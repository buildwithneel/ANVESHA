import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({ children, className, variant = 'default', size = 'md', ...props }) {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
    outline: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium border rounded-md uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
