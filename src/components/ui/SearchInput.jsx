import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Enterprise Command Search Bar
 * Supports search icon, clear button, keyboard shortcut badge (e.g. '/'), and accessibility labels.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  shortcutHint = '/',
  onClear,
  className,
  inputRef,
  ...props
}) {
  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="absolute left-3 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-16 py-1.5 text-xs sm:text-sm bg-canvas border border-border rounded-md text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
        {...props}
      />

      <div className="absolute right-2.5 flex items-center gap-1">
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="p-1 text-text-muted hover:text-text-primary rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          shortcutHint && (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface border border-border rounded shadow-2xs">
              {shortcutHint}
            </kbd>
          )
        )}
      </div>
    </div>
  );
}
