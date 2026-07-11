'use client';
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { sounds } from '@/lib/sounds';
import { useAimStore } from '@/lib/store';
import { idb } from '@/lib/idb';
import Marquee from './retro/Marquee';

// Retro "AIM Sign-On" screen (Phase 1.4). Wraps Supabase Auth.
export default function SignOn() {
  const { setCurrentUser, toggleSound, soundOn } = useAimStore();
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    idb.getKV('lastEmail').then((v) => v && setEmail(v));
  }, []);

  async function handle(e) {
    e.preventDefault();
    setMsg('');
    sounds.resume();
    if (!isSupabaseConfigured || !supabase) {
      // Local demo fallback: sign in without a backend so the shell is viewable.
      setBusy(true);
      await idb.setKV('lastEmail', email);
      setTimeout(() => {
        setCurrentUser({ id: 'local-demo', email: email || 'guest@aim.local', local: true });
        if (soundOn) sounds.signOn();
        setBusy(false);
      }, 500);
      return;
    }
    setBusy(true);
    try {
      await idb.setKV('lastEmail', email);
      let res;
      if (mode === 'signup') {
        res = await supabase.auth.signUp({ email, password });
        if (!res.error) setMsg('Check your email to confirm, then Sign On.');
      } else {
        res = await supabase.auth.signInWithPassword({ email, password });
      }
      if (res.error) setMsg(res.error.message);
      else if (res.data?.user && res.data?.session) {
        setCurrentUser(res.data.user);
        if (soundOn) sounds.signOn();
      }
    } catch (err) {
      setMsg(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="window-95 w-[320px]">
        <div className="titlebar">
          <span className="flex items-center gap-1">🏃 A.I.M. Sign On</span>
        </div>
        <div className="p-3">
          {/* Running-man logo block */}
          <div className="flex flex-col items-center mb-3">
            <div className="text-5xl">🏃‍♂️</div>
            <div className="text-aim-blue font-bold text-lg leading-none">A.I.M.</div>
            <div className="text-[10px] text-center text-black">
              Agent Instant Messenger
              <br />& Identity Manager
            </div>
          </div>

          <Marquee>
            The Switzerland of Agent Trust — dressed as your old Buddy List ★ W3C DID
            + Verifiable Credentials ★ Trust Score ★ Revocation Bus
          </Marquee>

          <form onSubmit={handle} className="mt-3 space-y-2">
            <label className="block text-xs">
              ScreenName (email)
              <input
                className="field-95 w-full mt-0.5"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="block text-xs">
              Password
              <input
                className="field-95 w-full mt-0.5"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required={isSupabaseConfigured}
              />
            </label>

            {msg && <div className="text-[11px] text-aim-red">{msg}</div>}

            <div className="flex items-center justify-between pt-1">
              <label className="text-[11px] flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={soundOn}
                  onChange={toggleSound}
                />
                Sounds
              </label>
              <button className="btn-primary" disabled={busy} type="submit">
                {busy ? 'Signing On…' : mode === 'signup' ? 'Sign Up' : 'Sign On'}
              </button>
            </div>
          </form>

          <div className="mt-2 text-center text-[11px]">
            <button
              className="text-aim-blue underline"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'New user? Set up an account' : 'Already have an account? Sign On'}
            </button>
          </div>

          {!isSupabaseConfigured && (
            <div className="mt-2 text-[10px] bg-aim-yellow border border-black p-1">
              ⚠ Supabase env not set — running in <b>local demo mode</b>. Any
              email/password lets you explore the shell. Add env vars for full backend.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
