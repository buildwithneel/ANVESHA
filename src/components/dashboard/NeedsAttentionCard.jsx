import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, ChevronRight, MapPin } from 'lucide-react';
import { cn } from '../../utils/cn';

export function NeedsAttentionCard({
  items = [],
}) {
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    if (item.camera_id) {
      navigate('/live-monitoring', {
        state: { cameraId: item.camera_id, highlightDetection: true },
      });
    } else if (item.location?.includes('Platform')) {
      navigate('/crowd-intelligence', {
        state: { zoneId: item.location === 'Platform 3' ? 'PF-3' : 'PF-2' },
      });
    } else {
      navigate('/alerts');
    }
  };

  return (
    <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>NEEDS ATTENTION</span>
        </h2>
        <span className="text-[11px] font-mono text-text-muted">{items.length} Hotspots</span>
      </div>

      <div className="divide-y divide-border">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="py-2.5 flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-surface-hover/60 px-1.5 -mx-1.5 rounded-lg transition-colors group"
          >
            <div className="min-w-0">
              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  item.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'
                )} />
                <span className="truncate">{item.location}</span>
              </div>
              <div className="text-[11px] text-text-secondary truncate mt-0.5">
                {item.event_type}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono text-[11px] text-text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.elapsed_time}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
