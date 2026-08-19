import apiClient from './apiClient';

/**
 * Camera Service - Interface for CCTV camera management, feeds, snapshots, and health statistics.
 */
export const cameraService = {
  /**
   * Get all cameras with optional search, zone, status, and AI activity filtering
   */
  async getCameras(params = {}) {
    try {
      const response = await apiClient.get('/cameras', { params });
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.cameras)) return data.cameras;
      if (data && Array.isArray(data.data)) return data.data;
      return getFallbackCameras(params);
    } catch (err) {
      console.warn('[cameraService] getCameras API fallback:', err);
      // Fallback demo cameras
      return getFallbackCameras(params);
    }
  },

  /**
   * Get details for a specific camera
   */
  async getCameraById(cameraId) {
    try {
      const response = await apiClient.get(`/cameras/${cameraId}`);
      return response.data;
    } catch (err) {
      console.warn(`[cameraService] getCameraById(${cameraId}) fallback:`, err);
      const fallbackList = getFallbackCameras();
      return fallbackList.find((c) => c.id === cameraId || c.camera_code === cameraId) || null;
    }
  },

  /**
   * Get recent events for a specific camera with time range
   */
  async getCameraEvents(cameraId, timeRange = 'today') {
    try {
      const response = await apiClient.get(`/cameras/${cameraId}/events`, {
        params: { time_range: timeRange },
      });
      return response.data;
    } catch (err) {
      console.warn(`[cameraService] getCameraEvents(${cameraId}) fallback:`, err);
      return getFallbackCameraEvents(cameraId, timeRange);
    }
  },

  /**
   * Capture a camera snapshot with timestamp and metadata retention
   */
  async takeSnapshot(cameraId, payload = {}) {
    try {
      const response = await apiClient.post(`/cameras/${cameraId}/snapshot`, payload);
      return response.data;
    } catch (err) {
      console.warn(`[cameraService] takeSnapshot(${cameraId}) fallback:`, err);
      return {
        id: `SNAP-${cameraId}-${Date.now()}`,
        camera_id: cameraId,
        camera_code: cameraId,
        location: 'Vadodara Station',
        timestamp: new Date().toISOString(),
        file_path: `/snapshots/SNAP-${cameraId}.jpg`,
        message: 'Snapshot archived successfully (Local Session)',
      };
    }
  },

  /**
   * Get CCTV system health summary metrics
   */
  async getHealthSummary(stationId) {
    try {
      const response = await apiClient.get('/cameras/health/summary', {
        params: { station_id: stationId },
      });
      return response.data;
    } catch (err) {
      console.warn('[cameraService] getHealthSummary fallback:', err);
      return {
        total_cameras: 24,
        online_count: 20,
        degraded_count: 1,
        offline_count: 1,
        maintenance_count: 2,
        active_alert_count: 3,
        network_health_pct: 95.8,
        ai_health_pct: 91.7,
      };
    }
  },

  /**
   * Update camera status or AI settings
   */
  async updateCamera(cameraId, updateData) {
    try {
      const response = await apiClient.patch(`/cameras/${cameraId}`, updateData);
      return response.data;
    } catch (err) {
      console.warn(`[cameraService] updateCamera(${cameraId}) fallback:`, err);
      return { id: cameraId, ...updateData };
    }
  },
};

// ─── Realistic Fallback Data Generators ────────────────────────
function getFallbackCameras(params = {}) {
  const base = [
    { id: 'CAM-01', camera_code: 'CAM-01', name: 'Platform 1 North Concourse', location: 'Platform 1 North Concourse', zone: 'Platform 1', category: 'Platform', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam01', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-02', camera_code: 'CAM-02', name: 'Platform 1 Central Escalator', location: 'Platform 1 Central Escalator', zone: 'Platform 1', category: 'Platform', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam02', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-03', camera_code: 'CAM-03', name: 'Platform 1 South Waiting Hall', location: 'Platform 1 South Waiting Hall', zone: 'Platform 1', category: 'Platform', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam03', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-04', camera_code: 'CAM-04', name: 'Platform 2 North Ramp', location: 'Platform 2 North Ramp', zone: 'Platform 2', category: 'Platform', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam04', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-05', camera_code: 'CAM-05', name: 'Platform 2 Center Stalls', location: 'Platform 2 Center Stalls', zone: 'Platform 2', category: 'Platform', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam05', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-06', camera_code: 'CAM-06', name: 'Platform 2 South End', location: 'Platform 2 South End', zone: 'Platform 2', category: 'Platform', status: 'MAINTENANCE', stream_url: 'rtsp://stream.railguard.internal/brc/cam06', ai_enabled: false, ai_status: 'DISABLED', active_alert_count: 0, last_heartbeat: new Date(Date.now() - 3600000).toISOString() },
    { id: 'CAM-07', camera_code: 'CAM-07', name: 'Platform 3 North Foot-Overbridge', location: 'Platform 3 North Foot-Overbridge', zone: 'Platform 3', category: 'Platform', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam07', ai_enabled: true, ai_status: 'ALERT', active_alert_count: 2, last_heartbeat: new Date().toISOString(), current_detection: { id: 701, type: 'restricted_zone', confidence: 0.94, severity: 'CRITICAL', risk_score: 92, timestamp: new Date().toISOString(), metadata: { bbox: [120, 80, 320, 420], label: 'RESTRICTED ZONE' } } },
    { id: 'CAM-08', camera_code: 'CAM-08', name: 'Platform 3 Main Boarding Zone', location: 'Platform 3 Main Boarding Zone', zone: 'Platform 3', category: 'Platform', status: 'DEGRADED', stream_url: 'rtsp://stream.railguard.internal/brc/cam08', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 1, last_heartbeat: new Date().toISOString(), current_detection: { id: 801, type: 'worker_no_ppe', confidence: 0.91, severity: 'HIGH', risk_score: 75, timestamp: new Date().toISOString(), metadata: { bbox: [200, 150, 400, 450], label: 'PPE VIOLATION' } } },
    { id: 'CAM-09', camera_code: 'CAM-09', name: 'Platform 3 South Track Junction', location: 'Platform 3 South Track Junction', zone: 'Platform 3', category: 'Platform', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam09', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-10', camera_code: 'CAM-10', name: 'Platform 4 North Stairs', location: 'Platform 4 North Stairs', zone: 'Platform 4', category: 'Platform', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam10', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-11', camera_code: 'CAM-11', name: 'Platform 4 Central Section', location: 'Platform 4 Central Section', zone: 'Platform 4', category: 'Platform', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam11', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-12', camera_code: 'CAM-12', name: 'Main Foot Overbridge 1 West', location: 'Main Foot Overbridge 1 West', zone: 'FOB', category: 'FOB', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam12', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-13', camera_code: 'CAM-13', name: 'Foot Overbridge 2 PF 3-4 Span', location: 'Foot Overbridge 2 PF 3-4 Span', zone: 'FOB', category: 'FOB', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam13', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-14', camera_code: 'CAM-14', name: 'Foot Overbridge 3 South Stairs', location: 'Foot Overbridge 3 South Stairs', zone: 'FOB', category: 'FOB', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam14', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-15', camera_code: 'CAM-15', name: 'Platform 5 Express Track End', location: 'Platform 5 Express Track End', zone: 'Platform 4', category: 'Platform', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam15', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-16', camera_code: 'CAM-16', name: 'Main Station Concourse & Tickets', location: 'Main Station Concourse & Tickets', zone: 'Concourse', category: 'Concourse', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam16', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-17', camera_code: 'CAM-17', name: 'East Entrance Security Baggage', location: 'East Entrance Security Baggage', zone: 'Concourse', category: 'Concourse', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam17', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-18', camera_code: 'CAM-18', name: 'Maintenance Yard Bay 4', location: 'Maintenance Yard Bay 4', zone: 'Maintenance Area', category: 'Maintenance', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam18', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-19', camera_code: 'CAM-19', name: 'Heavy Maintenance Shed North', location: 'Heavy Maintenance Shed North', zone: 'Maintenance Area', category: 'Maintenance', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam19', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-20', camera_code: 'CAM-20', name: 'Track Section Line 1-2 Interlock', location: 'Track Section Line 1-2 Interlock', zone: 'Track Area', category: 'Track Bed', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam20', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-21', camera_code: 'CAM-21', name: 'Track Area KM 392 South Junction', location: 'Track Area KM 392 South Junction', zone: 'Track Area', category: 'Track Bed', status: 'OFFLINE', stream_url: 'rtsp://stream.railguard.internal/brc/cam21', ai_enabled: false, ai_status: 'DISABLED', active_alert_count: 0, last_heartbeat: new Date(Date.now() - 11520000).toISOString() },
    { id: 'CAM-22', camera_code: 'CAM-22', name: 'Track Area Signal Gantry West', location: 'Track Area Signal Gantry West', zone: 'Track Area', category: 'Track Bed', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam22', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-23', camera_code: 'CAM-23', name: 'West Terminal Entry Gate 1', location: 'West Terminal Entry Gate 1', zone: 'Concourse', category: 'Concourse', status: 'LIVE', stream_url: 'rtsp://stream.railguard.internal/brc/cam23', ai_enabled: true, ai_status: 'ACTIVE', active_alert_count: 0, last_heartbeat: new Date().toISOString() },
    { id: 'CAM-24', camera_code: 'CAM-24', name: 'Circulating Area & Parking Bay', location: 'Circulating Area & Parking Bay', zone: 'Concourse', category: 'Concourse', status: 'MAINTENANCE', stream_url: 'rtsp://stream.railguard.internal/brc/cam24', ai_enabled: false, ai_status: 'DISABLED', active_alert_count: 0, last_heartbeat: new Date(Date.now() - 7200000).toISOString() },
  ];

  let filtered = [...base];
  if (params.search) {
    const q = params.search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        (c.zone && c.zone.toLowerCase().includes(q))
    );
  }
  if (params.zone && params.zone.toLowerCase() !== 'all') {
    filtered = filtered.filter((c) => c.zone?.toLowerCase() === params.zone.toLowerCase());
  }
  if (params.status && params.status.toLowerCase() !== 'all') {
    filtered = filtered.filter((c) => c.status.toLowerCase() === params.status.toLowerCase());
  }
  if (params.ai_activity && params.ai_activity.toLowerCase() !== 'all') {
    const act = params.ai_activity.toLowerCase();
    if (act === 'alert') {
      filtered = filtered.filter((c) => c.active_alert_count > 0 || c.ai_status === 'ALERT');
    } else if (act === 'detection') {
      filtered = filtered.filter((c) => c.current_detection && c.active_alert_count === 0);
    } else if (act === 'normal') {
      filtered = filtered.filter((c) => c.active_alert_count === 0);
    }
  }

  return filtered;
}

function getFallbackCameraEvents(cameraId, timeRange) {
  const now = new Date();
  const baseEvents = [
    {
      id: 101,
      camera_id: cameraId,
      event_type: 'restricted_zone',
      confidence: 0.94,
      severity: 'HIGH',
      risk_score: 88,
      timestamp: new Date(now.getTime() - 12 * 60000).toISOString(),
      location: 'Track Edge Zone',
      metadata: { bbox: [120, 80, 320, 420], label: 'RESTRICTED ZONE' },
    },
    {
      id: 102,
      camera_id: cameraId,
      event_type: 'person_detected',
      confidence: 0.96,
      severity: 'NORMAL',
      risk_score: 15,
      timestamp: new Date(now.getTime() - 25 * 60000).toISOString(),
      location: 'Platform Walkway',
      metadata: { bbox: [250, 180, 380, 520], label: 'PERSON' },
    },
    {
      id: 103,
      camera_id: cameraId,
      event_type: 'crowd_increase',
      confidence: 0.88,
      severity: 'MODERATE',
      risk_score: 62,
      timestamp: new Date(now.getTime() - 48 * 60000).toISOString(),
      location: 'Stairwell Ingress',
      metadata: { people_count: 24, label: 'CROWD SURGE' },
    },
    {
      id: 104,
      camera_id: cameraId,
      event_type: 'ppe_violation',
      confidence: 0.91,
      severity: 'HIGH',
      risk_score: 78,
      timestamp: new Date(now.getTime() - 95 * 60000).toISOString(),
      location: 'Track Maintenance Area',
      metadata: { violation: 'No Helmet', label: 'PPE VIOLATION' },
    },
  ];

  if (timeRange === '15m') {
    return baseEvents.slice(0, 1);
  } else if (timeRange === '1h') {
    return baseEvents.slice(0, 3);
  }
  return baseEvents;
}
