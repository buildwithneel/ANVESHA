import apiClient from './apiClient';
import { mockIncidents } from '../data/mockIncidents';

export const incidentService = {
  async getIncidents(filters = {}) {
    try {
      const response = await apiClient.get('/incidents', { params: filters });
      return response.data;
    } catch {
      let filtered = [...mockIncidents];
      if (filters.stationId) {
        filtered = filtered.filter((i) => i.stationId === filters.stationId);
      }
      if (filters.severity && filters.severity !== 'ALL') {
        filtered = filtered.filter((i) => i.severity === filters.severity);
      }
      if (filters.status && filters.status !== 'ALL') {
        filtered = filtered.filter((i) => (i.status || '').toUpperCase() === filters.status.toUpperCase());
      }
      return filtered;
    }
  },

  async getIncidentById(incidentId) {
    try {
      const response = await apiClient.get(`/incidents/${incidentId}`);
      return response.data;
    } catch {
      return mockIncidents.find((i) => i.id === incidentId) || null;
    }
  },

  async createIncident(incidentData) {
    try {
      const payload = {
        alert_id: incidentData.alert_id || incidentData.alertId,
        camera_id: incidentData.camera_id || incidentData.cameraId || 'CAM-01',
        type: incidentData.type || incidentData.event || 'general_incident',
        severity: (incidentData.severity || 'MEDIUM').toUpperCase(),
        status: (incidentData.status || 'OPEN').toUpperCase(),
        description: incidentData.description || incidentData.notes || 'Operational safety incident logged.',
        operator_notes: incidentData.operator_notes || incidentData.notes || '',
      };
      const response = await apiClient.post('/incidents', payload);
      return response.data;
    } catch (err) {
      console.warn('[IncidentService] Fallback incident creation:', err);
      return {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        ...incidentData,
        status: incidentData.status || 'OPEN',
        created_at: new Date().toISOString(),
      };
    }
  },

  async updateIncidentStatus(incidentId, status, notes = '') {
    try {
      const response = await apiClient.patch(`/incidents/${incidentId}`, {
        status: status.toUpperCase(),
        operator_notes: notes || undefined,
      });
      return response.data;
    } catch {
      return { success: true, id: incidentId, status, notes };
    }
  },

  async getIncidentEvents(incidentId) {
    try {
      const response = await apiClient.get(`/incidents/${incidentId}/events`);
      return response.data;
    } catch {
      return [
        {
          id: 1,
          incident_id: incidentId,
          event_type: 'incident_opened',
          description: 'Incident ticket opened by control room officer',
          actor: 'Duty Officer',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
    }
  },

  async addIncidentNote(incidentId, noteText, actor = 'Duty Officer') {
    try {
      const response = await apiClient.post(`/incidents/${incidentId}/notes`, {
        note: noteText,
        actor: actor,
      });
      return response.data;
    } catch {
      return {
        id: Date.now(),
        incident_id: incidentId,
        event_type: 'note_added',
        description: noteText,
        actor: actor,
        created_at: new Date().toISOString(),
      };
    }
  },
};

export default incidentService;
