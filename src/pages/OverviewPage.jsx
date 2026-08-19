import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Video,
  Users,
  HardHat,
  Play,
  RefreshCw,
  Sparkles,
  Command,
  CheckCircle2,
  Activity,
  Layers,
  ChevronDown,
  Radio,
} from 'lucide-react';
import { cn } from '../utils/cn';

// Step 10 Unified Command Components
import { PriorityActionsQueue } from '../components/dashboard/PriorityActionsQueue';
import { NeedsAttentionCard } from '../components/dashboard/NeedsAttentionCard';
import { AIRecommendationsCard } from '../components/dashboard/AIRecommendationsCard';
import { StationSafetyIndexCard } from '../components/dashboard/StationSafetyIndexCard';
import { SystemAndAIEngineHealthCard } from '../components/dashboard/SystemAndAIEngineHealthCard';
import { SituationMap } from '../components/dashboard/SituationMap';
import { CommandPaletteModal } from '../components/common/CommandPaletteModal';

// Services
import { dashboardService } from '../services/dashboardService';
import { alertService } from '../services/alertService';
import { webSocketService } from '../services/websocket';
import { soundService } from '../services/soundService';

export function OverviewPage() {
  const navigate = useNavigate();

  // ── States ──────────────────────────────────────────────
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState('BRC');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoToast, setDemoToast] = useState(null);

  // ── 1. Fetch Consolidated Summary ───────────────────────
  const loadDashboardData = useCallback(async () => {
    try {
      const data = await dashboardService.getUnifiedDashboardSummary(selectedStation);
      if (data) {
        setSummaryData(data);
      }
    } catch (err) {
      console.warn('Overview summary fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── 2. Real-Time WebSocket Synchronization ───────────────
  useEffect(() => {
    // 1. New Alert Received
    const unsubAlert = webSocketService.subscribe('new_alert', (newAlert) => {
      console.log('[Dashboard Real-Time] Received new_alert:', newAlert);
      loadDashboardData();
      if ((newAlert.severity || '').toUpperCase() === 'CRITICAL') {
        soundService.playAlertSound('CRITICAL');
      }
    });

    // 2. Alert Updated
    const unsubAlertUp = webSocketService.subscribe('alert_updated', () => {
      loadDashboardData();
    });

    // 3. New Detection
    const unsubDet = webSocketService.subscribe('new_detection', (det) => {
      console.log('[Dashboard Real-Time] Received new_detection:', det);
      loadDashboardData();
    });

    // 4. Crowd Update
    const unsubCrowd = webSocketService.subscribe('crowd_updated', () => {
      loadDashboardData();
    });

    // 5. Worksite Update
    const unsubWorksite = webSocketService.subscribe('worksite_updated', () => {
      loadDashboardData();
    });

    // 6. Camera Status Changed
    const unsubCamera = webSocketService.subscribe('camera_status_changed', () => {
      loadDashboardData();
    });

    return () => {
      unsubAlert();
      unsubAlertUp();
      unsubDet();
      unsubCrowd();
      unsubWorksite();
      unsubCamera();
    };
  }, [loadDashboardData]);

  // ── 3. Global Ctrl + K Command Palette Shortcut ─────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Handlers ───────────────────────────────────────────
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await alertService.acknowledgeAlert(alertId);
      loadDashboardData();
    } catch (err) {
      console.warn('Acknowledge alert error:', err);
    }
  };

  const handleDismissRecommendation = async (recId) => {
    try {
      await dashboardService.dismissRecommendation(recId);
      setSummaryData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recommendations: prev.recommendations.filter((r) => r.id !== recId),
        };
      });
    } catch (err) {
      console.warn('Dismiss recommendation error:', err);
    }
  };

  const handleRunIntegratedDemo = async () => {
    setDemoRunning(true);
    try {
      const res = await dashboardService.triggerIntegratedDemo();
      setDemoToast({
        title: 'Integrated Operational Demo Triggered',
        message: 'Crowd surge & track intrusion scenario dispatched across WebSocket channels.',
      });
      soundService.playAlertSound('CRITICAL');
      setTimeout(() => setDemoToast(null), 5000);
      loadDashboardData();
    } catch (err) {
      console.error('Demo error:', err);
    } finally {
      setDemoRunning(false);
    }
  };

  const summary = summaryData || {};
  const cameras = summary.cameras || { active: 20, total: 24 };
  const alerts = summary.alerts || { active: 3, critical: 1, high: 1 };
  const incidents = summary.incidents || { total: 4, open: 2 };
  const worksites = summary.worksites || { active_worksites: 6, worksite_alerts: 1 };
  const people = summary.crowd_people_count || 428;

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* ── 1. Unified Command Center Header ──────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface p-4.5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-extrabold text-text-primary tracking-tight uppercase flex items-center gap-2 font-heading">
              <Radio className="w-4 h-4 text-accent animate-pulse" />
              ANVESHA · COMMAND CONSOLE
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Active
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted mt-1 font-sans">
            <span className="font-semibold text-text-primary">
              {summary.station_name || 'Vadodara Railway Station'} ({summary.division || 'Ahmedabad Division'})
            </span>
            <span>·</span>
            <span className="font-mono text-[11px]">
              Last telemetry: {new Date(summary.last_updated || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Action Buttons: Ctrl+K & Demo Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Command Palette Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface-raised hover:bg-surface-hover text-text-secondary text-xs font-mono transition-all shadow-2xs tactile-button"
            title="Open Command Palette (Ctrl + K)"
          >
            <Command className="w-3.5 h-3.5 text-accent" />
            <span>Command Palette</span>
            <span className="text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border font-bold">Ctrl+K</span>
          </button>

          {/* Integrated Demo Trigger */}
          <button
            onClick={handleRunIntegratedDemo}
            disabled={demoRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-white hover:bg-accent-hover text-xs font-extrabold transition-all shadow-sm disabled:opacity-50 tactile-button"
            title="Run Integrated Multi-Module Demo Scenario"
          >
            <Play className={cn('w-3.5 h-3.5 fill-white', demoRunning && 'animate-spin')} />
            <span>{demoRunning ? 'Simulating Scenario...' : 'Run Live Demo'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadDashboardData}
            className="p-2 rounded-xl border border-border bg-surface-raised hover:bg-surface-hover text-text-secondary transition-all shadow-2xs tactile-button"
            title="Refresh Telemetry"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── 2. Key Operational Metrics Bar (6 Fast-Scan Cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Critical Alerts */}
        <div
          onClick={() => navigate('/alerts', { state: { severity: 'CRITICAL' } })}
          className="p-3 bg-surface rounded-xl border border-red-200 dark:border-red-900/60 shadow-xs cursor-pointer hover:shadow-md transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>Critical Alerts</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-black font-mono text-red-600 dark:text-red-400">
            {alerts.critical || 0}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Immediate response</div>
        </div>

        {/* Metric 2: High Alerts */}
        <div
          onClick={() => navigate('/alerts', { state: { severity: 'HIGH' } })}
          className="p-3 bg-surface rounded-xl border border-border shadow-xs cursor-pointer hover:shadow-md transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>High Alerts</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-black font-mono text-orange-600 dark:text-orange-400">
            {alerts.high || 0}
          </div>
          <div className="text-[10px] text-text-muted font-mono">{alerts.active} total active</div>
        </div>

        {/* Metric 3: Active Incidents */}
        <div
          onClick={() => navigate('/incidents')}
          className="p-3 bg-surface rounded-xl border border-border shadow-xs cursor-pointer hover:shadow-md transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>Active Incidents</span>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono text-text-primary">
            {incidents.open || 2}
          </div>
          <div className="text-[10px] text-text-muted font-mono">{incidents.total || 4} total cases</div>
        </div>

        {/* Metric 4: Cameras Online */}
        <div
          onClick={() => navigate('/live-monitoring')}
          className="p-3 bg-surface rounded-xl border border-border shadow-xs cursor-pointer hover:shadow-md transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>Cameras Online</span>
            <Video className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono text-text-primary">
            {cameras.active} <span className="text-xs text-text-muted font-normal">/ {cameras.total}</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
            {Math.round((cameras.active / Math.max(cameras.total, 1)) * 100)}% coverage
          </div>
        </div>

        {/* Metric 5: Crowd Density / People Count */}
        <div
          onClick={() => navigate('/crowd-intelligence')}
          className="p-3 bg-surface rounded-xl border border-border shadow-xs cursor-pointer hover:shadow-md transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>Crowd Estimate</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black font-mono text-text-primary">
            {people}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Platform 3 surge</div>
        </div>

        {/* Metric 6: Worksite Alerts */}
        <div
          onClick={() => navigate('/worker-safety')}
          className="p-3 bg-surface rounded-xl border border-border shadow-xs cursor-pointer hover:shadow-md transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>Worksites</span>
            <HardHat className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono text-text-primary">
            {worksites.active_worksites} <span className="text-xs text-text-muted font-normal">({worksites.worksite_alerts} Alert)</span>
          </div>
          <div className="text-[10px] text-text-muted font-mono">{worksites.overall_ppe_compliance}% compliance</div>
        </div>
      </div>

      {/* ── 3. Two-Column Unified Operations Grid ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Primary Operational Actions & Situation (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Priority Actions Queue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-accent" />
                <span>PRIORITY ACTIONS QUEUE</span>
              </h2>
              <span className="text-[11px] font-mono text-text-muted">
                Sorted by Severity & Risk
              </span>
            </div>

            <PriorityActionsQueue
              actions={summary.priority_actions || []}
              onAcknowledge={handleAcknowledgeAlert}
            />
          </div>

          {/* Needs Attention Hotspots */}
          <NeedsAttentionCard items={summary.needs_attention || []} />

          {/* Integrated Station Situation Map */}
          <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-accent" />
                <span>LIVE PLATFORM SITUATION MAP</span>
              </h2>
              <button
                onClick={() => navigate('/station-map')}
                className="text-[11px] font-semibold text-accent hover:underline"
              >
                Full Map View →
              </button>
            </div>
            <SituationMap selectedZoneId="PF-3" onSelectZone={(zId) => navigate('/crowd-intelligence', { state: { zoneId: zId } })} />
          </div>
        </div>

        {/* Right Column: Decision Intelligence, Safety Index & Health (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* AI Operational Insights (Explainable Decision Support) */}
          <AIRecommendationsCard
            recommendations={summary.recommendations || []}
            onDismiss={handleDismissRecommendation}
          />

          {/* Station Safety Index */}
          <StationSafetyIndexCard safetyIndex={summary.safety_index} />

          {/* System & AI Engine Health */}
          <SystemAndAIEngineHealthCard
            systemHealth={summary.system_health}
            aiTelemetry={summary.ai_telemetry}
          />
        </div>
      </div>

      {/* ── 4. Command Palette Modal (Ctrl + K) ────────────────── */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onRunDemo={handleRunIntegratedDemo}
      />

      {/* Demo Notification Toast */}
      {demoToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-700 shadow-2xl animate-fade-in max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs">
            <div className="font-bold">{demoToast.title}</div>
            <div className="text-slate-400 text-[11px] mt-0.5">{demoToast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OverviewPage;
