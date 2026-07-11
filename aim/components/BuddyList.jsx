'use client';
import { useEffect } from 'react';
import { useAimStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import BuddyIcon from './BuddyIcon';
import StatusDot from './retro/StatusDot';
import Marquee from './retro/Marquee';
import { sha256Hex } from '@/lib/did';

// Buddy List sidebar (Phase 5 shell primitive, wired to Realtime).
// Groups buddies by status. Phase-2 scope: display + Realtime live status.
const GROUPS = [
  { key: 'active', label: 'Trusted / Online', match: ['active', 'online', 'trusted', 'busy'] },
  { key: 'suspended', label: 'Review / Probation', match: ['suspended', 'review', 'probation'] },
  { key: 'revoked', label: 'Blocked / Signed Off', match: ['revoked', 'blocked', 'offline'] },
];

export default function BuddyList({ onOpenWhois, onOpenSetup }) {
  const { buddyList, setBuddyList, upsertBuddy, currentUser } = useAimStore();

  // Load agents from Supabase (public read) + subscribe to live status.
  useEffect(() => {
    let sub;
    async function load() {
      if (!isSupabaseConfigured || !supabase) return;
      const { data } = await supabase
        .from('agents')
        .select('id, did, screen_name, status, protocol_type, operator_name')
        .order('created_at', { ascending: false });
      if (data) {
        const withIcons = await Promise.all(
          data.map(async (a) => ({
            ...a,
            buddy_icon_hash: a.did ? await sha256Hex(a.did) : '0',
          }))
        );
        setBuddyList(withIcons);
      }
      // Supabase Realtime for in-app live status updates
      sub = supabase
        .channel('status-live')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'status_broadcast' },
          async (payload) => {
            const row = payload.new;
            if (row?.agent_id) {
              upsertBuddy({ id: row.agent_id, status: row.status });
            }
          }
        )
        .subscribe();
    }
    load();
    return () => {
      if (sub && supabase) supabase.removeChannel(sub);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside className="window-95 w-60 flex-shrink-0 flex flex-col self-start">
      <div className="titlebar">
        <span>🏃 {currentUser?.email || 'My'} — Buddy List</span>
      </div>
      <Marquee>Welcome to A.I.M. ★ Agent Passports online ★</Marquee>

      {/* Toolbar */}
      <div className="flex gap-1 p-1 border-b border-win-shadow">
        <button className="btn-95 flex-1 text-[10px]" onClick={onOpenSetup}>
          ➕ New Buddy
        </button>
        <button className="btn-95 flex-1 text-[10px]" onClick={onOpenWhois}>
          🔍 Whois
        </button>
      </div>

      <div className="p-1 space-y-1 overflow-auto" style={{ maxHeight: '60vh' }}>
        {GROUPS.map((g) => {
          const members = buddyList.filter((b) => g.match.includes(b.status));
          return (
            <div key={g.key}>
              <div className="bg-win-face font-bold text-[11px] px-1 border-b border-win-shadow">
                ▾ {g.label} ({members.length})
              </div>
              <div className="panel-sunken min-h-[24px] p-1 space-y-0.5">
                {members.length === 0 && (
                  <div className="text-[10px] text-win-shadow italic px-1">— empty —</div>
                )}
                {members.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-1 px-1 hover:bg-aim-blue hover:text-white cursor-pointer"
                    title={b.did}
                  >
                    <BuddyIcon hashHex={b.buddy_icon_hash} status="trusted" size={18} />
                    <StatusDot status={b.status} />
                    <span className="truncate text-[11px]">{b.screen_name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!isSupabaseConfigured && (
        <div className="text-[9px] bg-aim-yellow border-t border-black p-1">
          Local demo mode — buddies added this session appear above.
        </div>
      )}
    </aside>
  );
}
