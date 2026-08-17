import React, { useState, useMemo } from 'react';
import { SearchInput } from '../ui/SearchInput';
import { cn } from '../../utils/cn';
import { CAMERA_CATEGORIES, CAMERA_STATUS_FILTERS } from '../../data/mockLiveMonitoringData';
import { Video, AlertTriangle, Cpu, Wifi, WifiOff } from 'lucide-react';

export function CameraNavPanel({ cameras, selectedCameraId, onSelectCamera, className }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const onlineCount = cameras.filter((c) => c.status === 'online').length;

  const filtered = useMemo(() => {
    let list = [...cameras];

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.zone.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'online') list = list.filter((c) => c.status === 'online');
    else if (statusFilter === 'offline') list = list.filter((c) => c.status === 'offline');
    else if (statusFilter === 'alerts') list = list.filter((c) => c.hasAlerts);
    else if (statusFilter === 'aiActive') list = list.filter((c) => c.aiEnabled);

    // Category filter
    if (categoryFilter !== 'all') list = list.filter((c) => c.category === categoryFilter);

    return list;
  }, [cameras, search, statusFilter, categoryFilter]);

  return (
    <div className={cn('flex flex-col h-full bg-surface border-r border-border', className)}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-border space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">Cameras</h2>
          <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
            {onlineCount} Online
          </span>
        </div>

        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search cameras..."
          shortcutHint={null}
        />

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1">
          {CAMERA_STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors',
                statusFilter === f.key
                  ? 'bg-accent-soft text-accent border-accent-border'
                  : 'bg-canvas text-text-muted border-border hover:text-text-primary hover:border-border-strong'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {CAMERA_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategoryFilter(c.key)}
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
                categoryFilter === c.key
                  ? 'bg-text-primary text-text-inverse'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Camera List */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-text-muted">No cameras match filter</div>
        ) : (
          filtered.map((cam) => {
            const isSelected = cam.id === selectedCameraId;
            const isOnline = cam.status === 'online';

            return (
              <button
                key={cam.id}
                type="button"
                onClick={() => onSelectCamera(cam.id)}
                aria-label={`Select ${cam.id} — ${cam.name}`}
                aria-pressed={isSelected}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-l-2',
                  isSelected
                    ? 'bg-accent-soft border-l-accent'
                    : 'border-l-transparent hover:bg-surface-hover'
                )}
              >
                {/* Status Indicator */}
                <div className="relative flex-shrink-0">
                  <Video className={cn('w-4 h-4', isOnline ? 'text-text-muted' : 'text-text-muted/40')} />
                  <span
                    className={cn(
                      'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-surface',
                      isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    )}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-[11px] font-bold font-mono', isSelected ? 'text-accent' : 'text-text-primary')}>
                      {cam.id}
                    </span>
                    {cam.hasAlerts && (
                      <AlertTriangle className="w-3 h-3 text-rose-500 flex-shrink-0" />
                    )}
                    {cam.aiEnabled && (
                      <Cpu className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-text-muted truncate">{cam.name}</div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
