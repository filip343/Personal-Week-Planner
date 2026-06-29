'use client';

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { formatWeekLabel } from '@/lib/weekHelpers';

interface Props {
  weekStart: Date;
  weekEnd: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function WeekNav({ weekStart, weekEnd, onPrev, onNext, onToday }: Props) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onPrev}
        aria-label="Previous week"
        title="Previous week (←)"
        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <ChevronLeft size={15} strokeWidth={2} />
      </button>

      <button
        onClick={onToday}
        title="Go to this week (T)"
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <CalendarDays size={12} strokeWidth={2} />
        Today
      </button>

      <button
        onClick={onNext}
        aria-label="Next week"
        title="Next week (→)"
        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <ChevronRight size={15} strokeWidth={2} />
      </button>

      <span className="ml-1.5 font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums hidden sm:inline">
        {formatWeekLabel(weekStart, weekEnd)}
      </span>
    </div>
  );
}
