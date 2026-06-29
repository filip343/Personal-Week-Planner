'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import SignInScreen from '@/components/auth/SignInScreen';

// WeeklyBoard uses browser APIs; skip SSR entirely
const WeeklyBoard = dynamic(() => import('@/components/board/WeeklyBoard'), { ssr: false });

export default function Home() {
  const { state, error, signIn, signOut, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <WeeklyBoard onSignOut={signOut} />;
  }

  return <SignInScreen state={state} error={error} onSignIn={signIn} />;
}
