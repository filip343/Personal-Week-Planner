export type Category = 'School' | 'Study' | 'Personal' | 'Trading' | 'Other';
export type EventType = 'recurring' | 'one-time';

export interface CalendarEventTime {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: CalendarEventTime;
  end: CalendarEventTime;
  recurrence?: string[];
  extendedProperties?: {
    private?: {
      category?: Category;
      done?: string;
    };
  };
  recurringEventId?: string;
  originalStartTime?: CalendarEventTime;
  status?: string;
}

export interface EventFormData {
  title: string;
  type: EventType;
  category: Category;
  time?: string;
  notes?: string;
  weekdays?: number[];
  date?: string;
}

export interface WeekStat {
  label: string;
  weekStart: string;
  total: number;
  done: number;
  rate: number;
}

export const CATEGORIES: Category[] = ['School', 'Study', 'Personal', 'Trading', 'Other'];

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string; dot: string }> = {
  School:   { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-300',    dot: 'bg-blue-500' },
  Study:    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  Personal: { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-500' },
  Trading:  { bg: 'bg-rose-100 dark:bg-rose-900/30',    text: 'text-rose-700 dark:text-rose-300',    dot: 'bg-rose-500' },
  Other:    { bg: 'bg-slate-100 dark:bg-slate-800',      text: 'text-slate-600 dark:text-slate-400',  dot: 'bg-slate-400' },
};
