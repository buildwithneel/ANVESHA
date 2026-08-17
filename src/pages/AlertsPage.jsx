import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { AlertCard } from '../components/common/AlertCard';
import { AlertDetailsDrawer } from '../components/alerts/AlertDetailsDrawer';
import { CreateIncidentModal } from '../components/live/CreateIncidentModal';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { alertService } from '../services/alertService';
import { soundService } from '../services/soundService';
import {
  Filter,
  RefreshCw,
  Layers,
  Play,
  ShieldAlert,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Clock,
  Camera as CameraIcon,
} from 'lucide-react';
import { cn } from '../utils/cn';

const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'WARNING', 'RESOLVED'];

export function AlertsPage() {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};

  // State
  const [alerts, setAlerts] = useState(outletContext.alertsList || []);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCamera, setSelectedCamera] = useState('ALL');
  const [timeRange, setTimeRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dedupStats, setDedupStats] = useState({
    total_raw_detections: 47,
    total_operational_alerts: 12,
    active_operational_alerts: 7,
    suppressed_duplicate_detections: 35,
    deduplication_ratio: '74.5%',
  });

  // Modal / Drawer state
  const [selectedAlertForDrawer, setSelectedAlertForDrawer] = useState(null);
  const [incidentModalAlert, setIncidentModalAlert] = useState(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoBanner, setDemoBanner] = useState(null);

  // Sync with context
  useEffect(() => {
    if (outletContext.alertsList && outletContext.alertsList.length > 0) {
      setAlerts(outletContext.alertsList);
    }
  }, [outletContext.alertsList]);

  // Load deduplication stats & fresh alerts
  const loadAlertsData = useCallback(async () => {
    try {
      const [liveAlerts, stats] = await Promise.all([
        alertService.getAlerts(),
        alertService.getDeduplicationStats(),
      ]);
      if (Array.isArray(liveAlerts) && liveAlerts.length > 0) {
        setAlerts(liveAlerts);
      }
      if (stats) {
        setDedupStats(stats);
      }
    } catch (e) {
      console.warn('Error loading alerts:', e);
    }
  }, []);

  useEffect(() => {
    loadAlertsData();
  }, [loadAlertsData]);

  // Unique cameras for filter dropdown
  const uniqueCameras = useMemo(() => {
    const set = new Set();
    alerts.forEach((a) => {
      const cam = a.cameraId || a.camera_id;
      if (cam) set.add(cam);
    });
    return Array.from(set).sort();
  }, [alerts]);

  // Lifecycle action handlers
  const handleAcknowledge = async (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
    );
    if (selectedAlertForDrawer?.id === id) {
      setSelectedAlertForDrawer((prev) => ({ ...prev, status: 'ACKNOWLEDGED' }));
    }
    try {
      await alertService.acknowledgeAlert(id);
    } catch (e) {
      console.warn('Error acknowledging alert:', e);
    }
  };

  const handleInvestigate = async (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'INVESTIGATING' } : a))
    );
    if (selectedAlertForDrawer?.id === id) {
      setSelectedAlertForDrawer((prev) => ({ ...prev, status: 'INVESTIGATING' }));
    }
    try {
      await alertService.investigateAlert(id);
    } catch (e) {
      console.warn('Error investigating alert:', e);
    }
  };

  const handleResolve = async (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a))
    );
    if (selectedAlertForDrawer?.id === id) {
      setSelectedAlertForDrawer((prev) => ({ ...prev, status: 'RESOLVED' }));
    }
    try {
      await alertService.resolveAlert(id);
    } catch (e) {
      console.warn('Error resolving alert:', e);
    }
  };

  const handleDismiss = async (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'DISMISSED' } : a))
    );
    if (selectedAlertForDrawer?.id === id) {
      setSelectedAlertForDrawer((prev) => ({ ...prev, status: 'DISMISSED' }));
    }
    try {
      await alertService.dismissAlert(id);
    } catch (e) {
      console.warn('Error dismissing alert:', e);
    }
  };

  const handleViewFeed = (alert) => {
    const camId = alert.cameraId || alert.camera_id || 'CAM-01';
    navigate('/live-monitoring', {
      state: {
        cameraId: camId,
        alertId: alert.id,
        highlightDetection: true,
        eventTitle: alert.type || alert.title || alert.message,
      },
    });
  };

  // Trigger Real Backend Demo Scenario
  const handleRunDemoScenario = async () => {
    setIsDemoRunning(true);
    try {
      const result = await alertService.triggerDemoScenario();
      if (result?.alert) {
        soundService.playAlertSound('CRITICAL');
        setDemoBanner({
          title: 'Judge Demo Scenario Triggered Successfully',
          message: `${result.alert.id} (${result.alert.type.replace(/_/g, ' ').toUpperCase()}) dispatched via WebSocket to Platform 3 North CCTV feed.`,
        });

        // Insert at head if not already present
        setAlerts((prev) => [result.alert, ...prev.filter((a) => a.id !== result.alert.id)]);
        setSelectedAlertForDrawer(result.alert);

        setTimeout(() => setDemoBanner(null), 6000);
      }
    } catch (e) {
      console.warn('Demo scenario error:', e);
    } finally {
      setIsDemoRunning(false);
    }
  };

  // Keyboard shortcuts handler when an alert is selected in drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (selectedAlertForDrawer) {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handleAcknowledge(selectedAlertForDrawer.id);
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          handleInvestigate(selectedAlertForDrawer.id);
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          handleResolve(selectedAlertForDrawer.id);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedAlertForDrawer(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAlertForDrawer]);

  // Filtering & Search
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const sev = (alert.severity || '').toUpperCase();
      const stat = (alert.status || '').toUpperCase();
      const cam = (alert.cameraId || alert.camera_id || '').toUpperCase();
      const loc = (alert.location || alert.stationName || '').toUpperCase();
      const type = (alert.type || alert.title || '').toUpperCase();
      const id = (alert.id || '').toUpperCase();
      const msg = (alert.message || alert.description || '').toUpperCase();

      // 1. Severity Filter (WARNING matches MEDIUM or WARNING)
      if (selectedSeverity !== 'ALL') {
        if (selectedSeverity === 'RESOLVED') {
          if (stat !== 'RESOLVED') return false;
        } else if (selectedSeverity === 'WARNING') {
          if (sev !== 'MEDIUM' && sev !== 'WARNING') return false;
        } else if (sev !== selectedSeverity) {
          return false;
        }
      }

      // 2. Status Filter
      if (selectedStatus !== 'ALL' && stat !== selectedStatus) {
        return false;
      }

      // 3. Camera Filter
      if (selectedCamera !== 'ALL' && cam !== selectedCamera.toUpperCase()) {
        return false;
      }

      // 4. Time range filter
      if (timeRange !== 'all') {
        const itemTime = new Date(alert.timestamp || alert.created_at || alert.createdAt).getTime();
        const now = Date.now();
        if (timeRange === '1h' && now - itemTime > 3600000) return false;
        if (timeRange === '24h' && now - itemTime > 86400000) return false;
      }

      // 5. Search Query (Case-Insensitive across multiple fields)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toUpperCase();
        const matches =
          id.includes(q) ||
          cam.includes(q) ||
          loc.includes(q) ||
          type.includes(q) ||
          msg.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [alerts, selectedSeverity, selectedStatus, selectedCamera, timeRange, searchQuery]);

  const activeCount = alerts.filter((a) => (a.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => (a.severity || '').toUpperCase() === 'CRITICAL' && (a.status || '').toUpperCase() !== 'RESOLVED').length;

  return (
    <div className="space-y-4">
      {/* Demo Banner */}
      {demoBanner && (
        <div className="p-3.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="font-semibold">{demoBanner.title}</div>
              <div className="text-[11px] text-emerald-300/80">{demoBanner.message}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDemoBanner(null)} className="h-6 text-[10px]">
            Dismiss
          </Button>
        </div>
      )}

      {/* Header & Deduplication Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rg-card bg-surface border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-text-primary">Operational Alert Center</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
              {activeCount} Active ({criticalCount} Critical)
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time security threats, crowd bottlenecks, and railway safety escalations
          </p>
        </div>

        {/* Action Toolbar: Deduplication Pill & Demo Scenario Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Deduplication Metric Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-canvas border border-border text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-text-muted">Deduplication:</span>
            <strong className="text-text-primary">
              {dedupStats.total_raw_detections || 47} Detections → {dedupStats.total_operational_alerts || alerts.length} Alerts
            </strong>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-semibold">
              {dedupStats.deduplication_ratio || '74%'} Suppressed
            </span>
          </div>

          {/* Judge Demo Scenario Button */}
          <Button
            variant="primary"
            size="sm"
            icon={Play}
            onClick={handleRunDemoScenario}
            disabled={isDemoRunning}
            className="text-xs shadow-sm"
          >
            {isDemoRunning ? 'Simulating Threat...' : 'Run Judge Demo Scenario'}
          </Button>
        </div>
      </div>

      {/* Filter & Search Control Panel */}
      <div className="p-3.5 rg-card bg-surface border-border space-y-3">
        {/* Row 1: Primary Severity Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Severity Quick Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-text-muted font-medium mr-1 hidden md:inline">Severity:</span>
            {SEVERITY_FILTERS.map((sev) => (
              <Button
                key={sev}
                variant={selectedSeverity === sev ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedSeverity(sev)}
                className="text-xs h-7 px-2.5"
              >
                {sev}
                {sev === 'CRITICAL' && (
                  <span className="ml-1.5 px-1 py-0.2 rounded text-[10px] bg-rose-500 text-white font-mono">
                    {alerts.filter((a) => (a.severity || '').toUpperCase() === 'CRITICAL').length}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-72">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by Camera, ID, Type, Location..."
              onClear={() => setSearchQuery('')}
            />
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns (Status, Camera, Time Range) */}
        <div className="flex items-center gap-2.5 flex-wrap pt-2.5 border-t border-border/60 text-xs">
          <div className="flex items-center gap-1.5 text-text-muted">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Refine:</span>
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-canvas border border-border rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="DISMISSED">DISMISSED</option>
          </select>

          {/* Camera Filter Dropdown */}
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="bg-canvas border border-border rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Cameras ({uniqueCameras.length})</option>
            {uniqueCameras.map((cam) => (
              <option key={cam} value={cam}>
                {cam}
              </option>
            ))}
          </select>

          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-canvas border border-border rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="all">All Time</option>
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
          </select>

          {/* Active Results Summary */}
          <div className="ml-auto text-[11px] text-text-muted font-mono">
            Showing <strong className="text-text-primary">{filteredAlerts.length}</strong> of {alerts.length} alerts
          </div>
        </div>
      </div>

      {/* Alerts Grid */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 text-center rg-card bg-surface border-border space-y-2">
          <ShieldAlert className="w-8 h-8 text-text-muted mx-auto" />
          <h3 className="text-sm font-semibold text-text-primary">No Alerts Match Selected Filters</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Try resetting the severity or search query to view the complete real-time operational safety stream.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedSeverity('ALL');
              setSelectedStatus('ALL');
              setSelectedCamera('ALL');
              setTimeRange('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs"
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onSelect={(alt) => setSelectedAlertForDrawer(alt)}
              onAcknowledge={handleAcknowledge}
              onInvestigate={handleInvestigate}
              onResolve={handleResolve}
              onCreateIncident={(alt) => setIncidentModalAlert(alt)}
              onViewFeed={handleViewFeed}
            />
          ))}
        </div>
      )}

      {/* Alert Details Slide-Over Drawer */}
      <AlertDetailsDrawer
        isOpen={!!selectedAlertForDrawer}
        onClose={() => setSelectedAlertForDrawer(null)}
        alert={selectedAlertForDrawer}
        onAcknowledge={handleAcknowledge}
        onInvestigate={handleInvestigate}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
        onCreateIncident={(alt) => setIncidentModalAlert(alt)}
        onViewFeed={handleViewFeed}
      />

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={!!incidentModalAlert}
        onClose={() => setIncidentModalAlert(null)}
        alert={incidentModalAlert}
      />
    </div>
  );
}

export default AlertsPage;
