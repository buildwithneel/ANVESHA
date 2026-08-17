import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Grid,
  Filter,
  RefreshCw,
  Maximize2,
  AlertTriangle,
  Radio,
  Activity,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera as CameraIcon,
  WifiOff,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { cameraService } from '../../services/cameraService';
import { webSocketService } from '../../services/websocket';
import { CCTVCameraCard } from './CCTVCameraCard';
import { CCTVFullViewModal } from './CCTVFullViewModal';
import { useTranslation } from '../../i18n';

export function CCTVCommandCenter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ── States ──────────────────────────────────────────────
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthSummary, setHealthSummary] = useState(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [aiActivityFilter, setAiActivityFilter] = useState('All');
  const [layout, setLayout] = useState('2x2'); // '1x1' | '2x2' | '3x3' | '4x4'
  const [currentPage, setCurrentPage] = useState(1);

  // Selected camera for full monitoring inspection
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [highlightDetection, setHighlightDetection] = useState(false);
  const [relatedAlertId, setRelatedAlertId] = useState(null);

  // Global full screen container state
  const [isContainerFullscreen, setIsContainerFullscreen] = useState(false);
  const [quickSnapshotToast, setQuickSnapshotToast] = useState(null);

  // ── Fetch Cameras & Health ──────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [camsData, healthData] = await Promise.all([
        cameraService.getCameras({
          search: searchQuery,
          zone: zoneFilter,
          status: statusFilter,
          ai_activity: aiActivityFilter,
        }),
        cameraService.getHealthSummary(),
      ]);
      setCameras(camsData);
      setHealthSummary(healthData);
    } catch (err) {
      console.error('Failed to fetch CCTV cameras:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, zoneFilter, statusFilter, aiActivityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Handle incoming navigation state (e.g. from View Camera in Alert Center) ──
  useEffect(() => {
    if (location.state?.cameraId && cameras.length > 0) {
      const targetCam = cameras.find(
        (c) => c.id === location.state.cameraId || c.camera_code === location.state.cameraId
      );
      if (targetCam) {
        setSelectedCamera(targetCam);
        if (location.state?.highlightDetection) {
          setHighlightDetection(true);
        }
        if (location.state?.alertId) {
          setRelatedAlertId(location.state.alertId);
        }
      }
    }
  }, [location.state, cameras]);

  // ── Real-Time WebSocket Subscriptions ───────────────────
  useEffect(() => {
    // 1. Camera Status Changed
    const unsubStatus = webSocketService.subscribe('camera_status_changed', (data) => {
      setCameras((prev) =>
        prev.map((c) =>
          c.id === data.camera_id || c.camera_code === data.camera_code
            ? { ...c, status: data.status, ai_enabled: data.ai_enabled, ai_status: data.ai_status }
            : c
        )
      );
    });

    // 2. New Detection Triggered
    const unsubDetection = webSocketService.subscribe('new_detection', (data) => {
      setCameras((prev) =>
        prev.map((c) => {
          if (c.id === data.camera_id || c.camera_code === data.camera_id) {
            return {
              ...c,
              ai_status: 'ALERT',
              current_detection: {
                id: data.id || Date.now(),
                type: data.type || data.event_type || 'detection',
                confidence: data.confidence || 0.94,
                severity: data.severity || 'HIGH',
                risk_score: data.risk_score || 80,
                timestamp: data.timestamp || new Date().toISOString(),
                metadata: data.metadata || {},
              },
            };
          }
          return c;
        })
      );
    });

    // 3. New Alert Generated
    const unsubAlert = webSocketService.subscribe('new_alert', (data) => {
      setCameras((prev) =>
        prev.map((c) => {
          if (c.id === data.camera_id || c.camera_code === data.camera_id) {
            return {
              ...c,
              active_alert_count: (c.active_alert_count || 0) + 1,
              ai_status: 'ALERT',
            };
          }
          return c;
        })
      );
    });

    // 4. Alert Updated (e.g. Resolved / Dismissed)
    const unsubAlertUpdated = webSocketService.subscribe('alert_updated', (data) => {
      if (data.status === 'RESOLVED' || data.status === 'DISMISSED') {
        setCameras((prev) =>
          prev.map((c) => {
            if (c.id === data.camera_id) {
              return {
                ...c,
                active_alert_count: Math.max(0, (c.active_alert_count || 1) - 1),
              };
            }
            return c;
          })
        );
      }
    });

    return () => {
      unsubStatus();
      unsubDetection();
      unsubAlert();
      unsubAlertUpdated();
    };
  }, []);

  // ── Keyboard Shortcuts ─────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid triggering when typing in inputs/textareas/selects
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }

      if (e.key === '1') {
        setLayout('1x1');
      } else if (e.key === '2') {
        setLayout('2x2');
      } else if (e.key === '3') {
        setLayout('3x3');
      } else if (e.key === '4') {
        setLayout('4x4');
      } else if (e.key === 'f' || e.key === 'F') {
        setIsContainerFullscreen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSelectedCamera(null);
      } else if (e.key === 'ArrowLeft') {
        if (selectedCamera) {
          handlePrevCamera();
        }
      } else if (e.key === 'ArrowRight') {
        if (selectedCamera) {
          handleNextCamera();
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (selectedCamera) {
          handleQuickSnapshot(selectedCamera);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCamera, cameras]);

  const handleQuickSnapshot = async (cam) => {
    try {
      const snap = await cameraService.takeSnapshot(cam.id);
      setQuickSnapshotToast({
        id: snap.id,
        camera: cam.camera_code || cam.id,
        location: cam.location,
        time: new Date().toLocaleTimeString(),
      });
      setTimeout(() => setQuickSnapshotToast(null), 4000);
    } catch (err) {
      console.error('Quick snapshot error:', err);
    }
  };

  // ── Filtered & Paginated Cameras ───────────────────────
  const pageSize = useMemo(() => {
    if (layout === '1x1') return 1;
    if (layout === '2x2') return 4;
    if (layout === '3x3') return 9;
    if (layout === '4x4') return 16;
    return 4;
  }, [layout]);

  const totalPages = Math.max(1, Math.ceil(cameras.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);

  const paginatedCameras = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return cameras.slice(start, start + pageSize);
  }, [cameras, currentPageSafe, pageSize]);

  // Next / Previous Camera within full modal
  const handlePrevCamera = () => {
    if (!selectedCamera || cameras.length === 0) return;
    const idx = cameras.findIndex((c) => c.id === selectedCamera.id);
    const prevIdx = (idx - 1 + cameras.length) % cameras.length;
    setSelectedCamera(cameras[prevIdx]);
  };

  const handleNextCamera = () => {
    if (!selectedCamera || cameras.length === 0) return;
    const idx = cameras.findIndex((c) => c.id === selectedCamera.id);
    const nextIdx = (idx + 1) % cameras.length;
    setSelectedCamera(cameras[nextIdx]);
  };

  const handleViewAlertsForCamera = (cameraId) => {
    navigate('/alerts', { state: { cameraId } });
  };

  // Metric counts
  const counts = useMemo(() => {
    const online = cameras.filter((c) => (c.status || '').toUpperCase() === 'LIVE' || (c.status || '').toUpperCase() === 'ONLINE').length;
    const offline = cameras.filter((c) => (c.status || '').toUpperCase() === 'OFFLINE').length;
    const degraded = cameras.filter((c) => (c.status || '').toUpperCase() === 'DEGRADED').length;
    const alerts = cameras.reduce((acc, c) => acc + (c.active_alert_count || 0), 0);
    return { online, offline, degraded, alerts };
  }, [cameras]);

  return (
    <div className={cn(
      'flex flex-col h-full space-y-4 animate-fade-in select-none',
      isContainerFullscreen && 'fixed inset-0 z-40 bg-canvas p-4'
    )}>
      {/* ── 1. Header & Metrics Bar ────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-text-primary tracking-tight uppercase flex items-center gap-2">
              <CameraIcon className="w-5 h-5 text-accent" />
              {t('cctv.title', 'CCTV COMMAND CENTER')}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-soft text-accent border border-accent-border font-mono">
              BRC DIVISION
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {t('cctv.subtitle', 'Real-time railway operations video monitoring, automated AI telemetry, and security surveillance')}
          </p>
        </div>

        {/* Operational Status Metrics Counters */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Online cameras */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised border border-border">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-text-muted">{t('status.online', 'Online')}:</span>
            <span className="font-mono font-bold text-text-primary">{counts.online}</span>
          </div>

          {/* Offline cameras */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised border border-border">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-text-muted">{t('status.offline', 'Offline')}:</span>
            <span className="font-mono font-bold text-text-primary">{counts.offline}</span>
          </div>

          {/* Degraded cameras */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised border border-border">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-text-muted">{t('cctv.degraded', 'Degraded')}:</span>
            <span className="font-mono font-bold text-text-primary">{counts.degraded}</span>
          </div>

          {/* Active alerts */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('cctv.activeAlert', 'Active alerts')}:</span>
            <span className="font-mono font-bold">{counts.alerts}</span>
          </div>

          {/* System Health Pill */}
          {healthSummary && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised border border-border font-mono text-[11px] text-text-secondary">
              <span>Net: <strong className="text-emerald-600 dark:text-emerald-400">{healthSummary.network_health_pct}%</strong></span>
              <span className="text-border">|</span>
              <span>AI: <strong className="text-blue-600 dark:text-blue-400">{healthSummary.ai_health_pct}%</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Filters & Layout Controls Toolbar ──────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border shadow-xs">
        {/* Left Side: Search & Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search Camera */}
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={t('cctv.searchPlaceholder', 'Search Camera ID, Location, Zone...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>

          {/* Zone Filter */}
          <select
            value={zoneFilter}
            onChange={(e) => {
              setZoneFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium cursor-pointer"
          >
            <option value="All">{t('cctv.allZones', 'All Zones')}</option>
            <option value="Platform 1">Platform 1</option>
            <option value="Platform 2">Platform 2</option>
            <option value="Platform 3">Platform 3</option>
            <option value="Platform 4">Platform 4</option>
            <option value="Concourse">Concourse</option>
            <option value="FOB">FOB (Foot-Overbridge)</option>
            <option value="Track Area">Track Area</option>
            <option value="Maintenance Area">Maintenance Area</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="LIVE">Online / Live</option>
            <option value="DEGRADED">Degraded</option>
            <option value="OFFLINE">Offline</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          {/* AI Activity Filter */}
          <select
            value={aiActivityFilter}
            onChange={(e) => {
              setAiActivityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface-raised text-text-primary focus:outline-none focus:ring-1 focus:ring-accent font-medium cursor-pointer"
          >
            <option value="All">All AI Activity</option>
            <option value="Normal">Normal</option>
            <option value="Detection">Active Detection</option>
            <option value="Alert">Active Alert</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface-hover text-text-secondary transition-colors"
            title="Refresh Camera Telemetry"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>

        {/* Right Side: Layout Selector & Pagination */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {/* Layout Selector Segmented Control */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface-raised border border-border text-xs">
            {['1x1', '2x2', '3x3', '4x4'].map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLayout(l);
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-2.5 py-1 rounded-md font-mono font-semibold transition-colors',
                  layout === l
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                )}
                title={`Layout ${l} (${l.split('x')[0] * l.split('x')[1]} feeds)`}
              >
                {l.replace('x', ' × ')}
              </button>
            ))}
          </div>

          {/* Pagination Navigator */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-text-muted font-mono text-[11px]">
                {currentPageSafe}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPageSafe <= 1}
                className="p-1 rounded border border-border bg-surface-raised hover:bg-surface-hover disabled:opacity-40 text-text-secondary"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPageSafe >= totalPages}
                className="p-1 rounded border border-border bg-surface-raised hover:bg-surface-hover disabled:opacity-40 text-text-secondary"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsContainerFullscreen((prev) => !prev)}
            className="p-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface-hover text-text-secondary transition-colors"
            title={isContainerFullscreen ? 'Exit Full Screen' : 'Full Screen Desk (F)'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 3. Responsive Camera Grid ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {cameras.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-xl border border-border text-center text-text-muted">
            <CameraIcon className="w-12 h-12 text-text-muted mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-text-primary">No CCTV cameras match your filter criteria</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm">
              Try adjusting your search query, zone, or operational status filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setZoneFilter('All');
                setStatusFilter('All');
                setAiActivityFilter('All');
              }}
              className="mt-4 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-3 transition-all duration-150',
              layout === '1x1' && 'grid-cols-1 max-w-4xl mx-auto',
              layout === '2x2' && 'grid-cols-1 md:grid-cols-2',
              layout === '3x3' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
              layout === '4x4' && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            )}
          >
            {paginatedCameras.map((camera) => (
              <CCTVCameraCard
                key={camera.id}
                camera={camera}
                isFocused={selectedCamera?.id === camera.id}
                onSelect={(cam) => setSelectedCamera(cam)}
                onViewAlerts={handleViewAlertsForCamera}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Full Camera View Modal (Opened on click or shortcut) ── */}
      {selectedCamera && (
        <CCTVFullViewModal
          camera={selectedCamera}
          initialAlertId={relatedAlertId}
          highlightDetection={highlightDetection}
          onClose={() => {
            setSelectedCamera(null);
            setHighlightDetection(false);
            setRelatedAlertId(null);
          }}
          onPrevCamera={handlePrevCamera}
          onNextCamera={handleNextCamera}
        />
      )}

      {/* Quick Snapshot Notification */}
      {quickSnapshotToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-700 shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-mono">
            <div className="font-bold">Snapshot Recorded [Shortcut S]</div>
            <div className="text-slate-400 text-[11px]">
              {quickSnapshotToast.camera} · {quickSnapshotToast.time}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
