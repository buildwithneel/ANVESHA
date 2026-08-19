/**
 * Format timestamp based on format preference ('24h' or '12h')
 */
export function formatTime(dateInput, format = '24h') {
  const date = dateInput ? new Date(dateInput) : new Date();
  const is12 = format === '12h';
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: is12,
  });
}

/**
 * Format timestamp to 24-hour control room time string (HH:mm:ss)
 */
export function formatTime24(dateInput) {
  return formatTime(dateInput, '24h');
}

/**
 * Format full date & time for incident logs
 */
export function formatDateTime(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format relative time (e.g., '2m ago', 'Just now')
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Just now';
  const now = new Date();
  const date = new Date(dateInput);
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 10) return 'Just now';
  if (diffInSec < 60) return `${diffInSec}s ago`;
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return formatDateTime(dateInput);
}

/**
 * Format camera ID into standard code (e.g. CAM-CSMT-PF01-04)
 */
export function formatCameraCode(id) {
  if (!id) return 'CAM-UNKNOWN';
  return id.startsWith('CAM-') ? id : `CAM-${id.toUpperCase()}`;
}

/**
 * Technical to Human-Friendly Event Label Mapping
 */
export const EVENT_LABEL_MAP = {
  NO_HELMET: 'Helmet not detected',
  PPE_VIOLATION: 'PPE compliance issue',
  CROWD_SURGE: 'Crowd surge detected',
  FALL_DETECTED: 'Possible fall detected',
  SLIP_FALL: 'Possible fall detected',
  FALL: 'Possible fall detected',
  WORKER_FALL: 'Possible fall detected',
  INTRUSION: 'Restricted-zone entry detected',
  UNAUTHORIZED_ACCESS: 'Restricted-zone entry detected',
  RESTRICTED_ZONE: 'Restricted-zone entry detected',
  RESTRICTED_WORK_ZONE: 'Restricted-zone entry detected',
  ABANDONED_OBJECT: 'Possible unattended luggage',
  UNATTENDED_LUGGAGE: 'Possible unattended luggage',
  NO_SAFETY_VEST: 'Safety vest not detected',
  TRACK_INTRUSION: 'Track intrusion detected',
  OVERCROWDING: 'Platform overcrowding detected',
  UNSAFE_CROWDING: 'Platform overcrowding detected',
  CROWD: 'Crowd surge detected',
};

/**
 * Format technical AI event names into human-friendly operational labels for display
 */
export function formatEventLabel(type) {
  if (!type) return 'Safety Event';
  const key = String(type).toUpperCase().trim().replace(/\s+/g, '_');
  if (EVENT_LABEL_MAP[key]) return EVENT_LABEL_MAP[key];
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format Crowd Status with standard operational severity indicators
 */
export function formatCrowdStatus(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'LOW') {
    return { label: 'LOW', colorClass: 'text-emerald-400', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  }
  if (s === 'MODERATE') {
    return { label: 'MODERATE', colorClass: 'text-amber-400', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
  }
  if (s === 'HIGH') {
    return { label: 'HIGH', colorClass: 'text-orange-400', badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30' };
  }
  if (s === 'CRITICAL') {
    return { label: 'CRITICAL', colorClass: 'text-rose-400', badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-bold' };
  }
  return { label: s || 'NORMAL', colorClass: 'text-slate-300', badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
}

