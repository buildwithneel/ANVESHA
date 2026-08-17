import React from 'react';
import { Drawer } from '../ui/Drawer';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle,
  ShieldAlert,
  Search,
  FilePlus,
  Flame,
  Activity,
  XCircle,
  Eye,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { getSeverityConfig } from '../../utils/severity';
import { cn } from '../../utils/cn';

export function AlertDetailsDrawer({
  isOpen,
  onClose,
  alert,
  onAcknowledge,
  onInvestigate,
  onResolve,
  onDismiss,
  onCreateIncident,
  onViewFeed,
}) {
  if (!alert) return null;

  const severity = (alert.severity || 'MEDIUM').toUpperCase();
  const severityConfig = getSeverityConfig(severity);
  const status = (alert.status || 'ACTIVE').toUpperCase();
  const confidencePercent = alert.confidence ? Math.round(alert.confidence * 100) : 94;
  const riskScore = alert.riskScore || alert.risk_score || 75;
  const cameraId = alert.cameraId || alert.camera_id || 'CAM-01';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Alert ${alert.id}`}
      subtitle="Operational Safety Threat & AI Detection Breakdown"
    >
      <div className="space-y-5 text-text-primary text-xs">
        {/* Status & Severity Banner */}
        <div className={cn('p-3.5 rounded-lg border flex items-center justify-between', severityConfig.bgClass, severityConfig.borderClass)}>
          <div className="flex items-center gap-2.5">
            <StatusBadge severity={severity} size="md" />
            <div>
              <div className="font-semibold text-sm text-text-primary">
                {alert.type ? alert.type.replace(/_/g, ' ').toUpperCase() : 'SAFETY ALERT'}
              </div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                Current Status: <strong className="font-bold text-text-primary">{status}</strong>
              </div>
            </div>
          </div>

          <div className="text-right font-mono text-[11px] text-text-muted">
            <Clock className="w-3.5 h-3.5 inline mr-1 text-text-muted" />
            <span>{formatRelativeTime(alert.timestamp || alert.created_at || alert.createdAt)}</span>
          </div>
        </div>

        {/* Message / Description */}
        <div className="bg-canvas p-3.5 rounded-lg border border-border space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Event Summary</div>
          <p className="text-sm font-medium text-text-primary leading-relaxed">
            {alert.message || alert.description || 'AI safety detection triggered on live CCTV feed.'}
          </p>
        </div>

        {/* AI Analytics & Confidence Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-canvas p-3 rounded-lg border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
              <Flame className={cn('w-3.5 h-3.5', riskScore > 80 ? 'text-rose-500' : 'text-amber-500')} />
              <span>AI Risk Score</span>
            </div>
            <div className="text-xl font-mono font-bold text-text-primary">
              {riskScore} <span className="text-xs text-text-muted font-normal">/ 100</span>
            </div>
            <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
              <div
                className={cn('h-full', riskScore > 80 ? 'bg-rose-500' : riskScore > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>

          <div className="bg-canvas p-3 rounded-lg border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
              <Activity className="w-3.5 h-3.5 text-accent" />
              <span>AI Confidence</span>
            </div>
            <div className="text-xl font-mono font-bold text-text-primary">
              {confidencePercent}%
            </div>
            <div className="text-[10px] text-text-muted font-medium">
              YOLOv8 Edge Engine Verified
            </div>
          </div>
        </div>

        {/* Camera & Location Context */}
        <div className="bg-canvas p-3.5 rounded-lg border border-border space-y-3">
          <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Surveillance Context</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-muted block text-[11px]">Camera Unit</span>
              <div className="font-mono font-semibold text-text-primary flex items-center gap-1.5 mt-0.5">
                <Camera className="w-3.5 h-3.5 text-text-muted" />
                {cameraId}
              </div>
            </div>

            <div>
              <span className="text-text-muted block text-[11px]">Location</span>
              <div className="font-semibold text-text-primary flex items-center gap-1.5 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span className="truncate">{alert.location || alert.stationName || 'Vadodara Railway Station'}</span>
              </div>
            </div>

            <div>
              <span className="text-text-muted block text-[11px]">Timestamp</span>
              <div className="font-mono text-text-primary text-[11px] mt-0.5">
                {formatDateTime(alert.timestamp || alert.created_at || alert.createdAt)}
              </div>
            </div>

            <div>
              <span className="text-text-muted block text-[11px]">ML Suppression</span>
              <div className="text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1 text-[11px] mt-0.5">
                <Layers className="w-3 h-3" />
                Deduplicated (1 Active)
              </div>
            </div>
          </div>
        </div>

        {/* Simulated Evidence / Snapshot Box */}
        <div className="bg-canvas p-3.5 rounded-lg border border-border space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-text-muted">
            <span>Visual Evidence Frame</span>
            <span className="text-accent font-mono">1080p · AI Boxed</span>
          </div>

          <div className="relative aspect-video bg-slate-950 rounded-md overflow-hidden border border-border flex items-center justify-center group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            
            {/* Mock Bounding Box Overlay */}
            <div className="absolute inset-[25%] border-2 border-dashed border-rose-500 rounded flex flex-col justify-between p-1 bg-rose-500/10">
              <span className="text-[10px] font-mono font-bold text-white bg-rose-600 px-1 py-0.5 rounded self-start">
                {alert.type ? alert.type.toUpperCase() : 'TARGET'} ({confidencePercent}%)
              </span>
              <span className="text-[9px] font-mono text-rose-300 self-end">
                {cameraId} · LIVE
              </span>
            </div>

            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Evidence Timestamp: {formatDateTime(alert.timestamp || alert.created_at || alert.createdAt)}</span>
            </div>

            {onViewFeed && (
              <Button
                variant="primary"
                size="sm"
                icon={Eye}
                onClick={() => onViewFeed(alert)}
                className="absolute top-2 right-2 shadow-lg z-10 text-xs"
              >
                Inspect Live Feed
              </Button>
            )}
          </div>
        </div>

        {/* Operational Actions */}
        <div className="pt-2 border-t border-border space-y-2.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Operator Response Actions</div>
          
          <div className="grid grid-cols-2 gap-2">
            {status === 'ACTIVE' && onAcknowledge && (
              <Button
                variant="warning"
                size="md"
                icon={ShieldAlert}
                onClick={() => {
                  onAcknowledge(alert.id);
                  onClose();
                }}
                className="w-full justify-center"
              >
                Acknowledge Alert (A)
              </Button>
            )}

            {status !== 'INVESTIGATING' && status !== 'RESOLVED' && onInvestigate && (
              <Button
                variant="outline"
                size="md"
                icon={Search}
                onClick={() => {
                  onInvestigate(alert.id);
                  onClose();
                }}
                className="w-full justify-center text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
              >
                Investigate (I)
              </Button>
            )}

            {onCreateIncident && status !== 'RESOLVED' && status !== 'DISMISSED' && (
              <Button
                variant="outline"
                size="md"
                icon={FilePlus}
                onClick={() => {
                  onCreateIncident(alert);
                  onClose();
                }}
                className="w-full justify-center text-accent border-accent/40 hover:bg-accent-soft"
              >
                Create Incident
              </Button>
            )}

            {status !== 'RESOLVED' && onResolve && (
              <Button
                variant="success"
                size="md"
                icon={CheckCircle}
                onClick={() => {
                  onResolve(alert.id);
                  onClose();
                }}
                className="w-full justify-center"
              >
                Resolve Alert (R)
              </Button>
            )}
          </div>

          {status !== 'DISMISSED' && status !== 'RESOLVED' && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              icon={XCircle}
              onClick={() => {
                onDismiss(alert.id);
                onClose();
              }}
              className="w-full justify-center text-text-muted hover:text-rose-500 hover:bg-rose-500/10 text-xs"
            >
              Dismiss as False Positive / Training Test
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}

export default AlertDetailsDrawer;
