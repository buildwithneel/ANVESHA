import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Maximize2,
  Minimize2,
  Camera,
  Download,
  AlertTriangle,
  Clock,
  Activity,
  Layers,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Info,
  CheckCircle2,
  Shield,
  WifiOff,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { cameraService } from '../../services/cameraService';
import { formatEventLabel } from '../../utils/formatters';
import { CCTVVideoFeed } from './CCTVVideoFeed';

export function CCTVFullViewModal({
  camera,
  initialAlertId = null,
  highlightDetection = false,
  onClose,
  onPrevCamera,
  onNextCamera,
  sourceType = 'webcam',
  customVideoUrl = null,
}) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // States
  const [showOverlays, setShowOverlays] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'controls' | 'health'
  const [timeFilter, setTimeFilter] = useState('today'); // '15m' | '1h' | '6h' | 'today'
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotToast, setSnapshotToast] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [controlNotice, setControlNotice] = useState(null);

  const status = (camera?.status || 'LIVE').toUpperCase();
  const isOnline = status === 'LIVE' || status === 'ONLINE';
  const isDegraded = status === 'DEGRADED';
  const isOffline = status === 'OFFLINE';
  const isMaintenance = status === 'MAINTENANCE';

  // Load camera event history
  useEffect(() => {
    if (!camera?.id) return;
    let isMounted = true;
    async function loadEvents() {
      const data = await cameraService.getCameraEvents(camera.id, timeFilter);
      if (isMounted) {
        setEvents(data);
      }
    }
    loadEvents();
    return () => { isMounted = false; };
  }, [camera?.id, timeFilter]);

  // Set initial detection from camera or highlighted alert
  useEffect(() => {
    if (sourceType === 'webcam') {
      // In live webcam mode, clear static demo detection state unless dynamically triggered by real live feed
      setSelectedDetection(camera?.current_detection?.is_live ? camera.current_detection : null);
    } else if (camera?.current_detection) {
      setSelectedDetection(camera.current_detection);
    }
  }, [camera, sourceType]);

  // Real-time canvas feed renderer
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

      // Dark surveillance background
      ctx.fillStyle = isDegraded ? '#111827' : '#0B1120';
      ctx.fillRect(0, 0, w, h);

      // Apply digital pan & zoom
      ctx.save();
      ctx.translate(w / 2 + panOffset.x, h / 2 + panOffset.y);
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(-w / 2, -h / 2);

      // Grid guidelines
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

      // Scanline raster
      ctx.fillStyle = isDegraded ? 'rgba(245, 158, 11, 0.025)' : 'rgba(255, 255, 255, 0.015)';
      for (let i = 0; i < h; i += 4) {
        ctx.fillRect(0, i + (frame % 4), w, 1);
      }

      // Detection bounding box
      if (showOverlays && camera?.current_detection) {
        const det = camera.current_detection;
        const rawBox = det.metadata?.bbox || det.bbox || [120, 80, 320, 420];
        const bx = (rawBox[0] / 1920) * w;
        const by = (rawBox[1] / 1080) * h;
        const bw = Math.max(70, ((rawBox[2] - rawBox[0]) / 1920) * w);
        const bh = Math.max(90, ((rawBox[3] - rawBox[1]) / 1080) * h);

        const isCrit = det.severity === 'CRITICAL' || camera.active_alert_count > 0;
        const strokeColor = isCrit ? '#EF4444' : '#F59E0B';
        const fillColor = isCrit ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.15)';

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = fillColor;
        ctx.fillRect(bx, by, bw, bh);

        // Corner indicators
        const tick = 10;
        ctx.fillStyle = strokeColor;
        ctx.fillRect(bx - 2, by - 2, tick, 3);
        ctx.fillRect(bx - 2, by - 2, 3, tick);
        ctx.fillRect(bx + bw - tick + 2, by - 2, tick, 3);
        ctx.fillRect(bx + bw - 1, by - 2, 3, tick);
        ctx.fillRect(bx - 2, by + bh - 2, tick, 3);
        ctx.fillRect(bx - 2, by + bh - tick + 2, 3, tick);
        ctx.fillRect(bx + bw - tick + 2, by + bh - 2, tick, 3);
        ctx.fillRect(bx + bw - 1, by + bh - tick + 2, 3, tick);

        // AI Label badge on box
        ctx.fillStyle = strokeColor;
        const labelText = `${formatEventLabel(det.type)} ${Math.round(det.confidence * (det.confidence <= 1 ? 100 : 1))}%`;
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillRect(bx, by - 20, textWidth + 12, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, bx + 6, by - 7);
      }

      ctx.restore();
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isOnline, isDegraded, showOverlays, camera, zoomLevel, panOffset]);

  // Handle Snapshot
  const handleTakeSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      const snap = await cameraService.takeSnapshot(camera.id, {
        note: 'Control Room Manual Snapshot',
      });
      setSnapshotToast({
        id: snap.id,
        timestamp: snap.timestamp,
        location: camera.location,
        cameraId: camera.id,
      });
      setTimeout(() => setSnapshotToast(null), 5000);
    } catch (err) {
      console.error('Snapshot failed:', err);
    } finally {
      setSnapshotLoading(false);
    }
  };

  // PTZ Control simulation
  const handlePan = (dx, dy) => {
    setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    triggerControlNotice('Digital Pan Applied');
  };

  const handleZoom = (factor) => {
    setZoomLevel((prev) => Math.min(3.0, Math.max(1.0, prev + factor)));
    triggerControlNotice(`Digital Zoom: ${Math.round((zoomLevel + factor) * 100)}%`);
  };

  const resetPanZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    triggerControlNotice('Digital View Reset');
  };

  const triggerControlNotice = (msg) => {
    setControlNotice(msg);
    setTimeout(() => setControlNotice(null), 2500);
  };

  const handleViewAlert = (alertId) => {
    navigate('/alerts', {
      state: {
        cameraId: camera.id,
        alertId: alertId || camera.active_alert_id,
      },
    });
  };

  const getStatusBadge = () => {
    if (isOnline) {
      return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">● LIVE</span>;
    }
    if (isDegraded) {
      return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-700">● DEGRADED</span>;
    }
    if (isOffline) {
      return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-red-950 text-red-300 border border-red-700">● OFFLINE</span>;
    }
    if (isMaintenance) {
      return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-700">● MAINTENANCE</span>;
    }
    return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">● {status}</span>;
  };

  if (!camera) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 animate-fade-in">
      <div className={cn(
        'relative flex flex-col bg-surface border border-border rounded-xl shadow-2xl overflow-hidden transition-all duration-200',
        isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-6xl max-h-[92vh]'
      )}>
        {/* ── Modal Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-raised border-b border-border text-text-primary gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-text-primary">
                {camera.camera_code || camera.id}
              </span>
              {getStatusBadge()}
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-xs text-text-secondary truncate hidden sm:inline" title={camera.location}>
              {camera.location} ({camera.zone})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Active alerts quick jump */}
            {camera.active_alert_count > 0 && (
              <button
                onClick={() => handleViewAlert()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{camera.active_alert_count} Active Alert{camera.active_alert_count > 1 ? 's' : ''}</span>
              </button>
            )}

            {/* Prev / Next Camera Navigation */}
            <div className="flex items-center border border-border rounded bg-surface overflow-hidden">
              <button
                onClick={onPrevCamera}
                className="p-1 hover:bg-surface-hover text-text-secondary"
                title="Previous Camera (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNextCamera}
                className="p-1 hover:bg-surface-hover text-text-secondary border-l border-border"
                title="Next Camera (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Fullscreen */}
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 rounded hover:bg-surface-hover text-text-secondary"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-red-500/10 hover:text-red-500 text-text-secondary transition-colors"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Modal Body (Split Layout: Stream + Details/Events) ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Main CCTV Feed Viewport */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden min-h-[300px]">
            {isOffline ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <WifiOff className="w-12 h-12 text-slate-500 mb-3" />
                <h3 className="text-base font-semibold text-slate-200">Live feed unavailable</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  The RTSP feed stream for {camera.camera_code || camera.id} is currently disconnected.
                </p>
                <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-400 text-left space-y-1">
                  <div><strong>Location:</strong> {camera.location}</div>
                  <div><strong>Zone:</strong> {camera.zone}</div>
                  <div><strong>Last Heartbeat:</strong> {camera.last_heartbeat ? new Date(camera.last_heartbeat).toLocaleString() : 'N/A'}</div>
                  <div><strong>Last Known Status:</strong> OFFLINE</div>
                </div>
              </div>
            ) : isMaintenance ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Activity className="w-12 h-12 text-blue-400 mb-3 animate-pulse" />
                <h3 className="text-base font-semibold text-blue-300">Under Scheduled Maintenance</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Field technicians are performing optical calibration and sensor realignment.
                </p>
              </div>
            ) : (
              <>
                <CCTVVideoFeed
                  camera={camera}
                  sourceType={sourceType}
                  customVideoUrl={customVideoUrl}
                  showOverlays={showOverlays}
                  isModal={true}
                  zoomLevel={zoomLevel}
                  panOffset={panOffset}
                  className="w-full h-full"
                />

                {/* Control Action Toast */}
                {controlNotice && (
                  <div className="absolute top-3 right-3 bg-blue-950/90 border border-blue-600 text-blue-200 px-3 py-1 rounded text-xs font-mono shadow-lg animate-fade-in z-30">
                    {controlNotice}
                  </div>
                )}

                {/* Bottom Action Bar inside Feed */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Take Snapshot Button */}
                    <button
                      onClick={handleTakeSnapshot}
                      disabled={snapshotLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium backdrop-blur-xs transition-colors shadow-sm"
                      title="Take Snapshot (S)"
                    >
                      <Camera className="w-3.5 h-3.5 text-accent-soft" />
                      <span>{snapshotLoading ? 'Archiving...' : 'Take Snapshot'}</span>
                    </button>

                    {/* Toggle AI Overlays */}
                    <button
                      onClick={() => setShowOverlays((prev) => !prev)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium backdrop-blur-xs transition-colors border shadow-sm',
                        showOverlays
                          ? 'bg-blue-900/80 text-blue-200 border-blue-600'
                          : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
                      )}
                    >
                      {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>AI Overlay {showOverlays ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* Interactive Detection Indicator */}
                  {selectedDetection && (
                    <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 border border-slate-700 px-3 py-1.5 rounded backdrop-blur-xs text-xs">
                      <span className={cn(
                        'font-bold',
                        selectedDetection.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                      )}>
                        {formatEventLabel(selectedDetection.type)}
                      </span>
                      <span className="text-slate-300 font-mono">
                        {Math.round(selectedDetection.confidence * (selectedDetection.confidence <= 1 ? 100 : 1))}% Confidence
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-300 font-mono">
                        Risk: {selectedDetection.risk_score || 75}/100
                      </span>
                      <button
                        onClick={() => handleViewAlert()}
                        className="ml-1 px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-medium text-[11px] transition-colors"
                      >
                        View Alert
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Side Operations Panel ───────────────────────────── */}
          <div className="w-full lg:w-96 flex flex-col bg-surface border-t lg:border-t-0 lg:border-l border-border min-h-0">
            {/* Panel Tabs */}
            <div className="flex border-b border-border bg-surface-raised text-xs font-semibold">
              <button
                onClick={() => setActiveTab('events')}
                className={cn(
                  'flex-1 py-2.5 px-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5',
                  activeTab === 'events'
                    ? 'border-accent text-accent bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Events</span>
              </button>
              <button
                onClick={() => setActiveTab('controls')}
                className={cn(
                  'flex-1 py-2.5 px-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5',
                  activeTab === 'controls'
                    ? 'border-accent text-accent bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>PTZ Control</span>
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={cn(
                  'flex-1 py-2.5 px-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5',
                  activeTab === 'health'
                    ? 'border-accent text-accent bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Health</span>
              </button>
            </div>

            {/* Tab 1: Camera Event History */}
            {activeTab === 'events' && (
              <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3 overflow-y-auto">
                {/* Time Range Filter Selector */}
                <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-md border border-border text-xs">
                  {['15m', '1h', '6h', 'today'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeFilter(t)}
                      className={cn(
                        'flex-1 py-1 rounded text-[11px] font-medium transition-colors',
                        timeFilter === t
                          ? 'bg-accent text-white shadow-xs'
                          : 'text-text-secondary hover:bg-surface-hover'
                      )}
                    >
                      {t === '15m' ? '15 min' : t === '1h' ? '1 hour' : t === '6h' ? '6 hours' : 'Today'}
                    </button>
                  ))}
                </div>

                {/* Event List */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {events.length === 0 ? (
                    <div className="py-8 text-center text-xs text-text-muted">
                      No detection events recorded for this timeframe.
                    </div>
                  ) : (
                    events.map((ev) => {
                      const timeStr = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isHigh = ev.severity === 'CRITICAL' || ev.severity === 'HIGH';
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={cn(
                            'p-2.5 rounded-lg border text-xs cursor-pointer transition-colors',
                            selectedEvent?.id === ev.id
                              ? 'border-accent bg-accent-soft/30'
                              : 'border-border bg-surface hover:bg-surface-hover'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-text-muted">{timeStr}</span>
                            <span className={cn(
                              'px-1.5 py-0.2 rounded font-semibold text-[10px]',
                              ev.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                              ev.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                              ev.severity === 'MODERATE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            )}>
                              {ev.severity}
                            </span>
                          </div>
                          <div className="font-bold text-text-primary">
                            {formatEventLabel(ev.event_type)}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-text-secondary mt-1">
                            <span>Confidence: {Math.round((ev.confidence || 0.9) * 100)}%</span>
                            <span className="text-accent hover:underline">View details →</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Event Details Card */}
                {selectedEvent && (
                  <div className="p-3 bg-surface-raised border border-border rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-text-primary">
                      <span>Event Inspection</span>
                      <button onClick={() => setSelectedEvent(null)} className="text-text-muted hover:text-text-primary">✕</button>
                    </div>
                    <div><strong>Type:</strong> {selectedEvent.event_type}</div>
                    <div><strong>Location:</strong> {selectedEvent.location}</div>
                    <div><strong>Confidence:</strong> {Math.round((selectedEvent.confidence || 0.9) * 100)}%</div>
                    <div><strong>Risk Score:</strong> {selectedEvent.risk_score || 50}/100</div>
                    <button
                      onClick={() => handleViewAlert()}
                      className="w-full mt-2 py-1.5 rounded bg-accent hover:bg-accent-hover text-white font-semibold text-xs transition-colors"
                    >
                      Cross-Reference Alert Center
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: PTZ Controls (Explicitly Labeled Demo Control) */}
            {activeTab === 'controls' && (
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Demo PTZ Control</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                    Physical PTZ hardware actuation is unavailable for fixed dome units. Digital viewport panning and optical zoom simulation are enabled.
                  </p>
                </div>

                {/* Directional Pad */}
                <div className="flex flex-col items-center justify-center space-y-2 py-2">
                  <button
                    onClick={() => handlePan(0, -30)}
                    className="p-2 rounded-lg bg-surface-raised border border-border hover:bg-surface-hover text-text-primary active:scale-95 shadow-xs"
                    title="Pan Up"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePan(-30, 0)}
                      className="p-2 rounded-lg bg-surface-raised border border-border hover:bg-surface-hover text-text-primary active:scale-95 shadow-xs"
                      title="Pan Left"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={resetPanZoom}
                      className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-[10px] font-mono hover:bg-surface-hover text-text-secondary"
                      title="Reset Pan/Zoom"
                    >
                      RESET
                    </button>
                    <button
                      onClick={() => handlePan(30, 0)}
                      className="p-2 rounded-lg bg-surface-raised border border-border hover:bg-surface-hover text-text-primary active:scale-95 shadow-xs"
                      title="Pan Right"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => handlePan(0, 30)}
                    className="p-2 rounded-lg bg-surface-raised border border-border hover:bg-surface-hover text-text-primary active:scale-95 shadow-xs"
                    title="Pan Down"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="text-xs font-semibold text-text-primary flex justify-between">
                    <span>Digital Zoom</span>
                    <span className="font-mono text-accent">{Math.round(zoomLevel * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleZoom(-0.25)}
                      disabled={zoomLevel <= 1}
                      className="flex-1 py-1.5 rounded bg-surface-raised border border-border hover:bg-surface-hover disabled:opacity-50 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                      <span>Zoom Out</span>
                    </button>
                    <button
                      onClick={() => handleZoom(0.25)}
                      disabled={zoomLevel >= 3}
                      className="flex-1 py-1.5 rounded bg-surface-raised border border-border hover:bg-surface-hover disabled:opacity-50 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom In</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Camera Health Metrics */}
            {activeTab === 'health' && (
              <div className="p-4 space-y-3 text-xs overflow-y-auto">
                <div className="p-3 bg-surface-raised border border-border rounded-lg space-y-2">
                  <div className="font-semibold text-text-primary">Camera Telemetry & Pipeline</div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-text-muted">Connection:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">100% (STABLE)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-text-muted">AI Inference Pipeline:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">ACTIVE (24ms)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-text-muted">Last Heartbeat:</span>
                    <span className="font-mono text-text-primary">
                      {camera.last_heartbeat ? new Date(camera.last_heartbeat).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-text-muted">Resolution:</span>
                    <span className="font-mono text-text-primary">1920 × 1080 (1080p)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-text-muted">Stream Protocol:</span>
                    <span className="font-mono text-text-primary">RTSP / WebRTC Low-Latency</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Snapshot Notification Toast */}
        {snapshotToast && (
          <div className="absolute bottom-4 left-4 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-700 shadow-xl animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-semibold">Snapshot Archived</div>
              <div className="text-slate-400 font-mono text-[11px]">
                {snapshotToast.cameraId} · {new Date(snapshotToast.timestamp).toLocaleTimeString()} · {snapshotToast.location}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
