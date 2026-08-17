import React from 'react';
import { Activity, Cpu, Server, Database, Radio, CheckCircle, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SystemAndAIEngineHealthCard({
  systemHealth = {
    cctv_network_pct: 98.0,
    ai_processing_pct: 96.0,
    backend_api_pct: 100.0,
    database_pct: 100.0,
    websocket_pct: 99.0,
  },
  aiTelemetry = {
    status: 'ONLINE',
    cameras_processed: 24,
    total_detections_today: 142,
    inference_latency_ms: 24,
    average_model_confidence_pct: 94.2,
    uptime_pct: 99.8,
  },
}) {
  return (
    <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>SYSTEM & AI ENGINE HEALTH</span>
        </h2>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ALL SYSTEMS HEALTHY
        </span>
      </div>

      {/* Infrastructure Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">CCTV Network</div>
          <div className="font-mono font-bold text-text-primary text-sm mt-0.5">
            {systemHealth.cctv_network_pct}%
          </div>
        </div>

        <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">AI Processing</div>
          <div className="font-mono font-bold text-text-primary text-sm mt-0.5">
            {systemHealth.ai_processing_pct}%
          </div>
        </div>

        <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">Backend API</div>
          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
            {systemHealth.backend_api_pct}%
          </div>
        </div>

        <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">Database</div>
          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
            {systemHealth.database_pct}%
          </div>
        </div>

        <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">WebSocket Live</div>
          <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
            {systemHealth.websocket_pct}%
          </div>
        </div>

        <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">AI Model Latency</div>
          <div className="font-mono font-bold text-text-primary text-sm mt-0.5">
            {aiTelemetry.inference_latency_ms} ms
          </div>
        </div>
      </div>

      {/* AI Telemetry Details */}
      <div className="p-2.5 bg-surface-raised rounded-lg border border-border text-[11px] space-y-1.5">
        <div className="font-semibold text-text-primary flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-accent" />
            AI Computer Vision Telemetry
          </span>
          <span className="font-mono text-accent">● {aiTelemetry.status}</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Active CCTV Feeds Ingested:</span>
          <span className="font-mono font-bold text-text-primary">{aiTelemetry.cameras_processed} Cameras</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Average Inference Confidence:</span>
          <span className="font-mono font-bold text-text-primary">{aiTelemetry.average_model_confidence_pct}%</span>
        </div>
      </div>
    </div>
  );
}
