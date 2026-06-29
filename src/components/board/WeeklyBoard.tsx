'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, EventFormData, Category } from '@/types';
import { useWeek } from '@/hooks/useWeek';
import { bucketByDay, getWeekdays, getWeekBounds, toISODate, WEEKDAY_RRULE } from '@/lib/weekHelpers';
import WeekNav from '@/components/nav/WeekNav';
import DayColumn from './DayColumn';
import EventModal from '@/components/modal/EventModal';
import DeleteDialog from '@/components/modal/DeleteDialog';
import StatsChart from '@/components/stats/StatsChart';
import SkeletonBoard from '@/components/ui/SkeletonBoard';
import OfflineBanner from '@/components/OfflineBanner';
import ThemeToggle from '@/components/ThemeToggle';
import { BarChart2, LogOut, RefreshCw, Plus, AlertCircle } from 'lucide-react';

interface Props {
  onSignOut: () => void;
}

type ModalMode =
  | { type: 'create'; date?: Date }
  | { type: 'edit'; event: CalendarEvent }
  | { type: 'delete'; event: CalendarEvent }
  | null;

function localTz(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function buildEditPatch(form: EventFormData, scope: 'this' | 'all'): Record<string, unknown> {
  const base: Record<string, unknown> = {
    summary: form.title,
    description: form.notes ?? '',
    extendedProperties: {
      private: { category: form.category as Category },
    },
  };

  if (form.time) {
    const [hh, mm] = form.time.split(':').map(Number);
    const pad = (n: number) => String(n).padStart(2, '0');
    const endMin = (mm + 30) % 60;
    const endHr = hh + Math.floor((mm + 30) / 60);
    if (scope === 'this' && form.date) {
      base.start = { dateTime: `${form.date}T${pad(hh)}:${pad(mm)}:00`, timeZone: localTz() };
      base.end = { dateTime: `${form.date}T${pad(endHr)}:${pad(endMin)}:00`, timeZone: localTz() };
    } else if (scope === 'all') {
      const { start: weekMon } = getWeekBounds(new Date());
      const anchor = toISODate(weekMon);
      base.start = { dateTime: `${anchor}T${pad(hh)}:${pad(mm)}:00`, timeZone: localTz() };
      base.end = { dateTime: `${anchor}T${pad(endHr)}:${pad(endMin)}:00`, timeZone: localTz() };
    }
  } else if (scope === 'all') {
    const { start: weekMon } = getWeekBounds(new Date());
    const anchor = toISODate(weekMon);
    base.start = { date: anchor };
    base.end = { date: anchor };
  }

  if (scope === 'all' && form.type === 'recurring' && form.weekdays && form.weekdays.length > 0) {
    const days = form.weekdays.map((i) => WEEKDAY_RRULE[i]).join(',');
    base.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${days}`];
  }

  return base;
}

export default function WeeklyBoard({ onSignOut }: Props) {
  const {
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
  } = useWeek();

  const [modal, setModal] = useState<ModalMode>(null);
  const [showStats, setShowStats] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const weekdays = getWeekdays(weekStart);
  const buckets = bucketByDay(events, weekStart);

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (modal !== null) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (e.key === 'ArrowLeft') prevWeek();
      else if (e.key === 'ArrowRight') nextWeek();
      else if (e.key === 't' || e.key === 'T') thisWeek();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modal, prevWeek, nextWeek, thisWeek]);

  const handleAdd = useCallback((date?: Date) => {
    setMutationError(null);
    setModal({ type: 'create', date });
  }, []);

  const handleEdit = useCallback((event: CalendarEvent) => {
    setMutationError(null);
    setModal({ type: 'edit', event });
  }, []);

  const handleDeleteRequest = useCallback((event: CalendarEvent) => {
    setMutationError(null);
    setModal({ type: 'delete', event });
  }, []);

  const handleModalSubmit = useCallback(
    async (form: EventFormData, scope: 'this' | 'all') => {
      setMutating(true);
      setMutationError(null);
      try {
        if (modal?.type === 'create') {
          await addEvent(form);
          setModal(null);
        } else if (modal?.type === 'edit' && modal.event) {
          const event = modal.event;
          const isRecurring = !!event.recurringEventId;

          if (isRecurring && scope === 'all') {
            const patch = buildEditPatch(form, 'all');
            await editEvent(event.recurringEventId!, patch);
          } else {
            const patch = buildEditPatch(form, 'this');
            await editEvent(event.id, patch);
          }
          setModal(null);
        }
      } catch (err) {
        setMutationError(err instanceof Error ? err.message : 'Failed to save event');
      } finally {
        setMutating(false);
      }
    },
    [modal, addEvent, editEvent]
  );

  const handleDelete = useCallback(
    async (scope: 'this' | 'all') => {
      if (modal?.type !== 'delete') return;
      setMutating(true);
      setMutationError(null);
      try {
        const event = modal.event;
        const isRecurring = !!event.recurringEventId;
        const idToDelete = isRecurring && scope === 'all' ? event.recurringEventId! : event.id;
        await removeEvent(idToDelete);
        setModal(null);
      } catch (err) {
        setMutationError(err instanceof Error ? err.message : 'Failed to delete event');
      } finally {
        setMutating(false);
      }
    },
    [modal, removeEvent]
  );

  const isFirstRun = !loading && events.length === 0 && !error;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {!isOnline && <OfflineBanner />}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 py-2.5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 min-w-0 overflow-hidden">
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight shrink-0 mr-3">
              Weekly Planner
            </h1>
            <WeekNav
              weekStart={weekStart}
              weekEnd={weekEnd}
              onPrev={prevWeek}
              onNext={nextWeek}
              onToday={thisWeek}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {error && (
              <button
                onClick={refresh}
                className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <RefreshCw size={12} strokeWidth={2} />
                Retry
              </button>
            )}
            <button
              onClick={() => setShowStats((s) => !s)}
              aria-label="Toggle completion chart"
              title="Completion trend"
              className={`p-2 rounded-lg transition-colors ${
                showStats
                  ? 'text-accent-500 bg-accent-50 dark:bg-accent-950/20'
                  : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <BarChart2 size={17} strokeWidth={2} />
            </button>
            <ThemeToggle />
            <button
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <LogOut size={17} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* Stats panel */}
      {showStats && (
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 py-4 bg-white dark:bg-zinc-900 animate-fade-in">
          <div className="max-w-[1400px] mx-auto">
            <StatsChart currentWeekStart={weekStart} currentEvents={events} />
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="px-4 md:px-6 py-2.5 bg-rose-50 dark:bg-rose-950/20 border-b border-rose-200 dark:border-rose-900">
          <div className="max-w-[1400px] mx-auto flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
            <AlertCircle size={13} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Board */}
      <main className="flex-1 px-4 md:px-6 py-4 overflow-x-auto">
        <div className="max-w-[1400px] mx-auto">
          {loading && events.length === 0 ? (
            <SkeletonBoard />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-5 min-h-[480px]">
                {weekdays.map((date, i) => (
                  <DayColumn
                    key={i}
                    dayIndex={i}
                    date={date}
                    events={buckets.get(i) ?? []}
                    onToggleDone={toggleDone}
                    onEdit={handleEdit}
                    onAdd={handleAdd}
                  />
                ))}
              </div>

              {/* First-run empty state */}
              {isFirstRun && (
                <div className="mt-10 flex flex-col items-center text-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-50 dark:bg-accent-950/30 flex items-center justify-center">
                    <Plus size={18} strokeWidth={1.5} className="text-accent-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Nothing planned this week
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
                      Click the&nbsp;<strong>+</strong>&nbsp;on any day column to add your first event
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd()}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-accent-500 hover:bg-accent-600 rounded-lg transition-colors active:scale-[0.98]"
                  >
                    <Plus size={14} strokeWidth={2} />
                    Add event
                  </button>
                </div>
              )}

              {/* Bottom add button (when there are events) */}
              {!isFirstRun && (
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => handleAdd()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-lg transition-colors"
                  >
                    <Plus size={13} strokeWidth={2} />
                    Add event
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {modal?.type === 'create' && (
        <EventModal
          mode="create"
          defaultDate={modal.date}
          onSubmit={handleModalSubmit}
          onDelete={undefined}
          onClose={() => setModal(null)}
          loading={mutating}
          error={mutationError}
        />
      )}
      {modal?.type === 'edit' && (
        <EventModal
          mode="edit"
          event={modal.event}
          onSubmit={handleModalSubmit}
          onDelete={() => handleDeleteRequest(modal.event)}
          onClose={() => setModal(null)}
          loading={mutating}
          error={mutationError}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteDialog
          event={modal.event}
          onConfirm={handleDelete}
          onCancel={() =>
            setModal(
              modal.type === 'delete' ? { type: 'edit', event: modal.event } : null
            )
          }
          loading={mutating}
          error={mutationError}
        />
      )}
    </div>
  );
}
