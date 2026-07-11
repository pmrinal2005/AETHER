'use client';
import { useEffect, useState } from 'react';
import { useAimStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import SignOn from '@/components/SignOn';
import Desktop from '@/components/Desktop';

export default function Home() {
  const { currentUser, setCurrentUser } = useAimStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let sub;
    async function init() {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) setCurrentUser(data.session.user);
        const listener = supabase.auth.onAuthStateChange((_ev, session) => {
          setCurrentUser(session?.user ?? null);
        });
        sub = listener.data.subscription;
      }
      setReady(true);
    }
    init();
    return () => sub?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xs">
        Loading A.I.M.…
      </div>
    );
  }

  return currentUser ? <Desktop /> : <SignOn />;
}
