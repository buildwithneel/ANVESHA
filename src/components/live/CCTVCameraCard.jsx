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
import { cn } from '../../utils/cn';

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
}) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const status = (camera.status || 'LIVE').toUpperCase();
  const isOnline = status === 'LIVE' || status === 'ONLINE';
  const isDegraded = status === 'DEGRADED';
  const isOffline = status === 'OFFLINE';
  const isMaintenance = status === 'MAINTENANCE';

  const activeAlerts = camera.active_alert_count || 0;
  const currentDetection = camera.current_detection;

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

      // Dark railway CCTV background
      ctx.fillStyle = isDegraded ? '#111827' : '#0B1120';
      ctx.fillRect(0, 0, w, h);

      // Draw faint surveillance perspective grid / platform guidelines
      ctx.strokeStyle = isDegraded ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Horizon line
      ctx.moveTo(0, h * 0.45);
      ctx.lineTo(w, h * 0.45);
      // Perspective rails/lines
      ctx.moveTo(w * 0.2, h);
      ctx.lineTo(w * 0.45, h * 0.45);
      ctx.moveTo(w * 0.8, h);
      ctx.lineTo(w * 0.55, h * 0.45);
      ctx.stroke();

      // Subtle CCTV noise / scanlines
      if (frame % 3 === 0) {
        ctx.fillStyle = isDegraded ? 'rgba(245, 158, 11, 0.03)' : 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < h; i += 4) {
          ctx.fillRect(0, i + (frame % 4), w, 1);
        }
      }

      // If degraded, render simulated interference line
      if (isDegraded && frame % 40 < 10) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        const jitterY = (frame * 7) % h;
        ctx.fillRect(0, jitterY, w, 6);
      }

      // Draw animated simulated detection target if currentDetection exists
      if (currentDetection && (currentDetection.metadata?.bbox || currentDetection.bbox)) {
        const rawBox = currentDetection.metadata?.bbox || currentDetection.bbox || [120, 80, 320, 420];
        // Convert to canvas normalized coordinates
        const bx = (rawBox[0] / 1920) * w;
        const by = (rawBox[1] / 1080) * h;
        const bw = Math.max(28, ((rawBox[2] - rawBox[0]) / 1920) * w);
        const bh = Math.max(36, ((rawBox[3] - rawBox[1]) / 1080) * h);

        const isCrit = currentDetection.severity === 'CRITICAL' || activeAlerts > 0;
        const strokeColor = isCrit ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)';
        const fillColor = isCrit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.12)';

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = fillColor;
        ctx.fillRect(bx, by, bw, bh);

        // Corner tick marks
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
      onViewAlerts(camera.id);
    } else {
      navigate('/alerts', { state: { cameraId: camera.id } });
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
          <span className="font-mono font-bold text-text-primary tracking-wide text-xs">
            {camera.camera_code || camera.id}
          </span>
          <span className="text-text-muted truncate max-w-[130px] sm:max-w-[180px]" title={camera.location}>
            {camera.zone || camera.location}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Active Alert Badge */}
          {activeAlerts > 0 && (
            <button
              onClick={handleAlertClick}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs"
              title={`Click to view ${activeAlerts} alert(s) for ${camera.id}`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{activeAlerts} Active Alert{activeAlerts > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Status Indicator (Text + Symbol, never color alone) */}
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border flex items-center gap-1',
              getStatusBadgeClass()
            )}
          >
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* ── Video Stream Area ──────────────────────────────────── */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Offline View Placeholder */}
        {isOffline ? (
          <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 select-none space-y-1.5">
            <WifiOff className="w-8 h-8 text-slate-500 mb-1 stroke-[1.5]" />
            <span className="text-xs font-semibold text-slate-300">Live feed unavailable</span>
            <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
              <p>Last heartbeat: {formatHeartbeatTime(camera.last_heartbeat)}</p>
              <p>Status: <strong className="text-red-400">OFFLINE</strong></p>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onInspect) onInspect(camera);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Retry Stream
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/system-health');
                }}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-900/40 text-blue-300 hover:bg-blue-900/60 border border-blue-800/60 transition-colors"
              >
                View Health
              </button>
            </div>
          </div>
        ) : isMaintenance ? (
          <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 select-none">
            <Radio className="w-8 h-8 text-blue-400 mb-2 stroke-[1.5] animate-pulse" />
            <span className="text-xs font-semibold text-blue-300">Maintenance Mode</span>
            <div className="mt-2 text-[11px] text-slate-400 space-y-0.5 font-mono">
              <p>Feed paused for scheduled calibration</p>
              <p>Zone: {camera.zone || camera.location}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Simulated Canvas Feed */}
            <canvas
              ref={canvasRef}
              width={320}
              height={180}
              className="w-full h-full object-cover"
            />

            {/* Subtle OSD (On-Screen Display) Header */}
            <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none text-[10px] font-mono text-emerald-400 bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800/80 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{camera.camera_code || camera.id}</span>
              <span className="text-slate-400">|</span>
              <span>BRC-CCTV</span>
            </div>

            {/* AI Status Badge Overlay (Top-Right) */}
            <div className="absolute top-2 right-2 flex items-center gap-1 pointer-events-none text-[10px] font-mono bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800/80 backdrop-blur-xs text-slate-300">
              {camera.ai_enabled !== false ? (
                <span className={cn(
                  'flex items-center gap-1 font-semibold',
                  activeAlerts > 0 ? 'text-red-400' : currentDetection ? 'text-amber-400' : 'text-blue-400'
                )}>
                  <Sparkles className="w-2.5 h-2.5" />
                  {activeAlerts > 0 ? 'AI ALERT' : currentDetection ? 'AI DETECT' : 'AI ACTIVE'}
                </span>
              ) : (
                <span className="text-slate-400">AI OFF</span>
              )}
            </div>

            {/* Degraded Stream Warning Overlay */}
            {isDegraded && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/90 border border-amber-600/80 text-amber-300 text-[10px] font-mono">
                <AlertTriangle className="w-3 h-3" />
                <span>Degraded Signal (15 FPS)</span>
              </div>
            )}

            {/* AI Detection Overlay Label */}
            {currentDetection && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950/85 border border-slate-700 text-[10px] font-mono">
                <span className={cn(
                  'font-bold',
                  currentDetection.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                )}>
                  {(currentDetection.type || 'DETECTION').replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-slate-300">
                  {Math.round(currentDetection.confidence * (currentDetection.confidence <= 1 ? 100 : 1))}%
                </span>
              </div>
            )}

            {/* Hover Expand Prompt */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 text-slate-200 border border-slate-700 text-xs font-medium shadow-md backdrop-blur-xs">
                <Maximize2 className="w-3.5 h-3.5 text-accent-soft" />
                Inspect Camera Feed
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Card Footer ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface text-[11px] text-text-secondary border-t border-border">
        <div className="flex items-center gap-1 text-text-muted truncate max-w-[180px]">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span className="font-mono">{formatHeartbeatTime(camera.last_heartbeat)}</span>
        </div>

        <div className="flex items-center gap-2 text-text-secondary">
          {currentDetection ? (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {currentDetection.type?.replace('_', ' ')}
            </span>
          ) : (
            <span className="text-[10px] text-text-muted font-mono">
              {isOnline ? 'Scanning normal' : 'No telemetry'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
