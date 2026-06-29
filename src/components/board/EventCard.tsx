'use client';

import { CalendarEvent, CATEGORY_COLORS, Category } from '@/types';
import { getEventTimeStr } from '@/lib/weekHelpers';
import { Repeat, Calendar, Check } from 'lucide-react';

interface Props {
  event: CalendarEvent;
  onToggleDone: (event: CalendarEvent) => void;
  onEdit: (event: CalendarEvent) => void;
}

export default function EventCard({ event, onToggleDone, onEdit }: Props) {
  const done = event.extendedProperties?.private?.done === 'true';
  const category = (event.extendedProperties?.private?.category ?? 'Other') as Category;
  const colors = CATEGORY_COLORS[category];
  const time = getEventTimeStr(event);
  const isRecurring = !!event.recurringEventId;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(event)}
      onKeyDown={(e) => e.key === 'Enter' && onEdit(event)}
      className={`group relative flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer select-none transition-all duration-100 ${
        done
          ? 'border-zinc-100 dark:border-zinc-800/50 bg-transparent'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm active:scale-[0.99]'
      }`}
    >
      {/* Category dot */}
      <div
        className={`mt-[3px] flex-shrink-0 w-1.5 h-1.5 rounded-full ${colors.dot} ${
          done ? 'opacity-30' : 'opacity-100'
        }`}
      />

      <div className="flex-1 min-w-0">
        <div
          className={`text-xs font-medium leading-snug truncate ${
            done
              ? 'line-through text-zinc-400 dark:text-zinc-600'
              : 'text-zinc-800 dark:text-zinc-200'
          }`}
        >
          {event.summary}
        </div>
        {time && (
          <div
            className={`mt-0.5 font-mono text-[10px] tabular-nums ${
              done ? 'text-zinc-400 dark:text-zinc-700' : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {time}
          </div>
        )}
      </div>

      {/* Type icon */}
      <div
        className={`flex-shrink-0 mt-0.5 ${
          done
            ? 'text-zinc-300 dark:text-zinc-700'
            : 'text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500'
        }`}
      >
        {isRecurring ? (
          <Repeat size={11} strokeWidth={2} />
        ) : (
          <Calendar size={11} strokeWidth={2} />
        )}
      </div>

      {/* Done toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleDone(event);
        }}
        aria-label={done ? 'Mark undone' : 'Mark done'}
        className={`flex-shrink-0 w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all duration-100 ${
          done
            ? 'bg-accent-500 border-accent-500 text-white'
            : 'border-zinc-300 dark:border-zinc-600 hover:border-accent-400 dark:hover:border-accent-400 bg-transparent'
        }`}
      >
        {done && <Check size={9} strokeWidth={3} />}
      </button>
    </div>
  );
}
