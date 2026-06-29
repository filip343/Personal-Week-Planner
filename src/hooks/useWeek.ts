'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent, EventFormData } from '@/types';
import {
  getWeekEvents,
  createEvent as apiCreate,
  updateEvent as apiUpdate,
  deleteEvent as apiDelete,
  markEventDone,
} from '@/lib/calendarApi';
import { getWeekBounds, addWeeks, toISODate } from '@/lib/weekHelpers';

const CACHE_PREFIX = 'wp_week_';

function cacheKey(weekStart: Date) {
  return CACHE_PREFIX + toISODate(weekStart);
}

function loadCache(weekStart: Date): CalendarEvent[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(weekStart));
    return raw ? (JSON.parse(raw) as CalendarEvent[]) : null;
  } catch {
    return null;
  }
}

function saveCache(weekStart: Date, events: CalendarEvent[]) {
  try {
    localStorage.setItem(cacheKey(weekStart), JSON.stringify(events));
  } catch {}
}

export function useWeek() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekBounds(new Date()).start);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const fetchVersion = useRef(0);

  const weekEnd = getWeekBounds(weekStart).end;

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

  const fetchWeek = useCallback(async (start: Date) => {
    const v = ++fetchVersion.current;
    const { end } = getWeekBounds(start);
    const cached = loadCache(start);

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
      saveCache(start, fresh);
    } catch (err) {
      if (fetchVersion.current !== v) return;
      if (!cached) setEvents([]);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      if (fetchVersion.current === v) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeek(weekStart);
  }, [weekStart, fetchWeek]);

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
