import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, BrainCircuit, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    let labelText = 'NORMAL';
    let labelColor = 'text-emerald-600 dark:text-emerald-400';
    if (val >= 80) {
      labelText = 'HIGH';
      labelColor = 'text-rose-600 dark:text-rose-400';
    } else if (val >= 60) {
      labelText = 'MODERATE';
      labelColor = 'text-amber-600 dark:text-amber-400';
    }

    return (
      <div className="rg-card px-3 py-2 text-xs shadow-lg border border-border bg-surface">
        <p className="text-text-muted font-mono text-[10px]">{label}</p>
        <p className="font-bold text-text-primary text-sm font-mono">
          {val}% <span className={cn('text-xs font-semibold', labelColor)}>({labelText})</span>
        </p>
      </div>
    );
  }
  return null;
}

export function CrowdTrendChart({
  trendData = [],
  prediction = { current: 81, predicted10Min: 86, predicted20Min: 91, trend: 'INCREASING' },
  zoneName = 'Station Overall',
}) {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.15)';
  const axisColor = isDark ? '#64748B' : '#94A3B8';
  const areaFill = isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)';
  const lineColor = '#3B82F6';

  const isIncreasing = prediction?.trend === 'INCREASING';
  const isDecreasing = prediction?.trend === 'DECREASING';

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <CardTitle className="text-sm">
            Crowd Density — Last 60 Minutes
          </CardTitle>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
            {zoneName}
          </span>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted text-[11px]">Trend:</span>
          <div className={cn(
            'flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded border',
            isIncreasing
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
              : isDecreasing
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-surface text-text-secondary border-border'
          )}>
            {isIncreasing && <ArrowUpRight className="w-3.5 h-3.5" />}
            {isDecreasing && <TrendingDown className="w-3.5 h-3.5" />}
            {!isIncreasing && !isDecreasing && <Minus className="w-3.5 h-3.5" />}
            <span>{prediction?.trend || 'STABLE'}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-2 space-y-3">
        {/* Time-Series Chart */}
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 12, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                ticks={[0, 30, 60, 80, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: axisColor, strokeDasharray: '4 4' }} />

              {/* Reference Threshold Lines */}
              <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.6} />
              <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.6} />

              <Area
                type="monotone"
                dataKey="density"
                stroke={lineColor}
                strokeWidth={2}
                fill={areaFill}
                dot={{ r: 3, fill: lineColor, stroke: '#fff', strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── 5. Projected Crowd Level Section ──────────────────── */}
        <div className="p-3 bg-canvas dark:bg-surface-raised/40 border border-border rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
              <BrainCircuit className="w-4 h-4 text-accent" />
              <span>Projected Crowd Level</span>
            </div>
            <span className="text-[10px] text-text-muted font-mono">
              AI Forecast Vector
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Current */}
            <div className="p-2 rounded bg-surface border border-border/80">
              <div className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Current</div>
              <div className="text-base font-black font-mono text-text-primary mt-0.5">
                {prediction?.current ?? 81}%
              </div>
            </div>

            {/* +10 min */}
            <div className="p-2 rounded bg-surface border border-border/80">
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider">+10 min</div>
              <div className="text-base font-black font-mono text-amber-700 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-0.5">
                <span>{prediction?.predicted10Min ?? prediction?.predicted_10_min ?? 86}%</span>
              </div>
            </div>

            {/* +20 min */}
            <div className="p-2 rounded bg-surface border border-border/80">
              <div className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold uppercase tracking-wider">+20 min</div>
              <div className="text-base font-black font-mono text-rose-700 dark:text-rose-400 mt-0.5 flex items-center justify-center gap-0.5">
                <span>{prediction?.predicted20Min ?? prediction?.predicted_20_min ?? 91}%</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-text-muted text-center pt-0.5">
            * Estimated projection from passenger flow models. Accuracy varies with unscheduled train delays.
          </p>
        </div>

        {/* Accessible Threshold Legend */}
        <div className="flex items-center justify-between text-[10px] text-text-muted px-1">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            0–59% NORMAL
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            60–79% MODERATE
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            80–100% HIGH
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default CrowdTrendChart;
