import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { FileText, CheckCircle, ShieldAlert } from 'lucide-react';
import { incidentService } from '../../services/incidentService';

const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function CreateIncidentModal({ isOpen, onClose, camera, latestEvent, alert, onSubmit }) {
  const targetAlert = alert || latestEvent;
  const initialSeverity = targetAlert?.severity?.toUpperCase() || 'MEDIUM';

  const [type, setType] = useState('track_trespass');
  const [severity, setSeverity] = useState(initialSeverity);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [incidentId, setIncidentId] = useState('');

  useEffect(() => {
    if (targetAlert) {
      setType(targetAlert.type || targetAlert.event || 'general_incident');
      setSeverity((targetAlert.severity || 'MEDIUM').toUpperCase());
      setLocation(targetAlert.location || camera?.zone || camera?.location || 'Vadodara Station');
      setDescription(targetAlert.message || targetAlert.description || `${(targetAlert.type || 'Safety incident').replace(/_/g, ' ')} detected on camera.`);
    } else if (camera) {
      setLocation(camera.name || camera.zone || 'Platform 1');
      setDescription(`Operator observation on camera ${camera.id}`);
    }
  }, [targetAlert, camera, isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        alert_id: targetAlert?.id || null,
        camera_id: camera?.id || targetAlert?.cameraId || targetAlert?.camera_id || 'CAM-01',
        type: type,
        severity: severity,
        status: 'OPEN',
        description: description || 'Operational incident logged by duty officer.',
        operator_notes: notes,
      };

      let result;
      if (onSubmit) {
        result = await onSubmit(payload);
      } else {
        result = await incidentService.createIncident(payload);
      }

      if (result?.id) {
        setIncidentId(result.id);
        setSubmitted(true);
      }
    } catch (e) {
      console.warn('Error submitting incident:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setNotes('');
    setSeverity('MEDIUM');
    setIncidentId('');
    onClose();
  };

  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Incident Logged Successfully">
        <div className="flex flex-col items-center justify-center py-6 space-y-3 text-center">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-full">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Formal Incident Record Created</p>
            <p className="text-xl font-bold font-mono text-accent mt-1">{incidentId}</p>
          </div>
          <p className="text-xs text-text-muted max-w-sm">
            The incident has been registered in the database, assigned to the RPF duty control desk, and real-time alerts have been dispatched.
          </p>
          <Button variant="primary" onClick={handleClose} className="mt-2">
            Return to Command Center
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Incident Ticket"
      description="File a formal railway police & control room incident report."
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" icon={FileText} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Logging Ticket...' : 'Create Incident Ticket'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Linked Context */}
        <div className="grid grid-cols-2 gap-2 bg-canvas p-2.5 rounded-md border border-border">
          <div>
            <span className="text-text-muted text-[10px] uppercase font-semibold">Camera</span>
            <div className="font-mono font-semibold text-text-primary mt-0.5">
              {camera?.id || targetAlert?.cameraId || targetAlert?.camera_id || 'CAM-01'}
            </div>
          </div>
          <div>
            <span className="text-text-muted text-[10px] uppercase font-semibold">Linked Alert ID</span>
            <div className="font-mono text-accent font-semibold mt-0.5">
              {targetAlert?.id || 'None (Direct Report)'}
            </div>
          </div>
        </div>

        {/* Incident Type */}
        <FormField label="Incident Type / Classification">
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. track_trespass, crowd_surge, unattended_baggage"
            className="w-full text-xs bg-canvas border border-border rounded-md px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </FormField>

        {/* Severity Selector */}
        <FormField label="Severity Level">
          <div className="flex gap-2">
            {SEVERITY_OPTIONS.map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverity(sev)}
                className={cn(
                  'flex-1 px-2 py-1.5 text-xs font-semibold rounded-md border transition-colors',
                  severity === sev
                    ? sev === 'CRITICAL' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40'
                      : sev === 'HIGH' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/40'
                      : sev === 'MEDIUM' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                    : 'bg-canvas text-text-muted border-border hover:border-border-strong'
                )}
              >
                {sev}
              </button>
            ))}
          </div>
        </FormField>

        {/* Location */}
        <FormField label="Location Context">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Platform 3 North FOB Stairs"
            className="w-full text-xs bg-canvas border border-border rounded-md px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </FormField>

        {/* Description */}
        <FormField label="Incident Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the observation or threat..."
            rows={2}
            className="w-full text-xs bg-canvas border border-border rounded-md px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </FormField>

        {/* Officer Initial Notes */}
        <FormField label="Officer Initial Action Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Dispatched RPF unit 2 to inspect area..."
            rows={2}
            className="w-full text-xs bg-canvas border border-border rounded-md px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </FormField>
      </div>
    </Modal>
  );
}

function FormField({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

export default CreateIncidentModal;
