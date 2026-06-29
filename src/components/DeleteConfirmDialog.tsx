'use client';

import { CalendarEvent } from '@/types';
import { Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: 'this' | 'all') => void;
  deleting: boolean;
}

export default function DeleteConfirmDialog({ event, open, onClose, onConfirm, deleting }: Props) {
  const [mode, setMode] = useState<'this' | 'all'>('this');
  const cancelRef = useRef<HTMLButtonElement>(null);
  const isRecurring = !!event?.recurringEventId;

  useEffect(() => {
    if (open) {
      setMode('this');
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
            <Trash2 size={17} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Delete event?</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-[180px]">
              {event.summary}
            </p>
          </div>
        </div>

        {isRecurring && (
          <div className="mb-4 space-y-1.5">
            {(['this', 'all'] as const).map((m) => (
              <label
                key={m}
                className={`
                  flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors
                  ${mode === m
                    ? 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }
                `}
              >
                <input
                  type="radio"
                  name="delete-mode"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                  className="accent-rose-500"
                />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">
                  {m === 'this' ? 'This occurrence only' : 'All occurrences (entire series)'}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            ref={cancelRef}
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(mode)}
            disabled={deleting}
            className="flex-1 py-2 px-4 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
