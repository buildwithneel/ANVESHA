import React, { useState } from 'react';
import { cn } from '../../utils/cn';

/**
 * Accessible Tooltip Component
 * Displays helpful context labels on hover or keyboard focus.
 */
export function Tooltip({ children, content, position = 'top', className }) {
  const [isVisible, setIsVisible] = useState(false);

  if (!content) return children;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-2 py-1 text-[11px] font-medium text-white bg-slate-900 dark:bg-slate-800 border border-slate-700 rounded shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-150',
            positions[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
