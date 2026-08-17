import React from 'react';
import { getSeverityConfig } from '../../utils/severity';
import { cn } from '../../utils/cn';

/**
 * StatusBadge - Accessible Severity and Operational Status Badge
 * Never relies on color alone — always includes text label and unique icon indicator.
 */
export function StatusBadge({ severity, status, className, showIcon = true, size = 'md' }) {
  const config = getSeverityConfig(severity || status);
  const Icon = config.icon;

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-xs font-semibold gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      role="status"
      aria-label={config.ariaLabel}
      className={cn(
        'inline-flex items-center font-semibold border rounded-md uppercase tracking-wider',
        config.badgeClass,
        sizes[size],
        className
      )}
    >
      {showIcon && Icon && <Icon className={cn(iconSizes[size], 'flex-shrink-0')} aria-hidden="true" />}
      <span>{config.code ? `${config.code} · ${config.level}` : config.label}</span>
    </span>
  );
}
