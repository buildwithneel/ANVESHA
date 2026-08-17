import React from 'react';
import { ShieldAlert, TrendingUp, ArrowUpRight, Info } from 'lucide-react';
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

export function StationRiskTrendCard({
  data = {
    time_range: '1h',
    current_risk_score: 82,
    risk_level: 'HIGH',
    net_change: 14,
    trend_data: [
      { time: '18:00', risk_score: 68 },
      { time: '18:10', risk_score: 70 },
      { time: '18:20', risk_score: 72 },
      { time: '18:30', risk_score: 75 },
      { time: '18:40', risk_score: 80 },
      { time: '18:50', risk_score: 82 },
    ],
    contributing_factors: [
      'Platform 3 passenger density > threshold (87%)',
      'CAM-07 restricted zone detection (confidence: 94%)',
      'Stairwell B foot-overbridge localized bottleneck',
    ],
    disclaimer: 'Decision-support indicator. Derived from observable CCTV events and crowd metrics.',
  },
}) {
  return (
    <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3.5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-500" />
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            STATION RISK TREND
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
          Decision-Support Indicator
        </span>
      </div>

      {/* Main Score Bar */}
      <div className="flex items-baseline justify-between p-3 bg-surface-raised rounded-xl border border-border">
        <div>
          <div className="text-[11px] text-text-muted">Station Composite Risk</div>
          <div className="text-xs font-bold text-text-primary mt-0.5">
            Level: <span className="text-orange-600 dark:text-orange-400 font-mono font-black">{data.risk_level}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400">
            {data.current_risk_score}
          </span>
          <span className="text-xs font-mono text-text-muted"> / 100</span>
          {data.net_change !== 0 && (
            <div className="text-[10px] font-mono text-orange-500 flex items-center justify-end gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{data.net_change} pts in last hour</span>
            </div>
          )}
        </div>
      </div>

      {/* Risk Chart */}
      <div className="h-44 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.trend_data || []}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
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
              dataKey="risk_score"
              name="Risk Score"
              stroke="#F97316"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#riskGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Contributing Factors */}
      {data.contributing_factors && data.contributing_factors.length > 0 && (
        <div className="p-2.5 bg-surface-raised rounded-lg border border-border text-[11px] space-y-1.5 font-mono">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Info className="w-3 h-3 text-accent" />
            Key Contributing Factors:
          </div>
          <ul className="space-y-1">
            {data.contributing_factors.map((f, i) => (
              <li key={i} className="text-text-secondary flex items-start gap-1.5">
                <span className="text-accent">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
