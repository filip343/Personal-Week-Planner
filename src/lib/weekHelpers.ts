import { CalendarEvent, WeekStat } from '@/types';

export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAY_LONG  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const WEEKDAY_RRULE = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatWeekLabel(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
  });
  return `${startStr} – ${endStr}, ${end.getFullYear()}`;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function getWeekdays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

export function getEventDateStr(event: CalendarEvent): string {
  if (event.start.date) return event.start.date;
  if (!event.start.dateTime) return '';
  // Parse the datetime (may have UTC offset or Z suffix) and convert to local date
  return toISODate(new Date(event.start.dateTime));
}

export function getEventTimeStr(event: CalendarEvent): string | null {
  if (!event.start.dateTime) return null;
  // Parse properly so UTC ("...Z") and offset ("...+02:00") both display in local tz
  return new Date(event.start.dateTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function bucketByDay(events: CalendarEvent[], weekStart: Date): Map<number, CalendarEvent[]> {
  const map = new Map<number, CalendarEvent[]>();
  for (let i = 0; i < 7; i++) map.set(i, []);

  for (const event of events) {
    const dateStr = getEventDateStr(event);
    if (!dateStr) continue;
    const [y, m, d] = dateStr.split('-').map(Number);
    const eventDate = new Date(y, m - 1, d);
    const [wy, wm, wd] = toISODate(weekStart).split('-').map(Number);
    const wStart = new Date(wy, wm - 1, wd);
    const diffMs = eventDate.getTime() - wStart.getTime();
    const dayIndex = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) {
      map.get(dayIndex)!.push(event);
    }
  }

  for (const dayEvents of map.values()) {
    dayEvents.sort((a, b) => {
      const aMs = a.start.dateTime ? new Date(a.start.dateTime).getTime() : null;
      const bMs = b.start.dateTime ? new Date(b.start.dateTime).getTime() : null;
      if (aMs !== null && bMs !== null) return aMs - bMs;
      if (aMs !== null) return -1;
      if (bMs !== null) return 1;
      return a.summary.localeCompare(b.summary);
    });
  }

  return map;
}

export function buildWeekStats(
  weekEventSets: CalendarEvent[][],
  weekStarts: Date[]
): WeekStat[] {
  return weekEventSets.map((events, i) => {
    const total = events.length;
    const done = events.filter(e => e.extendedProperties?.private?.done === 'true').length;
    const label = weekStarts[i].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      label,
      weekStart: toISODate(weekStarts[i]),
      total,
      done,
      rate: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  });
}
