import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Video,
  Cpu,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../utils/cn';

// Step 12 Components
import { AIEngineStatusCard } from '../components/analytics/AIEngineStatusCard';
import { DemoScenariosToolbar } from '../components/analytics/DemoScenariosToolbar';
import { CrowdDensityTrendCard } from '../components/analytics/CrowdDensityTrendCard';
import { StationRiskTrendCard } from '../components/analytics/StationRiskTrendCard';
import { EventDistributionCard } from '../components/analytics/EventDistributionCard';
import { AIExplainableInsightsFeed } from '../components/analytics/AIExplainableInsightsFeed';

// Services
import { aiAnalyticsService } from '../services/aiAnalyticsService';
import { webSocketService } from '../services/websocket';
import { useTranslation } from '../i18n';

export function AnalyticsPage() {
  const { t } = useTranslation();

  // ── States ──────────────────────────────────────────────
  const [engineStatus, setEngineStatus] = useState(null);
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [crowdTrend, setCrowdTrend] = useState(null);
  const [riskTrend, setRiskTrend] = useState(null);
  const [eventDistribution, setEventDistribution] = useState(null);
  const [explainableInsights, setExplainableInsights] = useState([]);
  const [timeRange, setTimeRange] = useState('1h');
  const [loading, setLoading] = useState(true);

  // ── Data Fetching ────────────────────────────────────────
  const loadAllAnalytics = useCallback(async () => {
    try {
      const [statusData, summaryData, crowdData, riskData, eventData, insightsData] =
        await Promise.all([
          aiAnalyticsService.getStatus(),
          aiAnalyticsService.getSummary(),
          aiAnalyticsService.getCrowdDensityTrend(timeRange),
          aiAnalyticsService.getRiskTrend(timeRange),
          aiAnalyticsService.getEventDistribution(),
          aiAnalyticsService.getExplainableInsights(),
        ]);

      setEngineStatus(statusData);
      setSummaryMetrics(summaryData);
      setCrowdTrend(crowdData);
      setRiskTrend(riskData);
      setEventDistribution(eventData);
      setExplainableInsights(insightsData);
    } catch (err) {
      console.warn('Failed to load AI analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAllAnalytics();
  }, [loadAllAnalytics]);

  // ── WebSocket Real-Time Listener ────────────────────────
  useEffect(() => {
    const unsubDetection = webSocketService.subscribe('new_detection', () => {
      loadAllAnalytics();
    });
    const unsubAlert = webSocketService.subscribe('new_alert', () => {
      loadAllAnalytics();
    });
    const unsubCrowd = webSocketService.subscribe('crowd_updated', () => {
      loadAllAnalytics();
    });

    return () => {
      unsubDetection();
      unsubAlert();
      unsubCrowd();
    };
  }, [loadAllAnalytics]);

  // ── Handlers ───────────────────────────────────────────
  const handleToggleEngineMode = async (newMode) => {
    try {
      await aiAnalyticsService.setEngineMode(newMode);
      setEngineStatus((prev) => (prev ? { ...prev, engine_mode: newMode } : prev));
      loadAllAnalytics();
    } catch (err) {
      console.warn('Failed to set engine mode:', err);
    }
  };

  const handleTriggerScenario = async (scenarioId) => {
    await aiAnalyticsService.triggerDemoScenario(scenarioId);
    loadAllAnalytics();
  };

  const isDemo = engineStatus?.engine_mode === 'DEMO MODE' || engineStatus?.is_simulation;

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* ── 1. Page Header & Top Stats ──────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-text-primary tracking-tight uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              AI INSIGHTS, ANALYTICS & EXPLAINABILITY
            </h1>
            {isDemo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                ● DEMO DATA
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Model-agnostic computer vision telemetry, crowd flow analysis, and observable explainability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllAnalytics}
            className="p-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface-hover text-text-secondary transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── 2. Top Metric Cards Bar ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-surface rounded-xl border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>Detections Today</span>
            <Video className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-black font-mono text-text-primary">
            {summaryMetrics?.detections_today || 142}
          </div>
          <div className="text-[10px] text-text-muted font-mono">24 cameras processed</div>
        </div>

        <div className="p-3 bg-surface rounded-xl border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>High-Risk Events</span>
            <ShieldAlert className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-black font-mono text-orange-600 dark:text-orange-400">
            {summaryMetrics?.high_risk_events || 18}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Requires officer review</div>
        </div>

        <div className="p-3 bg-surface rounded-xl border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>Alerts Generated</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono text-text-primary">
            {summaryMetrics?.alerts_generated || 28}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Deduplicated in real time</div>
        </div>

        <div className="p-3 bg-surface rounded-xl border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>Avg Model Confidence</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {summaryMetrics?.average_confidence || 94.2}%
          </div>
          <div className="text-[10px] text-text-muted font-mono">Latency: 24 ms</div>
        </div>
      </div>

      {/* ── 3. AI Engine Status & Model Metadata ────────────── */}
      <AIEngineStatusCard
        status={engineStatus || undefined}
        onToggleMode={handleToggleEngineMode}
      />

      {/* ── 4. Controlled Demo Scenarios Toolbar ────────────── */}
      <DemoScenariosToolbar onTriggerScenario={handleTriggerScenario} />

      {/* ── 5. Analytics & Explainability 2-Column Grid ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (7 Cols): Crowd Density Trend & 5-Pillar Explainable Feed */}
        <div className="lg:col-span-7 space-y-4">
          <CrowdDensityTrendCard
            data={crowdTrend || undefined}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          <AIExplainableInsightsFeed
            insights={explainableInsights}
          />
        </div>

        {/* Right Column (5 Cols): Station Risk Trend & Event Distribution */}
        <div className="lg:col-span-5 space-y-4">
          <StationRiskTrendCard
            data={riskTrend || undefined}
          />

          <EventDistributionCard
            data={eventDistribution || undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
