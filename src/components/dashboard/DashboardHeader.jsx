import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle, AlertTriangle, Wifi, WifiOff, BellRing, BellOff, Bell, Volume2 } from 'lucide-react';
import { formatTime24 } from '../../utils/formatters';
import { Tooltip } from '../ui/Tooltip';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const NOTIFICATION_FILTERS = [
  { key: 'all', label: 'All', icon: Bell },
  { key: 'high', label: 'High+', icon: Volume2 },
  { key: 'critical', label: 'Critical', icon: BellRing },
  { key: 'muted', label: 'Muted', icon: BellOff },
];

export function DashboardHeader({ station, notificationFilter, onNotificationFilterChange }) {
  const [now, setNow] = useState(new Date());
  const [secondsSinceSync, setSecondsSinceSync] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setSecondsSinceSync((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resetSync = useCallback(() => setSecondsSinceSync(2), []);

  // Simulate periodic sync resets
  useEffect(() => {
    const syncTimer = setInterval(resetSync, 15000);
    return () => clearInterval(syncTimer);
  }, [resetSync]);

  const isStale = secondsSinceSync > 30;
  const isOperational = station.operationalStatus === 'OPERATIONAL';

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-3">
      {/* Main Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        {/* Left: Greeting & Station Identity */}
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-text-primary leading-tight">
            {getGreeting()}, Officer
          </h1>
          <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{station.name}</span>
            <span className="text-text-muted">·</span>
            <span>{station.division}</span>
            <span className="text-text-muted hidden sm:inline">·</span>
            <span className="hidden sm:inline text-text-muted">{dateStr}</span>
          </div>
        </div>

        {/* Right: Status Row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Station Operational Status */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border',
              isOperational
                ? 'bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/8 text-amber-700 dark:text-amber-400 border-amber-500/20'
            )}
          >
            {isOperational ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>{isOperational ? 'Station Operational' : 'Degraded Operations'}</span>
          </div>

          {/* Camera Sync Status */}
          <div className="text-[11px] text-text-muted font-mono flex items-center gap-1.5">
            <span>{station.cameras.online} / {station.cameras.total} cameras online</span>
          </div>

          {/* Live Data Status */}
          <Tooltip content={isStale ? `Data delayed — last update ${secondsSinceSync}s ago` : `Live feed active — updated ${secondsSinceSync}s ago`}>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-default',
                isStale
                  ? 'bg-amber-500/8 text-amber-700 dark:text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              )}
            >
              {isStale ? (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Delayed · {secondsSinceSync}s</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3" />
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live · {secondsSinceSync}s ago
                  </span>
                </>
              )}
            </div>
          </Tooltip>

          {/* Notification Filter */}
          <div className="flex items-center bg-canvas border border-border rounded-md overflow-hidden">
            {NOTIFICATION_FILTERS.map(({ key, label, icon: FilterIcon }) => (
              <Tooltip key={key} content={`Notification filter: ${label}`}>
                <button
                  type="button"
                  onClick={() => onNotificationFilterChange(key)}
                  aria-label={`Notification filter: ${label}`}
                  aria-pressed={notificationFilter === key}
                  className={cn(
                    'px-2 py-1.5 text-[10px] font-semibold flex items-center gap-1 transition-colors border-r border-border last:border-r-0',
                    notificationFilter === key
                      ? 'bg-accent-soft text-accent'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                  )}
                >
                  <FilterIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
