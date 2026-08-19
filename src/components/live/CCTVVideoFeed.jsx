import React, { useRef, useEffect, useState } from 'react';
import {
  Camera,
  Video,
  WifiOff,
  VideoOff,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatEventLabel } from '../../utils/formatters';

/**
 * CCTVVideoFeed Component
 * Consumes Python AI Live Stream (http://127.0.0.1:8090/stream) for Laptop Camera,
 * HTML5 video for Demo Video, or Simulated Grid fallback.
 * Strictly adheres to RailGuard control-room styling and labeling rules.
 */
export function CCTVVideoFeed({
  camera,
  sourceType = 'webcam', // 'webcam' (Python AI Laptop Camera) | 'video' | 'simulated'
  customVideoUrl = null,
  defaultVideoUrl = '/videos/sample_cctv.mp4',
  streamUrl = 'http://127.0.0.1:8090/stream',
  showOverlays = true,
  isModal = false,
  zoomLevel = 1,
  panOffset = { x: 0, y: 0 },
  className = '',
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Python AI Live Stream State
  const [streamError, setStreamError] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);

  // Demo Video State
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const status = (camera?.status || 'LIVE').toUpperCase();
  const isDegraded = status === 'DEGRADED';
  const isUnavailable = status === 'UNAVAILABLE';
  const activeAlerts = camera?.active_alert_count || 0;
  const currentDetection = camera?.current_detection;

  // Clean stream URL string guard
  const cleanStreamUrl = typeof streamUrl === 'string' && streamUrl.trim() !== ''
    ? streamUrl.trim()
    : 'http://127.0.0.1:8090/stream';

  const videoSourceUrl = customVideoUrl || defaultVideoUrl;

  // ── 1. PYTHON AI STREAM HANDLER ──────────────────────────
  useEffect(() => {
    if (sourceType === 'webcam') {
      setStreamError(false);
      setConnectionFailed(false);
    }
  }, [sourceType, cleanStreamUrl]);

  // ── 2. DEMO VIDEO HANDLER ───────────────────────────────
  useEffect(() => {
    if (sourceType === 'video' && videoRef.current) {
      setHasVideoError(false);
      videoRef.current.srcObject = null;
      videoRef.current.load();
      videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {
        setIsVideoPlaying(false);
      });
    }
  }, [sourceType, videoSourceUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setVideoProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const togglePlayPause = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isVideoMuted;
    setIsVideoMuted(!isVideoMuted);
  };

  const handleReplay = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsVideoPlaying(true);
  };

  // ── 3. SIMULATED CANVAS RENDERER ─────────────────────────
  useEffect(() => {
    if (sourceType !== 'simulated') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let frame = 0;

    const draw = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;
      const safePanX = panOffset?.x || 0;
      const safePanY = panOffset?.y || 0;
      const safeZoom = zoomLevel || 1;

      ctx.fillStyle = isDegraded ? '#111827' : '#0B1120';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2 + safePanX, h / 2 + safePanY);
      ctx.scale(safeZoom, safeZoom);
      ctx.translate(-w / 2, -h / 2);

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

      ctx.restore();
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [sourceType, isDegraded, zoomLevel, panOffset]);

  // Safe camera data missing check
  if (!camera && sourceType === 'webcam') {
    return (
      <div className={cn('relative w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 text-center select-none space-y-2', className)}>
        <WifiOff className="w-8 h-8 text-amber-500 mb-1 stroke-[1.5]" />
        <span className="text-xs font-bold font-mono text-amber-400 tracking-wide uppercase">
          CAMERA DATA UNAVAILABLE
        </span>
        <span className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
          No telemetry or configuration data loaded for this camera slot.
        </span>
      </div>
    );
  }

  if (isUnavailable) {
    return (
      <div className={cn('relative w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 text-center select-none space-y-2', className)}>
        <WifiOff className="w-8 h-8 text-rose-500 mb-1 stroke-[1.5]" />
        <span className="text-xs font-bold font-mono text-rose-400 tracking-wide uppercase">
          CAMERA UNAVAILABLE
        </span>
        <span className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
          Target CCTV hardware ({camera?.camera_code || camera?.id || 'CAM'}) is currently unreachable on the station matrix network.
        </span>
      </div>
    );
  }

  // Real backend detection Bounding Box coordinates (ignore static mock bboxes when viewing live webcam)
  const isWebcamMode = sourceType === 'webcam';
  const rawBox = (isWebcamMode && currentDetection && !currentDetection.is_live && !currentDetection.metadata?.frame_width)
    ? null
    : (currentDetection?.metadata?.bbox || currentDetection?.bbox);

  const safePanX = panOffset?.x || 0;
  const safePanY = panOffset?.y || 0;
  const safeZoom = zoomLevel || 1;

  return (
    <div className={cn('relative w-full h-full bg-slate-950 overflow-hidden select-none', className)}>
      {/* ── LAPTOP CAMERA / PYTHON AI STREAM MODE ─────────────── */}
      {sourceType === 'webcam' && (
        <>
          {streamError || connectionFailed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950 z-10 space-y-2">
              <WifiOff className="w-8 h-8 text-rose-500 mb-1" />
              <span className="text-xs font-bold font-mono text-rose-400 tracking-wide uppercase">
                {connectionFailed ? 'STREAM CONNECTION ERROR' : 'CAMERA STREAM OFFLINE'}
              </span>
              <span className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                Python AI pipeline is not streaming on <code className="text-amber-300">{cleanStreamUrl}</code>. Start pipeline:
              </span>
              <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 select-all">
                python main.py --source 0 --camera-id {camera?.camera_code || camera?.id || 'CAM-01'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setStreamError(false);
                  setConnectionFailed(false);
                }}
                className="mt-1 px-3 py-1 text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              {/* Python Stream Image Tag */}
              <img
                src={cleanStreamUrl}
                alt="Python AI Camera Feed"
                onError={() => {
                  setStreamError(true);
                  setConnectionFailed(true);
                }}
                onLoad={() => {
                  setStreamError(false);
                  setConnectionFailed(false);
                }}
                className="w-full h-full object-cover transition-transform duration-75"
                style={{
                  transform: `scale(${safeZoom}) translate(${safePanX / 10}px, ${safePanY / 10}px)`,
                }}
              />

              {/* OSD Status Badge — Laptop Camera AI Stream */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/85 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-900/60 backdrop-blur-xs z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">● LIVE</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">{camera?.camera_code || camera?.id || 'CAM-01'}</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-300 font-semibold uppercase">LIVE CCTV FEED</span>
                <span className="text-slate-600">|</span>
                <span className="text-blue-400 font-semibold uppercase">AI PROCESSING</span>
              </div>
            </>
          )}
        </>
      )}

      {/* ── DEMO VIDEO MODE ───────────────────────────────────── */}
      {sourceType === 'video' && (
        <>
          {hasVideoError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950 z-10 space-y-2">
              <VideoOff className="w-8 h-8 text-rose-500" />
              <span className="text-xs font-bold font-mono text-rose-400 tracking-wide uppercase">
                DEMO VIDEO UNAVAILABLE
              </span>
              <span className="text-[11px] text-slate-400 max-w-xs">
                Unable to load local demo video file ({videoSourceUrl}).
              </span>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={videoSourceUrl}
                autoPlay
                loop
                muted={isVideoMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onError={() => setHasVideoError(true)}
                className="w-full h-full object-cover transition-transform duration-75"
                style={{
                  transform: `scale(${safeZoom}) translate(${safePanX / 10}px, ${safePanY / 10}px)`,
                }}
              />

              {/* OSD Status Badge — Demo Video (STRICTLY ▶ DEMO, NEVER LIVE) */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/85 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 border border-amber-900/60 backdrop-blur-xs z-20">
                <Play className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="font-bold">▶ DEMO</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">{camera?.camera_code || camera?.id || 'CAM-07'}</span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-300 font-semibold uppercase">DEMO CAMERA</span>
              </div>

              {/* Interactive Video Controls */}
              <div className={cn(
                'absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded bg-slate-950/85 border border-slate-800 text-xs text-slate-300 backdrop-blur-xs z-20 transition-opacity',
                !isModal && 'opacity-0 hover:opacity-100'
              )}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className="p-1 rounded hover:bg-slate-800 text-slate-200 transition-colors"
                    title={isVideoPlaying ? 'Pause Video' : 'Play Video'}
                  >
                    {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleReplay}
                    className="p-1 rounded hover:bg-slate-800 text-slate-200 transition-colors"
                    title="Replay Video"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1 rounded hover:bg-slate-800 text-slate-200 transition-colors"
                    title={isVideoMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isVideoMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>

                <div className="flex-1 mx-3 h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-100" style={{ width: `${videoProgress}%` }} />
                </div>

                <span className="text-[10px] font-mono text-amber-400 font-semibold">
                  PRERECORDED
                </span>
              </div>
            </>
          )}
        </>
      )}

      {/* ── SIMULATED GRID FALLBACK MODE ──────────────────────── */}
      {sourceType === 'simulated' && (
        <>
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-cover"
          />

          {/* OSD Status Badge — Simulated */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/85 px-2 py-0.5 rounded text-[10px] font-mono text-blue-400 border border-blue-900/60 backdrop-blur-xs z-20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-bold">● LIVE</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">{camera?.camera_code || camera?.id || 'CAM-01'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-300 font-semibold uppercase">SIMULATED CCTV</span>
          </div>
        </>
      )}

      {/* ── REAL BACKEND AI BBOX DETECTIONS OVERLAY ───────────── */}
      {showOverlays && rawBox && Array.isArray(rawBox) && rawBox.length === 4 && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {(() => {
            const metaW = currentDetection?.metadata?.frame_width || (rawBox[2] <= 640 && rawBox[3] <= 480 ? 640 : (rawBox[2] <= 1280 && rawBox[3] <= 720 ? 1280 : 1920));
            const metaH = currentDetection?.metadata?.frame_height || (rawBox[2] <= 640 && rawBox[3] <= 480 ? 480 : (rawBox[2] <= 1280 && rawBox[3] <= 720 ? 720 : 1080));

            const bx = (rawBox[0] / metaW) * 100;
            const by = (rawBox[1] / metaH) * 100;
            const bw = Math.max(5, ((rawBox[2] - rawBox[0]) / metaW) * 100);
            const bh = Math.max(5, ((rawBox[3] - rawBox[1]) / metaH) * 100);

            const isCrit = currentDetection?.severity === 'CRITICAL' || activeAlerts > 0;
            const borderColor = isCrit ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)';
            const bgColor = isCrit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.12)';
            const confVal = currentDetection?.confidence || 0.9;
            const confPct = Math.round(confVal * (confVal <= 1 ? 100 : 1));

            return (
              <div
                className="absolute border-2 transition-all duration-150"
                style={{
                  left: `${bx}%`,
                  top: `${by}%`,
                  width: `${bw}%`,
                  height: `${bh}%`,
                  borderColor,
                  backgroundColor: bgColor,
                }}
              >
                <div
                  className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white whitespace-nowrap shadow-sm"
                  style={{ backgroundColor: borderColor }}
                >
                  {formatEventLabel(currentDetection?.type)} {confPct}%
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Top-Right AI Indicator Badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-slate-300 z-20 backdrop-blur-xs">
        {camera?.ai_enabled !== false ? (
          <span className={cn(
            'flex items-center gap-1 font-semibold',
            activeAlerts > 0 ? 'text-red-400' : currentDetection ? 'text-amber-400' : 'text-blue-400'
          )}>
            <Sparkles className="w-2.5 h-2.5" />
            {activeAlerts > 0 ? 'AI ALERT' : currentDetection ? 'AI DETECT' : 'AI ACTIVE'}
          </span>
        ) : (
          <span className="text-slate-500">AI OFF</span>
        )}
      </div>
    </div>
  );
}

export default CCTVVideoFeed;
