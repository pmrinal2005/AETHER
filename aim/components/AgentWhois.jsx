'use client';
import { useState } from 'react';
import BuddyIcon from './BuddyIcon';
import StatusDot from './retro/StatusDot';
import { useAimStore } from '@/lib/store';
import { sounds } from '@/lib/sounds';

// AgentWhois Lookup (Phase 2.4): retro ICQ/Whois search → unified profile card.
export default function AgentWhois() {
  const { upsertBuddy, pushNotification, soundOn } = useAimStore();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  async function search(e) {
    e?.preventDefault();
    setBusy(true);
    setError('');
    setResults(null);
    try {
      const res = await fetch('/api/whois?q=' + encodeURIComponent(q));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lookup failed');
      setResults(data.results || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  function addBuddy(a) {
    upsertBuddy({
      id: a.id,
      did: a.did,
      screen_name: a.screen_name,
      status: a.status,
      buddy_icon_hash: a.icon_hash,
      protocol_type: a.protocol_type,
    });
    if (soundOn) sounds.imReceive();
    pushNotification({ title: 'Buddy Added', body: `${a.screen_name} added to your list.` });
  }

  return (
    <div className="text-xs">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-lg">🔍</span>
        <span className="font-bold">AgentWhois — Find an Agent</span>
      </div>
      <form onSubmit={search} className="flex gap-1 mb-2">
        <input
          className="field-95 flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Screen name or endpoint URL…"
        />
        <button className="btn-95" disabled={busy}>
          {busy ? '…' : 'Search'}
        </button>
      </form>

      {error && <div className="text-aim-red mb-1">{error}</div>}

      {results && results.length === 0 && (
        <div className="panel-sunken p-2 text-center text-win-shadow">
          No agents found. Try a different screen name.
        </div>
      )}

      <div className="space-y-2 max-h-72 overflow-auto">
        {results?.map((a) => (
          <div key={a.id} className="panel-sunken p-2">
            <div className="flex items-start gap-2">
              <BuddyIcon hashHex={a.icon_hash} status={a.warning_status || 'trusted'} size={40} />
              <div className="flex-1">
                <div className="flex items-center gap-1 font-bold">
                  <StatusDot status={a.status} />
                  {a.screen_name}
                  <span className="text-[10px] text-win-shadow font-normal">
                    ({a.protocol_type?.toUpperCase()})
                  </span>
                </div>
                <div className="text-[10px] break-all">{a.did}</div>
                <div className="text-[11px]">Operator: {a.operator_name || '—'}</div>
                <div className="text-[11px]">
                  Trust Score:{' '}
                  <b>{a.score != null ? a.score : '— (Bootcamp pending)'}</b> / 999
                </div>
                {a.capabilities?.length > 0 && (
                  <div className="text-[10px]">
                    Capabilities: {a.capabilities.join(', ')}
                  </div>
                )}
                {a.endpoints?.url && (
                  <div className="text-[10px] break-all">Endpoint: {a.endpoints.url}</div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-1">
              <button className="btn-95" onClick={() => addBuddy(a)}>
                ➕ Add to Buddies
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
