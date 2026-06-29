'use client';

import { CalendarEvent } from '@/types';
import { getWeekdays, bucketByDay } from '@/lib/weekHelpers';
import DayColumn from './DayColumn';

interface Props {
  weekStart: Date;
  events: CalendarEvent[];
  loading: boolean;
  onDoneToggle: (event: CalendarEvent) => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddClick: (date: string) => void;
}

export default function WeeklyBoard({
  weekStart,
  events,
  loading,
  onDoneToggle,
  onEventClick,
  onAddClick,
}: Props) {
  const weekdays = getWeekdays(weekStart);
  const byDay = bucketByDay(events, weekStart);

  return (
    <div className="overflow-x-auto -mx-4 px-4 pb-2">
      <div className="grid grid-cols-7 gap-2" style={{ minWidth: '560px' }}>
        {weekdays.map((date, i) => (
          <DayColumn
            key={i}
            date={date}
            dayIndex={i}
            events={byDay.get(i) ?? []}
            loading={loading}
            onDoneToggle={onDoneToggle}
            onEventClick={onEventClick}
            onAddClick={onAddClick}
          />
        ))}
      </div>
    </div>
  );
}
