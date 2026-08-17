import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Reusable Enterprise Button Component
 * Supports variants (primary, secondary, outline, ghost, danger, success),
 * sizes (sm, md, lg), loading state, icons, and keyboard accessibility.
 */
export const Button = forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon: Icon = null,
      iconPosition = 'left',
      ariaLabel,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer active:scale-[0.99]';

    const variants = {
      primary: 'bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900 border border-transparent shadow-xs',
      secondary: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 border border-transparent',
      outline: 'bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60',
      ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
      danger: 'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 border border-transparent shadow-xs',
      success: 'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 border border-transparent shadow-xs',
      warning: 'bg-amber-700 text-white hover:bg-amber-800 active:bg-amber-900 border border-transparent shadow-xs',
    };

    const sizes = {
      sm: 'px-2.5 py-1 text-xs gap-1.5 min-h-[30px]',
      md: 'px-3.5 py-1.5 text-sm gap-2 min-h-[36px]',
      lg: 'px-4 py-2.5 text-base gap-2.5 min-h-[42px]',
      icon: 'p-2 w-9 h-9 text-sm justify-center',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : Icon && iconPosition === 'left' ? (
          <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        ) : null}

        {children}

        {!isLoading && Icon && iconPosition === 'right' ? (
          <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
