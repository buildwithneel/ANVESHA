import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../utils/cn';
import { getSeverityConfig } from '../../utils/severity';
import { Clock, Camera, ChevronRight, MapPin } from 'lucide-react';

export function PriorityAlertsList({ alerts, onAlertClick }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          Priority Alerts
          <span className="text-[10px] font-mono bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25 px-1.5 py-0.5 rounded-md font-bold">
            {alerts.length}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 space-y-2">
        {alerts.map((alert) => {
          const config = getSeverityConfig(alert.severity);

          return (
            <button
              key={alert.id}
              type="button"
              onClick={() => onAlertClick(alert)}
              className={cn(
                'w-full text-left p-3 rounded-md border-l-[3px] bg-surface hover:bg-surface-hover/80 transition-colors focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer',
                config.borderClass
              )}
              aria-label={`${alert.severity} alert: ${alert.title}. ${alert.relativeTime}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusBadge severity={alert.severity} size="sm" />
                  <span className="text-[11px] font-semibold text-text-primary truncate">
                    {alert.eventType}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
              </div>

              <p className="text-[11px] text-text-secondary leading-relaxed mb-2 line-clamp-1">
                {alert.title}
              </p>

              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {alert.location}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Camera className="w-3 h-3" />
                  {alert.cameraId}
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  <Clock className="w-3 h-3" />
                  {alert.relativeTime}
                </span>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
