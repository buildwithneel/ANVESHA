import React, { useState, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { IncidentTimelineView } from './IncidentTimelineView';
import { incidentService } from '../../services/incidentService';
import {
  Camera,
  MapPin,
  Clock,
  Shield,
  FileText,
  Send,
  CheckCircle2,
  Search,
  Lock,
  Radio,
  User,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { getSeverityConfig } from '../../utils/severity';
import { cn } from '../../utils/cn';

const INCIDENT_STATUSES = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];

export function IncidentDetailsDrawer({
  isOpen,
  onClose,
  incident,
  onStatusChange,
  onViewCamera,
}) {
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [currentIncident, setCurrentIncident] = useState(incident);

  useEffect(() => {
    setCurrentIncident(incident);
    if (incident?.id) {
      loadTimeline(incident.id);
    }
  }, [incident]);

  async function loadTimeline(incId) {
    try {
      const events = await incidentService.getIncidentEvents(incId);
      if (Array.isArray(events)) {
        setTimelineEvents(events);
      }
    } catch (e) {
      console.warn('Error loading timeline events:', e);
    }
  }

  const handleStatusClick = async (newStatus) => {
    if (!currentIncident?.id) return;
    try {
      const updated = await incidentService.updateIncidentStatus(currentIncident.id, newStatus);
      setCurrentIncident((prev) => ({ ...prev, status: newStatus }));
      if (onStatusChange) onStatusChange(currentIncident.id, newStatus);
      await loadTimeline(currentIncident.id);
    } catch (e) {
      console.warn('Error updating status:', e);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !currentIncident?.id) return;

    setIsSubmittingNote(true);
    try {
      const ev = await incidentService.addIncidentNote(currentIncident.id, newNote.trim(), 'Insp. Sharma');
      if (ev) {
        setTimelineEvents((prev) => [...prev, ev]);
      }
      setNewNote('');
    } catch (err) {
      console.warn('Error adding note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (!currentIncident) return null;

  const severity = (currentIncident.severity || 'MEDIUM').toUpperCase();
  const severityConfig = getSeverityConfig(severity);
  const status = (currentIncident.status || 'OPEN').toUpperCase();
  const cameraId = currentIncident.camera_id || currentIncident.cameraId || 'CAM-01';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Incident Ticket ${currentIncident.id}`}
      subtitle="Operational Railway Command, Response & Investigation Record"
    >
      <div className="space-y-5 text-text-primary text-xs">
        {/* Top Header Card */}
        <div className={cn('p-3.5 rounded-lg border flex items-center justify-between', severityConfig.bgClass, severityConfig.borderClass)}>
          <div className="flex items-center gap-2.5">
            <StatusBadge severity={severity} size="md" />
            <div>
              <div className="font-semibold text-sm text-text-primary">
                {currentIncident.type ? currentIncident.type.replace(/_/g, ' ').toUpperCase() : currentIncident.title || 'GENERAL INCIDENT'}
              </div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                Current Status: <strong className="font-bold text-text-primary uppercase">{status}</strong>
              </div>
            </div>
          </div>

          <div className="text-right font-mono text-[11px] text-text-muted">
            <Clock className="w-3.5 h-3.5 inline mr-1 text-text-muted" />
            <span>{formatRelativeTime(currentIncident.created_at || currentIncident.createdAt)}</span>
          </div>
        </div>

        {/* Status Lifecycle Switcher */}
        <div className="bg-canvas p-3 rounded-lg border border-border space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
            Investigation Status
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {INCIDENT_STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusClick(st)}
                className={cn(
                  'px-2 py-1.5 rounded-md font-semibold text-[11px] text-center border transition-all',
                  status === st
                    ? st === 'OPEN' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/50 shadow-xs' :
                      st === 'INVESTIGATING' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/50 shadow-xs' :
                      st === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50 shadow-xs' :
                      'bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/50 shadow-xs'
                    : 'bg-surface text-text-muted border-border hover:border-border-strong hover:text-text-primary'
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Incident Summary & Description */}
        <div className="bg-canvas p-3.5 rounded-lg border border-border space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Incident Description</div>
          <p className="text-xs text-text-secondary leading-relaxed font-normal">
            {currentIncident.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Context Grid */}
        <div className="bg-canvas p-3.5 rounded-lg border border-border grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Camera Unit</span>
            <div className="font-mono font-semibold text-text-primary flex items-center gap-1.5 mt-0.5">
              <Camera className="w-3.5 h-3.5 text-text-muted" />
              {cameraId}
            </div>
          </div>

          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Location Context</span>
            <div className="font-semibold text-text-primary flex items-center gap-1.5 mt-0.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className="truncate">{currentIncident.location || 'Vadodara Station'}</span>
            </div>
          </div>

          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Logged At</span>
            <div className="font-mono text-text-primary text-[11px] mt-0.5">
              {formatDateTime(currentIncident.created_at || currentIncident.createdAt)}
            </div>
          </div>

          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Linked Alert</span>
            <div className="font-mono text-accent text-[11px] mt-0.5 font-bold">
              {currentIncident.alert_id || currentIncident.alertId || 'Direct Observation'}
            </div>
          </div>
        </div>

        {/* Add Officer Note Form */}
        <form onSubmit={handleAddNote} className="bg-canvas p-3.5 rounded-lg border border-border space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center justify-between">
            <span>Add Officer Field Note</span>
            <span className="text-text-muted font-normal">Logged as Insp. Sharma</span>
          </div>

          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter situation update, dispatch instructions, or investigation progress..."
            rows={2}
            className="w-full text-xs bg-surface border border-border rounded-md px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Send}
              disabled={isSubmittingNote || !newNote.trim()}
              className="text-xs"
            >
              {isSubmittingNote ? 'Submitting...' : 'Post Note to Timeline'}
            </Button>
          </div>
        </form>

        {/* Data-Backed Incident Timeline */}
        <div className="space-y-2.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-text-muted">
            <span>Operational Timeline ({timelineEvents.length} Events)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Data Verified</span>
          </div>

          <IncidentTimelineView events={timelineEvents} />
        </div>
      </div>
    </Drawer>
  );
}

export default IncidentDetailsDrawer;
