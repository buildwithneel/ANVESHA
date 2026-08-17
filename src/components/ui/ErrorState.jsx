import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

/**
 * Resilient Operational Error State
 */
export function ErrorState({
  title = 'System Telemetry Error',
  message = 'Unable to fetch real-time CCTV or alert telemetry. Verify backend connection.',
  onRetry,
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 rounded-lg space-y-3',
        className
      )}
    >
      <AlertOctagon className="w-8 h-8 flex-shrink-0" aria-hidden="true" />
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-xs opacity-90 mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button variant="danger" size="sm" icon={RotateCw} onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
}
