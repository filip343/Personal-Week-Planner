'use client';

import { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { CalendarEvent } from '@/types';

interface Props {
  event: CalendarEvent;
  onConfirm: (scope: 'this' | 'all') => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

export default function DeleteDialog({ event, onConfirm, onCancel, loading, error }: Props) {
  const isRecurring = !!event.recurringEventId;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [loading, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-slide-up p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
            <AlertTriangle size={15} className="text-rose-500" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Delete &ldquo;{event.summary}&rdquo;
            </h2>
            {isRecurring ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                This is a recurring event. Choose whether to remove only this occurrence or the
                entire series.
              </p>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                This action cannot be undone.
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-500 mb-3 px-1">{error}</p>
        )}

        <div className="flex flex-col gap-2">
          {isRecurring ? (
            <>
              <button
                onClick={() => onConfirm('this')}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/50 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading && <Loader2 size={12} className="animate-spin" />}
                Delete this occurrence
              </button>
              <button
                onClick={() => onConfirm('all')}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading && <Loader2 size={12} className="animate-spin" />}
                Delete entire series
              </button>
            </>
          ) : (
            <button
              onClick={() => onConfirm('all')}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              Delete event
            </button>
          )}
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
