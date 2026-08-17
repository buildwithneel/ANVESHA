import React from 'react';
import { Users, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '../../utils/cn';

export function CrowdDensityTrendCard({
  data = {
    time_range: '1h',
    current_density: 87.0,
    average_density: 73.0,
    peak_density: 88.0,
    trend_direction: 'INCREASING',
    trend_data: [
      { time: '18:00', density: 54.0, passengers: 240 },
      { time: '18:10', density: 62.0, passengers: 280 },
      { time: '18:20', density: 71.0, passengers: 320 },
      { time: '18:30', density: 79.0, passengers: 370 },
      { time: '18:40', density: 85.0, passengers: 410 },
      { time: '18:50', density: 87.0, passengers: 428 },
    ],
  },
  timeRange = '1h',
  onTimeRangeChange,
}) {
  const isIncreasing = data.trend_direction === 'INCREASING';

  return (
    <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3.5 select-none">
      {/* Header with Time Range Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            CROWD DENSITY TREND
          </h2>
        </div>

        {/* Time Range Filter: 15m, 1h, 6h, today */}
        <div className="flex rounded-lg border border-border overflow-hidden bg-surface-raised text-xs">
          {['15m', '1h', '6h', 'today'].map((tr) => (
            <button
              key={tr}
              onClick={() => onTimeRangeChange && onTimeRangeChange(tr)}
              className={cn(
                'px-2.5 py-1 font-mono transition-colors text-[11px]',
                timeRange === tr
                  ? 'bg-accent text-white font-bold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              {tr.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">Current Density</div>
          <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
            {data.current_density}%
          </div>
        </div>

        <div className="p-2 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">Average Density</div>
          <div className="font-mono font-bold text-text-primary text-sm mt-0.5">
            {data.average_density}%
          </div>
        </div>

        <div className="p-2 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">Peak Density</div>
          <div className="font-mono font-bold text-red-500 text-sm mt-0.5">
            {data.peak_density}%
          </div>
        </div>

        <div className="p-2 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">Trend Direction</div>
          <div className="font-mono font-bold text-sm mt-0.5 flex items-center gap-1 text-text-primary">
            {isIncreasing ? (
              <span className="text-orange-500 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Increasing
              </span>
            ) : (
              <span className="text-emerald-500 flex items-center gap-0.5">
                <Minus className="w-3.5 h-3.5" />
                Stable
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.trend_data || []}>
            <defs>
              <linearGradient id="crowdDensityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Area
              type="monotone"
              dataKey="density"
              name="Density %"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#crowdDensityGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
