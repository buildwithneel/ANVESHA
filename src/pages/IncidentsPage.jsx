import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { IncidentDetailsDrawer } from '../components/incidents/IncidentDetailsDrawer';
import { CreateIncidentModal } from '../components/live/CreateIncidentModal';
import { incidentService } from '../services/incidentService';
import { webSocketService } from '../services/websocket';
import { mockIncidents } from '../data/mockIncidents';
import { formatDateTime, formatRelativeTime } from '../utils/formatters';
import {
  FilePlus,
  Filter,
  Shield,
  Clock,
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  User,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';

const INCIDENT_STATUS_TABS = ['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];

export function IncidentsPage() {
  const [incidents, setIncidents] = useState(mockIncidents);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live incidents from backend
  const loadIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await incidentService.getIncidents();
      if (Array.isArray(data) && data.length > 0) {
        setIncidents(data);
      }
    } catch (err) {
      console.warn('Falling back to default incidents:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // Subscribe to real-time incident updates via WebSocket
  useEffect(() => {
    const unsubCreated = webSocketService.subscribe('incident_created', (newInc) => {
      console.log('[IncidentsPage]: Received real-time incident_created event:', newInc);
      setIncidents((prev) => [newInc, ...prev.filter((i) => i.id !== newInc.id)]);
    });

    const unsubUpdated = webSocketService.subscribe('incident_updated', (updatedInc) => {
      console.log('[IncidentsPage]: Received real-time incident_updated event:', updatedInc);
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === updatedInc.id
            ? { ...i, ...updatedInc, status: updatedInc.status?.toUpperCase() || i.status }
            : i
        )
      );
    });

    return () => {
      unsubCreated();
      unsubUpdated();
    };
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );
  };

  // Filter & Search
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const stat = (inc.status || '').toUpperCase();
      const sev = (inc.severity || '').toUpperCase();
      const id = (inc.id || '').toUpperCase();
      const alertId = (inc.alert_id || inc.alertId || '').toUpperCase();
      const type = (inc.type || inc.title || '').toUpperCase();
      const loc = (inc.location || '').toUpperCase();
      const cam = (inc.camera_id || inc.cameraId || '').toUpperCase();
      const officer = (inc.assignedOfficer || inc.operator_notes || '').toUpperCase();

      // 1. Status Filter
      if (activeTab !== 'ALL') {
        if (activeTab === 'INVESTIGATING' && (stat === 'IN_PROGRESS' || stat === 'INVESTIGATING')) {
          // match
        } else if (stat !== activeTab) {
          return false;
        }
      }

      // 2. Severity Filter
      if (selectedSeverity !== 'ALL' && sev !== selectedSeverity) {
        return false;
      }

      // 3. Search Query (Case-Insensitive across multiple fields)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toUpperCase();
        const matches =
          id.includes(q) ||
          alertId.includes(q) ||
          type.includes(q) ||
          loc.includes(q) ||
          cam.includes(q) ||
          officer.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [incidents, activeTab, selectedSeverity, searchQuery]);

  const openCount = incidents.filter((i) => (i.status || '').toUpperCase() === 'OPEN').length;
  const investigatingCount = incidents.filter((i) =>
    ['INVESTIGATING', 'IN_PROGRESS'].includes((i.status || '').toUpperCase())
  ).length;

  const incidentColumns = [
    {
      header: 'Incident ID',
      accessorKey: 'id',
      cell: (row) => (
        <span className="font-mono font-bold text-accent text-xs hover:underline cursor-pointer">
          {row.id}
        </span>
      ),
    },
    {
      header: 'Incident Classification',
      accessorKey: 'type',
      cell: (row) => (
        <div>
          <div className="font-semibold text-text-primary text-xs">
            {row.type ? row.type.replace(/_/g, ' ').toUpperCase() : row.title || 'GENERAL'}
          </div>
          <div className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
            {row.description}
          </div>
        </div>
      ),
    },
    {
      header: 'Severity',
      cell: (row) => <StatusBadge severity={(row.severity || 'MEDIUM').toUpperCase()} size="sm" />,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => {
        const stat = (row.status || 'OPEN').toUpperCase();
        return (
          <span
            className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider',
              stat === 'OPEN'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                : stat === 'INVESTIGATING' || stat === 'IN_PROGRESS'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                : stat === 'RESOLVED'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30'
            )}
          >
            {stat}
          </span>
        );
      },
    },
    {
      header: 'Location / Cam',
      cell: (row) => (
        <div className="text-xs text-text-muted space-y-0.5">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-accent flex-shrink-0" />
            <span className="truncate">{row.location || 'Vadodara Station'}</span>
          </div>
          <div className="font-mono text-[10px] text-text-muted">
            {row.camera_id || row.cameraId || 'CAM-01'}
          </div>
        </div>
      ),
    },
    {
      header: 'Logged Time',
      cell: (row) => (
        <div className="text-xs text-text-muted font-mono">
          <div>{formatRelativeTime(row.created_at || row.createdAt)}</div>
          <div className="text-[10px] text-text-muted/80">{formatDateTime(row.created_at || row.createdAt)}</div>
        </div>
      ),
    },
    {
      header: 'Action',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedIncident(row)}
          className="text-xs h-7 px-2.5 flex items-center gap-1"
        >
          <span>Inspect</span>
          <ChevronRight className="w-3 h-3" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rg-card bg-surface border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-text-primary">Incident Command & Response Log</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              {openCount} Open · {investigatingCount} Investigating
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Formal railway RPF investigation records, evidence timelines, and operational escalations
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={FilePlus}
          onClick={() => setCreateModalOpen(true)}
          className="text-xs shadow-xs"
        >
          New Incident Ticket
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rg-card bg-surface border-border space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {INCIDENT_STATUS_TABS.map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="text-xs h-7 px-2.5"
              >
                {tab}
                {tab === 'OPEN' && openCount > 0 && (
                  <span className="ml-1.5 px-1 py-0.2 rounded text-[10px] bg-rose-500 text-white font-mono">
                    {openCount}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-72">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Incident ID, Alert, Officer..."
              onClear={() => setSearchQuery('')}
            />
          </div>
        </div>

        {/* Secondary Severity Filter */}
        <div className="flex items-center gap-2.5 flex-wrap pt-2.5 border-t border-border/60 text-xs">
          <div className="flex items-center gap-1.5 text-text-muted">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Severity:</span>
          </div>

          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium border transition-colors',
                selectedSeverity === sev
                  ? 'bg-accent text-white border-accent'
                  : 'bg-canvas text-text-muted border-border hover:border-border-strong hover:text-text-primary'
              )}
            >
              {sev}
            </button>
          ))}

          <div className="ml-auto text-[11px] text-text-muted font-mono">
            Showing <strong className="text-text-primary">{filteredIncidents.length}</strong> of {incidents.length} incidents
          </div>
        </div>
      </div>

      {/* Incident Data Table */}
      <DataTable
        columns={incidentColumns}
        data={filteredIncidents}
        onRowClick={(row) => setSelectedIncident(row)}
      />

      {/* Incident Details Drawer with Timeline */}
      <IncidentDetailsDrawer
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        incident={selectedIncident}
        onStatusChange={handleStatusChange}
      />

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          loadIncidents();
        }}
      />
    </div>
  );
}

export default IncidentsPage;
