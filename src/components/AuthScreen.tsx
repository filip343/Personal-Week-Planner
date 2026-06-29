'use client';

import { CalendarDays, LogIn } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface Props {
  onSignIn: () => void;
  loading: boolean;
  missingClientId: boolean;
}

export default function AuthScreen({ onSignIn, loading, missingClientId }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <CalendarDays size={32} className="text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Weekly Planner</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Your personal week, powered by Google Calendar
              </p>
            </div>
          </div>

          {missingClientId ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-left space-y-2">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Setup required</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Create a <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code> file with your{' '}
                <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                See <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local.example</code> for reference.
              </p>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              <LogIn size={17} />
              {loading ? 'Connecting…' : 'Sign in with Google'}
            </button>
          )}

          <p className="text-xs text-zinc-400 dark:text-zinc-600 leading-relaxed">
            Events are stored in a &ldquo;Weekly Planner&rdquo; calendar in your Google account.
            No data leaves your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
