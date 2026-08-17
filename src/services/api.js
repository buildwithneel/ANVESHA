// ============================================================
// RailGuard AI — API Service Layer
// Abstracts data fetching for easy FastAPI migration
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK = true; // Toggle to false when connecting to FastAPI

import {
  dashboardStats,
  cameras,
  incidents,
  crowdDensityZones,
  crowdTrendData,
  incidentsByCategory,
  riskTrendData,
  ppeComplianceData,
  cleanlinessData,
  cameraActivityData,
  stations,
  systemStatus,
} from '../data/mockData';

// Simulate slight network latency (reduced to 100ms for fast initial load)
const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Generic fetch wrapper (for future FastAPI calls) ─────────
async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// ── Dashboard ────────────────────────────────────────────────
export async function getDashboardStats() {
  if (USE_MOCK) {
    await delay(100);
    return { ...dashboardStats };
  }
  return apiFetch('/api/dashboard/stats');
}

export async function getCrowdDensityZones() {
  if (USE_MOCK) {
    await delay(80);
    return [...crowdDensityZones];
  }
  return apiFetch('/api/dashboard/crowd-density');
}

// ── Cameras ──────────────────────────────────────────────────
export async function getCameras() {
  if (USE_MOCK) {
    await delay(120);
    return [...cameras];
  }
  return apiFetch('/api/cameras');
}

export async function getCameraById(cameraId) {
  if (USE_MOCK) {
    await delay(80);
    return cameras.find((c) => c.id === cameraId) || null;
  }
  return apiFetch(`/api/cameras/${cameraId}`);
}

// ── Incidents ────────────────────────────────────────────────
export async function getIncidents(filters = {}) {
  if (USE_MOCK) {
    await delay(100);
    let filtered = [...incidents];
    if (filters.severity) filtered = filtered.filter((i) => i.severity === filters.severity);
    if (filters.category) filtered = filtered.filter((i) => i.category === filters.category);
    if (filters.status) filtered = filtered.filter((i) => i.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/api/incidents?${params}`);
}

export async function getIncidentById(incidentId) {
  if (USE_MOCK) {
    await delay(80);
    return incidents.find((i) => i.id === incidentId) || null;
  }
  return apiFetch(`/api/incidents/${incidentId}`);
}

export async function updateIncidentStatus(incidentId, status) {
  if (USE_MOCK) {
    await delay(100);
    const incident = incidents.find((i) => i.id === incidentId);
    if (incident) {
      incident.status = status;
      if (status === 'resolved') {
        incident.resolvedAt = new Date().toISOString();
      } else if (status === 'acknowledged') {
        incident.acknowledgedAt = new Date().toISOString();
      }
    }
    return { id: incidentId, status, updatedAt: new Date().toISOString() };
  }
  return apiFetch(`/api/incidents/${incidentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Analytics ────────────────────────────────────────────────
export async function getAnalyticsData() {
  if (USE_MOCK) {
    await delay(150);
    return {
      crowdTrend: crowdTrendData,
      incidentsByCategory,
      riskTrend: riskTrendData,
      ppeCompliance: ppeComplianceData,
      cleanliness: cleanlinessData,
      cameraActivity: cameraActivityData,
    };
  }
  return apiFetch('/api/analytics');
}

// ── Stations ─────────────────────────────────────────────────
export async function getStations() {
  if (USE_MOCK) {
    await delay(50);
    return [...stations];
  }
  return apiFetch('/api/stations');
}

// ── System ───────────────────────────────────────────────────
export async function getSystemStatus() {
  if (USE_MOCK) {
    await delay(50);
    return { ...systemStatus };
  }
  return apiFetch('/api/system/status');
}

// ── Settings ─────────────────────────────────────────────────
export async function getSettings() {
  if (USE_MOCK) {
    await delay(100);
    return {
      aiConfidenceThreshold: 75,
      overcrowdingLimit: 80,
      alertSoundEnabled: false,
      autoDispatch: false,
      backendUrl: API_BASE_URL || 'http://localhost:8000',
      useMockData: USE_MOCK,
    };
  }
  return apiFetch('/api/settings');
}

export async function saveSettings(settings) {
  if (USE_MOCK) {
    await delay(150);
    return { success: true, settings };
  }
  return apiFetch('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}
