import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * MetricCard - Enterprise KPI Card for Railway Control Desk
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // 'up' | 'down' | 'neutral'
  trendValue,
  status = 'normal', // 'normal' | 'attention' | 'critical' | 'info'
  className,
}) {
  const statusColors = {
    normal: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    attention: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    critical: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    info: 'text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
  };

  return (
    <Card className={cn('p-4 space-y-3 relative overflow-hidden', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={cn('p-2 rounded-md border', statusColors[status])}>
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-text-primary">{value}</span>

        {trendValue && (
          <div className="flex items-center gap-1 text-xs font-medium">
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-text-muted" />}
            <span
              className={cn(
                trend === 'up' && 'text-rose-700 dark:text-rose-400',
                trend === 'down' && 'text-emerald-700 dark:text-emerald-400',
                trend === 'neutral' && 'text-text-muted'
              )}
            >
              {trendValue}
            </span>
          </div>
        )}
      </div>

      {subtitle && <p className="text-xs text-text-muted border-t border-border/40 pt-2">{subtitle}</p>}
    </Card>
  );
}
