'use client';

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { formatWeekLabel } from '@/lib/weekHelpers';

interface Props {
  weekStart: Date;
  weekEnd: Date;
  weekOffset: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function WeekNav({ weekStart, weekEnd, weekOffset, onPrev, onNext, onToday }: Props) {
  const label = formatWeekLabel(weekStart, weekEnd);

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          aria-label="Previous week"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={onNext}
          aria-label="Next week"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400 tabular-nums select-none">
        {label}
      </span>

      <button
        onClick={onToday}
        disabled={weekOffset === 0}
        aria-label="Go to current week"
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <CalendarDays size={15} />
        Today
      </button>
    </div>
  );
}
