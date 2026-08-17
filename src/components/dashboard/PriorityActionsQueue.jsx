import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  ShieldAlert,
  Users,
  HardHat,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function PriorityActionsQueue({
  actions = [],
  onAcknowledge,
}) {
  const navigate = useNavigate();

  const handleViewCamera = (cameraId, alertId) => {
    navigate('/live-monitoring', {
      state: {
        cameraId: cameraId || 'CAM-07',
        alertId: alertId,
        highlightDetection: true,
      },
    });
  };

  const handleViewPlatform = (zone) => {
    navigate('/crowd-intelligence', {
      state: {
        zoneId: zone === 'Platform 3' ? 'PF-3' : zone === 'Platform 2' ? 'PF-2' : 'PF-1',
      },
    });
  };

  const getSeverityBadgeClass = (sev) => {
    const s = (sev || 'MEDIUM').toUpperCase();
    if (s === 'CRITICAL') return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800';
    if (s === 'HIGH') return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800';
    if (s === 'MODERATE' || s === 'MEDIUM') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800';
  };

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-xl border border-border text-center text-text-muted">
        <CheckCircle className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
        <span className="text-sm font-semibold text-text-primary">No Critical Priority Actions Pending</span>
        <p className="text-xs text-text-muted mt-0.5">All railway zones and security corridors are operating within safety parameters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((item) => {
        const isCritical = item.severity === 'CRITICAL';
        return (
          <div
            key={item.id}
            className={cn(
              'p-3.5 rounded-xl border bg-surface transition-all duration-150 hover:shadow-md space-y-2.5',
              isCritical
                ? 'border-red-400 dark:border-red-800/80 bg-red-50/20 dark:bg-red-950/10'
                : 'border-border'
            )}
          >
            {/* Header: Type, Severity, Elapsed Time */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn('px-2 py-0.5 rounded text-[11px] font-bold border', getSeverityBadgeClass(item.severity))}>
                  {item.severity}
                </span>
                <h3 className="text-xs font-bold text-text-primary truncate">
                  {item.event_type}
                </h3>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-mono text-text-muted flex-shrink-0">
                <Clock className="w-3 h-3" />
                <span>{item.relative_time || item.duration_str}</span>
              </div>
            </div>

            {/* Description & Location */}
            <p className="text-xs text-text-secondary leading-snug">
              {item.title}
            </p>

            <div className="flex items-center gap-3 text-[11px] text-text-muted">
              <span className="flex items-center gap-1 font-mono text-text-primary">
                <MapPin className="w-3 h-3 text-accent" />
                {item.location} ({item.zone})
              </span>
              {item.camera_id && (
                <span className="font-mono text-text-secondary">
                  Camera: <strong>{item.camera_id}</strong>
                </span>
              )}
            </div>

            {/* Risk Explainability Factors (Transparent AI) */}
            {item.contributing_factors && item.contributing_factors.length > 0 && (
              <div className="p-2 bg-surface-raised rounded-lg border border-border text-[11px] space-y-1">
                <div className="flex items-center justify-between text-text-muted font-semibold text-[10px] uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-accent" />
                    Contributing Risk Factors:
                  </span>
                  <span className="font-mono text-text-primary">Risk: {item.risk_score}/100</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {item.contributing_factors.map((f, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary text-[10px] font-mono"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-1 gap-2 border-t border-border/60">
              <span className="text-[11px] text-text-muted italic truncate max-w-[260px] hidden sm:inline">
                Suggested: {item.suggested_action}
              </span>

              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                {/* View Camera */}
                {item.camera_id && (
                  <button
                    onClick={() => handleViewCamera(item.camera_id, item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs"
                  >
                    <Camera className="w-3 h-3" />
                    <span>View Camera</span>
                  </button>
                )}

                {/* View Platform */}
                {item.zone && item.zone.includes('Platform') && (
                  <button
                    onClick={() => handleViewPlatform(item.zone)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-surface-raised border border-border hover:bg-surface-hover text-text-secondary transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    <span>View Platform</span>
                  </button>
                )}

                {/* Acknowledge Button */}
                {onAcknowledge && (
                  <button
                    onClick={() => onAcknowledge(item.id)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium text-text-muted hover:text-text-primary border border-transparent hover:border-border transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
