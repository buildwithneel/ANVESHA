import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Calm Skeleton / Loading State Indicator
 */
export function LoadingState({ rows = 3, message = 'Loading operational telemetry...', className }) {
  return (
    <div className={cn('p-5 space-y-4 rg-card bg-surface border border-border rounded-lg', className)}>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
        <span className="text-xs font-medium text-text-muted">{message}</span>
      </div>

      <div className="space-y-2.5 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-full bg-slate-200/70 dark:bg-slate-800/60 rounded-md animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
