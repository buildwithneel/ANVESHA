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
  Radio,
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { cn } from '../../utils/cn';
import { RailGuardLogo } from '../common/RailGuardLogo';

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
        'h-full flex flex-col bg-surface border-r border-border transition-all duration-300 ease-in-out select-none z-20 flex-shrink-0 shadow-xs',
        collapsed ? 'w-[68px]' : 'w-[236px]'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-border min-h-[58px] overflow-hidden bg-surface-raised/40">
        {collapsed ? (
          <RailGuardLogo variant="icon" />
        ) : (
          <RailGuardLogo showSubtitle={true} />
        )}
      </div>

      {/* Main Navigation Groups */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-xs font-extrabold text-text-primary dark:text-text-secondary uppercase tracking-wider mb-1.5 font-mono">
                {group.title}
              </div>
            )}

            {group.items.map(({ path, label, icon: Icon, badge, badgeVariant }) => {
              const isActive = location.pathname === path;

              const linkContent = (
                <NavLink
                  to={path}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all tactile-button',
                    isActive
                      ? 'bg-accent text-white font-bold shadow-sm'
                      : 'text-text-primary dark:text-text-secondary hover:text-accent hover:bg-surface-hover'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
                      isActive ? 'text-white' : 'text-text-primary dark:text-text-muted group-hover:text-accent'
                    )}
                  />

                  {!collapsed && <span className="truncate">{label}</span>}

                  {badge !== undefined && !collapsed && (
                    <span
                      className={cn(
                        'ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded-full border shadow-2xs',
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : badgeVariant === 'critical'
                          ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40 font-bold'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-500/40 font-bold'
                      )}
                    >
                      {badge}
                    </span>
                  )}

                  {badge !== undefined && collapsed && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
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
      <div className="p-2.5 border-t border-border space-y-1 bg-surface-raised/40">
        {bottomItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          const link = (
            <NavLink
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all tactile-button',
                isActive
                  ? 'bg-accent text-white font-bold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-text-muted")} />
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

        {/* Collapse Toggle Button */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-xl transition-colors border-t border-border/50 mt-1.5"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
