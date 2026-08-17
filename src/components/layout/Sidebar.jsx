import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  MapPin,
  Bell,
  AlertTriangle,
  Users,
  HardHat,
  BarChart3,
  FileText,
  Camera,
  Activity,
  Settings,
  HelpCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { cn } from '../../utils/cn';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const navGroups = [
    {
      title: t('nav.command', 'COMMAND'),
      items: [
        { path: '/dashboard', label: t('nav.overview', 'Overview'), icon: LayoutDashboard },
        { path: '/live-monitoring', label: t('nav.liveMonitoring', 'Live Monitoring'), icon: Video },
        { path: '/station-map', label: t('nav.stationMap', 'Station Map'), icon: MapPin },
      ],
    },
    {
      title: t('nav.operations', 'OPERATIONS'),
      items: [
        { path: '/alerts', label: t('nav.alerts', 'Alerts'), icon: Bell, badge: 3, badgeVariant: 'critical' },
        { path: '/incidents', label: t('nav.incidents', 'Incidents'), icon: AlertTriangle, badge: 2, badgeVariant: 'warning' },
        { path: '/crowd-intelligence', label: t('nav.crowdIntelligence', 'Crowd Intelligence'), icon: Users },
        { path: '/worker-safety', label: t('nav.workerSafety', 'Worker Safety'), icon: HardHat },
      ],
    },
    {
      title: t('nav.analytics', 'ANALYTICS'),
      items: [
        { path: '/analytics', label: t('nav.analyticsPage', 'Analytics'), icon: BarChart3 },
        { path: '/reports', label: t('nav.reports', 'Reports'), icon: FileText },
      ],
    },
    {
      title: t('nav.system', 'SYSTEM'),
      items: [
        { path: '/system-cameras', label: t('nav.cameras', 'Cameras'), icon: Camera },
        { path: '/system-health', label: t('nav.systemHealth', 'System Health'), icon: Activity },
      ],
    },
  ];

  const bottomItems = [
    { path: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
    { path: '/help', label: t('nav.help', 'Help'), icon: HelpCircle },
  ];

  return (
    <aside
      className={cn(
        'h-full flex flex-col bg-surface border-r border-border transition-all duration-200 ease-in-out select-none z-20 flex-shrink-0',
        collapsed ? 'w-[64px]' : 'w-[230px]'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border min-h-[56px]">
        <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-sm font-bold text-text-primary tracking-tight leading-none">
              RailGuard AI
            </h1>
            <p className="text-[10px] text-text-muted mt-0.5">Control Desk v1.0</p>
          </div>
        )}
      </div>

      {/* Main Navigation Groups */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                {group.title}
              </div>
            )}

            {group.items.map(({ path, label, icon: Icon, badge, badgeVariant }) => {
              const isActive = location.pathname === path;

              const linkContent = (
                <NavLink
                  to={path}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-accent-soft text-accent font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 flex-shrink-0 transition-colors',
                      isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'
                    )}
                  />

                  {!collapsed && <span className="truncate">{label}</span>}

                  {badge !== undefined && !collapsed && (
                    <span
                      className={cn(
                        'ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full border',
                        badgeVariant === 'critical'
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      )}
                    >
                      {badge}
                    </span>
                  )}

                  {badge !== undefined && collapsed && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600" />
                  )}
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={path} content={label} position="right">
                  {linkContent}
                </Tooltip>
              ) : (
                <React.Fragment key={path}>{linkContent}</React.Fragment>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-border space-y-1 bg-surface-raised/30">
        {bottomItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          const link = (
            <NavLink
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                isActive
                  ? 'bg-accent-soft text-accent font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0 text-text-muted" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );

          return collapsed ? (
            <Tooltip key={path} content={label} position="right">
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors border-t border-border/50 mt-1"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
