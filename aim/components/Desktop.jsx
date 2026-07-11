'use client';
import { useEffect } from 'react';
import { useAimStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { sounds } from '@/lib/sounds';
import BuddyList from './BuddyList';
import Window from './retro/Window';
import Notifications from './Notifications';
import NewBuddySetup from './NewBuddySetup';
import AgentWhois from './AgentWhois';

// Main retro desktop (Phase 1 shell + Phase 2 windows).
export default function Desktop() {
  const {
    currentUser,
    setCurrentUser,
    activeWindows,
    openWindow,
    focusWindow,
    soundOn,
  } = useAimStore();

  function openSetup() {
    openWindow({ id: 'new-buddy', title: 'New Buddy Setup', kind: 'setup' });
  }
  function openWhois() {
    openWindow({ id: 'whois', title: 'AgentWhois Lookup', kind: 'whois' });
  }
  function openAbout() {
    openWindow({ id: 'about', title: 'About A.I.M.', kind: 'about' });
  }

  async function signOff() {
    if (soundOn) sounds.signOff();
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    setTimeout(() => setCurrentUser(null), 600);
  }

  return (
    <div className="min-h-screen relative pb-9">
      {/* Desktop work area */}
      <div className="flex gap-3 p-3">
        <BuddyList onOpenWhois={openWhois} onOpenSetup={openSetup} />

        {/* Welcome / hint card */}
        <section className="window-95 w-80 self-start">
          <div className="titlebar">
            <span>🏠 A.I.M. Desktop</span>
          </div>
          <div className="p-3 text-xs space-y-2">
            <p className="font-bold text-aim-blue">
              Welcome to A.I.M. — the Switzerland of Agent Trust.
            </p>
            <p>
              This is the human-oversight dashboard for AI agent identity. Every agent
              appears as a buddy with a W3C DID, Verifiable Credential passport, and
              color-coded trust status.
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>
                <b>New Buddy</b> — register an agent &amp; issue its Agent Passport.
              </li>
              <li>
                <b>Whois</b> — look up any agent's unified trust profile.
              </li>
            </ul>
            <div className="flex gap-1 pt-1">
              <button className="btn-95" onClick={openSetup}>
                ➕ New Buddy Setup
              </button>
              <button className="btn-95" onClick={openWhois}>
                🔍 AgentWhois
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Floating windows */}
      {activeWindows.map((w) => {
        if (w.kind === 'setup')
          return (
            <Window key={w.id} win={w} width={380}>
              <NewBuddySetup />
            </Window>
          );
        if (w.kind === 'whois')
          return (
            <Window key={w.id} win={w} width={360}>
              <AgentWhois />
            </Window>
          );
        if (w.kind === 'about')
          return (
            <Window key={w.id} win={w} width={320}>
              <div className="text-xs space-y-2">
                <p className="font-bold">A.I.M. — Agent Instant Messenger &amp; Identity Manager</p>
                <p>
                  W3C DID (did:web / did:key) + Verifiable Credential Agent Passport
                  infrastructure. "The S&amp;P/Moody's + Whois for machines," delivered
                  through authentic Y2K nostalgia.
                </p>
                <p className="text-[10px] text-win-shadow">
                  Phases 0–2 implemented. Identity + Reputation + Moderation track.
                  Neutral infrastructure — no payment settlement.
                </p>
              </div>
            </Window>
          );
        return null;
      })}

      <Notifications />

      {/* Windows-XP-style taskbar */}
      <footer
        className="fixed bottom-0 left-0 right-0 h-9 flex items-center px-1 gap-1 text-white z-[9998]"
        style={{ background: 'linear-gradient(180deg,#3f8cf3 0%,#245edb 8%,#0a41c4 100%)' }}
      >
        <button
          className="btn-primary flex items-center gap-1 h-7"
          onClick={openAbout}
          style={{ background: '#22b14c', color: '#fff' }}
        >
          🏃 start
        </button>
        <div className="w-px h-6 bg-white/40" />
        {/* Taskbar buttons for open windows */}
        {activeWindows.map((w) => (
          <button
            key={w.id}
            className="btn-95 h-7 text-[11px] max-w-[140px] truncate"
            onClick={() => focusWindow(w.id)}
          >
            {w.title}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pr-2 text-[11px]">
          <span className="bg-black/20 px-2 py-0.5 border border-white/30">
            {currentUser?.email || 'guest'}
          </span>
          <button className="btn-95 h-7 text-[11px]" onClick={signOff}>
            Sign Off
          </button>
        </div>
      </footer>
    </div>
  );
}
