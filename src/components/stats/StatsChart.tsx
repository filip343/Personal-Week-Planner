'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { CalendarEvent, WeekStat } from '@/types';
import { getMultipleWeeksEvents } from '@/lib/calendarApi';
import { addWeeks, getWeekBounds, buildWeekStats } from '@/lib/weekHelpers';
import { TrendingUp, Loader2 } from 'lucide-react';

const WEEKS_BACK = 7; // 7 prior weeks + current = 8 total

interface Props {
  currentWeekStart: Date;
  currentEvents: CalendarEvent[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: WeekStat }>;
  label?: string;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1">{d.label}</div>
      <div className="text-zinc-500 dark:text-zinc-400">
        {d.done} of {d.total} done
      </div>
      <div className="font-mono font-bold text-accent-500 mt-0.5">{d.rate}%</div>
    </div>
  );
}

export default function StatsChart({ currentWeekStart, currentEvents }: Props) {
  const [stats, setStats] = useState<WeekStat[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const priorStarts = Array.from({ length: WEEKS_BACK }, (_, i) =>
      getWeekBounds(addWeeks(currentWeekStart, -(WEEKS_BACK - i))).start
    );

    getMultipleWeeksEvents(priorStarts)
      .then((priorSets) => {
        const allStarts = [...priorStarts, currentWeekStart];
        const allSets = [...priorSets, currentEvents];
        setStats(buildWeekStats(allSets, allStarts));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      })
      .finally(() => setLoading(false));
  }, [currentWeekStart, currentEvents]);

  const currentStat = stats?.[stats.length - 1];
  const totalDone = currentEvents.filter(
    (e) => e.extendedProperties?.private?.done === 'true'
  ).length;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} strokeWidth={2} className="text-accent-500" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Completion trend — last 8 weeks
          </span>
        </div>
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          This week:{' '}
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {totalDone} of {currentEvents.length}
          </span>{' '}
          done
          {currentStat && currentStat.total > 0 && (
            <span className="ml-1 text-accent-500">({currentStat.rate}%)</span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-32">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-zinc-300 dark:text-zinc-700" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-xs text-rose-500">
            {error}
          </div>
        ) : stats && stats.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-zinc-100 dark:text-zinc-800"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'currentColor', className: 'text-zinc-400' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: 'currentColor', className: 'text-zinc-400' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
                ticks={[0, 50, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={100}
                stroke="currentColor"
                strokeDasharray="3 3"
                className="text-accent-200 dark:text-accent-900"
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-600">
            No data yet
          </div>
        )}
      </div>
    </div>
  );
}
