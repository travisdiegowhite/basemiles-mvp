// File: /components/AuthHeader.tsx
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function AuthHeader() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <span className="text-sm text-gray-600">
            {user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
          >
            Sign Out
          </button>
        </>
      ) : (
        <button
          onClick={handleSignIn}
          className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition"
        >
          Sign In
        </button>
      )}
    </div>
  );
}