import React, { useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  Eye,
  EyeOff,
  Maximize2,
  Shield,
  WifiOff,
  Activity,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatEventLabel } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { CCTVVideoFeed } from './CCTVVideoFeed';

/**
 * CCTV Camera Card Component
 * Optimized for railway control room 8-10 hour shifts.
 * Clean, stable typography, restrained animations, accessible status text.
 */
export const CCTVCameraCard = memo(function CCTVCameraCard({
  camera,
  isFocused = false,
  onSelect,
  onViewAlerts,
  sourceType = 'video',
  customVideoUrl = null,
}) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  if (!camera) {
    return (
      <div className="flex items-center justify-center p-6 bg-surface rounded-lg border border-border text-xs font-mono text-text-muted">
        CAMERA DATA UNAVAILABLE
      </div>
    );
  }

  const status = (camera?.status || 'LIVE').toUpperCase();
  const isOnline = status === 'LIVE' || status === 'ONLINE';
  const isDegraded = status === 'DEGRADED';
  const isOffline = status === 'OFFLINE';
  const isMaintenance = status === 'MAINTENANCE';

  const activeAlerts = camera?.active_alert_count || 0;
  const currentDetection = camera?.current_detection;

  // Render simulated live CCTV noise / raster on canvas for online/degraded cameras
  useEffect(() => {
    if (!isOnline && !isDegraded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let frame = 0;

    const draw = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = isDegraded ? '#111827' : '#0B1120';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = isDegraded ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.45);
      ctx.lineTo(w, h * 0.45);
      ctx.moveTo(w * 0.2, h);
      ctx.lineTo(w * 0.45, h * 0.45);
      ctx.moveTo(w * 0.8, h);
      ctx.lineTo(w * 0.55, h * 0.45);
      ctx.stroke();

      if (frame % 3 === 0) {
        ctx.fillStyle = isDegraded ? 'rgba(245, 158, 11, 0.03)' : 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < h; i += 4) {
          ctx.fillRect(0, i + (frame % 4), w, 1);
        }
      }

      if (isDegraded && frame % 40 < 10) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        const jitterY = (frame * 7) % h;
        ctx.fillRect(0, jitterY, w, 6);
      }

      if (currentDetection && (currentDetection.metadata?.bbox || currentDetection.bbox)) {
        const rawBox = currentDetection.metadata?.bbox || currentDetection.bbox || [120, 80, 320, 420];
        const metaW = currentDetection.metadata?.frame_width || (rawBox[2] <= 640 && rawBox[3] <= 480 ? 640 : (rawBox[2] <= 1280 && rawBox[3] <= 720 ? 1280 : 1920));
        const metaH = currentDetection.metadata?.frame_height || (rawBox[2] <= 640 && rawBox[3] <= 480 ? 480 : (rawBox[2] <= 1280 && rawBox[3] <= 720 ? 720 : 1080));
        const bx = (rawBox[0] / metaW) * w;
        const by = (rawBox[1] / metaH) * h;
        const bw = Math.max(28, ((rawBox[2] - rawBox[0]) / metaW) * w);
        const bh = Math.max(36, ((rawBox[3] - rawBox[1]) / metaH) * h);

        const isCrit = currentDetection.severity === 'CRITICAL' || activeAlerts > 0;
        const strokeColor = isCrit ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)';
        const fillColor = isCrit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.12)';

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = fillColor;
        ctx.fillRect(bx, by, bw, bh);

        const tick = 6;
        ctx.fillStyle = strokeColor;
        ctx.fillRect(bx - 1, by - 1, tick, 2);
        ctx.fillRect(bx - 1, by - 1, 2, tick);
        ctx.fillRect(bx + bw - tick + 1, by - 1, tick, 2);
        ctx.fillRect(bx + bw - 1, by - 1, 2, tick);
        ctx.fillRect(bx - 1, by + bh - 1, tick, 2);
        ctx.fillRect(bx - 1, by + bh - tick + 1, 2, tick);
        ctx.fillRect(bx + bw - tick + 1, by + bh - 1, tick, 2);
        ctx.fillRect(bx + bw - 1, by + bh - tick + 1, 2, tick);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isOnline, isDegraded, currentDetection, activeAlerts]);

  const handleAlertClick = (e) => {
    e.stopPropagation();
    if (onViewAlerts) {
      onViewAlerts(camera?.id);
    } else {
      navigate('/alerts', { state: { cameraId: camera?.id } });
    }
  };

  const getStatusText = () => {
    if (isOnline) return '● LIVE';
    if (isDegraded) return '● DEGRADED';
    if (isOffline) return '● OFFLINE';
    if (isMaintenance) return '● MAINTENANCE';
    return `● ${status}`;
  };

  const getStatusBadgeClass = () => {
    if (isOnline) return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
    if (isDegraded) return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
    if (isOffline) return 'bg-red-950/80 text-red-300 border-red-700/60';
    if (isMaintenance) return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const formatHeartbeatTime = (isoString) => {
    if (!isoString) return 'Active now';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(camera)}
      className={cn(
        'group relative flex flex-col rounded-lg border bg-surface overflow-hidden transition-all duration-150 cursor-pointer shadow-xs',
        isFocused
          ? 'ring-2 ring-accent border-accent'
          : 'border-border hover:border-accent-border hover:shadow-md',
        activeAlerts > 0 && 'border-red-500/60'
      )}
    >
      {/* ── Card Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-raised border-b border-border text-xs gap-2 min-h-[38px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-extrabold text-text-primary tracking-wide text-xs">
            {camera?.camera_code || camera?.id || 'CAM-01'}
          </span>
          <span className="text-text-primary dark:text-text-secondary font-bold truncate max-w-[130px] sm:max-w-[180px]" title={camera?.location}>
            {camera?.zone || camera?.location || 'Station Area'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {activeAlerts > 0 && (
            <button
              onClick={handleAlertClick}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs"
              title={`Click to view ${activeAlerts} alert(s) for ${camera?.id}`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{activeAlerts} Active Alert{activeAlerts > 1 ? 's' : ''}</span>
            </button>
          )}

          <span
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-bold tracking-wide border flex items-center gap-1',
              getStatusBadgeClass()
            )}
          >
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* ── Video Stream Area ──────────────────────────────────── */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {isOffline ? (
          <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 select-none space-y-1.5">
            <WifiOff className="w-8 h-8 text-slate-500 mb-1 stroke-[1.5]" />
            <span className="text-xs font-bold text-slate-200">Live feed unavailable</span>
            <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
              <p>Last heartbeat: {formatHeartbeatTime(camera?.last_heartbeat)}</p>
              <p>Status: <strong className="text-red-400">OFFLINE</strong></p>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect && onSelect(camera);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Retry Stream
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/system-health');
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/40 text-blue-300 hover:bg-blue-900/60 border border-blue-800/60 transition-colors"
              >
                View Health
              </button>
            </div>
          </div>
        ) : isMaintenance ? (
          <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 select-none">
            <Radio className="w-8 h-8 text-blue-400 mb-2 stroke-[1.5] animate-pulse" />
            <span className="text-xs font-bold text-blue-300">Maintenance Mode</span>
            <div className="mt-2 text-[11px] text-slate-300 space-y-0.5 font-mono">
              <p>Feed paused for scheduled calibration</p>
              <p>Zone: {camera?.zone || camera?.location}</p>
            </div>
          </div>
        ) : (
          <>
            <CCTVVideoFeed
              camera={camera}
              sourceType={sourceType}
              customVideoUrl={customVideoUrl}
              className="w-full h-full"
            />

            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-30">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 text-slate-200 border border-slate-700 text-xs font-semibold shadow-md backdrop-blur-xs">
                <Maximize2 className="w-3.5 h-3.5 text-accent-soft" />
                Inspect Camera Feed
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Card Footer ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface text-xs text-text-secondary border-t border-border">
        <div className="flex items-center gap-1 text-text-secondary font-mono font-semibold truncate max-w-[180px]">
          <Clock className="w-3 h-3 flex-shrink-0 text-text-muted" />
          <span>{formatHeartbeatTime(camera?.last_heartbeat)}</span>
        </div>

        <div className="flex items-center gap-2 text-text-secondary">
          {currentDetection ? (
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {formatEventLabel(currentDetection.type)}
            </span>
          ) : (
            <span className="text-xs text-text-secondary font-mono font-semibold">
              {isOnline ? 'Scanning normal' : 'No telemetry'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
