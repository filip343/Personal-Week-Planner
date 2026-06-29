'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent, EventFormData } from '@/types';
import {
  getWeekEvents,
  createEvent as apiCreate,
  updateEvent as apiUpdate,
  deleteEvent as apiDelete,
  markEventDone,
  getCalendarList,
  getActiveCalendarId,
  setActiveCalendarId,
  CalendarInfo,
} from '@/lib/calendarApi';
import { getWeekBounds, addWeeks, toISODate } from '@/lib/weekHelpers';

const CACHE_PREFIX = 'wp_week_';

function cacheKey(weekStart: Date, calId: string) {
  return `${CACHE_PREFIX}${calId}_${toISODate(weekStart)}`;
}

function loadCache(weekStart: Date, calId: string): CalendarEvent[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(weekStart, calId));
    return raw ? (JSON.parse(raw) as CalendarEvent[]) : null;
  } catch {
    return null;
  }
}

function saveCache(weekStart: Date, calId: string, events: CalendarEvent[]) {
  try {
    localStorage.setItem(cacheKey(weekStart, calId), JSON.stringify(events));
  } catch {}
}

export function useWeek() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekBounds(new Date()).start);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [activeCalendarId, setActiveCalendarIdState] = useState<string | null>(
    () => getActiveCalendarId()
  );
  const fetchVersion = useRef(0);

  const weekEnd = getWeekBounds(weekStart).end;
  // Stable key for caching/refetch; the default Weekly Planner calendar maps to 'default'.
  const calKey = activeCalendarId ?? 'default';
  const plannerCalendar = calendars.find((c) => c.isPlanner) ?? null;
  const activeCalendar =
    calendars.find((c) => c.id === activeCalendarId) ?? plannerCalendar;
  // The Weekly Planner calendar is created by the app, so it is always writable.
  const canWrite = activeCalendar ? activeCalendar.writable : true;

  useEffect(() => {
    getCalendarList()
      .then(setCalendars)
      .catch(() => setCalendars([]));
  }, []);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  const fetchWeek = useCallback(
    async (start: Date) => {
      const v = ++fetchVersion.current;
      const { end } = getWeekBounds(start);
      const cached = loadCache(start, calKey);

      if (cached) {
        setEvents(cached);
        setLoading(false);
      } else {
        setLoading(true);
        setEvents([]);
      }

      try {
        const fresh = await getWeekEvents(start, end);
        if (fetchVersion.current !== v) return;
        setEvents(fresh);
        setError(null);
        saveCache(start, calKey, fresh);
      } catch (err) {
        if (fetchVersion.current !== v) return;
        if (!cached) setEvents([]);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        if (fetchVersion.current === v) setLoading(false);
      }
    },
    [calKey]
  );

  useEffect(() => {
    fetchWeek(weekStart);
  }, [weekStart, fetchWeek]);

  const selectCalendar = useCallback(
    (id: string | null) => {
      // Selecting the planner calendar is the canonical "default": store null.
      const planner = calendars.find((c) => c.isPlanner);
      const normalized = id && planner && id === planner.id ? null : id;
      setActiveCalendarId(normalized);
      setActiveCalendarIdState(normalized);
    },
    [calendars]
  );

  const prevWeek = useCallback(() => setWeekStart((s) => addWeeks(s, -1)), []);
  const nextWeek = useCallback(() => setWeekStart((s) => addWeeks(s, 1)), []);
  const thisWeek = useCallback(() => setWeekStart(getWeekBounds(new Date()).start), []);

  const toggleDone = useCallback(async (event: CalendarEvent) => {
    const wasDone = event.extendedProperties?.private?.done === 'true';
    const newDone = !wasDone;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              extendedProperties: {
                ...e.extendedProperties,
                private: { ...e.extendedProperties?.private, done: newDone ? 'true' : 'false' },
              },
            }
          : e
      )
    );

    try {
      await markEventDone(event, newDone);
    } catch {
      // Revert optimistic update
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                extendedProperties: {
                  ...e.extendedProperties,
                  private: { ...e.extendedProperties?.private, done: wasDone ? 'true' : 'false' },
                },
              }
            : e
        )
      );
    }
  }, []);

  const addEvent = useCallback(
    async (form: EventFormData) => {
      await apiCreate(form);
      await fetchWeek(weekStart);
    },
    [weekStart, fetchWeek]
  );

  const editEvent = useCallback(
    async (eventId: string, patch: Record<string, unknown>) => {
      await apiUpdate(eventId, patch);
      await fetchWeek(weekStart);
    },
    [weekStart, fetchWeek]
  );

  const removeEvent = useCallback(async (eventId: string) => {
    await apiDelete(eventId);
    setEvents((prev) =>
      prev.filter((e) => e.id !== eventId && e.recurringEventId !== eventId)
    );
  }, []);

  const refresh = useCallback(() => fetchWeek(weekStart), [weekStart, fetchWeek]);

  return {
    weekStart,
    weekEnd,
    events,
    loading,
    error,
    isOnline,
    calendars,
    activeCalendarId,
    canWrite,
    selectCalendar,
    prevWeek,
    nextWeek,
    thisWeek,
    toggleDone,
    addEvent,
    editEvent,
    removeEvent,
    refresh,
  };
}
