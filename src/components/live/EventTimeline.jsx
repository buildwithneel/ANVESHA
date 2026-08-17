import React from 'react';
import { cn } from '../../utils/cn';
import { getSeverityConfig } from '../../utils/severity';
import { Clock, MapPin } from 'lucide-react';

export function EventTimeline({ events = [], selectedEventId, onSelectEvent, className }) {
  if (!events || events.length === 0) {
    return (
      <div className={cn('px-4 py-3 text-xs text-text-muted text-center', className)}>
        No events recorded for current session.
      </div>
    );
  }

  return (
    <div className={cn('flex items-stretch gap-1.5 overflow-x-auto px-3 py-2', className)}>
      {events.map((event) => {
        const config = getSeverityConfig(event.severity);
        const SeverityIcon = config.icon;
        const isSelected = event.id === selectedEventId;

        return (
          <button
            key={event.id}
            type="button"
            onClick={() => onSelectEvent(event)}
            aria-label={`Event: ${event.title} at ${event.time}`}
            aria-pressed={isSelected}
            className={cn(
              'flex-shrink-0 flex items-start gap-2 px-3 py-2 rounded-md border-l-2 text-left transition-colors min-w-[200px] max-w-[260px]',
              isSelected
                ? cn('bg-accent-soft border-l-accent', config.borderClass)
                : 'bg-surface hover:bg-surface-hover border-l-transparent border border-border'
            )}
          >
            <SeverityIcon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', config.textClass)} aria-hidden="true" />
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                <Clock className="w-3 h-3" />
                {event.time}
              </div>
              <p className="text-[11px] font-semibold text-text-primary leading-tight truncate">
                {event.title}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-text-muted">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
