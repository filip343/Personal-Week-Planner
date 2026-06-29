'use client';

import { CalendarEvent, Category, EventFormData, CATEGORIES, CATEGORY_COLORS } from '@/types';
import { toISODate, WEEKDAY_SHORT } from '@/lib/weekHelpers';
import { X, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  event: CalendarEvent | null;
  defaultDate?: string;
  onClose: () => void;
  onCreate: (form: EventFormData) => Promise<void>;
  onUpdate: (event: CalendarEvent, form: EventFormData, mode: 'this' | 'all') => Promise<void>;
  onDelete: (event: CalendarEvent) => void;
  saving: boolean;
}

function eventToForm(event: CalendarEvent): EventFormData {
  const isRecurring = !!event.recurringEventId || !!(event.recurrence?.length);
  const time = event.start.dateTime?.slice(11, 16) ?? undefined;
  const date = event.start.date ?? event.start.dateTime?.slice(0, 10) ?? toISODate(new Date());
  const weekdays: number[] = [];
  if (isRecurring && event.recurrence) {
    const rrule = event.recurrence.find((r) => r.startsWith('RRULE:'));
    const byday = rrule?.match(/BYDAY=([^;]+)/)?.[1] ?? '';
    const rruleDays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    byday.split(',').forEach((d) => {
      const idx = rruleDays.indexOf(d.trim());
      if (idx >= 0) weekdays.push(idx);
    });
  }
  return {
    title: event.summary,
    type: isRecurring ? 'recurring' : 'one-time',
    category: (event.extendedProperties?.private?.category as Category) ?? 'Other',
    time,
    notes: event.description ?? '',
    weekdays: weekdays.length ? weekdays : undefined,
    date,
  };
}

export default function EventModal({
  open,
  event,
  defaultDate,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  saving,
}: Props) {
  const isEdit = !!event;
  const isRecurringInstance = !!(event?.recurringEventId);

  const emptyForm: EventFormData = {
    title: '',
    type: 'one-time',
    category: 'Other',
    time: '',
    notes: '',
    weekdays: [],
    date: defaultDate ?? toISODate(new Date()),
  };

  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [recurringMode, setRecurringMode] = useState<'this' | 'all'>('this');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setErrors({});
      if (event) {
        setForm(eventToForm(event));
        setRecurringMode('this');
      } else {
        setForm({ ...emptyForm, date: defaultDate ?? toISODate(new Date()) });
      }
      setTimeout(() => titleRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event, defaultDate]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
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
    const cleaned = { ...form, title: form.title.trim(), notes: form.notes?.trim() };
    if (isEdit && event) {
      await onUpdate(event, cleaned, recurringMode);
    } else {
      await onCreate(cleaned);
    }
  }

  function toggleWeekday(idx: number) {
    setForm((f) => {
      const days = f.weekdays ?? [];
      return {
        ...f,
        weekdays: days.includes(idx) ? days.filter((d) => d !== idx) : [...days, idx].sort(),
      };
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            {isEdit ? 'Edit event' : 'New event'}
          </h2>
          <div className="flex items-center gap-1">
            {isEdit && (
              <button
                type="button"
                onClick={() => event && onDelete(event)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                aria-label="Delete event"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Recurring edit mode selector */}
          {isEdit && isRecurringInstance && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Edit</p>
              {(['this', 'all'] as const).map((m) => (
                <label
                  key={m}
                  className={`
                    flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors
                    ${recurringMode === m
                      ? 'border-accent-300 bg-accent-50 dark:border-accent-700 dark:bg-accent-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="recurring-mode"
                    checked={recurringMode === m}
                    onChange={() => setRecurringMode(m)}
                    className="accent-sky-500"
                  />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">
                    {m === 'this' ? 'This occurrence only' : 'All occurrences (entire series)'}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Title
            </label>
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Event title"
              className={`
                w-full px-3 py-2 text-sm rounded-lg border bg-transparent
                focus:outline-none focus:ring-2 focus:ring-accent-500/40 transition-shadow
                ${errors.title
                  ? 'border-rose-400 dark:border-rose-600'
                  : 'border-zinc-200 dark:border-zinc-700'
                }
                text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400
              `}
            />
            {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
          </div>

          {/* Type toggle */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Type
              </label>
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {(['one-time', 'recurring'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`
                      flex-1 py-1.5 text-xs font-medium transition-colors
                      ${form.type === t
                        ? 'bg-accent-500 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }
                    `}
                  >
                    {t === 'one-time' ? 'One-time' : 'Recurring'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const c = CATEGORY_COLORS[cat];
                const selected = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: cat }))}
                    className={`
                      flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium border transition-all
                      ${selected
                        ? `${c.bg} ${c.text} border-transparent`
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300'
                      }
                    `}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekdays (recurring) */}
          {form.type === 'recurring' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Repeat on
              </label>
              <div className="flex gap-1">
                {WEEKDAY_SHORT.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    className={`
                      flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors
                      ${form.weekdays?.includes(idx)
                        ? 'bg-accent-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }
                    `}
                  >
                    {day[0]}
                  </button>
                ))}
              </div>
              {errors.weekdays && <p className="mt-1 text-xs text-rose-500">{errors.weekdays}</p>}
            </div>
          )}

          {/* Date (one-time) */}
          {form.type === 'one-time' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={`
                  w-full px-3 py-2 text-sm rounded-lg border bg-transparent font-mono
                  focus:outline-none focus:ring-2 focus:ring-accent-500/40 transition-shadow
                  ${errors.date ? 'border-rose-400' : 'border-zinc-200 dark:border-zinc-700'}
                  text-zinc-900 dark:text-zinc-100
                `}
              />
              {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
            </div>
          )}

          {/* Time */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Time <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              type="time"
              value={form.time ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value || undefined }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent font-mono focus:outline-none focus:ring-2 focus:ring-accent-500/40 transition-shadow text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Notes <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Add notes…"
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-accent-500/40 transition-shadow text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2 px-4 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
          </button>
        </div>
      </div>
    </div>
  );
}
