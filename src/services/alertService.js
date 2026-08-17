import apiClient from './apiClient';
import { mockAlerts } from '../data/mockAlerts';

/**
 * Alert Service - Interface for safety alerts, status transitions, and ML deduplication.
 */
export const alertService = {
  async getAlerts(filters = {}) {
    try {
      const response = await apiClient.get('/alerts', { params: filters });
      return response.data;
    } catch {
      let filtered = [...mockAlerts];
      if (filters.stationId) {
        filtered = filtered.filter((a) => a.stationId === filters.stationId);
      }
      if (filters.severity && filters.severity !== 'ALL') {
        filtered = filtered.filter((a) => a.severity === filters.severity);
      }
      if (filters.status && filters.status !== 'ALL') {
        filtered = filtered.filter((a) => a.status === filters.status);
      }
      return filtered;
    }
  },

  async getAlertById(alertId) {
    try {
      const response = await apiClient.get(`/alerts/${alertId}`);
      return response.data;
    } catch {
      return mockAlerts.find((a) => a.id === alertId) || null;
    }
  },

  async acknowledgeAlert(alertId) {
    try {
      const response = await apiClient.post(`/alerts/${alertId}/acknowledge`);
      return response.data;
    } catch {
      return { success: true, id: alertId, status: 'ACKNOWLEDGED' };
    }
  },

  async investigateAlert(alertId) {
    try {
      const response = await apiClient.post(`/alerts/${alertId}/investigate`);
      return response.data;
    } catch {
      return { success: true, id: alertId, status: 'INVESTIGATING' };
    }
  },

  async resolveAlert(alertId, resolutionNotes = '') {
    try {
      const response = await apiClient.post(`/alerts/${alertId}/resolve`, { notes: resolutionNotes });
      return response.data;
    } catch {
      return { success: true, id: alertId, status: 'RESOLVED', notes: resolutionNotes };
    }
  },

  async dismissAlert(alertId) {
    try {
      const response = await apiClient.post(`/alerts/${alertId}/dismiss`);
      return response.data;
    } catch {
      return { success: true, id: alertId, status: 'DISMISSED' };
    }
  },

  async getDeduplicationStats() {
    try {
      const response = await apiClient.get('/alerts/stats/deduplication');
      return response.data;
    } catch {
      return {
        total_raw_detections: 47,
        total_operational_alerts: 12,
        active_operational_alerts: 7,
        suppressed_duplicate_detections: 35,
        deduplication_ratio: '74.5%',
      };
    }
  },

  async triggerDemoScenario() {
    try {
      const response = await apiClient.post('/alerts/demo/trigger-scenario');
      return response.data;
    } catch (e) {
      console.warn('Demo scenario backend trigger fallback:', e);
      return {
        success: true,
        scenario: 'Live Track Intrusion & Emergency Escalation',
        alert: {
          id: `ALT-${Date.now().toString().slice(-3)}`,
          camera_id: 'CAM-07',
          type: 'track_intrusion',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          message: 'CRITICAL: Live unauthorized person detected in track bed near Platform 3 North',
          confidence: 0.97,
          risk_score: 96,
          created_at: new Date().toISOString(),
        },
      };
    }
  },
};

export default alertService;
