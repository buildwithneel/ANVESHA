import apiClient from './apiClient';
import {
  dashboardPlatforms,
  dashboardCrowdTrend,
  dashboardCrowdPrediction,
  stationZonesData,
} from '../data/mockDashboardData';
import { mockCrowdData } from '../data/mockCrowdData';

export const crowdService = {
  /**
   * Fetch complete station-wide crowd metrics and zones summary
   */
  async getStationCrowd() {
    try {
      const response = await apiClient.get('/crowd');
      return response.data;
    } catch (err) {
      console.warn('[CrowdService] Falling back to mock station crowd data:', err);
      return {
        station_name: 'Vadodara Railway Station',
        station_code: 'BRC',
        total_estimated_people: 428,
        average_density_percentage: 69,
        density_label: 'MODERATE',
        risk_level: 'MODERATE',
        platforms: dashboardPlatforms,
        zones: stationZonesData,
        trend_60min: dashboardCrowdTrend,
        projections: dashboardCrowdPrediction,
      };
    }
  },

  /**
   * Fetch specific zone details by zone ID (e.g. 'PF-1', 'PF-3', 'FOB', 'CONCOURSE')
   */
  async getZoneCrowd(zoneId) {
    try {
      const response = await apiClient.get(`/crowd/${zoneId}`);
      return response.data;
    } catch (err) {
      console.warn(`[CrowdService] Falling back for zone ${zoneId}:`, err);
      const matched = stationZonesData.find((z) => z.id === zoneId || z.name === zoneId);
      return matched || stationZonesData[0];
    }
  },

  /**
   * Ingest crowd measurement into the backend system
   */
  async ingestMeasurement(payload) {
    try {
      const response = await apiClient.post('/crowd', payload);
      return response.data;
    } catch (err) {
      console.warn('[CrowdService] Ingest measurement fallback:', err);
      return { status: 'success', fallback: true };
    }
  },

  /**
   * Run the live Demo Scenario step
   */
  async triggerDemoScenario(step = 4) {
    try {
      const response = await apiClient.post(`/crowd/demo-scenario?step=${step}`);
      return response.data;
    } catch (err) {
      console.warn('[CrowdService] Demo scenario fallback:', err);
      const densities = { 1: 76, 2: 81, 3: 86, 4: 91 };
      const density = densities[step] || 91;
      return {
        success: true,
        step,
        zone_id: 'PF-3',
        zone_name: 'Platform 3',
        crowd_percentage: density,
        people_count: Math.round((density / 100) * 500),
        risk_level: 'HIGH',
        density_label: 'HIGH',
        alert_generated: step === 4 ? 'ALT-DEMO-CROWD' : null,
        alert_message: step === 4 ? `CROWD THRESHOLD EXCEEDED: Platform 3 crowd density reached ${density}% (Duration: 4 min)` : null,
      };
    }
  },

  /**
   * Legacy compatibility method
   */
  async getStationCrowdMetrics(stationId = 'BRC') {
    return this.getStationCrowd();
  },
};

export default crowdService;
