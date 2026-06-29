'use client';

import { CalendarEvent } from '@/types';
import { WEEKDAY_SHORT, isToday } from '@/lib/weekHelpers';
import EventCard from './EventCard';
import { Plus } from 'lucide-react';

interface Props {
  dayIndex: number;
  date: Date;
  events: CalendarEvent[];
  onToggleDone: (event: CalendarEvent) => void;
  onEdit: (event: CalendarEvent) => void;
  onAdd: (date: Date) => void;
}

export default function DayColumn({ dayIndex, date, events, onToggleDone, onEdit, onAdd }: Props) {
  const today = isToday(date);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div
        className={`flex items-end justify-between mb-3 pb-2 border-b ${
          today
            ? 'border-accent-400 dark:border-accent-500'
            : 'border-zinc-200 dark:border-zinc-800'
        }`}
      >
        <div>
          <div
            className={`text-[10px] font-bold uppercase tracking-widest ${
              today ? 'text-accent-500 dark:text-accent-400' : 'text-zinc-400 dark:text-zinc-600'
            }`}
          >
            {WEEKDAY_SHORT[dayIndex]}
          </div>
          <div
            className={`font-mono text-2xl font-semibold tabular-nums leading-none mt-0.5 ${
              today ? 'text-accent-500 dark:text-accent-400' : 'text-zinc-800 dark:text-zinc-200'
            }`}
          >
            {String(date.getDate()).padStart(2, '0')}
          </div>
        </div>
        <button
          onClick={() => onAdd(date)}
          aria-label={`Add event on ${WEEKDAY_SHORT[dayIndex]}`}
          className="mb-0.5 p-1 rounded-md text-zinc-300 dark:text-zinc-700 hover:text-accent-500 dark:hover:text-accent-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Plus size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Events */}
      <div className="flex flex-col gap-1.5 flex-1">
        {events.length === 0 ? (
          <button
            onClick={() => onAdd(date)}
            className="w-full min-h-[52px] rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors flex items-center justify-center"
          >
            <span className="text-[10px] text-zinc-300 dark:text-zinc-700">Nothing planned</span>
          </button>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onToggleDone={onToggleDone}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}
