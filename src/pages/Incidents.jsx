import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  X,
  Camera,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  Eye,
  ChevronRight,
  Lightbulb,
  UserCheck,
  MonitorCheck,
  Send,
} from 'lucide-react';
import { getIncidents, updateIncidentStatus } from '../services/api';

const severityConfig = {
  critical: { label: 'Critical', badge: 'badge-critical', dot: 'status-dot-critical' },
  high: { label: 'Attention', badge: 'badge-high', dot: 'status-dot-attention' },
  warning: { label: 'Attention', badge: 'badge-attention', dot: 'status-dot-attention' },
  low: { label: 'Normal', badge: 'badge-normal', dot: '' },
};

const statusConfig = {
  active: { label: 'Active', badge: 'badge-critical' },
  investigating: { label: 'Investigating', badge: 'badge-attention' },
  acknowledged: { label: 'Acknowledged', badge: 'badge-info' },
  dispatched: { label: 'Dispatched', badge: 'badge-attention' },
  resolved: { label: 'Resolved', badge: 'badge-normal' },
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    setLoading(true);
    const data = await getIncidents();
    setIncidents(data);
    setLoading(false);
  }

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      !searchQuery ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || inc.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || inc.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Sort: unresolved first, then by severity
  const severityOrder = { critical: 0, high: 1, warning: 2, low: 3 };
  const sortedFiltered = [...filtered].sort((a, b) => {
    // Unresolved first
    if (a.status === 'resolved' && b.status !== 'resolved') return 1;
    if (a.status !== 'resolved' && b.status === 'resolved') return -1;
    // Then by severity
    return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
  });

  const handleStatusUpdate = async (incidentId, newStatus) => {
    await updateIncidentStatus(incidentId, newStatus);
    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status: newStatus } : i))
    );
    if (selectedIncident?.id === incidentId) {
      setSelectedIncident((prev) => ({ ...prev, status: newStatus }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-10 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = incidents.filter((i) => i.status !== 'resolved').length;
  const criticalCount = incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <AlertTriangle size={20} className="text-status-attention" />
            Incidents
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {filtered.length} incidents · {activeCount} active{criticalCount > 0 ? ` · ${criticalCount} critical` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 pr-3 text-sm w-52"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="warning">Attention</option>
            <option value="low">Normal</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="investigating">Investigating</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="dispatched">Dispatched</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* ── Incidents List ─────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border text-[11px] text-text-muted font-medium">
          <span className="col-span-1">ID</span>
          <span className="col-span-3">Incident</span>
          <span className="col-span-2">Location</span>
          <span className="col-span-1">Camera</span>
          <span className="col-span-1">Time</span>
          <span className="col-span-1">Priority</span>
          <span className="col-span-1">Confidence</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1"></span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {sortedFiltered.map((incident) => {
            const sev = severityConfig[incident.severity] || severityConfig.low;
            const stat = statusConfig[incident.status] || statusConfig.active;

            return (
              <div
                key={incident.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-canvas cursor-pointer transition-colors items-center"
                onClick={() => setSelectedIncident(incident)}
              >
                <span className="col-span-1 text-xs font-mono text-accent">{incident.id.replace('INC-', '')}</span>
                <span className="col-span-3 text-xs text-text-primary font-medium truncate">
                  {incident.type}
                </span>
                <span className="col-span-2 text-xs text-text-secondary flex items-center gap-1 truncate">
                  <MapPin size={10} /> {incident.location}
                </span>
                <span className="col-span-1 text-[11px] font-mono text-text-muted">{incident.cameraId}</span>
                <span className="col-span-1 text-[11px] font-mono text-text-muted">
                  {new Date(incident.timestamp).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="col-span-1">
                  <span className={`badge text-[10px] ${sev.badge}`}>{sev.label}</span>
                </span>
                <span className="col-span-1 text-xs text-text-primary">{incident.aiConfidence}%</span>
                <span className="col-span-1">
                  <span className={`badge text-[10px] ${stat.badge}`}>
                    {stat.label}
                  </span>
                </span>
                <span className="col-span-1 flex justify-end">
                  <ChevronRight size={14} className="text-text-muted" />
                </span>
              </div>
            );
          })}
        </div>

        {sortedFiltered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-text-muted">
            <div className="text-center">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-status-normal" />
              <p className="text-sm">No incidents match your filters</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Incident Detail Modal ────────────────────────────── */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in" onClick={() => setSelectedIncident(null)}>
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedIncident.severity === 'critical' ? 'bg-status-critical-bg' :
                  selectedIncident.severity === 'high' ? 'bg-status-attention-bg' :
                  'bg-accent-soft'
                }`}>
                  <AlertTriangle size={18} className={
                    selectedIncident.severity === 'critical' ? 'text-status-critical' :
                    selectedIncident.severity === 'high' ? 'text-status-attention' :
                    'text-accent'
                  } />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    {selectedIncident.type}
                    <span className={`badge text-[10px] ${severityConfig[selectedIncident.severity]?.badge || 'badge-normal'}`}>
                      {severityConfig[selectedIncident.severity]?.label || 'Normal'}
                    </span>
                  </h2>
                  <p className="text-[11px] text-text-muted">{selectedIncident.id} · {selectedIncident.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-2 rounded-lg hover:bg-canvas text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Description */}
              <div>
                <p className="text-sm text-text-primary leading-relaxed">{selectedIncident.description}</p>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={12} className="text-text-muted" />
                    <span className="text-[11px] text-text-muted">Location</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate">{selectedIncident.location}</p>
                </div>
                <div className="card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Camera size={12} className="text-text-muted" />
                    <span className="text-[11px] text-text-muted">Camera</span>
                  </div>
                  <p className="text-sm font-mono font-medium text-text-primary">{selectedIncident.cameraId}</p>
                </div>
                <div className="card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye size={12} className="text-text-muted" />
                    <span className="text-[11px] text-text-muted">Detection confidence</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary">{selectedIncident.aiConfidence}%</p>
                </div>
                <div className="card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-text-muted" />
                    <span className="text-[11px] text-text-muted">Detected at</span>
                  </div>
                  <p className="text-sm font-mono font-medium text-text-primary">
                    {new Date(selectedIncident.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                  </p>
                </div>
              </div>

              {/* Why this needs attention */}
              {selectedIncident.reasons && selectedIncident.reasons.length > 0 && (
                <div className="card p-4 bg-canvas border-l-[3px] border-l-status-attention">
                  <h3 className="text-xs font-semibold text-text-primary flex items-center gap-2 mb-2">
                    <Lightbulb size={14} className="text-status-attention" />
                    Why this needs attention
                  </h3>
                  <ul className="space-y-1.5">
                    {selectedIncident.reasons.map((reason, idx) => (
                      <li key={idx} className="text-xs text-text-secondary flex items-start gap-2">
                        <span className="text-text-muted mt-0.5">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended action */}
              {selectedIncident.recommendation && (
                <div className="card p-4 bg-accent-soft border-l-[3px] border-l-accent">
                  <h3 className="text-xs font-semibold text-text-primary flex items-center gap-2 mb-2">
                    <UserCheck size={14} className="text-accent" />
                    Recommended action
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {selectedIncident.recommendation}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-xs font-medium text-text-muted mb-3">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-status-critical flex-shrink-0" />
                    <span className="text-xs text-text-secondary w-28">Detected</span>
                    <span className="text-xs font-mono text-text-primary">{new Date(selectedIncident.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  {selectedIncident.acknowledgedAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                      <span className="text-xs text-text-secondary w-28">Acknowledged</span>
                      <span className="text-xs font-mono text-text-primary">{new Date(selectedIncident.acknowledgedAt).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {selectedIncident.resolvedAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-status-normal flex-shrink-0" />
                      <span className="text-xs text-text-secondary w-28">Resolved</span>
                      <span className="text-xs font-mono text-text-primary">{new Date(selectedIncident.resolvedAt).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment & Human-in-the-Loop Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-text-muted" />
                  <span className="text-xs text-text-muted">Assigned to:</span>
                  <span className="text-xs text-text-primary font-medium">{selectedIncident.assignedTo}</span>
                </div>
                {selectedIncident.status !== 'resolved' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(selectedIncident.id, 'acknowledged')}
                      className="btn btn-ghost text-xs"
                    >
                      <Eye size={12} /> Review
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedIncident.id, 'dispatched')}
                      className="btn btn-warning text-xs"
                    >
                      <Send size={12} /> Assign
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedIncident.id, 'resolved')}
                      className="btn btn-success text-xs"
                    >
                      <CheckCircle2 size={12} /> Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
