import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  OctagonAlert,
  Info,
} from 'lucide-react';

/**
 * Severity configuration matrix.
 * Every severity level MUST provide color, text label, badge style, icon, and ARIA label
 * so users with color vision deficiencies can easily distinguish severities.
 */
export const SEVERITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
  INFO: 'INFO',
};

export const SEVERITY_CONFIG = {
  [SEVERITY_LEVELS.LOW]: {
    level: SEVERITY_LEVELS.LOW,
    label: 'Low Severity',
    code: 'SEV-4',
    icon: ShieldCheck,
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-l-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    ariaLabel: 'Severity Level 4: Low',
  },
  [SEVERITY_LEVELS.MEDIUM]: {
    level: SEVERITY_LEVELS.MEDIUM,
    label: 'Medium Severity',
    code: 'SEV-3',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500',
    borderClass: 'border-l-amber-500',
    textClass: 'text-amber-700 dark:text-amber-400',
    ariaLabel: 'Severity Level 3: Medium',
  },
  [SEVERITY_LEVELS.HIGH]: {
    level: SEVERITY_LEVELS.HIGH,
    label: 'High Severity',
    code: 'SEV-2',
    icon: AlertCircle,
    badgeClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
    dotClass: 'bg-orange-500',
    borderClass: 'border-l-orange-500',
    textClass: 'text-orange-700 dark:text-orange-400',
    ariaLabel: 'Severity Level 2: High',
  },
  [SEVERITY_LEVELS.CRITICAL]: {
    level: SEVERITY_LEVELS.CRITICAL,
    label: 'Critical Severity',
    code: 'SEV-1',
    icon: OctagonAlert,
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 font-bold',
    dotClass: 'bg-rose-600 animate-pulse',
    borderClass: 'border-l-rose-600',
    textClass: 'text-rose-700 dark:text-rose-400',
    ariaLabel: 'Severity Level 1: Critical Emergency',
  },
  [SEVERITY_LEVELS.INFO]: {
    level: SEVERITY_LEVELS.INFO,
    label: 'Info',
    code: 'SEV-5',
    icon: Info,
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-500',
    borderClass: 'border-l-blue-500',
    textClass: 'text-blue-700 dark:text-blue-400',
    ariaLabel: 'Information Note',
  },
};

/**
 * Get normalized severity configuration object.
 * @param {string} severity 
 * @returns {object}
 */
export function getSeverityConfig(severity) {
  const normalized = (severity || '').toUpperCase();
  return SEVERITY_CONFIG[normalized] || SEVERITY_CONFIG[SEVERITY_LEVELS.INFO];
}
