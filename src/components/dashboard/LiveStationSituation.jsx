import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../utils/cn';
import { Train, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STATUS_STYLES = {
  normal: {
    bar: 'bg-emerald-500',
    track: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-400',
    riskLabel: 'LOW',
    label: 'NORMAL',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  low: {
    bar: 'bg-emerald-500',
    track: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-400',
    riskLabel: 'LOW',
    label: 'NORMAL',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  moderate: {
    bar: 'bg-amber-500',
    track: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-400',
    riskLabel: 'MODERATE',
    label: 'MODERATE',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  high: {
    bar: 'bg-rose-500',
    track: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-400',
    riskLabel: 'HIGH',
    label: 'HIGH',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
  },
};

export function LiveStationSituation({
  platforms = [],
  selectedPlatformId = 'PF-3',
  onSelectPlatform = () => {},
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">
        <CardTitle className="text-sm flex items-center gap-2">
          <Train className="w-4 h-4 text-accent" />
          Platform Risk & Live Situation
        </CardTitle>
        <span className="text-[10px] text-text-muted font-mono">
          Click platform to filter
        </span>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-3 space-y-2.5">
        {platforms.map((platform) => {
          const occ = platform.occupancy ?? platform.crowd_percentage ?? 50;
          let statusKey = 'normal';
          if (occ >= 80) statusKey = 'high';
          else if (occ >= 60) statusKey = 'moderate';

          const style = STATUS_STYLES[statusKey] || STATUS_STYLES.normal;
          const isSelected = selectedPlatformId === platform.id;

          return (
            <div
              key={platform.id}
              onClick={() => onSelectPlatform(platform.id)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && onSelectPlatform(platform.id)}
              className={cn(
                'p-2.5 rounded-lg border transition-all duration-150 cursor-pointer space-y-1.5 group',
                isSelected
                  ? 'bg-accent-soft/40 border-accent shadow-sm'
                  : 'bg-canvas/60 hover:bg-surface-hover border-border/70'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-bold', isSelected ? 'text-accent' : 'text-text-primary')}>
                    {platform.name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-semibold text-accent flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Filter
                    </span>
                  )}
                  {platform.incident && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      Alert
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Text Label for Risk Level */}
                  <span className={cn('text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border', style.badgeClass)}>
                    {style.riskLabel}
                  </span>
                  <span className="text-xs font-mono font-bold text-text-primary w-9 text-right">
                    {occ}%
                  </span>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div className={cn('h-1.5 rounded-full w-full', style.track)}>
                <div
                  className={cn('h-full rounded-full transition-all duration-500 ease-out', style.bar)}
                  style={{ width: `${occ}%` }}
                  role="progressbar"
                  aria-valuenow={occ}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${platform.name} occupancy at ${occ}%`}
                />
              </div>

              {/* Train info */}
              <div className="text-[10px] text-text-muted font-mono leading-tight flex justify-between">
                <span>{platform.trains || 'Regular scheduled service'}</span>
                <span className="text-text-muted">{platform.people_count ? `${platform.people_count} pax` : ''}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default LiveStationSituation;
