import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HardHat,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Users,
  Camera,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Play,
  RefreshCw,
  Sparkles,
  Lock,
  Layers,
  FileCheck,
  Info,
  ChevronRight,
  ShieldX,
  X,
  PlusCircle,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { cn } from '../utils/cn';
import { formatTime24, formatRelativeTime, formatEventLabel } from '../utils/formatters';

import { mockWorksites, mockWorksiteSummary } from '../data/mockWorksites';
import { workerSafetyService } from '../services/workerSafetyService';
import { alertService } from '../services/alertService';
import { incidentService } from '../services/incidentService';
import { webSocketService } from '../services/websocket';
import { soundService } from '../services/soundService';

const STATUS_BADGE_CONFIG = {
  ACTIVE: { label: 'ACTIVE', class: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  PAUSED: { label: 'PAUSED', class: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  COMPLETED: { label: 'COMPLETED', class: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30' },
  RESTRICTED: { label: 'RESTRICTED', class: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' },
};

const RISK_BADGE_CONFIG = {
  LOW: { label: 'LOW', class: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  MODERATE: { label: 'MODERATE', class: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  HIGH: { label: 'HIGH', class: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30' },
  CRITICAL: { label: 'CRITICAL', class: 'bg-rose-600 text-white border-rose-600 animate-pulse' },
};

export function WorkerSafetyPage() {
  const navigate = useNavigate();
  const { reducedMotion } = useReducedMotion();

  const [summary, setSummary] = useState(mockWorksiteSummary);
  const [worksites, setWorksites] = useState(mockWorksites);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedWorksite, setSelectedWorksite] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState([]);

  // Demo Scenario States
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoAlertNotification, setDemoAlertNotification] = useState(null);

  // 1. Initial REST API Load
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const sumData = await workerSafetyService.getSummary();
        if (isMounted && sumData) {
          setSummary(sumData);
          if (sumData.worksites?.length) {
            setWorksites(sumData.worksites);
          }
        }
      } catch (err) {
        console.warn('WorkerSafety load warning:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Real-Time WebSocket Subscriptions
  useEffect(() => {
    const unsubWsUpdate = webSocketService.subscribe('worksite_updated', (updated) => {
      console.log('[Real-Time WS]: Worksite updated:', updated);
      setWorksites((prev) =>
        prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w))
      );
      if (selectedWorksite?.id === updated.id) {
        setSelectedWorksite((prev) => ({ ...prev, ...updated }));
      }
    });

    const unsubWsEvent = webSocketService.subscribe('worksite_event_created', (ev) => {
      console.log('[Real-Time WS]: Worksite event created:', ev);
      if (selectedWorksite?.id === ev.worksite_id) {
        setTimelineEvents((prev) => [ev, ...prev]);
      }
    });

    const unsubAlert = webSocketService.subscribe('new_alert', (alt) => {
      if (
        alt.type === 'ppe_violation' ||
        alt.type === 'no_helmet' ||
        alt.type === 'no_vest' ||
        alt.type === 'restricted_work_zone' ||
        alt.type === 'worker_fall'
      ) {
        soundService.playAlertSound(alt.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH');
      }
    });

    return () => {
      unsubWsUpdate();
      unsubWsEvent();
      unsubAlert();
    };
  }, [selectedWorksite]);

  // 3. Open Detail Drawer & Fetch Timeline
  const handleOpenDetails = useCallback(async (worksite) => {
    setSelectedWorksite(worksite);
    setDrawerOpen(true);
    try {
      const events = await workerSafetyService.getWorksiteEvents(worksite.id);
      setTimelineEvents(events?.length ? events : worksite.recent_events || []);
    } catch (e) {
      setTimelineEvents(worksite.recent_events || []);
    }
  }, []);

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedWorksite(null), 200);
  };

  // 4. Filtered Worksites
  const filteredWorksites = useMemo(() => {
    if (statusFilter === 'ALL') return worksites;
    return worksites.filter((w) => w.status === statusFilter);
  }, [worksites, statusFilter]);

  // 5. Worksite Safety Demo Scenario Runner
  const handleRunDemoScenario = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    setDemoStep(1);
    setDemoAlertNotification(null);

    // Step 1: Select Platform 3 Maintenance and set initial 8 workers, 96%
    const ws1 = worksites.find((w) => w.id === 'WS-01') || worksites[0];
    handleOpenDetails(ws1);

    await new Promise((r) => setTimeout(r, 1200));
    setDemoStep(2);

    // Step 2: Trigger PPE Violation detected on CAM-18
    await new Promise((r) => setTimeout(r, 1500));
    setDemoStep(3);

    try {
      const demoResult = await workerSafetyService.triggerDemoScenario();
      soundService.playAlertSound('HIGH');

      // Update local state to reflect violation
      setDemoAlertNotification({
        title: 'PPE COMPLIANCE ALERT',
        workArea: 'Platform 3 Maintenance',
        camera: 'CAM-18',
        detection: 'Safety helmet missing',
        confidence: '91%',
        alertId: demoResult.alert?.id || 'ALT-WS-DEMO',
      });

      // Refresh events
      const events = await workerSafetyService.getWorksiteEvents('WS-01');
      setTimelineEvents(events);

      // Refresh summary
      const sum = await workerSafetyService.getSummary();
      setSummary(sum);
      setWorksites(sum.worksites);
      if (selectedWorksite?.id === 'WS-01') {
        const updatedTarget = sum.worksites.find((w) => w.id === 'WS-01');
        if (updatedTarget) setSelectedWorksite(updatedTarget);
      }
    } catch (e) {
      console.warn('Demo scenario error:', e);
    }

    setDemoStep(4);
    setIsDemoRunning(false);
  };

  const handleNavigateToCamera = (camId) => {
    navigate('/live-monitoring', {
      state: { cameraId: camId, autoPlay: true },
    });
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await alertService.acknowledgeAlert(alertId);
      if (demoAlertNotification) {
        setDemoAlertNotification((prev) => (prev ? { ...prev, acknowledged: true } : null));
      }
    } catch (e) {
      console.warn('Acknowledge failed:', e);
    }
  };

  const handleCreateIncident = async (alertInfo) => {
    try {
      await incidentService.createIncident({
        alert_id: alertInfo.alertId || 'ALT-WS-DEMO',
        camera_id: alertInfo.camera || 'CAM-18',
        type: 'ppe_compliance_breach',
        severity: 'HIGH',
        status: 'OPEN',
        description: `PPE safety violation on ${alertInfo.workArea}: ${alertInfo.detection}`,
        operator_notes: 'Safety marshal dispatched to verify hard hat equipment.',
      });
      navigate('/incidents');
    } catch (e) {
      console.warn('Create incident failed:', e);
    }
  };

  const fadeIn = reducedMotion
    ? {}
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">
      {/* ── 1. Page Header & Safety Privacy Statement ───────── */}
      <motion.div {...fadeIn} className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rg-card bg-surface border-border">
          <div>
            <div className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-accent" />
              <h1 className="text-base font-bold text-text-primary">
                Worksite Safety & Work Monitoring
              </h1>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Safety-focused work monitoring, PPE compliance verification, and restricted zone safety
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Privacy UI Note */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Safety-focused monitoring. No facial identification or individual profiling.</span>
            </div>

            {/* Demo Scenario Button */}
            <Button
              variant={isDemoRunning ? 'warning' : 'outline'}
              size="sm"
              onClick={handleRunDemoScenario}
              disabled={isDemoRunning}
              className="text-xs h-8 gap-1.5"
            >
              {isDemoRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating Step {demoStep}/4...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Demo: Worksite Safety Flow</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Active Demo Operational Alert Banner if triggered */}
        {demoAlertNotification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-lg bg-rose-500/10 border-2 border-rose-500 text-text-primary shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-rose-500 text-white animate-pulse">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-700 dark:text-rose-400 text-sm">
                    {demoAlertNotification.title}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-700 dark:text-rose-400 font-mono text-[10px] font-bold">
                    HIGH SEVERITY
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  <strong>Work Area:</strong> {demoAlertNotification.workArea} ·{' '}
                  <strong>Camera:</strong> <span className="font-mono">{demoAlertNotification.camera}</span> ·{' '}
                  <strong>Detection:</strong> {demoAlertNotification.detection} (Confidence: {demoAlertNotification.confidence})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => handleNavigateToCamera(demoAlertNotification.camera)}
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                View Camera
              </Button>
              <Button
                variant={demoAlertNotification.acknowledged ? 'outline' : 'warning'}
                size="sm"
                className="text-xs h-8"
                disabled={demoAlertNotification.acknowledged}
                onClick={() => handleAcknowledgeAlert(demoAlertNotification.alertId)}
              >
                {demoAlertNotification.acknowledged ? 'Acknowledged' : 'Acknowledge'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="text-xs h-8"
                onClick={() => handleCreateIncident(demoAlertNotification)}
              >
                Create Incident
              </Button>
              <button
                type="button"
                onClick={() => setDemoAlertNotification(null)}
                className="p-1 hover:bg-surface rounded text-text-muted hover:text-text-primary text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── 2. Top-Level Metrics Grid ────────────────────────── */}
      <motion.div
        {...fadeIn}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <MetricCard
          title="Active Worksites"
          value={`${summary.active_worksites} Sites`}
          subtitle="Platform & Track Sections"
          icon={HardHat}
          status="normal"
        />
        <MetricCard
          title="Workers Detected"
          value={`${summary.total_workers_detected} Total`}
          subtitle="Aggregate Zone Headcount"
          icon={Users}
          status="normal"
        />
        <MetricCard
          title="Safety Alerts"
          value={`${summary.safety_alerts_count} Active`}
          subtitle="1 Gear Alert · 1 Boundary"
          icon={ShieldAlert}
          status="attention"
        />
        <MetricCard
          title="Critical Issues"
          value={`${summary.critical_issues_count} Critical`}
          subtitle="Track Maintenance Interlock"
          icon={AlertTriangle}
          status="critical"
        />
        <MetricCard
          title="Overall PPE Compliance"
          value={`${summary.overall_ppe_compliance}%`}
          subtitle="Station Safety Standard"
          icon={ShieldCheck}
          status="normal"
        />
      </motion.div>

      {/* ── 3. PPE Breakdown Bar ─────────────────────────────── */}
      <motion.div {...fadeIn}>
        <Card className="p-4 bg-surface border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-text-primary">
                Station-Wide PPE Safety Verification Matrix
              </h3>
            </div>
            <span className="text-[11px] font-mono text-text-muted">
              Optical Computer Vision Inference
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
            {/* Helmet Compliance */}
            <div className="p-3 rounded-lg bg-canvas border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-muted uppercase text-[10px] tracking-wider">
                  Safety Helmet Compliance
                </span>
                <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {summary.helmet_compliance}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-emerald-500/15 w-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${summary.helmet_compliance}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted">
                Mandatory EN 397 certified hard hats verified across all track and platform worksites.
              </p>
            </div>

            {/* High-Vis Vest Compliance */}
            <div className="p-3 rounded-lg bg-canvas border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-muted uppercase text-[10px] tracking-wider">
                  High-Visibility Vest Compliance
                </span>
                <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">
                  {summary.vest_compliance}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-amber-500/15 w-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${summary.vest_compliance}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted">
                Fluorescent retro-reflective safety vests for track-bed visibility.
              </p>
            </div>

            {/* Overall PPE Score */}
            <div className="p-3 rounded-lg bg-canvas border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-muted uppercase text-[10px] tracking-wider">
                  Composite PPE Compliance
                </span>
                <span className="text-sm font-bold font-mono text-text-primary">
                  {summary.overall_ppe_compliance}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-blue-500/15 w-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-700"
                  style={{ width: `${summary.overall_ppe_compliance}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted">
                Meets Indian Railways Safety Directive 2026-SR.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── 4. Worksite Filter Tabs & Search ──────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg p-1">
          {['ALL', 'ACTIVE', 'RESTRICTED', 'PAUSED', 'COMPLETED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-semibold transition-colors',
                statusFilter === st
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              {st}
              <span className="ml-1 text-[10px] opacity-80 font-mono">
                ({st === 'ALL' ? worksites.length : worksites.filter((w) => w.status === st).length})
              </span>
            </button>
          ))}
        </div>

        <span className="text-xs text-text-muted font-mono">
          Showing {filteredWorksites.length} of {worksites.length} Worksites
        </span>
      </div>

      {/* ── 5. Worksite Cards Grid ───────────────────────────── */}
      <motion.div
        {...fadeIn}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredWorksites.map((ws) => {
          const statusCfg = STATUS_BADGE_CONFIG[ws.status] || STATUS_BADGE_CONFIG.ACTIVE;
          const riskCfg = RISK_BADGE_CONFIG[ws.risk_level] || RISK_BADGE_CONFIG.LOW;

          return (
            <Card
              key={ws.id}
              className={cn(
                'p-4 space-y-3.5 border transition-all duration-150 hover:shadow-md flex flex-col justify-between',
                ws.status === 'RESTRICTED' ? 'border-l-4 border-l-rose-500' : ''
              )}
            >
              <div className="space-y-2.5">
                {/* Header: Name + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-text-muted block">
                      {ws.id} · {ws.type}
                    </span>
                    <h3 className="text-sm font-bold text-text-primary leading-snug">
                      {ws.name}
                    </h3>
                  </div>

                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold font-mono border uppercase flex-shrink-0', statusCfg.class)}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Metrics Row: Worker Count, PPE %, Risk Level */}
                <div className="grid grid-cols-3 gap-2 text-center p-2 rounded bg-canvas border border-border/80">
                  <div>
                    <div className="text-[10px] text-text-muted font-semibold uppercase">Workers</div>
                    <div className="text-sm font-bold font-mono text-text-primary mt-0.5">
                      {ws.worker_count} pax
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-text-muted font-semibold uppercase">PPE Rate</div>
                    <div className={cn(
                      'text-sm font-bold font-mono mt-0.5',
                      ws.ppe_compliance >= 95
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : ws.ppe_compliance >= 90
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-rose-700 dark:text-rose-400'
                    )}>
                      {ws.ppe_compliance}%
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-text-muted font-semibold uppercase">Risk</div>
                    <div className={cn('text-[11px] font-bold font-mono mt-1 px-1 rounded inline-block border', riskCfg.class)}>
                      {riskCfg.label}
                    </div>
                  </div>
                </div>

                {/* Zone & Camera coverage */}
                <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-text-muted" />
                    Zone: <strong className="text-text-primary font-medium">{ws.zone}</strong>
                  </span>

                  <span className="flex items-center gap-1 font-mono">
                    <Camera className="w-3.5 h-3.5 text-text-muted" />
                    {ws.camera_count || ws.cameras?.length || 1} Cams
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-center text-xs h-7"
                  onClick={() => handleNavigateToCamera(ws.cameras?.[0] || 'CAM-01')}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View Camera
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 justify-center text-xs h-7"
                  onClick={() => handleOpenDetails(ws)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          );
        })}
      </motion.div>

      {/* ── 6. Worksite Details Drawer ───────────────────────── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        title={selectedWorksite?.name || 'Worksite Safety Details'}
        subtitle={`${selectedWorksite?.id} · ${selectedWorksite?.zone} · ${selectedWorksite?.type}`}
      >
        {selectedWorksite && (
          <div className="space-y-5 text-xs">
            {/* Status & Risk Header */}
            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block font-mono">
                  Operational Status
                </span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-bold font-mono border inline-block mt-1', STATUS_BADGE_CONFIG[selectedWorksite.status]?.class)}>
                  {selectedWorksite.status}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-text-muted uppercase tracking-wider block font-mono">
                  Risk Level
                </span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-bold font-mono border inline-block mt-1', RISK_BADGE_CONFIG[selectedWorksite.risk_level]?.class)}>
                  {selectedWorksite.risk_level} ({selectedWorksite.risk_score}/100)
                </span>
              </div>
            </div>

            {/* PPE Breakdown Grid */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                PPE Compliance Breakdown
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded bg-canvas border border-border">
                <div>
                  <span className="text-[10px] text-text-muted uppercase block">Helmet</span>
                  <span className="text-base font-bold font-mono text-text-primary">
                    {selectedWorksite.helmet_compliance ?? 96}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase block">Safety Vest</span>
                  <span className="text-base font-bold font-mono text-text-primary">
                    {selectedWorksite.vest_compliance ?? 93}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase block">Overall</span>
                  <span className="text-base font-bold font-mono text-accent">
                    {selectedWorksite.ppe_compliance}%
                  </span>
                </div>
              </div>
            </div>

            {/* ── 10. Risk Factors Checklist ────────────────────── */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
                <span>Risk Factors Analysis</span>
                <span className="text-[10px] text-text-muted font-mono">Real-time Assessment</span>
              </h4>

              <div className="space-y-1.5">
                {(selectedWorksite.risk_factors || []).map((rf) => (
                  <div
                    key={rf.id || rf.name}
                    className="p-2.5 rounded bg-canvas border border-border/80 flex items-start gap-2.5"
                  >
                    {rf.status === 'pass' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    )}
                    {rf.status === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    {rf.status === 'critical' && (
                      <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0 animate-pulse" />
                    )}

                    <div className="space-y-0.5">
                      <div className="font-bold text-text-primary text-[11px] flex items-center gap-1.5">
                        <span>{rf.name}</span>
                        <span className={cn(
                          'text-[9px] font-mono px-1 py-0.2 rounded uppercase',
                          rf.status === 'pass'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : rf.status === 'warning'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                        )}>
                          {rf.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">{rf.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned CCTV Optical Feeds */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Assigned Cameras ({selectedWorksite.cameras?.length || 1})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {(selectedWorksite.cameras || ['CAM-07']).map((camId) => (
                  <button
                    key={camId}
                    type="button"
                    onClick={() => handleNavigateToCamera(camId)}
                    className="p-2 rounded bg-surface hover:bg-surface-hover border border-border flex items-center justify-between text-left group transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-accent" />
                      <span className="font-mono font-bold text-text-primary text-xs">{camId}</span>
                    </div>
                    <Eye className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary" />
                  </button>
                ))}
              </div>
            </div>

            {/* ── 11. Worksite Events Timeline ─────────────────── */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  Worksite Event Timeline
                </h4>
                <span className="text-[10px] font-mono text-text-muted">Live Stream</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {timelineEvents.length === 0 ? (
                  <div className="text-center py-6 text-text-muted text-xs">
                    No recent events logged for this worksite.
                  </div>
                ) : (
                  timelineEvents.map((ev, idx) => (
                    <div
                      key={ev.id || idx}
                      className="p-2.5 rounded bg-canvas border border-border/70 flex items-start gap-2.5 text-xs"
                    >
                      <div className="p-1 rounded bg-surface border border-border mt-0.5">
                        <Clock className="w-3 h-3 text-text-muted" />
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-text-muted">
                            {formatTime24(ev.timestamp)}
                          </span>
                          <span className={cn(
                            'text-[9px] font-mono font-bold px-1.5 rounded uppercase',
                            ev.severity === 'CRITICAL' || ev.severity === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                              : 'bg-surface text-text-muted'
                          )}>
                            {formatEventLabel(ev.event_type)}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-primary leading-snug">
                          {ev.description}
                        </p>
                        {ev.camera_id && (
                          <span className="text-[10px] font-mono text-text-muted block">
                            Camera: {ev.camera_id} · Conf: {Math.round((ev.confidence || 0.9) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Drawer Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => handleNavigateToCamera(selectedWorksite.cameras?.[0] || 'CAM-07')}
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Live Camera
              </Button>
              <Button
                variant="primary"
                className="flex-1 justify-center"
                onClick={handleCloseDrawer}
              >
                Close Details
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default WorkerSafetyPage;
