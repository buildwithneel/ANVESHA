import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

/**
 * Empty State Container
 */
export function EmptyState({
  title = 'No Records Found',
  message = 'There are no active records matching your current filter criteria.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rg-card bg-surface/50 border border-dashed border-border rounded-lg',
        className
      )}
    >
      <div className="p-3 mb-3 text-text-muted bg-surface-raised rounded-full border border-border">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-sm leading-relaxed mb-4">{message}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
