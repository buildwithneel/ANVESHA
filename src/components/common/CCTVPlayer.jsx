import { Camera, Users, MapPin, AlertTriangle, WifiOff, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { CCTVVideoFeed } from '../live/CCTVVideoFeed';

const priorityColors = {
  normal: { dot: 'bg-status-normal', badge: 'badge-normal' },
  attention: { dot: 'bg-status-attention', badge: 'badge-attention' },
  critical: { dot: 'bg-status-critical', badge: 'badge-critical' },
};

export default function CCTVPlayer({ camera, compact = false, sourceType = 'video', onClick }) {
  const isLive = camera.status === 'live';
  const [hasError, setHasError] = useState(false);
  const priority = priorityColors[camera.priorityLevel] || priorityColors.normal;

  const densityLabel =
    camera.crowdDensity > 75 ? 'High' :
    camera.crowdDensity > 50 ? 'Moderate' :
    camera.crowdDensity > 25 ? 'Normal' : 'Low';

  const densityColor =
    camera.crowdDensity > 75 ? 'text-status-critical' :
    camera.crowdDensity > 50 ? 'text-status-attention' :
    'text-status-normal';

  const densityBarColor =
    camera.crowdDensity > 75 ? 'bg-status-critical' :
    camera.crowdDensity > 50 ? 'bg-status-attention' :
    'bg-status-normal';

  // Camera unavailable state
  if (!isLive || hasError) {
    return (
      <div
        onClick={onClick}
        className="card overflow-hidden cursor-pointer opacity-70 transition-all duration-200 hover:opacity-90"
      >
        <div className={`camera-feed relative ${compact ? 'h-28' : 'h-36'} flex items-center justify-center`}>
          <div className="text-center">
            <WifiOff size={24} className="text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted font-medium">Camera unavailable</p>
            {camera.lastDetection && (
              <p className="text-[10px] text-text-muted mt-1">
                Last update: {new Date(camera.lastDetection).toLocaleTimeString('en-IN', { hour12: false })}
              </p>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setHasError(false); }}
              className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent hover:underline"
            >
              <RotateCw size={10} /> Retry
            </button>
          </div>

          {/* Camera ID overlay */}
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-mono text-text-muted bg-surface/80 px-1.5 py-0.5 rounded">
              {camera.id}
            </span>
          </div>
        </div>

        {!compact && (
          <div className="px-3 py-2.5 border-t border-border">
            <p className="text-xs font-medium text-text-primary truncate">{camera.name}</p>
            <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
              <MapPin size={10} /> {camera.location}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="card card-hover overflow-hidden cursor-pointer transition-all duration-200 group"
    >
      {/* Camera Feed Area */}
      <div className={`camera-feed relative ${compact ? 'h-28' : 'h-36'}`}>
        <CCTVVideoFeed
          camera={camera}
          sourceType={sourceType}
          compact={compact}
          className="w-full h-full"
        />

        {/* Bottom Bar — People count & density */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2.5 py-2 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-20">
          <div className="flex items-center gap-1.5">
            <Users size={11} className="text-white/80" />
            <span className="text-[11px] font-mono text-white/90 font-medium">{camera.peopleCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-10 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full ${densityBarColor}`}
                style={{ width: `${camera.crowdDensity}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-white/70">{camera.crowdDensity}%</span>
          </div>
        </div>
      </div>

      {/* Camera Info */}
      {!compact && (
        <div className="px-3 py-2.5 border-t border-border">
          <p className="text-xs font-medium text-text-primary truncate">{camera.name}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-text-muted flex items-center gap-1">
              <MapPin size={10} /> {camera.location}
            </p>
            <span className={`text-[10px] font-medium ${densityColor}`}>
              {densityLabel} density
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
