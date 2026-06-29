'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { CalendarEvent, EventFormData, CATEGORIES, Category } from '@/types';
import { WEEKDAY_SHORT, WEEKDAY_RRULE, toISODate } from '@/lib/weekHelpers';
import { getEventById } from '@/lib/calendarApi';

interface Props {
  mode: 'create' | 'edit';
  event?: CalendarEvent;
  defaultDate?: Date;
  onSubmit: (form: EventFormData, scope: 'this' | 'all') => Promise<void>;
  onDelete?: () => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}

function extractWeekdaysFromRule(rule: string): number[] {
  const match = rule.match(/BYDAY=([^;]+)/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((day) => WEEKDAY_RRULE.indexOf(day.trim()))
    .filter((i) => i >= 0);
}

function getInitialForm(event?: CalendarEvent, defaultDate?: Date): EventFormData {
  if (!event) {
    return {
      title: '',
      type: 'one-time',
      category: 'Personal',
      time: '',
      notes: '',
      weekdays: [],
      date: defaultDate ? toISODate(defaultDate) : toISODate(new Date()),
    };
  }
  const isRecurring = !!event.recurringEventId;
  const time = event.start.dateTime
    ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';
  return {
    title: event.summary ?? '',
    type: isRecurring ? 'recurring' : 'one-time',
    category: (event.extendedProperties?.private?.category ?? 'Other') as Category,
    time,
    notes: event.description ?? '',
    weekdays: [],
    date: event.start.date ?? (event.start.dateTime ? toISODate(new Date(event.start.dateTime)) : toISODate(new Date())),
  };
}

interface FormErrors {
  title?: string;
  weekdays?: string;
  date?: string;
}

export default function EventModal({
  mode,
  event,
  defaultDate,
  onSubmit,
  onDelete,
  onClose,
  loading,
  error,
}: Props) {
  const isEdit = mode === 'edit';
  const isRecurringEvent = isEdit && !!event?.recurringEventId;

  const [form, setForm] = useState<EventFormData>(() => getInitialForm(event, defaultDate));
  const [scope, setScope] = useState<'this' | 'all'>('this');
  const [errors, setErrors] = useState<FormErrors>({});
  const [fetchingMaster, setFetchingMaster] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus title on open
  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  // When scope changes to 'all' for recurring event, fetch master to get weekdays
  useEffect(() => {
    if (!isRecurringEvent || scope !== 'all' || !event?.recurringEventId) return;
    setFetchingMaster(true);
    getEventById(event.recurringEventId)
      .then((master) => {
        const rule = master.recurrence?.[0] ?? '';
        const weekdays = extractWeekdaysFromRule(rule);
        setForm((f) => ({ ...f, weekdays, type: 'recurring' }));
      })
      .catch(() => {})
      .finally(() => setFetchingMaster(false));
  }, [scope, isRecurringEvent, event?.recurringEventId]);

  // Keyboard close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [loading, onClose]);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.type === 'recurring' && (!form.weekdays || form.weekdays.length === 0)) {
      errs.weekdays = 'Select at least one day';
    }
    if (form.type === 'one-time' && !form.date) {
      errs.date = 'Date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // For editing this occurrence of a recurring event, treat as one-time for the patch
    const effectiveScope = isRecurringEvent ? scope : 'all';
    await onSubmit(
      {
        ...form,
        // When editing 'this occurrence', type doesn't matter much for the patch
        type: isRecurringEvent && scope === 'this' ? 'one-time' : form.type,
      },
      effectiveScope
    );
  }

  function toggleWeekday(idx: number) {
    setForm((f) => {
      const current = f.weekdays ?? [];
      const next = current.includes(idx)
        ? current.filter((d) => d !== idx)
        : [...current, idx].sort((a, b) => a - b);
      return { ...f, weekdays: next };
    });
    if (errors.weekdays) setErrors((e) => ({ ...e, weekdays: undefined }));
  }

  const showWeekdays = form.type === 'recurring' && (!isRecurringEvent || scope === 'all');
  const showDatePicker = form.type === 'one-time' && !(isRecurringEvent && scope === 'all');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? 'Edit event' : 'New event'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Recurring event scope selector */}
            {isRecurringEvent && (
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setScope('this')}
                  className={`flex-1 py-2 transition-colors ${
                    scope === 'this'
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  This occurrence
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`flex-1 py-2 border-l border-zinc-200 dark:border-zinc-700 transition-colors ${
                    scope === 'all'
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  Entire series
                </button>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={(e) => {
                  setForm((f) => ({ ...f, title: e.target.value }));
                  if (errors.title) setErrors((er) => ({ ...er, title: undefined }));
                }}
                placeholder="Event title"
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 transition-colors ${
                  errors.title
                    ? 'border-rose-400 dark:border-rose-700 focus:ring-rose-200 dark:focus:ring-rose-900/40'
                    : 'border-zinc-200 dark:border-zinc-700 focus:ring-accent-200 dark:focus:ring-accent-900/30 focus:border-accent-400'
                }`}
              />
              {errors.title && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.title}
                </p>
              )}
            </div>

            {/* Type toggle — only for new events or editing non-recurring one-time */}
            {!isRecurringEvent && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Type</label>
                <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: 'one-time' }))}
                    className={`flex-1 py-2 transition-colors ${
                      form.type === 'one-time'
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    One-time
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: 'recurring' }))}
                    className={`flex-1 py-2 border-l border-zinc-200 dark:border-zinc-700 transition-colors ${
                      form.type === 'recurring'
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Recurring
                  </button>
                </div>
              </div>
            )}

            {/* Weekdays (for recurring) */}
            {showWeekdays && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Repeat on <span className="text-rose-500">*</span>
                </label>
                {fetchingMaster ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Loader2 size={13} className="animate-spin" /> Loading series…
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    {WEEKDAY_SHORT.map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleWeekday(i)}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-colors ${
                          form.weekdays?.includes(i)
                            ? 'bg-accent-500 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {day[0]}
                      </button>
                    ))}
                  </div>
                )}
                {errors.weekdays && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.weekdays}
                  </p>
                )}
              </div>
            )}

            {/* Date picker (for one-time) */}
            {showDatePicker && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date ?? ''}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, date: e.target.value }));
                    if (errors.date) setErrors((er) => ({ ...er, date: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-colors font-mono ${
                    errors.date
                      ? 'border-rose-400 dark:border-rose-700 focus:ring-rose-200 dark:focus:ring-rose-900/40'
                      : 'border-zinc-200 dark:border-zinc-700 focus:ring-accent-200 dark:focus:ring-accent-900/30 focus:border-accent-400'
                  }`}
                />
                {errors.date && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.date}
                  </p>
                )}
              </div>
            )}

            {/* Row: Category + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-accent-200 dark:focus:ring-accent-900/30 focus:border-accent-400 transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Time <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  type="time"
                  value={form.time ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-accent-200 dark:focus:ring-accent-900/30 focus:border-accent-400 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Notes <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.notes ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes…"
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-200 dark:focus:ring-accent-900/30 focus:border-accent-400 resize-none transition-colors"
              />
            </div>

            {/* API error */}
            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                <AlertCircle size={13} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors disabled:opacity-40"
              >
                <Trash2 size={13} strokeWidth={2} />
                Delete
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={12} className="animate-spin" />}
                {isEdit ? 'Save changes' : 'Create event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
