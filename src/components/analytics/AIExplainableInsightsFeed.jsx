import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Camera, Users, HardHat, ShieldAlert, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function AIExplainableInsightsFeed({
  insights = [],
}) {
  const navigate = useNavigate();

  const handleAction = (item) => {
    if (item.category === 'SECURITY' || item.camera_id) {
      navigate('/live-monitoring', {
        state: { cameraId: item.camera_id || 'CAM-07', highlightDetection: true },
      });
    } else if (item.category === 'CROWD') {
      navigate('/crowd-intelligence', { state: { zoneId: 'PF-3' } });
    } else if (item.category === 'WORKER_SAFETY') {
      navigate('/worker-safety');
    }
  };

  const getImpactBadge = (impact) => {
    const s = (impact || 'MEDIUM').toUpperCase();
    if (s === 'CRITICAL') return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800';
    if (s === 'HIGH') return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800';
    return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
  };

  return (
    <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3.5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            EXPLAINABLE AI DECISION SUPPORT (5-PILLAR AUDIT)
          </h2>
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          Observable Detection Factors
        </span>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-surface-raised rounded-xl border border-border space-y-2.5 text-xs"
          >
            {/* Top Bar: Impact & Confidence */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border font-mono', getImpactBadge(item.impact))}>
                  IMPACT: {item.impact}
                </span>
                <span className="text-text-primary font-bold text-xs">
                  {item.location} {item.camera_id ? `(${item.camera_id})` : ''}
                </span>
              </div>

              <div className="font-mono text-[11px] text-accent font-bold">
                Confidence: {Math.round(item.confidence * 100)}%
              </div>
            </div>

            {/* 5 Explainability Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              {/* WHAT */}
              <div className="p-2 rounded-lg bg-surface border border-border space-y-0.5">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                  1. WHAT HAPPENED:
                </span>
                <p className="text-text-primary font-sans text-xs">{item.what}</p>
              </div>

              {/* WHY */}
              <div className="p-2 rounded-lg bg-surface border border-border space-y-0.5">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                  2. WHY TRIGGERED:
                </span>
                <p className="text-text-secondary font-sans text-xs">{item.why}</p>
              </div>
            </div>

            {/* SUGGESTED ACTION */}
            <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-text-primary">
                <span className="font-bold text-accent mr-1">SUGGESTED ACTION:</span>
                <span className="text-text-secondary">{item.suggested_action}</span>
              </div>

              <button
                onClick={() => handleAction(item)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs flex-shrink-0"
              >
                <span>Inspect Zone</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Advisory Note */}
      <div className="p-2 bg-surface-raised border border-border rounded-lg text-[10px] text-text-muted flex items-start gap-1.5 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
        <span>
          <strong>Ethical AI Notice:</strong> Detection reasoning is purely derived from observable pixel activations, bounding box geometry, and configured zone rules. The system does not imply predictive criminal intent or autonomous decision authority.
        </span>
      </div>
    </div>
  );
}
