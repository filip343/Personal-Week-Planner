'use client';

import { WeekStat } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Props {
  stats: WeekStat[];
  currentTotal: number;
  currentDone: number;
  loading: boolean;
}

export default function StatsChart({ stats, currentTotal, currentDone, loading }: Props) {
  const completionPct = currentTotal === 0 ? 0 : Math.round((currentDone / currentTotal) * 100);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Completion trend
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Last 8 weeks</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-semibold text-zinc-900 dark:text-zinc-100">
            {currentDone}
            <span className="text-zinc-400 dark:text-zinc-600 text-lg">/{currentTotal}</span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {completionPct}% this week
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-40 skeleton rounded-lg" />
      ) : stats.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-xs text-zinc-400">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={stats} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'currentColor', className: 'text-zinc-400' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'currentColor', className: 'text-zinc-400' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              cursor={{ fill: 'currentColor', className: 'text-zinc-100 dark:text-zinc-800', opacity: 0.5 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as WeekStat;
                return (
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg px-3 py-2 text-xs">
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">{d.label}</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {d.done} of {d.total} done ({d.rate}%)
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="rate" radius={[3, 3, 0, 0]} maxBarSize={32}>
              {stats.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    index === stats.length - 1
                      ? '#0ea5e9'
                      : entry.rate >= 80
                      ? '#34d399'
                      : entry.rate >= 50
                      ? '#fbbf24'
                      : '#f87171'
                  }
                  fillOpacity={index === stats.length - 1 ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
