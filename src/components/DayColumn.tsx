'use client';

import { CalendarEvent } from '@/types';
import { isToday, toISODate, WEEKDAY_SHORT } from '@/lib/weekHelpers';
import EventCard from './EventCard';
import { Plus } from 'lucide-react';

interface Props {
  date: Date;
  dayIndex: number;
  events: CalendarEvent[];
  loading: boolean;
  onDoneToggle: (event: CalendarEvent) => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddClick: (date: string) => void;
}

export default function DayColumn({
  date,
  dayIndex,
  events,
  loading,
  onDoneToggle,
  onEventClick,
  onAddClick,
}: Props) {
  const today = isToday(date);
  const dateNum = date.getDate();
  const dayLabel = WEEKDAY_SHORT[dayIndex];
  const dateStr = toISODate(date);

  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div className={`
        flex flex-col items-center py-2 mb-1 rounded-lg
        ${today ? 'bg-accent-50 dark:bg-accent-950/40' : ''}
      `}>
        <span className={`text-[10px] font-medium uppercase tracking-widest ${today ? 'text-accent-600 dark:text-accent-400' : 'text-zinc-400 dark:text-zinc-600'}`}>
          {dayLabel}
        </span>
        <span className={`
          mt-0.5 w-7 h-7 flex items-center justify-center rounded-full font-mono text-sm font-semibold
          ${today
            ? 'bg-accent-500 text-white'
            : 'text-zinc-700 dark:text-zinc-300'
          }
        `}>
          {dateNum}
        </span>
      </div>

      {/* Events */}
      <div className="flex flex-col gap-1.5 flex-1">
        {loading ? (
          <>
            <div className="skeleton h-14 rounded-lg" />
            {dayIndex % 3 === 0 && <div className="skeleton h-14 rounded-lg" />}
          </>
        ) : events.length === 0 ? (
          <button
            onClick={() => onAddClick(dateStr)}
            className="flex items-center justify-center gap-1 text-[10px] text-zinc-300 dark:text-zinc-700 hover:text-zinc-400 dark:hover:text-zinc-500 transition-colors py-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <Plus size={11} />
            Add
          </button>
        ) : (
          <>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDoneToggle={onDoneToggle}
                onClick={onEventClick}
              />
            ))}
            <button
              onClick={() => onAddClick(dateStr)}
              aria-label={`Add event on ${dayLabel}`}
              className="flex items-center justify-center p-1 text-zinc-300 dark:text-zinc-700 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-950/30 rounded-md transition-colors"
            >
              <Plus size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
