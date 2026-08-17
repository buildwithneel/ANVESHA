import React from 'react';
import { cn } from '../../utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import {
  Users, BarChart3, ShieldAlert, ShieldOff,
  Cpu, Clock, SlidersHorizontal, Brain,
} from 'lucide-react';

const DENSITY_STYLES = {
  LOW: { label: 'Low', class: 'text-emerald-700 dark:text-emerald-400' },
  NORMAL: { label: 'Normal', class: 'text-emerald-700 dark:text-emerald-400' },
  MODERATE: { label: 'Moderate', class: 'text-amber-700 dark:text-amber-400' },
  HIGH: { label: 'High', class: 'text-rose-700 dark:text-rose-400' },
};

export function AIDetectionPanel({ detections, modelStatus, aiExplanation, selectedEvent, className }) {
  const densityStyle = DENSITY_STYLES[detections?.crowdDensity] || DENSITY_STYLES.NORMAL;

  return (
    <div className={cn('flex flex-col h-full bg-surface border-l border-border overflow-y-auto', className)}>
      {/* ── Detection Counts ────────────────────────────── */}
      <div className="px-3 pt-3 pb-2 border-b border-border flex-shrink-0">
        <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">AI Detections</h2>
        <div className="grid grid-cols-2 gap-2">
          <DetectionMetric icon={Users} label="People" value={detections?.people ?? 0} />
          <DetectionMetric
            icon={BarChart3}
            label="Crowd Density"
            value={densityStyle.label}
            valueClass={densityStyle.class}
          />
          <DetectionMetric
            icon={ShieldAlert}
            label="PPE Violations"
            value={detections?.ppeViolations ?? 0}
            alert={detections?.ppeViolations > 0}
          />
          <DetectionMetric
            icon={ShieldOff}
            label="Restricted Zone"
            value={detections?.restrictedZone ?? 0}
            alert={detections?.restrictedZone > 0}
          />
        </div>
      </div>

      {/* ── Model Status ────────────────────────────────── */}
      <div className="px-3 py-2 border-b border-border flex-shrink-0">
        <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Model Status</h2>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Cpu className="w-3 h-3" />
              Detection Model
            </span>
            <span className={cn(
              'font-semibold flex items-center gap-1',
              modelStatus?.status === 'online' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', modelStatus?.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500')} />
              {modelStatus?.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Clock className="w-3 h-3" />
              Inference
            </span>
            <span className="font-mono font-semibold text-text-primary">{modelStatus?.inference ?? '--'} ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <SlidersHorizontal className="w-3 h-3" />
              Confidence Threshold
            </span>
            <span className="font-mono font-semibold text-text-primary">{modelStatus?.threshold ?? '--'}</span>
          </div>
        </div>
      </div>

      {/* ── AI Analysis / Explanation ───────────────────── */}
      <div className="px-3 py-3 flex-1">
        <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Brain className="w-3 h-3" />
          AI Analysis
        </h2>

        {aiExplanation ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-primary">{aiExplanation.title}</p>
              {aiExplanation.confidence && (
                <p className="text-[10px] font-mono text-text-muted">
                  Model confidence: <strong className="text-text-primary">{aiExplanation.confidence}%</strong>
                </p>
              )}
            </div>

            {/* Observed */}
            <div>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Observed</p>
              <ul className="space-y-1">
                {aiExplanation.observed.map((obs, i) => (
                  <li key={i} className="text-[11px] text-text-secondary leading-relaxed flex gap-1.5">
                    <span className="text-text-muted select-none flex-shrink-0">·</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended */}
            <div className="bg-amber-500/5 dark:bg-amber-500/8 border border-amber-500/15 rounded-md p-2.5">
              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Recommended</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">{aiExplanation.recommended}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted">No active AI analysis for current view.</p>
        )}
      </div>
    </div>
  );
}

function DetectionMetric({ icon: Icon, label, value, valueClass, alert = false }) {
  return (
    <div className={cn(
      'p-2 rounded-md border text-center space-y-0.5',
      alert
        ? 'bg-rose-500/8 border-rose-500/20'
        : 'bg-canvas border-border'
    )}>
      <Icon className={cn('w-3.5 h-3.5 mx-auto', alert ? 'text-rose-600 dark:text-rose-400' : 'text-text-muted')} />
      <div className={cn('text-sm font-bold font-mono', valueClass || (alert ? 'text-rose-700 dark:text-rose-400' : 'text-text-primary'))}>
        {value}
      </div>
      <div className="text-[9px] text-text-muted font-medium">{label}</div>
    </div>
  );
}
