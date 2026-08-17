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
