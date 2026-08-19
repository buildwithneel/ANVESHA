// ============================================================
// RailGuard AI — API Service Layer
// Abstracts data fetching for easy FastAPI migration
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const USE_MOCK = false; // Prefers real FastAPI backend data when available

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

// Simulate slight network latency for mock fallback
const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Generic fetch wrapper for FastAPI endpoints ─────────
async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const response = await fetch(url, {
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
  if (!USE_MOCK) {
    try {
      return await apiFetch('/dashboard/summary');
    } catch (err) {
      console.warn('[API] getDashboardStats fallback to mock:', err.message);
    }
  }
  await delay(100);
  return { ...dashboardStats };
}

export async function getCrowdDensityZones() {
  if (!USE_MOCK) {
    try {
      return await apiFetch('/crowd');
    } catch (err) {
      console.warn('[API] getCrowdDensityZones fallback to mock:', err.message);
    }
  }
  await delay(80);
  return [...crowdDensityZones];
}

// ── Cameras ──────────────────────────────────────────────────
export async function getCameras() {
  if (!USE_MOCK) {
    try {
      return await apiFetch('/cameras');
    } catch (err) {
      console.warn('[API] getCameras fallback to mock:', err.message);
    }
  }
  await delay(120);
  return [...cameras];
}

export async function getCameraById(cameraId) {
  if (!USE_MOCK) {
    try {
      return await apiFetch(`/cameras/${cameraId}`);
    } catch (err) {
      console.warn(`[API] getCameraById(${cameraId}) fallback to mock:`, err.message);
    }
  }
  await delay(80);
  return cameras.find((c) => c.id === cameraId) || null;
}

// ── Incidents ────────────────────────────────────────────────
export async function getIncidents(filters = {}) {
  if (!USE_MOCK) {
    try {
      const params = new URLSearchParams(filters).toString();
      return await apiFetch(`/incidents?${params}`);
    } catch (err) {
      console.warn('[API] getIncidents fallback to mock:', err.message);
    }
  }
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

export async function getIncidentById(incidentId) {
  if (!USE_MOCK) {
    try {
      return await apiFetch(`/incidents/${incidentId}`);
    } catch (err) {
      console.warn(`[API] getIncidentById(${incidentId}) fallback to mock:`, err.message);
    }
  }
  await delay(80);
  return incidents.find((i) => i.id === incidentId) || null;
}

export async function updateIncidentStatus(incidentId, status) {
  if (!USE_MOCK) {
    try {
      return await apiFetch(`/incidents/${incidentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn(`[API] updateIncidentStatus(${incidentId}) fallback to mock:`, err.message);
    }
  }
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

// ── Analytics ────────────────────────────────────────────────
export async function getAnalyticsData() {
  if (!USE_MOCK) {
    try {
      return await apiFetch('/ai/analytics/summary');
    } catch (err) {
      console.warn('[API] getAnalyticsData fallback to mock:', err.message);
    }
  }
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

// ── Stations ─────────────────────────────────────────────────
export async function getStations() {
  if (!USE_MOCK) {
    try {
      return await apiFetch('/stations');
    } catch (err) {
      console.warn('[API] getStations fallback to mock:', err.message);
    }
  }
  await delay(50);
  return [...stations];
}

// ── System ───────────────────────────────────────────────────
export async function getSystemStatus() {
  if (!USE_MOCK) {
    try {
      return await apiFetch('/system/status');
    } catch (err) {
      console.warn('[API] getSystemStatus fallback to mock:', err.message);
    }
  }
  await delay(50);
  return { ...systemStatus };
}

// ── Settings ─────────────────────────────────────────────────
export async function getSettings() {
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
