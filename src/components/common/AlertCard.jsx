import React from 'react';
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
  Layers,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';
import { getSeverityConfig } from '../../utils/severity';
import { cn } from '../../utils/cn';
import { speechService } from '../../services/speechService';
import { useTranslation } from '../../i18n';

/**
 * AlertCard - High-visibility command center operational alert card
 */
export function AlertCard({
  alert,
  onAcknowledge,
  onInvestigate,
  onResolve,
  onCreateIncident,
  onViewFeed,
  onSelect,
  className,
}) {
  if (!alert) return null;

  const { language, t } = useTranslation();
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const severity = (alert.severity || 'MEDIUM').toUpperCase();
  const severityConfig = getSeverityConfig(severity);
  const status = (alert.status || 'ACTIVE').toUpperCase();
  const confidencePercent = alert.confidence ? Math.round(alert.confidence * 100) : 92;
  const riskScore = alert.riskScore || alert.risk_score || 75;

  const handleReadAlert = (e) => {
    e.stopPropagation();
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      const speechText = `${severity} Alert. ${alert.type ? alert.type.replace(/_/g, ' ') : ''}. ${alert.message || alert.title || ''}. Location: ${alert.location || alert.cameraId || 'Platform'}.`;
      speechService.readAlert(
        speechText,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  const handleCardClick = (e) => {
    // If button was clicked, don't bubble
    if (e.target.closest('button')) return;
    if (onSelect) onSelect(alert);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest('button')) return;
      e.preventDefault();
      if (onSelect) onSelect(alert);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      aria-label={`Alert ${alert.id}: ${alert.type || alert.title || alert.message}`}
      className={cn(
        'rg-card p-3.5 border-l-4 bg-surface border-border shadow-xs hover:shadow-md transition-all flex flex-col gap-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent group',
        severityConfig.borderClass,
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge severity={severity} size="sm" />
          <span className="text-xs font-mono font-bold text-text-primary tracking-wide">{alert.id}</span>
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider',
            status === 'ACTIVE' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30' :
            status === 'INVESTIGATING' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
            status === 'ACKNOWLEDGED' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30' :
            status === 'RESOLVED' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
            'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30'
          )}>
            {status}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-text-muted font-medium flex-shrink-0">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(alert.timestamp || alert.created_at || alert.createdAt)}</span>
        </div>
      </div>

      {/* Message / Title */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug">
          {alert.type ? alert.type.replace(/_/g, ' ').toUpperCase() : alert.title || 'Security Event'}
        </h4>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
          {alert.message || alert.description || 'AI safety detection triggered on live CCTV feed.'}
        </p>
      </div>

      {/* Metrics Row: AI Risk Score, Confidence, Deduplication */}
      <div className="flex items-center gap-3 text-[11px] bg-canvas/80 px-2.5 py-1.5 rounded-md border border-border/60 flex-wrap">
        <div className="flex items-center gap-1 font-mono">
          <Flame className={cn('w-3.5 h-3.5', riskScore > 80 ? 'text-rose-500' : 'text-amber-500')} />
          <span className="text-text-muted">Risk:</span>
          <strong className="text-text-primary font-bold">{riskScore}/100</strong>
        </div>

        <div className="flex items-center gap-1 font-mono">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span className="text-text-muted">Conf:</span>
          <strong className="text-text-primary">{confidencePercent}%</strong>
        </div>

        <div className="flex items-center gap-1 text-text-muted ml-auto font-mono text-[10px]">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>AI Deduplicated</span>
        </div>
      </div>

      {/* Location & Camera Context */}
      <div className="flex items-center justify-between text-xs text-text-muted flex-wrap gap-2 border-t border-border/50 pt-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          <span className="truncate">{alert.location || alert.stationName || 'Vadodara Station'}</span>
        </div>

        {(alert.cameraId || alert.camera_id) && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] bg-surface px-1.5 py-0.5 rounded border border-border">
            <Camera className="w-3 h-3 text-text-muted" />
            <span className="font-semibold text-text-primary">{alert.cameraId || alert.camera_id}</span>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-1.5 border-t border-border/50 pt-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Read Alert Voice Button */}
          <Button
            variant="outline"
            size="sm"
            icon={isSpeaking ? VolumeX : Volume2}
            onClick={handleReadAlert}
            className={cn(
              'text-xs h-7 px-2.5 transition-colors',
              isSpeaking
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 animate-pulse'
                : 'text-text-muted hover:text-text-primary'
            )}
            title={isSpeaking ? t('alerts.stopReading', 'Stop Audio') : t('alerts.readAlert', 'Read Alert (Audio Announcement)')}
          >
            {isSpeaking ? t('alerts.stopReading', 'Stop Audio') : t('alerts.readAlert', 'Read Alert')}
          </Button>

          {onViewFeed && (
            <Button
              variant="outline"
              size="sm"
              icon={Camera}
              onClick={() => onViewFeed(alert)}
              className="text-xs h-7 px-2.5"
            >
              {t('cctv.viewCamera', 'View Camera')}
            </Button>
          )}

          {onCreateIncident && status !== 'RESOLVED' && status !== 'DISMISSED' && (
            <Button
              variant="outline"
              size="sm"
              icon={FilePlus}
              onClick={() => onCreateIncident(alert)}
              className="text-xs h-7 px-2.5 text-accent border-accent/30 hover:bg-accent-soft"
            >
              Create Incident
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {status === 'ACTIVE' && onAcknowledge && (
            <Button
              variant="warning"
              size="sm"
              icon={ShieldAlert}
              onClick={() => onAcknowledge(alert.id)}
              className="text-xs h-7 px-2.5"
            >
              Acknowledge
            </Button>
          )}

          {status === 'ACKNOWLEDGED' && onInvestigate && (
            <Button
              variant="outline"
              size="sm"
              icon={Search}
              onClick={() => onInvestigate(alert.id)}
              className="text-xs h-7 px-2.5 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
            >
              Investigate
            </Button>
          )}

          {(status === 'INVESTIGATING' || status === 'ACKNOWLEDGED') && onResolve && (
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle}
              onClick={() => onResolve(alert.id)}
              className="text-xs h-7 px-2.5"
            >
              Resolve
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertCard;
