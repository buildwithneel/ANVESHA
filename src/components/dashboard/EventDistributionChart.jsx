import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { BarChart3 } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rg-card px-3 py-2 text-xs shadow-lg border border-border">
        <p className="text-text-muted">{label}</p>
        <p className="font-bold text-text-primary">
          {payload[0].value} events
        </p>
      </div>
    );
  }
  return null;
}

export function EventDistributionChart({ data }) {
  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.15)';
  const axisColor = isDark ? '#64748B' : '#94A3B8';
  const totalEvents = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          Event Distribution
        </CardTitle>
        <span className="text-[11px] text-text-muted font-mono">{totalEvents} total events</span>
      </CardHeader>

      <CardContent className="px-2 pb-3 pt-0">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11, fill: isDark ? '#CBD5E1' : '#334155', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="count" barSize={14} radius={[0, 3, 3, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={isDark ? entry.color + 'CC' : entry.color + '99'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
