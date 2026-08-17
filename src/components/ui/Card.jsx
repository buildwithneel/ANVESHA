import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'rg-card bg-surface text-text-primary border border-border rounded-lg shadow-xs transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1 px-5 py-4 border-b border-border/60', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={cn('text-base font-semibold text-text-primary tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-xs text-text-muted leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('px-5 py-4 text-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center px-5 py-3 border-t border-border/60 bg-surface-raised/50 rounded-b-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
