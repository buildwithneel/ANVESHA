import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';

export function EventDistributionCard({
  data = {
    total_events: 142,
    categories: [
      { category: 'Crowd Flow & Surges', count: 58, percentage: 40.8, color: '#3B82F6' },
      { category: 'Security & Perimeter', count: 42, percentage: 29.6, color: '#EF4444' },
      { category: 'Worksite & PPE', count: 32, percentage: 22.5, color: '#F59E0B' },
      { category: 'General Operational', count: 10, percentage: 7.1, color: '#10B981' },
    ],
  },
}) {
  const chartData = (data.categories || []).map((c) => ({
    name: c.category,
    value: c.count,
    color: c.color,
  }));

  return (
    <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3.5 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            DETECTION EVENT DISTRIBUTION
          </h2>
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          Total: {data.total_events || 142}
        </span>
      </div>

      {/* Chart & Legend Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-3">
        {/* Donut Chart */}
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Categories List */}
        <div className="space-y-2 text-xs">
          {(data.categories || []).map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-text-secondary text-[11px] truncate max-w-[120px]">
                  {cat.category}
                </span>
              </div>
              <div className="font-mono text-[11px] text-right">
                <strong className="text-text-primary">{cat.count}</strong>
                <span className="text-text-muted ml-1">({cat.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
