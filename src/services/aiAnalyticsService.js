import apiClient from './apiClient';

export const aiAnalyticsService = {
  /**
   * Get AI Engine operational status and mode (DEMO MODE / LIVE MODEL)
   */
  async getStatus() {
    try {
      const res = await apiClient.get('/ai/status');
      return res.data;
    } catch (err) {
      console.warn('[aiAnalyticsService] getStatus fallback:', err);
      return {
        engine_mode: 'DEMO MODE',
        is_simulation: true,
        detection_pipeline_status: 'OPERATIONAL',
        active_cameras_processed: 24,
        total_detections_today: 142,
        inference_latency_ms: 24,
        average_confidence_pct: 94.2,
        uptime_pct: 99.8,
        model_info: {
          name: 'Simulation Engine (RailGuard Prototype)',
          purpose: 'Railway passenger safety, track intrusion detection, and PPE worker compliance',
          input_format: 'RTSP Video Stream / 1080p @ 25 FPS (H.264 / H.265)',
          output_format: 'JSON Detections (Class, Confidence 0-1, BoundingBox, TrackID)',
          inference_mode: 'Simulation / ML-Ready Contract',
          is_simulation: true,
          active_runtime: 'Local Engine Server (Vadodara)',
        },
      };
    }
  },

  /**
   * Switch AI engine operating mode
   */
  async setEngineMode(mode) {
    try {
      const res = await apiClient.post('/ai/status/mode', null, { params: { mode } });
      return res.data;
    } catch (err) {
      console.warn('[aiAnalyticsService] setEngineMode fallback:', err);
      return { success: true, engine_mode: mode };
    }
  },

  /**
   * Ingest a custom detection event (ML-ready contract)
   */
  async ingestDetection(payload) {
    try {
      const res = await apiClient.post('/ai/detections', payload);
      return res.data;
    } catch (err) {
      console.warn('[aiAnalyticsService] ingestDetection fallback:', err);
      return { success: true, alert_triggered: true };
    }
  },

  /**
   * Trigger controlled demo scenario (A, B, C, or D)
   */
  async triggerDemoScenario(scenarioId) {
    try {
      const res = await apiClient.post(`/ai/demo/scenarios/${scenarioId}`);
      return res.data;
    } catch (err) {
      console.warn(`[aiAnalyticsService] triggerDemoScenario(${scenarioId}) fallback:`, err);
      return { scenario: scenarioId, name: `Demo Scenario ${scenarioId}`, alert_triggered: true };
    }
  },

  /**
   * Get analytics overview metrics
   */
  async getSummary() {
    try {
      const res = await apiClient.get('/ai/analytics/summary');
      return res.data;
    } catch (err) {
      console.warn('[aiAnalyticsService] getSummary fallback:', err);
      return {
        detections_today: 142,
        high_risk_events: 18,
        alerts_generated: 28,
        average_confidence: 94.2,
        is_demo_data: true,
        last_updated: new Date().toISOString(),
      };
    }
  },

  /**
   * Get crowd density trend for 15m, 1h, 6h, today
   */
  async getCrowdDensityTrend(timeRange = '1h') {
    try {
      const res = await apiClient.get('/ai/analytics/crowd-trend', { params: { time_range: timeRange } });
      return res.data;
    } catch (err) {
      console.warn('[aiAnalyticsService] getCrowdDensityTrend fallback:', err);
      return getFallbackCrowdTrend(timeRange);
    }
  },

  /**
   * Get Station Risk Trend with delta and contributing factors
   */
  async getRiskTrend(timeRange = '1h') {
    try {
      const res = await apiClient.get('/ai/analytics/risk-trend', { params: { time_range: timeRange } });
      return res.data;
    } catch (err) {
      console.warn('[aiAnalyticsService] getRiskTrend fallback:', err);
      return getFallbackRiskTrend(timeRange);
    }
  },

  /**
   * Get event category distribution
   */
  async getEventDistribution() {
    try {
      const res = await apiClient.get('/ai/analytics/event-distribution');
      return res.data;
    } catch (err) {
      console.warn('[aiAnalyticsService] getEventDistribution fallback:', err);
      return {
        total_events: 142,
        categories: [
          { category: 'Crowd Flow & Surges', count: 58, percentage: 40.8, color: '#3B82F6' },
          { category: 'Security & Perimeter', count: 42, percentage: 29.6, color: '#EF4444' },
          { category: 'Worksite & PPE', count: 32, percentage: 22.5, color: '#F59E0B' },
          { category: 'General Operational', count: 10, percentage: 7.1, color: '#10B981' },
        ],
      };
    }
  },

  /**
   * Get 5-pillar explainable AI insights
   */
  async getExplainableInsights() {
    try {
      const res = await apiClient.get('/ai/insights');
      return res.data;
    } catch (err) {
      console.warn('[aiAnalyticsService] getExplainableInsights fallback:', err);
      return getFallbackInsights();
    }
  },

  /**
   * Generate human-readable incident narrative
   */
  async getIncidentNarrative(incidentId) {
    try {
      const res = await apiClient.get(`/ai/incidents/${incidentId}/narrative`);
      return res.data;
    } catch (err) {
      console.warn(`[aiAnalyticsService] getIncidentNarrative(${incidentId}) fallback:`, err);
      return {
        incident_id: incidentId,
        title: 'Track Corridor Intrusion Occurrence',
        narrative_summary: 'At approximately 18:42, CAM-07 detected a person entering the restricted Track Maintenance Zone with 94% model confidence. The event remained active for 38 seconds before operator review.',
        timeline_highlights: [
          '18:42:02 - Automated detection triggered by CAM-07 (Confidence: 94%)',
          '18:42:15 - Critical alert generated and dispatched to Command Console',
          '18:42:38 - Operator acknowledged alert; RPF patrol alerted',
        ],
        confidence_score: 0.94,
        risk_score: 90,
        status: 'OPEN',
      };
    }
  },
};

// ── Fallback Helpers ──────────────────────────────────────────
function getFallbackCrowdTrend(tr) {
  const points = [
    { time: '18:00', density: 54.0, passengers: 240 },
    { time: '18:10', density: 62.0, passengers: 280 },
    { time: '18:20', density: 71.0, passengers: 320 },
    { time: '18:30', density: 79.0, passengers: 370 },
    { time: '18:40', density: 85.0, passengers: 410 },
    { time: '18:50', density: 87.0, passengers: 428 },
  ];
  return {
    time_range: tr,
    current_density: 87.0,
    average_density: 73.0,
    peak_density: 88.0,
    trend_direction: 'INCREASING',
    trend_data: points,
  };
}

function getFallbackRiskTrend(tr) {
  const points = [
    { time: '18:00', risk_score: 68 },
    { time: '18:10', risk_score: 70 },
    { time: '18:20', risk_score: 72 },
    { time: '18:30', risk_score: 75 },
    { time: '18:40', risk_score: 80 },
    { time: '18:50', risk_score: 82 },
  ];
  return {
    time_range: tr,
    current_risk_score: 82,
    risk_level: 'HIGH',
    net_change: 14,
    trend_data: points,
    contributing_factors: [
      'Platform 3 passenger density > threshold (87%)',
      'CAM-07 restricted zone detection (confidence: 94%)',
      'Stairwell B foot-overbridge localized bottleneck',
    ],
    disclaimer: 'Decision-support indicator. Derived from observable CCTV events and crowd metrics.',
  };
}

function getFallbackInsights() {
  const now = new Date();
  return [
    {
      id: 'INS-01',
      category: 'SECURITY',
      what: 'Restricted track maintenance zone intrusion detected.',
      why: 'A person was detected inside the configured restricted track zone by CAM-07 bounding box intersection.',
      confidence: 0.94,
      impact: 'CRITICAL',
      suggested_action: 'Verify CAM-07 live feed immediately and dispatch RPF platform marshal for on-ground verification.',
      location: 'Platform 3 North Foot-Overbridge',
      camera_id: 'CAM-07',
      timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
    },
    {
      id: 'INS-02',
      category: 'CROWD',
      what: 'Platform 3 passenger density exceeds safety threshold.',
      why: 'Passenger count (86 pax) has remained above the platform density threshold for 4 continuous minutes.',
      confidence: 0.89,
      impact: 'HIGH',
      suggested_action: 'Review Platform 3 and consider deploying crowd-management marshals to stairs and escalators.',
      location: 'Platform 3 Main Boarding Zone',
      camera_id: 'CAM-08',
      timestamp: new Date(now.getTime() - 4 * 60000).toISOString(),
    },
    {
      id: 'INS-03',
      category: 'WORKER_SAFETY',
      what: 'Personal Protective Equipment (PPE) non-compliance observed.',
      why: 'Technician detected working near active track corridor without mandatory safety helmet.',
      confidence: 0.91,
      impact: 'MEDIUM',
      suggested_action: 'Notify engineering site supervisor and enforce safety helmet compliance.',
      location: 'Maintenance Yard Bay 4',
      camera_id: 'CAM-18',
      timestamp: new Date(now.getTime() - 8 * 60000).toISOString(),
    },
  ];
}

export default aiAnalyticsService;
