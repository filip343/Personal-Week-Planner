'use client';

import { CalendarDays, AlertCircle, Loader2 } from 'lucide-react';
import { AuthState } from '@/hooks/useAuth';

interface Props {
  state: AuthState;
  error: string | null;
  onSignIn: () => void;
}

export default function SignInScreen({ state, error, onSignIn }: Props) {
  const loading = state === 'loading';

  return (
    <div className="min-h-[100dvh] flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 dark:bg-black flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <CalendarDays size={20} strokeWidth={1.5} className="text-accent-400" />
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">Weekly Planner</span>
        </div>
        <div className="space-y-5">
          <Feature text="Recurring and one-time events in one view" />
          <Feature text="Track completions week over week" />
          <Feature text="Data lives in your Google Calendar" />
          <Feature text="No account to create, no new data silo" />
        </div>
        <p className="text-xs text-zinc-600 font-mono">
          Powered by Google Calendar API
        </p>
      </div>

      {/* Right sign-in panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <CalendarDays size={20} strokeWidth={1.5} className="text-accent-500" />
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Weekly Planner
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
            Sign in to continue
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            Connect your Google account to access your personal Weekly Planner calendar. Events and
            completions are stored directly in Google Calendar — nothing new to sync.
          </p>

          {error && (
            <div className="flex items-start gap-2.5 p-3 mb-5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
              <AlertCircle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            onClick={onSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-zinc-400" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Connecting…' : 'Continue with Google'}
          </button>

          <p className="mt-6 text-[11px] text-zinc-400 dark:text-zinc-600 text-center leading-relaxed">
            This app only reads and writes to a dedicated &ldquo;Weekly Planner&rdquo; calendar.
            <br />
            It never accesses your other calendars or data.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-zinc-500 text-sm">
      <div className="w-1 h-1 rounded-full bg-accent-500 flex-shrink-0" />
      {text}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
