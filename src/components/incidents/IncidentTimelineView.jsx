import React from 'react';
import {
  ShieldAlert,
  FilePlus,
  Search,
  MessageSquare,
  CheckCircle2,
  Activity,
  Clock,
  User,
  Radio,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const EVENT_TYPE_CONFIG = {
  alert_linked: {
    label: 'AI Alert Triggered',
    icon: Radio,
    iconColor: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
  },
  incident_opened: {
    label: 'Incident Logged',
    icon: FilePlus,
    iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  },
  investigation_started: {
    label: 'Investigation Underway',
    icon: Search,
    iconColor: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  },
  note_added: {
    label: 'Officer Field Note',
    icon: MessageSquare,
    iconColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
  },
  incident_resolved: {
    label: 'Incident Resolved',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  },
  status_changed: {
    label: 'Status Transition',
    icon: Activity,
    iconColor: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  },
};

export function IncidentTimelineView({ events = [], className }) {
  if (!events || events.length === 0) {
    return (
      <div className={cn('p-4 text-xs text-text-muted text-center bg-canvas rounded-lg border border-border', className)}>
        No timeline events recorded yet.
      </div>
    );
  }

  // Sort chronological ascending (oldest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime()
  );

  return (
    <div className={cn('relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border', className)}>
      {sortedEvents.map((ev, index) => {
        const typeConfig = EVENT_TYPE_CONFIG[ev.event_type] || {
          label: ev.event_type?.replace(/_/g, ' ') || 'Event',
          icon: Activity,
          iconColor: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
        };
        const EventIcon = typeConfig.icon;
        const timeStr = ev.created_at || ev.createdAt;

        return (
          <div key={ev.id || index} className="relative group">
            {/* Timeline Dot Icon */}
            <div
              className={cn(
                'absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 bg-surface shadow-xs',
                typeConfig.iconColor
              )}
            >
              <EventIcon className="w-2.5 h-2.5" />
            </div>

            {/* Event Content Card */}
            <div className="bg-canvas p-3 rounded-md border border-border text-xs space-y-1 hover:border-border-strong transition-colors">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-text-primary text-[11px]">
                  {typeConfig.label}
                </span>
                <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(timeStr)}</span>
                  <span className="text-text-muted hidden sm:inline">({formatDateTime(timeStr)})</span>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed pt-0.5">
                {ev.description}
              </p>

              {ev.actor && (
                <div className="flex items-center gap-1 text-[10px] text-text-muted pt-1 border-t border-border/40 font-mono">
                  <User className="w-3 h-3 text-text-muted" />
                  <span>Logged by: <strong className="text-text-primary">{ev.actor}</strong></span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default IncidentTimelineView;
