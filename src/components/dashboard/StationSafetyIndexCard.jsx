import React from 'react';
import { Shield, ShieldAlert, CheckCircle, Info, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

export function StationSafetyIndexCard({
  safetyIndex = {
    overall_score: 82,
    status_label: 'Moderate Operational Risk',
    crowd_safety_score: 85,
    security_score: 74,
    worksite_compliance_score: 96,
    cctv_health_score: 98,
  },
}) {
  const score = safetyIndex.overall_score || 82;

  const getScoreColor = () => {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBarClass = (val) => {
    if (val >= 85) return 'bg-emerald-500';
    if (val >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-accent" />
          <span>STATION SAFETY INDEX</span>
        </h2>
        <span className="text-[10px] text-text-muted font-mono">Decision Indicator</span>
      </div>

      {/* Main Score Display */}
      <div className="flex items-baseline justify-between p-3 bg-surface-raised rounded-xl border border-border">
        <div>
          <div className="text-xs text-text-muted">Composite Index</div>
          <div className="text-xs font-bold text-text-primary mt-0.5">
            {safetyIndex.status_label || 'Normal Safety Level'}
          </div>
        </div>

        <div className="text-right">
          <span className={cn('text-2xl font-black font-mono tracking-tight', getScoreColor())}>
            {score}
          </span>
          <span className="text-xs font-mono text-text-muted"> / 100</span>
        </div>
      </div>

      {/* 4 Pillars Breakdown */}
      <div className="space-y-2.5 text-xs">
        {/* Pillar 1: Crowd Safety */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-text-secondary">Crowd Density Safety</span>
            <span className="font-mono font-bold text-text-primary">{safetyIndex.crowd_safety_score}%</span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-300', getProgressBarClass(safetyIndex.crowd_safety_score))}
              style={{ width: `${safetyIndex.crowd_safety_score}%` }}
            />
          </div>
        </div>

        {/* Pillar 2: Security / Perimeter */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-text-secondary">Security & Track Intrusion</span>
            <span className="font-mono font-bold text-text-primary">{safetyIndex.security_score}%</span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-300', getProgressBarClass(safetyIndex.security_score))}
              style={{ width: `${safetyIndex.security_score}%` }}
            />
          </div>
        </div>

        {/* Pillar 3: Worksite Safety */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-text-secondary">Worksite PPE Compliance</span>
            <span className="font-mono font-bold text-text-primary">{safetyIndex.worksite_compliance_score}%</span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-300', getProgressBarClass(safetyIndex.worksite_compliance_score))}
              style={{ width: `${safetyIndex.worksite_compliance_score}%` }}
            />
          </div>
        </div>

        {/* Pillar 4: CCTV Infrastructure */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-text-secondary">CCTV Infrastructure Health</span>
            <span className="font-mono font-bold text-text-primary">{safetyIndex.cctv_health_score}%</span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-300', getProgressBarClass(safetyIndex.cctv_health_score))}
              style={{ width: `${safetyIndex.cctv_health_score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
