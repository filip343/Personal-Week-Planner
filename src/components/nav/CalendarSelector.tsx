'use client';

import { Calendar, ChevronDown } from 'lucide-react';
import { CalendarInfo } from '@/lib/calendarApi';

interface Props {
  calendars: CalendarInfo[];
  activeCalendarId: string | null;
  onSelect: (id: string | null) => void;
}

export default function CalendarSelector({ calendars, activeCalendarId, onSelect }: Props) {
  // Nothing to choose from until the list loads.
  if (calendars.length === 0) return null;

  const plannerId = calendars.find((c) => c.isPlanner)?.id ?? '';
  // A null active id means the default Weekly Planner calendar.
  const value = activeCalendarId ?? plannerId;

  return (
    <div className="relative inline-flex items-center group">
      <Calendar
        size={13}
        strokeWidth={2}
        className="absolute left-2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
      />
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value || null)}
        aria-label="Select calendar to view"
        title="Select calendar to view"
        className="appearance-none max-w-[160px] sm:max-w-[220px] truncate pl-7 pr-6 py-1 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-transparent focus:border-accent-400 focus:outline-none cursor-pointer transition-colors"
      >
        {calendars.map((cal) => (
          <option key={cal.id} value={cal.id}>
            {cal.isPlanner ? 'Weekly Planner' : cal.summary}
            {!cal.writable ? ' (read-only)' : ''}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        strokeWidth={2}
        className="absolute right-1.5 text-zinc-400 dark:text-zinc-500 pointer-events-none"
      />
    </div>
  );
}
