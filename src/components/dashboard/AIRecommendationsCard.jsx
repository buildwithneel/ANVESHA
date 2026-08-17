import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, X, Info, Shield, Users, Camera, HardHat } from 'lucide-react';
import { cn } from '../../utils/cn';

export function AIRecommendationsCard({
  recommendations = [],
  onDismiss,
}) {
  const navigate = useNavigate();

  const handleAction = (rec) => {
    if (rec.target_route) {
      navigate(rec.target_route, {
        state: {
          cameraId: rec.target_camera_id,
          zoneId: rec.target_zone === 'Platform 3' ? 'PF-3' : 'PF-2',
          highlightDetection: true,
        },
      });
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-2 text-center text-text-muted">
        <Sparkles className="w-6 h-6 text-accent mx-auto opacity-70" />
        <span className="text-xs font-semibold text-text-primary">No Active AI Recommendations</span>
        <p className="text-[11px] text-text-muted">All railway systems operating within normal parameters.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>AI OPERATIONAL INSIGHTS</span>
        </h2>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Decision Support
        </span>
      </div>

      {/* Recommendation Items */}
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-3 bg-surface-raised rounded-xl border border-border space-y-2 relative text-xs"
          >
            {/* Top Row: Headline & Dismiss Button */}
            <div className="flex items-start justify-between gap-2 pr-6">
              <div className="font-bold text-text-primary text-xs leading-snug">
                {rec.headline}
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(rec.id)}
                  className="absolute top-2.5 right-2.5 p-1 rounded hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
                  title="Dismiss recommendation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Observation Text */}
            <p className="text-[11px] text-text-secondary leading-relaxed">
              {rec.observation}
            </p>

            {/* Transparent Trigger Rule */}
            {rec.trigger_rule && (
              <div className="p-2 rounded bg-surface border border-border font-mono text-[10px] text-text-muted">
                <span className="font-semibold text-accent uppercase tracking-wider block mb-0.5">Transparent Decision Rule:</span>
                <code>{rec.trigger_rule}</code>
              </div>
            )}

            {/* Suggested Action & Buttons */}
            <div className="pt-1.5 border-t border-border space-y-2">
              <div className="text-[11px] text-text-primary font-medium">
                <strong>Suggested Action:</strong> {rec.suggested_action}
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => handleAction(rec)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs"
                >
                  <span>{rec.action_label || 'Inspect Zone'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                {rec.target_camera_id && (
                  <button
                    onClick={() => navigate('/live-monitoring', { state: { cameraId: rec.target_camera_id, highlightDetection: true } })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-surface border border-border hover:bg-surface-hover text-text-secondary transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                    <span>View Camera</span>
                  </button>
                )}

                {onDismiss && (
                  <button
                    onClick={() => onDismiss(rec.id)}
                    className="px-2 py-1 rounded text-xs font-medium text-text-muted hover:text-text-primary transition-colors ml-auto"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Advisory Disclaimer Notice */}
      <div className="p-2 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-lg text-[10px] text-text-muted flex items-start gap-1.5 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Advisory Notice:</strong> AI recommendations provide decision support for station duty officers. The system does not autonomously dispatch personnel or make operational changes.
        </span>
      </div>
    </div>
  );
}
