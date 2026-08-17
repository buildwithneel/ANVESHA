import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Server,
  Cpu,
  Radio,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Lock,
  UserCheck,
  RefreshCw,
  Play,
  RotateCcw,
  AlertTriangle,
  FileText,
  Clock,
  EyeOff,
  CheckCircle2,
  Sliders,
  Info,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { systemService } from '../services/systemService';
import { authService } from '../services/authService';
import { webSocketService } from '../services/websocket';
import { useTranslation } from '../i18n';

export function SystemHealthPage() {
  const { t } = useTranslation();

  // ── States ──────────────────────────────────────────────
  const [healthData, setHealthData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [selectedAuditFilter, setSelectedAuditFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [simulatingAction, setSimulatingAction] = useState(null);
  const [simulationToast, setSimulationToast] = useState(null);

  // ── Load Telemetry & Logs ────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [hData, logsData] = await Promise.all([
        systemService.getHealth(),
        systemService.getAuditLogs(selectedAuditFilter === 'ALL' ? null : selectedAuditFilter),
      ]);
      setHealthData(hData);
      setAuditLogs(logsData);
    } catch (err) {
      console.warn('Failed to load system health data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAuditFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── WebSocket Real-Time Listener ────────────────────────
  useEffect(() => {
    const unsubHealth = webSocketService.subscribe('system_status_changed', () => {
      loadData();
    });
    const unsubCamera = webSocketService.subscribe('camera_status_changed', () => {
      loadData();
    });

    return () => {
      unsubHealth();
      unsubCamera();
    };
  }, [loadData]);

  // ── Role Switcher Handler (For Demo) ────────────────────
  const handleRoleSwitch = (role) => {
    const updated = authService.switchRole(role);
    setCurrentUser(updated);
    loadData();
  };

  // ── Simulation Trigger Handler ──────────────────────────
  const handleTriggerSimulation = async (action, targetId = 'CAM-07') => {
    setSimulatingAction(action);
    try {
      const res = await systemService.simulateFailure(action, targetId);
      setSimulationToast({
        title: `Simulation Executed: ${action}`,
        message: res.message || 'State change broadcast to connected operator consoles.',
      });
      setTimeout(() => setSimulationToast(null), 5000);
      loadData();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulatingAction(null);
    }
  };

  const isAdmin = currentUser.role === 'ADMIN';
  const health = healthData || {};

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || 'OPERATIONAL').toUpperCase();
    if (s === 'OPERATIONAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          OPERATIONAL
        </span>
      );
    }
    if (s === 'DEGRADED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          DEGRADED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        OFFLINE
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* ── 1. Page Header & Live Status ─────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-text-primary tracking-tight uppercase flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              SECURITY, SYSTEM HEALTH & RESPONSIBLE AI
            </h1>
            {getStatusBadge(health.system_status)}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Infrastructure telemetry, role-based access control, security audit logging, and ethical AI transparency
          </p>
        </div>

        {/* RBAC Role Switcher (For Interactive Demo) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-raised px-3 py-1.5 rounded-lg border border-border text-xs">
            <UserCheck className="w-4 h-4 text-accent" />
            <span className="text-text-muted">Active Role:</span>
            <span className="font-bold text-text-primary font-mono">{currentUser.role}</span>
          </div>

          <button
            onClick={() => handleRoleSwitch(isAdmin ? 'OFFICER' : 'ADMIN')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs"
            title="Switch User Role"
          >
            Switch to {isAdmin ? 'Officer' : 'Admin'}
          </button>

          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface-hover text-text-secondary transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── 2. Five-Pillar Service Health Matrix ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Pillar 1: Backend API */}
        <div className="p-3 bg-surface rounded-xl border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-accent" />
              Backend Gateway
            </span>
            {getStatusBadge(health.backend?.status)}
          </div>
          <div className="text-xs font-bold text-text-primary">
            {health.backend?.latency_ms || 12} ms <span className="text-text-muted font-normal">latency</span>
          </div>
          <div className="text-[10px] text-text-muted truncate">
            {health.backend?.message || 'FastAPI Async Engine'}
          </div>
        </div>

        {/* Pillar 2: Database Engine */}
        <div className="p-3 bg-surface rounded-xl border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-500" />
              Database Engine
            </span>
            {getStatusBadge(health.database?.status)}
          </div>
          <div className="text-xs font-bold text-text-primary">
            {health.database?.latency_ms || 4} ms <span className="text-text-muted font-normal">query time</span>
          </div>
          <div className="text-[10px] text-text-muted truncate">
            {health.database?.message || 'SQL Parameterized Store'}
          </div>
        </div>

        {/* Pillar 3: WebSocket Live */}
        <div className="p-3 bg-surface rounded-xl border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-500" />
              WebSocket Hub
            </span>
            {getStatusBadge(health.websocket?.status)}
          </div>
          <div className="text-xs font-bold text-text-primary">
            {health.websocket?.uptime_pct || 99.8}% <span className="text-text-muted font-normal">uptime</span>
          </div>
          <div className="text-[10px] text-text-muted truncate">
            {health.websocket?.message || 'Real-time Event Stream'}
          </div>
        </div>

        {/* Pillar 4: AI Computer Vision */}
        <div className="p-3 bg-surface rounded-xl border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent" />
              AI Vision Pipeline
            </span>
            {getStatusBadge(health.ai_engine?.status)}
          </div>
          <div className="text-xs font-bold text-text-primary">
            {health.ai_engine?.latency_ms || 24} ms <span className="text-text-muted font-normal">inference</span>
          </div>
          <div className="text-[10px] text-text-muted truncate">
            {health.ai_engine?.message || 'Object Detection & Safety'}
          </div>
        </div>

        {/* Pillar 5: CCTV Video Network */}
        <div className="p-3 bg-surface rounded-xl border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-purple-500" />
              CCTV Surveillance
            </span>
            {getStatusBadge(health.cctv_network?.status)}
          </div>
          <div className="text-xs font-bold text-text-primary">
            {health.cctv_network?.uptime_pct || 95.8}% <span className="text-text-muted font-normal">online</span>
          </div>
          <div className="text-[10px] text-text-muted truncate">
            {health.cctv_network?.message || '24 Channels Operational'}
          </div>
        </div>
      </div>

      {/* ── 3. Responsible AI & Privacy Transparency Panel ───── */}
      <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              RESPONSIBLE AI & ETHICAL PRIVACY PILLARS
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COMPLIANT BY DESIGN
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
          <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
            <div className="text-[10px] text-text-muted">Human-in-the-Loop</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ✓ YES (Enforced)
            </div>
          </div>

          <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
            <div className="text-[10px] text-text-muted">Facial Recognition</div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              ✕ NO (Not Collected)
            </div>
          </div>

          <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
            <div className="text-[10px] text-text-muted">Auto Enforcement</div>
            <div className="text-xs font-bold text-text-primary mt-0.5">
              ✕ NO (Advisory Only)
            </div>
          </div>

          <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
            <div className="text-[10px] text-text-muted">Decision Support</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ✓ YES (Advisory)
            </div>
          </div>

          <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
            <div className="text-[10px] text-text-muted">Confidence Scores</div>
            <div className="text-xs font-bold text-accent mt-0.5">
              ✓ YES (Transparent)
            </div>
          </div>

          <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
            <div className="text-[10px] text-text-muted">Audit Logging</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ✓ YES (Full Trail)
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-surface-raised rounded-lg border border-border text-[11px] text-text-secondary leading-relaxed flex items-start gap-2">
          <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <span>
            <strong>Data Minimization Principle:</strong> RailGuard AI detects observable safety anomalies (track intrusions, overcrowding, PPE non-compliance) using geometrical bounding boxes and spatial zones. No passenger biometric identifiers or facial tracking records are ever ingested, processed, or persisted.
          </span>
        </div>
      </div>

      {/* ── 4. Admin Failure Simulation Console (Demonstration) ─ */}
      <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              SYSTEM RESILIENCE & FAILURE SIMULATION CONSOLE
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            DEMO / ADMIN SIMULATION
          </span>
        </div>

        <p className="text-xs text-text-muted">
          Trigger controlled subsystem fault injections to demonstrate automatic fault-tolerance, degraded UI state handling, and instant recovery.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Sim 1: Camera Offline */}
          <div className="p-3 bg-surface-raised rounded-xl border border-border space-y-2">
            <div className="text-xs font-bold text-text-primary">Camera Feed Fault</div>
            <div className="text-[11px] text-text-muted">Injects signal loss on CAM-07</div>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => handleTriggerSimulation('SIMULATE_CAMERA_OFFLINE', 'CAM-07')}
                disabled={simulatingAction !== null}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Set Offline
              </button>
              <button
                onClick={() => handleTriggerSimulation('RESTORE_CAMERA', 'CAM-07')}
                disabled={simulatingAction !== null}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-surface border border-border hover:bg-surface-hover text-text-secondary transition-colors"
              >
                Restore
              </button>
            </div>
          </div>

          {/* Sim 2: AI Engine Failure */}
          <div className="p-3 bg-surface-raised rounded-xl border border-border space-y-2">
            <div className="text-xs font-bold text-text-primary">AI Inference Degradation</div>
            <div className="text-[11px] text-text-muted">Simulates edge engine timeout</div>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => handleTriggerSimulation('SIMULATE_AI_DEGRADED')}
                disabled={simulatingAction !== null}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors"
              >
                Set Degraded
              </button>
              <button
                onClick={() => handleTriggerSimulation('RESTORE_AI')}
                disabled={simulatingAction !== null}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-surface border border-border hover:bg-surface-hover text-text-secondary transition-colors"
              >
                Restore
              </button>
            </div>
          </div>

          {/* Sim 3: WebSocket Disconnect */}
          <div className="p-3 bg-surface-raised rounded-xl border border-border space-y-2">
            <div className="text-xs font-bold text-text-primary">WebSocket Disconnect</div>
            <div className="text-[11px] text-text-muted">Tests client auto-reconnection</div>
            <div className="pt-1">
              <button
                onClick={() => handleTriggerSimulation('SIMULATE_WS_DISCONNECT')}
                disabled={simulatingAction !== null}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Trigger Reconnect Test
              </button>
            </div>
          </div>

          {/* Sim 4: Rapid Alert Injection */}
          <div className="p-3 bg-surface-raised rounded-xl border border-border space-y-2">
            <div className="text-xs font-bold text-text-primary">Critical Alert Stress</div>
            <div className="text-[11px] text-text-muted">Injects critical priority alert</div>
            <div className="pt-1">
              <button
                onClick={() => handleTriggerSimulation('SIMULATE_CRITICAL_ALERT', 'CAM-07')}
                disabled={simulatingAction !== null}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-700 hover:bg-rose-800 text-white transition-colors"
              >
                Dispatch Test Alert
              </button>
            </div>
          </div>
        </div>

        {simulationToast && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <div>
              <strong>{simulationToast.title}:</strong> {simulationToast.message}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Security & Operational Audit Log Explorer ─────── */}
      <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              SECURITY AUDIT TRAIL LOGS
            </h2>
          </div>

          {/* Filter Action Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'LOGIN', 'VIEW_CAMERA', 'ACKNOWLEDGE_ALERT', 'SIMULATE_FAILURE', 'UPDATE_SETTINGS'].map((act) => (
              <button
                key={act}
                onClick={() => setSelectedAuditFilter(act)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-mono transition-colors border',
                  selectedAuditFilter === act
                    ? 'bg-accent text-white font-bold border-accent'
                    : 'bg-surface-raised text-text-secondary border-border hover:bg-surface-hover'
                )}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised border-b border-border text-[10px] text-text-muted uppercase font-mono">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">User</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Resource</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-text-muted font-sans">
                    No audit records matching filter &quot;{selectedAuditFilter}&quot;.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-2 px-3 text-text-muted whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-text-primary">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 text-text-secondary font-sans">
                      {log.user_name}
                    </td>
                    <td className="py-2 px-3">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[9px] font-bold',
                        log.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      )}>
                        {log.role}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-text-secondary">
                      {log.resource} {log.resource_id ? `(${log.resource_id})` : ''}
                    </td>
                    <td className="py-2 px-3 text-text-muted truncate max-w-xs">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SystemHealthPage;
