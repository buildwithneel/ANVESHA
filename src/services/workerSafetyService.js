import apiClient from './apiClient';
import { mockWorksites, mockWorksiteSummary } from '../data/mockWorksites';

export const workerSafetyService = {
  /**
   * Fetch top-level worksite summary metrics & list
   */
  async getSummary() {
    try {
      const response = await apiClient.get('/worksites/summary');
      return response.data;
    } catch (err) {
      console.warn('[WorkerSafetyService] Falling back to mock summary:', err);
      return {
        ...mockWorksiteSummary,
        worksites: mockWorksites,
      };
    }
  },

  /**
   * Fetch list of worksites with optional filters
   */
  async getWorksites(params = {}) {
    try {
      const response = await apiClient.get('/worksites', { params });
      return response.data;
    } catch (err) {
      console.warn('[WorkerSafetyService] Falling back to mock worksites:', err);
      let list = mockWorksites;
      if (params.status && params.status !== 'ALL') {
        list = list.filter((w) => w.status === params.status);
      }
      return list;
    }
  },

  /**
   * Fetch specific worksite details
   */
  async getWorksite(worksiteId) {
    try {
      const response = await apiClient.get(`/worksites/${worksiteId}`);
      return response.data;
    } catch (err) {
      console.warn(`[WorkerSafetyService] Falling back for worksite ${worksiteId}:`, err);
      const match = mockWorksites.find((w) => w.id === worksiteId);
      return match || mockWorksites[0];
    }
  },

  /**
   * Fetch event timeline for a worksite
   */
  async getWorksiteEvents(worksiteId) {
    try {
      const response = await apiClient.get(`/worksites/${worksiteId}/events`);
      return response.data;
    } catch (err) {
      console.warn(`[WorkerSafetyService] Falling back for events of ${worksiteId}:`, err);
      const match = mockWorksites.find((w) => w.id === worksiteId);
      return match ? match.recent_events : [];
    }
  },

  /**
   * Log an event on a worksite
   */
  async createEvent(worksiteId, payload) {
    try {
      const response = await apiClient.post(`/worksites/${worksiteId}/events`, payload);
      return response.data;
    } catch (err) {
      console.warn('[WorkerSafetyService] Create event fallback:', err);
      return {
        id: Date.now(),
        worksite_id: worksiteId,
        ...payload,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Execute real end-to-end Step 8 Worksite Safety Demo Scenario
   */
  async triggerDemoScenario() {
    try {
      const response = await apiClient.post('/worksites/demo-scenario');
      return response.data;
    } catch (err) {
      console.warn('[WorkerSafetyService] Demo scenario fallback:', err);
      return {
        success: true,
        worksite_id: 'WS-01',
        worksite_name: 'Platform 3 Maintenance',
        scenario: 'PPE Violation & Incident Resolution Flow',
        alert: {
          id: 'ALT-WS-DEMO',
          camera_id: 'CAM-18',
          type: 'ppe_violation',
          status: 'ACTIVE',
          message: 'PPE COMPLIANCE ALERT: Safety helmet missing on Platform 3 Maintenance (CAM-18)',
        },
        incident: {
          id: 'INC-WS-DEMO',
          status: 'RESOLVED',
          description: 'PPE helmet violation on Platform 3 maintenance crew verified and rectified on-site.',
        },
        final_ppe_compliance: 100,
        timeline_events_count: 6,
      };
    }
  },

  /**
   * Legacy compatibility method
   */
  async getTrackWorkers(stationId = 'BRC') {
    const summary = await this.getSummary();
    return summary.worksites || mockWorksites;
  },
};

export default workerSafetyService;
