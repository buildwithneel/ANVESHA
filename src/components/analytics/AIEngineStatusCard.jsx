import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp, ShieldCheck, Activity, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function AIEngineStatusCard({
  status = {
    engine_mode: 'DEMO MODE',
    is_simulation: true,
    detection_pipeline_status: 'OPERATIONAL',
    active_cameras_processed: 24,
    total_detections_today: 142,
    inference_latency_ms: 24,
    average_confidence_pct: 94.2,
    uptime_pct: 99.8,
    model_info: {
      name: 'Simulation Engine (RailGuard Prototype)',
      purpose: 'Railway passenger safety, track intrusion detection, and PPE worker compliance',
      input_format: 'RTSP Video Stream / 1080p @ 25 FPS (H.264 / H.265)',
      output_format: 'JSON Detections (Class, Confidence 0-1, BoundingBox, TrackID)',
      inference_mode: 'Simulation / ML-Ready Contract',
      is_simulation: true,
      active_runtime: 'Local Engine Server (Vadodara)',
    },
  },
  onToggleMode,
}) {
  const [modelInfoExpanded, setModelInfoExpanded] = useState(false);

  const isDemo = status.engine_mode === 'DEMO MODE' || status.is_simulation;
  const model = status.model_info || {};

  return (
    <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3.5 select-none">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              AI ENGINE ARCHITECTURE
            </h2>
            <div className="text-[11px] text-text-muted">
              ML-Ready Computer Vision Detection Pipeline
            </div>
          </div>
        </div>

        {/* Engine Mode Pill & Toggle */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border',
              isDemo
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isDemo ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              )}
            />
            {status.engine_mode || 'DEMO MODE'}
          </span>

          {onToggleMode && (
            <button
              onClick={() => onToggleMode(isDemo ? 'LIVE MODEL' : 'DEMO MODE')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border bg-surface-raised hover:bg-surface-hover text-text-secondary transition-colors"
              title="Toggle Engine Mode"
            >
              Switch to {isDemo ? 'Live Model' : 'Demo Mode'}
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">Pipeline Status</div>
          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status.detection_pipeline_status}
          </div>
        </div>

        <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">Cameras Ingested</div>
          <div className="font-mono font-bold text-text-primary text-sm mt-0.5">
            {status.active_cameras_processed} Feeds
          </div>
        </div>

        <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">Inference Latency</div>
          <div className="font-mono font-bold text-text-primary text-sm mt-0.5">
            {status.inference_latency_ms} ms
          </div>
        </div>

        <div className="p-2.5 bg-surface-raised rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">Avg Model Confidence</div>
          <div className="font-mono font-bold text-accent text-sm mt-0.5">
            {status.average_confidence_pct}%
          </div>
        </div>
      </div>

      {/* Expandable Model Information Button */}
      <div className="border-t border-border pt-2">
        <button
          onClick={() => setModelInfoExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors rounded hover:bg-surface-hover"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-accent" />
            <span>MODEL CONTRACT & INTEGRATION METADATA</span>
          </span>
          {modelInfoExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {modelInfoExpanded && (
          <div className="mt-2 p-3 bg-surface-raised rounded-lg border border-border text-[11px] space-y-2 animate-fade-in font-mono">
            <div className="flex justify-between border-b border-border/60 pb-1">
              <span className="text-text-muted">Model Name:</span>
              <span className="text-text-primary font-bold">{model.name}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-1">
              <span className="text-text-muted">Purpose:</span>
              <span className="text-text-secondary text-right max-w-sm">{model.purpose}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-1">
              <span className="text-text-muted">Input Contract:</span>
              <span className="text-text-secondary">{model.input_format}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-1">
              <span className="text-text-muted">Output Contract:</span>
              <span className="text-text-secondary">{model.output_format}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Inference Mode:</span>
              <span className="text-accent font-semibold">{model.inference_mode}</span>
            </div>

            {isDemo && (
              <div className="p-2 mt-1 rounded bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300/40 text-[10px] text-amber-800 dark:text-amber-300 font-sans leading-relaxed">
                <strong>ML Readiness Notice:</strong> The system is executing in transparent DEMO MODE. The backend exposes standard <code>POST /api/ai/detections</code> and <code>/api/ai/analytics</code> contracts, allowing ML developers to replace the simulation engine with live PyTorch/ONNX inference without frontend modifications.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
