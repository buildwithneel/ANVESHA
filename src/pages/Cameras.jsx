import { useState, useEffect } from 'react';
import {
  Camera,
  Search,
  Grid3x3,
  List,
  X,
  Users,
  MapPin,
  Clock,
  Eye,
  WifiOff,
  RotateCw,
} from 'lucide-react';
import CCTVPlayer from '../components/common/CCTVPlayer';
import { getCameras } from '../services/api';

export default function Cameras() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedCamera, setSelectedCamera] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await getCameras();
      setCameras(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = cameras.filter((cam) => {
    const matchesSearch =
      !searchQuery ||
      cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority =
      filterPriority === 'all' ||
      (filterPriority === 'critical' && cam.priorityLevel === 'critical') ||
      (filterPriority === 'attention' && cam.priorityLevel === 'attention') ||
      (filterPriority === 'normal' && (cam.priorityLevel === 'normal' || cam.status === 'maintenance'));
    return matchesSearch && matchesPriority;
  });

  // Priority counts
  const counts = {
    all: cameras.length,
    critical: cameras.filter((c) => c.priorityLevel === 'critical').length,
    attention: cameras.filter((c) => c.priorityLevel === 'attention').length,
    normal: cameras.filter((c) => c.priorityLevel === 'normal' || c.status === 'maintenance').length,
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-52" />
          ))}
        </div>
      </div>
    );
  }

  const densityLabel = (d) =>
    d > 75 ? 'High' : d > 50 ? 'Moderate' : d > 25 ? 'Normal' : 'Low';

  const densityColor = (d) =>
    d > 75 ? 'text-status-critical' : d > 50 ? 'text-status-attention' : 'text-status-normal';

  const densityBarColor = (d) =>
    d > 75 ? 'bg-status-critical' : d > 50 ? 'bg-status-attention' : 'bg-status-normal';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header & Filters ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Camera size={20} className="text-accent" />
            Cameras
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {filtered.length} cameras · {cameras.filter((c) => c.status === 'live').length} online
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search cameras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 pr-3 text-sm w-52"
            />
          </div>

          {/* Priority Filter Tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {[
              { key: 'all', label: `All (${counts.all})` },
              { key: 'critical', label: `Critical (${counts.critical})` },
              { key: 'attention', label: `Attention (${counts.attention})` },
              { key: 'normal', label: `Normal (${counts.normal})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterPriority(tab.key)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  filterPriority === tab.key
                    ? 'bg-accent-soft text-accent'
                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-canvas'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-accent-soft text-accent' : 'bg-surface text-text-muted hover:text-text-primary'}`}
            >
              <Grid3x3 size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-accent-soft text-accent' : 'bg-surface text-text-muted hover:text-text-primary'}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Camera Grid / List ───────────────────────────────── */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((cam) => (
            <CCTVPlayer
              key={cam.id}
              camera={cam}
              onClick={() => setSelectedCamera(cam)}
            />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border text-[11px] text-text-muted font-medium">
            <span className="col-span-1">ID</span>
            <span className="col-span-3">Name</span>
            <span className="col-span-2">Location</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1">People</span>
            <span className="col-span-2">Density</span>
            <span className="col-span-1">Priority</span>
            <span className="col-span-1"></span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((cam) => (
              <div
                key={cam.id}
                className="grid grid-cols-12 gap-3 px-4 py-3 hover:bg-canvas cursor-pointer transition-colors items-center"
                onClick={() => setSelectedCamera(cam)}
              >
                <span className="col-span-1 text-xs font-mono text-accent">{cam.id}</span>
                <span className="col-span-3 text-xs text-text-primary font-medium truncate">{cam.name}</span>
                <span className="col-span-2 text-xs text-text-secondary flex items-center gap-1">
                  <MapPin size={10} /> {cam.location}
                </span>
                <span className="col-span-1">
                  <span className={`badge text-[10px] ${cam.status === 'live' ? 'badge-normal' : 'badge-offline'}`}>
                    {cam.status === 'live' ? 'Online' : 'Offline'}
                  </span>
                </span>
                <span className="col-span-1 text-xs font-mono text-text-primary flex items-center gap-1">
                  <Users size={10} className="text-text-muted" /> {cam.peopleCount}
                </span>
                <span className="col-span-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-canvas overflow-hidden">
                    <div
                      className={`h-full rounded-full ${densityBarColor(cam.crowdDensity)}`}
                      style={{ width: `${cam.crowdDensity}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-mono w-8 ${densityColor(cam.crowdDensity)}`}>
                    {cam.crowdDensity}%
                  </span>
                </span>
                <span className="col-span-1">
                  <span className={`badge text-[10px] ${
                    cam.priorityLevel === 'critical' ? 'badge-critical' :
                    cam.priorityLevel === 'attention' ? 'badge-attention' : 'badge-normal'
                  }`}>
                    {cam.priorityLevel === 'critical' ? 'Critical' :
                     cam.priorityLevel === 'attention' ? 'Attention' : 'Normal'}
                  </span>
                </span>
                <span className="col-span-1 flex justify-end">
                  <Eye size={14} className="text-text-muted hover:text-accent transition-colors" />
                </span>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <div className="text-center">
                <Camera size={24} className="mx-auto mb-2" />
                <p className="text-sm">No cameras match your filters</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Camera Detail Modal ──────────────────────────────── */}
      {selectedCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in" onClick={() => setSelectedCamera(null)}>
          <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-soft">
                  <Camera size={18} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">{selectedCamera.name}</h2>
                  <p className="text-[11px] text-text-muted">{selectedCamera.id} · {selectedCamera.location}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCamera(null)}
                className="p-2 rounded-lg hover:bg-canvas text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Camera Feed Large */}
              <div className="camera-feed h-64 rounded-lg relative overflow-hidden flex items-center justify-center">
                {selectedCamera.status === 'live' ? (
                  <>
                    <Camera size={48} className="text-border-strong" />
                    {/* Status overlay */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="status-dot status-dot-live" />
                      <span className="text-xs font-mono text-text-secondary bg-surface/80 px-2 py-0.5 rounded">
                        LIVE · {selectedCamera.resolution} · {selectedCamera.fps}fps
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <WifiOff size={32} className="text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-muted">Camera unavailable</p>
                    <button className="mt-2 btn btn-ghost text-xs">
                      <RotateCw size={12} /> Retry connection
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="card p-3 text-center">
                  <Users size={16} className="text-accent mx-auto mb-1" />
                  <p className="text-lg font-semibold text-text-primary">{selectedCamera.peopleCount}</p>
                  <p className="text-[11px] text-text-muted">People detected</p>
                </div>
                <div className="card p-3 text-center">
                  <span className={`text-lg font-semibold ${densityColor(selectedCamera.crowdDensity)}`}>
                    {selectedCamera.crowdDensity}%
                  </span>
                  <p className="text-[11px] text-text-muted">Crowd density</p>
                  <p className={`text-[10px] font-medium mt-0.5 ${densityColor(selectedCamera.crowdDensity)}`}>
                    {densityLabel(selectedCamera.crowdDensity)}
                  </p>
                </div>
                <div className="card p-3 text-center">
                  <span className={`text-lg font-semibold capitalize ${
                    selectedCamera.priorityLevel === 'critical' ? 'text-status-critical' :
                    selectedCamera.priorityLevel === 'attention' ? 'text-status-attention' :
                    'text-status-normal'
                  }`}>{selectedCamera.priorityLevel}</span>
                  <p className="text-[11px] text-text-muted">Priority</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-lg font-semibold text-text-primary">{selectedCamera.fps || '—'}</p>
                  <p className="text-[11px] text-text-muted">FPS</p>
                </div>
              </div>

              {/* Active Detection Modules */}
              <div>
                <h3 className="text-xs font-medium text-text-muted mb-2">Active detection modules</h3>
                <div className="flex gap-2 flex-wrap">
                  {selectedCamera.aiModules.map((mod) => (
                    <span key={mod} className="badge badge-info text-[10px] capitalize">
                      {mod === 'crowd' ? 'Crowd detection' :
                       mod === 'security' ? 'Security monitoring' :
                       mod === 'safety' ? 'Worker safety' :
                       mod === 'cleanliness' ? 'Cleanliness' : mod}
                    </span>
                  ))}
                </div>
              </div>

              {/* Last Detection */}
              {selectedCamera.lastDetection && (
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Clock size={12} />
                  <span>Last activity: {new Date(selectedCamera.lastDetection).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
