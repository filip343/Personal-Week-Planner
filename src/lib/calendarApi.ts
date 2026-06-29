import { CalendarEvent, Category, EventFormData } from '@/types';
import { authedFetch } from './tokenManager';
import { toISODate, getWeekBounds, WEEKDAY_RRULE } from './weekHelpers';

const BASE = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_TITLE = 'Weekly Planner';
const CACHE_KEY = 'wp_calendar_id';
const ACTIVE_KEY = 'wp_active_calendar_id';

let _calendarId: string | null = null;
let _activeCalendarId: string | null = null;

export interface CalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
  /** True when the current user can create/modify events on this calendar. */
  writable: boolean;
  /** True for the app's own "Weekly Planner" calendar (the default view). */
  isPlanner: boolean;
  backgroundColor?: string;
}

export function resetCalendarCache(): void {
  _calendarId = null;
  _activeCalendarId = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  }
}

/** The calendar id the user has chosen to view, or null to use the default Weekly Planner calendar. */
export function getActiveCalendarId(): string | null {
  if (_activeCalendarId) return _activeCalendarId;
  if (typeof localStorage !== 'undefined') {
    _activeCalendarId = localStorage.getItem(ACTIVE_KEY);
  }
  return _activeCalendarId;
}

export function setActiveCalendarId(id: string | null): void {
  _activeCalendarId = id;
  if (typeof localStorage === 'undefined') return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

/** Lists the user's calendars, defaulting the Weekly Planner calendar to the top. */
export async function getCalendarList(): Promise<CalendarInfo[]> {
  const res = await authedFetch(`${BASE}/users/me/calendarList?maxResults=250`);
  if (!res.ok) throw new Error(`Calendar list failed: ${res.status}`);
  const data = await res.json();
  const items: CalendarInfo[] = (data.items ?? []).map(
    (c: {
      id: string;
      summary: string;
      primary?: boolean;
      accessRole?: string;
      backgroundColor?: string;
    }) => ({
      id: c.id,
      summary: c.summary,
      primary: !!c.primary,
      writable: c.accessRole === 'owner' || c.accessRole === 'writer',
      isPlanner: c.summary === CALENDAR_TITLE,
      backgroundColor: c.backgroundColor,
    })
  );
  // Surface the planner's own calendar first, then primary, then alphabetical.
  return items.sort((a, b) => {
    if (a.summary === CALENDAR_TITLE) return -1;
    if (b.summary === CALENDAR_TITLE) return 1;
    if (a.primary !== b.primary) return a.primary ? -1 : 1;
    return a.summary.localeCompare(b.summary);
  });
}

/** Resolves the calendar id for all event operations: the active selection, or the default. */
async function resolveCalendarId(): Promise<string> {
  const active = getActiveCalendarId();
  if (active) return active;
  return getOrCreateCalendar();
}

async function getOrCreateCalendar(): Promise<string> {
  if (_calendarId) return _calendarId;

  if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      _calendarId = cached;
      return cached;
    }
  }

  const res = await authedFetch(`${BASE}/users/me/calendarList?maxResults=250`);
  if (!res.ok) throw new Error(`Calendar list failed: ${res.status}`);
  const data = await res.json();

  const existing = (data.items ?? []).find(
    (c: { summary: string; id: string }) => c.summary === CALENDAR_TITLE
  );
  if (existing) {
    _calendarId = existing.id as string;
    localStorage.setItem(CACHE_KEY, _calendarId!);
    return _calendarId!;
  }

  const createRes = await authedFetch(`${BASE}/calendars`, {
    method: 'POST',
    body: JSON.stringify({ summary: CALENDAR_TITLE }),
  });
  if (!createRes.ok) throw new Error(`Calendar create failed: ${createRes.status}`);
  const created = await createRes.json();
  _calendarId = created.id as string;
  localStorage.setItem(CACHE_KEY, _calendarId!);
  return _calendarId!;
}

export async function getWeekEvents(weekStart: Date, weekEnd: Date): Promise<CalendarEvent[]> {
  const cid = await resolveCalendarId();
  const params = new URLSearchParams({
    singleEvents: 'true',
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
    maxResults: '500',
    orderBy: 'startTime',
  });
  const res = await authedFetch(
    `${BASE}/calendars/${encodeURIComponent(cid)}/events?${params}`
  );
  if (!res.ok) throw new Error(`Events fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).filter((e: CalendarEvent) => e.status !== 'cancelled');
}

export async function getMultipleWeeksEvents(weekStarts: Date[]): Promise<CalendarEvent[][]> {
  return Promise.all(
    weekStarts.map((start) => {
      const { end } = getWeekBounds(start);
      return getWeekEvents(start, end);
    })
  );
}

function localTz(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export async function createEvent(form: EventFormData): Promise<CalendarEvent> {
  const cid = await resolveCalendarId();

  const extProps = {
    extendedProperties: {
      private: {
        category: form.category as Category,
        done: 'false',
      },
    },
  };

  let start: CalendarEvent['start'];
  let end: CalendarEvent['end'];
  let recurrence: string[] | undefined;

  if (form.type === 'recurring') {
    const weekdays = [...(form.weekdays ?? [])].sort((a, b) => a - b);
    const days = weekdays.map((i) => WEEKDAY_RRULE[i]).join(',');
    recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${days}`];

    // Anchor DTSTART to the first selected weekday. Google Calendar always emits
    // the DTSTART as an occurrence even if its weekday isn't in BYDAY, so anchoring
    // to Monday would force a spurious Monday instance.
    const { start: weekMon } = getWeekBounds(new Date());
    const firstDayIdx = weekdays[0] ?? 0;
    const anchor = new Date(weekMon);
    anchor.setDate(weekMon.getDate() + firstDayIdx);
    const anchorStr = toISODate(anchor);

    if (form.time) {
      const [hh, mm] = form.time.split(':').map(Number);
      const endMin = (mm + 30) % 60;
      const endHr = hh + Math.floor((mm + 30) / 60);
      const pad = (n: number) => String(n).padStart(2, '0');
      start = { dateTime: `${anchorStr}T${pad(hh)}:${pad(mm)}:00`, timeZone: localTz() };
      end   = { dateTime: `${anchorStr}T${pad(endHr)}:${pad(endMin)}:00`, timeZone: localTz() };
    } else {
      start = { date: anchorStr };
      end   = { date: anchorStr };
    }
  } else {
    const dateStr = form.date!;
    if (form.time) {
      const [hh, mm] = form.time.split(':').map(Number);
      const endMin = (mm + 30) % 60;
      const endHr = hh + Math.floor((mm + 30) / 60);
      const pad = (n: number) => String(n).padStart(2, '0');
      start = { dateTime: `${dateStr}T${pad(hh)}:${pad(mm)}:00`, timeZone: localTz() };
      end   = { dateTime: `${dateStr}T${pad(endHr)}:${pad(endMin)}:00`, timeZone: localTz() };
    } else {
      start = { date: dateStr };
      end   = { date: dateStr };
    }
  }

  const body: Record<string, unknown> = {
    summary: form.title,
    description: form.notes ?? '',
    start,
    end,
    ...extProps,
  };
  if (recurrence) body.recurrence = recurrence;

  const res = await authedFetch(
    `${BASE}/calendars/${encodeURIComponent(cid)}/events`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  if (!res.ok) throw new Error(`Create event failed: ${res.status}`);
  return res.json();
}

export async function updateEvent(
  eventId: string,
  patch: Record<string, unknown>
): Promise<CalendarEvent> {
  const cid = await resolveCalendarId();
  const res = await authedFetch(
    `${BASE}/calendars/${encodeURIComponent(cid)}/events/${encodeURIComponent(eventId)}`,
    { method: 'PATCH', body: JSON.stringify(patch) }
  );
  if (!res.ok) throw new Error(`Update event failed: ${res.status}`);
  return res.json();
}

export async function deleteEvent(eventId: string): Promise<void> {
  const cid = await resolveCalendarId();
  const res = await authedFetch(
    `${BASE}/calendars/${encodeURIComponent(cid)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' }
  );
  if (!res.ok && res.status !== 410) {
    throw new Error(`Delete event failed: ${res.status}`);
  }
}

export async function getEventById(eventId: string): Promise<CalendarEvent> {
  const cid = await resolveCalendarId();
  const res = await authedFetch(
    `${BASE}/calendars/${encodeURIComponent(cid)}/events/${encodeURIComponent(eventId)}`
  );
  if (!res.ok) throw new Error(`Get event failed: ${res.status}`);
  return res.json();
}

export async function markEventDone(
  event: CalendarEvent,
  done: boolean
): Promise<CalendarEvent> {
  const cid = await resolveCalendarId();
  const patch = {
    extendedProperties: {
      private: {
        ...(event.extendedProperties?.private ?? {}),
        done: done ? 'true' : 'false',
      },
    },
  };
  const res = await authedFetch(
    `${BASE}/calendars/${encodeURIComponent(cid)}/events/${encodeURIComponent(event.id)}`,
    { method: 'PATCH', body: JSON.stringify(patch) }
  );
  if (!res.ok) throw new Error(`Mark done failed: ${res.status}`);
  return res.json();
}
