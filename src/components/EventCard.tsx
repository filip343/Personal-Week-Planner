'use client';

import { CalendarEvent, CATEGORY_COLORS } from '@/types';
import { getEventTimeStr } from '@/lib/weekHelpers';
import { Repeat, Clock } from 'lucide-react';

interface Props {
  event: CalendarEvent;
  onDoneToggle: (event: CalendarEvent) => void;
  onClick: (event: CalendarEvent) => void;
}

export default function EventCard({ event, onDoneToggle, onClick }: Props) {
  const done = event.extendedProperties?.private?.done === 'true';
  const category = event.extendedProperties?.private?.category ?? 'Other';
  const colors = CATEGORY_COLORS[category];
  const timeStr = getEventTimeStr(event);
  const isRecurring = !!event.recurringEventId;

  return (
    <div
      className={`
        group relative flex items-start gap-2 rounded-lg px-2.5 py-2
        border transition-all duration-150 cursor-pointer
        ${done
          ? 'opacity-50 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm'
        }
      `}
      onClick={() => onClick(event)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDoneToggle(event); }}
        aria-label={done ? 'Mark undone' : 'Mark done'}
        className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
        style={{}}
      >
        <span
          className={`
            w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
            ${done
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-accent-400'
            }
          `}
          onClick={(e) => { e.stopPropagation(); onDoneToggle(event); }}
          role="checkbox"
          aria-checked={done}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.stopPropagation(); onDoneToggle(event); } }}
        >
          {done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`flex-shrink-0 w-2 h-2 rounded-full ${colors.dot}`} />
          <p className={`text-xs font-medium leading-tight truncate ${done ? 'line-through text-zinc-400 dark:text-zinc-600' : 'text-zinc-800 dark:text-zinc-200'}`}>
            {event.summary}
          </p>
        </div>

        {(timeStr || isRecurring) && (
          <div className="flex items-center gap-1.5 mt-0.5 pl-3.5">
            {timeStr && (
              <span className="flex items-center gap-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                <Clock size={9} />
                {timeStr}
              </span>
            )}
            {isRecurring && (
              <span className="text-zinc-300 dark:text-zinc-600">
                <Repeat size={9} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
