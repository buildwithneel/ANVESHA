import apiClient from './apiClient';
import {
  dashboardStation,
  dashboardKPIs,
  dashboardPlatforms,
  dashboardPriorityAlerts,
  dashboardCrowdTrend,
  dashboardCrowdPrediction,
  dashboardEventDistribution,
} from '../data/mockDashboardData';

export const dashboardService = {
  /**
   * Unified Command Dashboard Consolidated Summary
   */
  async getUnifiedDashboardSummary(stationId) {
    try {
      const response = await apiClient.get('/dashboard/summary', {
        params: { station_id: stationId },
      });
      return response.data;
    } catch (err) {
      console.warn('[dashboardService] getUnifiedDashboardSummary fallback:', err);
      return getFallbackDashboardSummary();
    }
  },

  /**
   * Fetch active AI decision-support recommendations
   */
  async getRecommendations() {
    try {
      const response = await apiClient.get('/dashboard/recommendations');
      return response.data;
    } catch (err) {
      console.warn('[dashboardService] getRecommendations fallback:', err);
      return getFallbackRecommendations();
    }
  },

  /**
   * Dismiss an operational recommendation in session
   */
  async dismissRecommendation(recId) {
    try {
      const response = await apiClient.post(`/dashboard/recommendations/${recId}/dismiss`);
      return response.data;
    } catch (err) {
      console.warn(`[dashboardService] dismissRecommendation(${recId}) fallback:`, err);
      return { success: true };
    }
  },

  /**
   * Unified Global Search across all modules
   */
  async globalSearch(query) {
    if (!query || !query.trim()) {
      return { query: '', total_results: 0, cameras: [], alerts: [], incidents: [], locations: [], worksites: [] };
    }
    try {
      const response = await apiClient.get('/dashboard/search', { params: { q: query } });
      return response.data;
    } catch (err) {
      console.warn('[dashboardService] globalSearch fallback:', err);
      return getFallbackGlobalSearch(query);
    }
  },

  /**
   * Trigger End-to-End Integrated Multi-Module Demo Scenario
   */
  async triggerIntegratedDemo() {
    try {
      const response = await apiClient.post('/dashboard/demo/integrated-scenario');
      return response.data;
    } catch (err) {
      console.warn('[dashboardService] triggerIntegratedDemo fallback:', err);
      return { success: true, message: 'Demo scenario started (Local Session)' };
    }
  },

  // Legacy fallback helpers
  async getSummary() {
    return this.getUnifiedDashboardSummary();
  },

  async getStationStatus() {
    return dashboardStation;
  },

  async getKPIs() {
    return dashboardKPIs;
  },

  async getPlatformSituation() {
    return dashboardPlatforms;
  },

  async getPriorityAlerts() {
    return dashboardPriorityAlerts;
  },

  async getCrowdTrend() {
    return {
      trend: dashboardCrowdTrend,
      prediction: dashboardCrowdPrediction,
    };
  },

  async getEventDistribution() {
    return dashboardEventDistribution;
  },
};

// ─── Realistic Fallback Data ──────────────────────────────────
function getFallbackDashboardSummary() {
  const now = new Date();
  return {
    station_id: 'BRC',
    station_name: 'Vadodara Railway Station',
    division: 'Ahmedabad Division',
    system_status: 'OPERATIONAL',
    last_updated: now.toISOString(),
    cameras: { active: 20, total: 24, degraded: 1, offline: 1, maintenance: 2 },
    alerts: { active: 3, critical: 1, high: 1, medium: 1, low: 0 },
    incidents: { total: 4, open: 2, investigating: 1, resolved: 1 },
    crowd_people_count: 428,
    worksites: { active_worksites: 6, workers_present: 34, overall_ppe_compliance: 96, worksite_alerts: 1 },
    safety_index: {
      overall_score: 82,
      status_label: 'Moderate Operational Risk',
      crowd_safety_score: 85,
      security_score: 74,
      worksite_compliance_score: 96,
      cctv_health_score: 98,
    },
    ai_telemetry: {
      status: 'ONLINE',
      cameras_processed: 24,
      total_detections_today: 142,
      inference_latency_ms: 24,
      average_model_confidence_pct: 94.2,
      uptime_pct: 99.8,
    },
    system_health: {
      cctv_network_pct: 95.8,
      ai_processing_pct: 96.0,
      backend_api_pct: 100.0,
      database_pct: 100.0,
      websocket_pct: 99.0,
    },
    priority_actions: [
      {
        id: 'ALT-001',
        event_type: 'RESTRICTED ZONE',
        title: 'Unauthorized person detected traversing active track line',
        severity: 'CRITICAL',
        location: 'Platform 3 North Foot-Overbridge',
        zone: 'Platform 3',
        camera_id: 'CAM-07',
        created_at: new Date(now.getTime() - 2 * 60000).toISOString(),
        relative_time: '2 min ago',
        risk_score: 92,
        confidence: 0.94,
        duration_str: '2m',
        contributing_factors: ['Restricted-zone detection', 'Confidence: 94%', 'Persistent event (>2m)', 'Active express track line'],
        suggested_action: 'Review live CCTV stream and dispatch RPF platform patrol.',
        status: 'ACTIVE',
      },
      {
        id: 'ALT-002',
        event_type: 'CROWD SURGE',
        title: 'Platform 3 passenger density exceeds safety threshold',
        severity: 'HIGH',
        location: 'Platform 3 Main Boarding Zone',
        zone: 'Platform 3',
        camera_id: 'CAM-08',
        created_at: new Date(now.getTime() - 5 * 60000).toISOString(),
        relative_time: '5 min ago',
        risk_score: 78,
        confidence: 0.89,
        duration_str: '5m',
        contributing_factors: ['Crowd density > 5.2 pax/sqm', 'Confidence: 89%', 'Stairwell B congestion'],
        suggested_action: 'Review Platform 3 and consider deploying crowd-management personnel.',
        status: 'ACTIVE',
      },
      {
        id: 'ALT-003',
        event_type: 'PPE VIOLATION',
        title: 'Technician observed without mandatory safety helmet',
        severity: 'HIGH',
        location: 'Maintenance Yard Bay 4',
        zone: 'Maintenance Area',
        camera_id: 'CAM-18',
        created_at: new Date(now.getTime() - 8 * 60000).toISOString(),
        relative_time: '8 min ago',
        risk_score: 65,
        confidence: 0.91,
        duration_str: '8m',
        contributing_factors: ['Worker safety PPE non-compliance', 'Confidence: 91%', 'Active electrical maintenance'],
        suggested_action: 'Notify site supervisor and enforce PPE compliance.',
        status: 'ACTIVE',
      },
    ],
    needs_attention: [
      { id: 'na-1', location: 'Platform 3', event_type: 'Track intrusion', elapsed_time: '2 min', severity: 'CRITICAL', camera_id: 'CAM-07' },
      { id: 'na-2', location: 'Platform 2', event_type: 'Crowd threshold exceeded', elapsed_time: '5 min', severity: 'HIGH', camera_id: 'CAM-05' },
      { id: 'na-3', location: 'Maintenance Area', event_type: 'PPE violation', elapsed_time: '8 min', severity: 'HIGH', camera_id: 'CAM-18' },
    ],
    recommendations: getFallbackRecommendations(),
  };
}

function getFallbackRecommendations() {
  const now = new Date();
  return [
    {
      id: 'REC-CROWD-PF3',
      category: 'CROWD',
      severity: 'HIGH',
      headline: 'Platform 3 Crowd Density Threshold Exceeded',
      observation: 'Platform 3 passenger density has remained above the configured threshold for 4 minutes (86 passengers detected).',
      trigger_rule: 'IF crowd density > threshold AND duration > 3 minutes THEN recommend crowd-management review',
      suggested_action: 'Review Platform 3 CCTV and consider deploying additional crowd-management marshals to stairs and escalators.',
      target_zone: 'Platform 3',
      target_camera_id: 'CAM-08',
      target_route: '/crowd-intelligence',
      action_label: 'View Platform 3',
      created_at: new Date(now.getTime() - 4 * 60000).toISOString(),
      dismissed: false,
    },
    {
      id: 'REC-SEC-CAM07',
      category: 'SECURITY',
      severity: 'HIGH',
      headline: 'Potential Track Intrusion Verified at CAM-07',
      observation: 'AI model detected unauthorized person traversing active track corridor near CAM-07 with 94% confidence.',
      trigger_rule: 'IF restricted-zone detection AND confidence > 0.85 THEN recommend security verification',
      suggested_action: 'Verify live CCTV stream immediately and dispatch RPF platform patrol for on-ground verification.',
      target_zone: 'Platform 3 Track Corridor',
      target_camera_id: 'CAM-07',
      target_route: '/live-monitoring',
      action_label: 'View Camera Feed',
      created_at: new Date(now.getTime() - 2 * 60000).toISOString(),
      dismissed: false,
    },
    {
      id: 'REC-WS-01',
      category: 'WORKER_SAFETY',
      severity: 'MODERATE',
      headline: 'PPE Compliance Non-Conformance at WS-01',
      observation: 'Platform 3 Maintenance compliance dropped to 86%. Technicians observed without mandatory helmets near track.',
      trigger_rule: 'IF PPE violation detected AND worksite status is ACTIVE THEN recommend site safety inspection',
      suggested_action: 'Notify engineering site supervisor and enforce safety helmet/vest compliance before track occupancy continues.',
      target_zone: 'Platform 3',
      target_camera_id: 'CAM-08',
      target_route: '/worker-safety',
      action_label: 'View Worksite',
      created_at: new Date(now.getTime() - 7 * 60000).toISOString(),
      dismissed: false,
    },
  ];
}

function getFallbackGlobalSearch(query) {
  const q = query.toLowerCase().trim();
  const allItems = [
    { id: 'CAM-07', type: 'camera', title: 'CAM-07', subtitle: 'Platform 3 North Foot-Overbridge (Platform 3)', route: '/live-monitoring', state: { cameraId: 'CAM-07' }, badge: 'LIVE', badge_variant: 'success' },
    { id: 'CAM-08', type: 'camera', title: 'CAM-08', subtitle: 'Platform 3 Main Boarding Zone (Platform 3)', route: '/live-monitoring', state: { cameraId: 'CAM-08' }, badge: 'DEGRADED', badge_variant: 'warning' },
    { id: 'CAM-21', type: 'camera', title: 'CAM-21', subtitle: 'Track Area KM 392 South Junction (Track Area)', route: '/live-monitoring', state: { cameraId: 'CAM-21' }, badge: 'OFFLINE', badge_variant: 'danger' },
    { id: 'ALT-001', type: 'alert', title: 'RESTRICTED ZONE', subtitle: 'Unauthorized person detected on track · CAM-07', route: '/alerts', state: { cameraId: 'CAM-07' }, badge: 'CRITICAL', badge_variant: 'critical' },
    { id: 'ALT-002', type: 'alert', title: 'CROWD SURGE', subtitle: 'Platform 3 passenger density exceeds threshold · CAM-08', route: '/alerts', state: { cameraId: 'CAM-08' }, badge: 'HIGH', badge_variant: 'warning' },
    { id: 'INC-001', type: 'incident', title: 'INC-001 - TRACK TRESPASS', subtitle: 'Person entered active express track line near Platform 3', route: '/incidents', state: { incidentId: 'INC-001' }, badge: 'OPEN', badge_variant: 'warning' },
    { id: 'WS-01', type: 'worksite', title: 'Platform 3 Maintenance', subtitle: 'Zone: Platform 3 · Compliance: 96%', route: '/worker-safety', state: { worksiteId: 'WS-01' }, badge: 'ACTIVE', badge_variant: 'success' },
    { id: 'LOC-PF3', type: 'location', title: 'Platform 3', subtitle: 'Platform 3 Express Track & Passenger Boarding', route: '/crowd-intelligence', state: { zoneId: 'PF-3' }, badge: 'ZONE', badge_variant: 'info' },
  ];

  const matched = allItems.filter(
    (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
  );

  return {
    query,
    total_results: matched.length,
    cameras: matched.filter((m) => m.type === 'camera'),
    alerts: matched.filter((m) => m.type === 'alert'),
    incidents: matched.filter((m) => m.type === 'incident'),
    locations: matched.filter((m) => m.type === 'location'),
    worksites: matched.filter((m) => m.type === 'worksite'),
  };
}

export default dashboardService;
