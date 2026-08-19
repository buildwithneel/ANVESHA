import React from 'react';
import { cn } from '../../utils/cn';

/**
 * RailGuardLogo Component (ANVESHA AI)
 * Renders the official ANVESHA AI emblem logo & brand identity.
 */
export function RailGuardLogo({ variant = 'default', className = '', showSubtitle = true }) {
  if (variant === 'icon') {
    return (
      <div className={cn("relative flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-border shadow-xs flex-shrink-0 select-none overflow-hidden p-0.5", className)}>
        <img src="/logo.png" alt="ANVESHA" className="w-full h-full object-contain" />
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <div className={cn("flex items-center gap-3.5 select-none", className)}>
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border/80 shadow-md flex-shrink-0 p-1">
          <img src="/logo.png" alt="ANVESHA" className="w-full h-full object-contain drop-shadow-xs" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase">
              INDIAN RAILWAYS
            </span>
            <span className="text-[9px] font-mono px-1.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-bold">
              GOI
            </span>
          </div>
          <h1 className="text-2xl font-black font-heading text-text-primary tracking-tight leading-tight uppercase">
            ANVESHA
          </h1>
          {showSubtitle && (
            <p className="text-xs text-text-secondary font-semibold leading-none mt-0.5">
              Railway Safety & Surveillance Intelligence
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-surface border border-border shadow-xs flex-shrink-0 p-0.5 overflow-hidden">
        <img src="/logo.png" alt="ANVESHA" className="w-full h-full object-contain" />
      </div>
      <div className="overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-1">
          <h1 className="text-base font-black font-heading text-text-primary tracking-tight leading-none uppercase">
            ANVESHA
          </h1>
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-text-secondary mt-0.5 font-mono font-semibold">
            Indian Railways · BRC
          </p>
        )}
      </div>
    </div>
  );
}

export default RailGuardLogo;

