'use client';

import { useState, useEffect, useCallback } from 'react';
import { initTokenClient, getToken, clearToken, isTokenValid } from '@/lib/tokenManager';

export type AuthState = 'loading' | 'unauthenticated' | 'authenticated' | 'error';

export function useAuth() {
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let timeoutId: ReturnType<typeof setTimeout>;

    function tryInit() {
      if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        initTokenClient();
        setState(isTokenValid() ? 'authenticated' : 'unauthenticated');
      }
    }

    intervalId = setInterval(tryInit, 150);
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setState((s) => {
        if (s === 'loading') {
          setError('Google Identity Services failed to load. Check your network and NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
          return 'error';
        }
        return s;
      });
    }, 12000);

    tryInit();

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  const signIn = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      await getToken(false);
      setState('authenticated');
    } catch (err) {
      setState('unauthenticated');
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setState('unauthenticated');
    setError(null);
  }, []);

  return {
    state,
    error,
    signIn,
    signOut,
    isAuthenticated: state === 'authenticated',
  };
}
