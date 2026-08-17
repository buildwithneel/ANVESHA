import React, { useState, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { Tooltip } from '../ui/Tooltip';
import {
  Maximize2, Minimize2, Camera as CameraIcon, Eye, EyeOff,
  Cpu, ImageIcon, AlertTriangle
} from 'lucide-react';

/**
 * Normalizes any bounding box specification into percentage coordinates (0 - 100%)
 * based on source stream resolution (e.g. 1920x1080, 1280x720).
 */
function normalizeBoundingBox(box, cameraResolution = '1920x1080') {
  if (!box) return null;

  // Default reference resolution
  let srcW = 1920;
  let srcH = 1080;

  if (box.source_resolution && Array.isArray(box.source_resolution) && box.source_resolution.length === 2) {
    srcW = box.source_resolution[0] || 1920;
    srcH = box.source_resolution[1] || 1080;
  } else if (cameraResolution && cameraResolution.includes('x')) {
    const parts = cameraResolution.split('x').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > 0) {
      srcW = parts[0];
      srcH = parts[1];
    }
  }

  let leftPct = 0;
  let topPct = 0;
  let widthPct = 0;
  let heightPct = 0;

  // Case 1: [x1, y1, x2, y2] array format
  if (Array.isArray(box.bbox) && box.bbox.length === 4) {
    const [x1, y1, x2, y2] = box.bbox;
    // Check if normalized (0.0 - 1.0) or pixel coordinates
    if (x1 <= 1.0 && x2 <= 1.0 && y1 <= 1.0 && y2 <= 1.0) {
      leftPct = x1 * 100;
      topPct = y1 * 100;
      widthPct = (x2 - x1) * 100;
      heightPct = (y2 - y1) * 100;
    } else {
      leftPct = (x1 / srcW) * 100;
      topPct = (y1 / srcH) * 100;
      widthPct = ((x2 - x1) / srcW) * 100;
      heightPct = ((y2 - y1) / srcH) * 100;
    }
  }
  // Case 2: Direct percentage object { x, y, w, h }
  else if (typeof box.x === 'number' && typeof box.y === 'number') {
    leftPct = box.x;
    topPct = box.y;
    widthPct = box.w || box.width || 10;
    heightPct = box.h || box.height || 10;
  }

  // Clamping to visible bounds (0 - 100%)
  leftPct = Math.max(0, Math.min(95, leftPct));
  topPct = Math.max(0, Math.min(95, topPct));
  widthPct = Math.max(2, Math.min(100 - leftPct, widthPct));
  heightPct = Math.max(2, Math.min(100 - topPct, heightPct));

  const color = box.color || (box.severity === 'CRITICAL' ? '#ef4444' : box.severity === 'HIGH' ? '#f59e0b' : '#3b82f6');

  return {
    id: box.id || `bbox-${Math.random()}`,
    left: leftPct,
    top: topPct,
    width: widthPct,
    height: heightPct,
    label: box.label || (box.type ? box.type.replace('_', ' ').toUpperCase() : 'Detection'),
    confidence: box.confidence ? Math.round(box.confidence * (box.confidence <= 1 ? 100 : 1)) : 94,
    color,
    severity: box.severity,
  };
}

export function CCTVViewer({
  camera,
  boundingBoxes = [],
  isFullscreen,
  onToggleFullscreen,
  onSnapshot,
  className,
}) {
  const [showOverlays, setShowOverlays] = useState(true);

  const normalizedBoxes = useMemo(() => {
    if (!boundingBoxes || !Array.isArray(boundingBoxes)) return [];
    return boundingBoxes
      .map((b) => normalizeBoundingBox(b, camera?.resolution))
      .filter(Boolean);
  }, [boundingBoxes, camera?.resolution]);

  if (!camera) {
    return (
      <div className={cn('flex items-center justify-center bg-slate-900 rounded-md text-slate-500 text-sm', className)}>
        Select a camera from the panel
      </div>
    );
  }

  const isOnline = (camera.status || 'ONLINE').toUpperCase() === 'ONLINE';

  return (
    <div className={cn('flex flex-col bg-slate-950 rounded-md overflow-hidden border border-border', className)}>
      {/* ── Stream Metadata Bar ────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <span className="font-mono font-bold text-white">{camera.id || camera.camera_code}</span>
          <span className="text-slate-400">{camera.name || camera.location}</span>
          <span className={cn(
            'flex items-center gap-1 font-semibold',
            isOnline ? 'text-emerald-400' : 'text-rose-400'
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400')} />
            {isOnline ? 'LIVE' : 'OFFLINE'}
          </span>
          <span className="text-slate-500 font-mono">{camera.resolution || '1920x1080'}</span>
          <span className="text-slate-500 font-mono">{camera.fps || 30} FPS</span>
          {(camera.aiEnabled || camera.ai_enabled) && (
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <Cpu className="w-3 h-3" />
              AI Analytics
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Tooltip content={showOverlays ? 'Hide AI Overlays' : 'Show AI Overlays'}>
            <button
              type="button"
              onClick={() => setShowOverlays(!showOverlays)}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={showOverlays ? 'Hide AI overlays' : 'Show AI overlays'}
            >
              {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>

          <Tooltip content="Capture Snapshot">
            <button
              type="button"
              onClick={onSnapshot}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Capture snapshot"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip content={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Video Area + AI Overlay ────────────────────── */}
      <div className="relative flex-1 min-h-0 bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Simulated Video Perspective Grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Simulated video content — clean dark scene */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-950/50" />

        {/* Camera text overlay */}
        <div className="text-center text-slate-600 z-10 select-none pointer-events-none">
          <CameraIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <div className="text-xs font-mono opacity-40">{camera.id || camera.camera_code} · {camera.name || camera.location}</div>
          <div className="text-[10px] font-mono opacity-25 mt-1">CCTV Stream · Auto-Scaling AI Detection View</div>
        </div>

        {/* ── Bounding Box Overlays (Scalable Percentage-Based) ──────────────────────── */}
        {showOverlays && normalizedBoxes.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {normalizedBoxes.map((box) => (
              <div
                key={box.id}
                className="absolute transition-all duration-150"
                style={{
                  left: `${box.left}%`,
                  top: `${box.top}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }}
              >
                {/* Clean, sharp detection box border */}
                <div
                  className="absolute inset-0 rounded-sm"
                  style={{
                    border: `2px solid ${box.color}`,
                    boxShadow: `0 0 8px ${box.color}66`,
                  }}
                />

                {/* Label tag */}
                <div
                  className="absolute -top-[20px] left-0 flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold text-white leading-none whitespace-nowrap shadow-md"
                  style={{ backgroundColor: box.color }}
                >
                  <span>{box.label}</span>
                  <span className="opacity-75">·</span>
                  <span className="font-mono">{box.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Live indicator corner badge ─────────────────── */}
        {isOnline && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm select-none shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            REC · LIVE
          </div>
        )}

        {/* Timestamp overlay */}
        <div className="absolute bottom-2 right-3 z-30 text-[10px] font-mono text-slate-400 select-none bg-slate-900/60 px-2 py-0.5 rounded">
          {new Date().toLocaleTimeString('en-IN', { hour12: false })} IST
        </div>
      </div>
    </div>
  );
}
