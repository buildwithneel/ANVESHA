import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Video, CheckCircle2, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/Button';
import { speechService } from '../../services/speechService';
import { useTranslation } from '../../i18n';

export function CriticalAlertToast({ alert, onAcknowledge, onDismiss }) {
  const navigate = useNavigate();

  if (!alert) return null;

  const handleViewCamera = () => {
    navigate('/live-monitoring', {
      state: {
        cameraId: alert.camera_id || alert.cameraId,
        alertId: alert.id,
        highlightEvent: true,
        alertData: alert,
      },
    });
    if (onDismiss) onDismiss();
  };

  const { language, t } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleReadAlert = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      const speechText = `${isCritical ? 'Critical' : 'High'} Alert. ${alert.message || alert.type || ''}. Camera: ${alert.camera_id || alert.cameraId || 'Platform'}.`;
      speechService.readAlert(
        speechText,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  const confidencePct = alert.confidence
    ? Math.round(alert.confidence * (alert.confidence <= 1 ? 100 : 1))
    : 94;

  const isCritical = (alert.severity || '').toUpperCase() === 'CRITICAL';
  const isHigh = (alert.severity || '').toUpperCase() === 'HIGH';

  return (
    <div className="fixed top-16 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-3 duration-200">
      <div className={`p-4 rounded-lg shadow-2xl border backdrop-blur-md ${
        isCritical
          ? 'bg-slate-900/95 border-rose-500/50 text-white shadow-rose-950/40'
          : 'bg-slate-900/95 border-amber-500/50 text-white shadow-amber-950/40'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-5 h-5 ${isCritical ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <span className={`text-xs font-black tracking-wider uppercase ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
              {isCritical ? 'CRITICAL ALERT' : 'HIGH PRIORITY ALERT'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) speechService.stop();
              if (onDismiss) onDismiss();
            }}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Dismiss alert toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Content */}
        <div className="space-y-1 mb-3">
          <div className="text-sm font-semibold text-slate-100">
            {alert.message || `${alert.type ? alert.type.replace('_', ' ').toUpperCase() : 'Hazard'} detected`}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="font-mono text-cyan-300 font-semibold">{alert.camera_id || alert.cameraId}</span>
            <span>·</span>
            <span>Model confidence: <strong className="text-slate-200">{confidencePct}%</strong></span>
            <span>·</span>
            <span>Risk Score: <strong className={isCritical ? 'text-rose-400' : 'text-amber-400'}>{alert.risk_score || alert.riskScore || 90}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Read Alert Voice Button */}
          <Button
            size="sm"
            variant="outline"
            icon={isSpeaking ? VolumeX : Volume2}
            onClick={handleReadAlert}
            className={`text-xs border-slate-700 ${
              isSpeaking
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isSpeaking ? t('alerts.stopReading', 'Stop Audio') : t('alerts.readAlert', 'Read Alert')}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={CheckCircle2}
              onClick={() => {
                if (isSpeaking) speechService.stop();
                if (onAcknowledge) onAcknowledge(alert.id);
                if (onDismiss) onDismiss();
              }}
              className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {t('common.acknowledge', 'Acknowledge')}
            </Button>

            <Button
              size="sm"
              variant="primary"
              icon={Video}
              onClick={() => {
                if (isSpeaking) speechService.stop();
                handleViewCamera();
              }}
              className={`text-xs text-white ${
                isCritical ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {t('cctv.viewCamera', 'View Camera')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CriticalAlertToast;
