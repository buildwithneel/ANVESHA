import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, Eye } from 'lucide-react';

/**
 * Soft top-right notification toast for critical incidents.
 * Auto-dismisses after 5 seconds without aggressive flashing.
 */
export default function NotificationToast({ notifications = [], onDismiss, onView, soundEnabled = false }) {
  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {notifications.map((n) => (
        <ToastItem
          key={n.id}
          notification={n}
          onDismiss={onDismiss}
          onView={onView}
          soundEnabled={soundEnabled}
        />
      ))}
    </div>
  );
}

function ToastItem({ notification, onDismiss, onView, soundEnabled }) {
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss?.(notification.id), 200);
  }, [notification.id, onDismiss]);

  useEffect(() => {
    // Play soft chime for critical notifications
    if (soundEnabled && notification.priorityLevel === 'critical') {
      playChime();
    }

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [dismiss, soundEnabled, notification.priorityLevel]);

  const severityStyles = {
    critical: 'border-l-status-critical bg-status-critical-bg',
    attention: 'border-l-status-attention bg-status-attention-bg',
    normal: 'border-l-accent bg-accent-soft',
  };

  const style = severityStyles[notification.priorityLevel] || severityStyles.normal;

  return (
    <div
      className={`${exiting ? 'toast-exit' : 'toast-enter'} card border-l-[3px] ${style} p-3 shadow-lg shadow-black/5`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="text-text-secondary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary">
            {notification.type}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            {notification.location} · {new Date(notification.timestamp).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onView && (
            <button
              onClick={() => onView(notification)}
              className="p-1 rounded hover:bg-surface transition-colors"
              title="View incident"
            >
              <Eye size={12} className="text-accent" />
            </button>
          )}
          <button
            onClick={dismiss}
            className="p-1 rounded hover:bg-surface transition-colors"
            title="Dismiss"
          >
            <X size={12} className="text-text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Play a short, soft chime using Web Audio API.
 * No external audio asset needed — 100% synthesized.
 */
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Silently fail if audio context is unavailable
  }
}
