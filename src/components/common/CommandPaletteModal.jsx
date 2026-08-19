import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Camera,
  AlertTriangle,
  Users,
  HardHat,
  AlertOctagon,
  MapPin,
  Moon,
  Sun,
  Play,
  ArrowRight,
  Sparkles,
  Command,
  X,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { dashboardService } from '../../services/dashboardService';
import { useTheme } from '../../hooks/useTheme';

export function CommandPaletteModal({
  isOpen,
  onClose,
  onRunDemo,
}) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Default Quick Commands
  const defaultCommands = [
    {
      id: 'cmd-cctv',
      title: 'Open CCTV Command Center',
      category: 'NAVIGATION',
      icon: Camera,
      shortcut: 'G C',
      action: () => navigate('/live-monitoring'),
    },
    {
      id: 'cmd-alerts',
      title: 'View Active Safety & Security Alerts',
      category: 'NAVIGATION',
      icon: AlertTriangle,
      shortcut: 'G A',
      action: () => navigate('/alerts'),
    },
    {
      id: 'cmd-crowd',
      title: 'Open Crowd Intelligence & Density Heatmaps',
      category: 'NAVIGATION',
      icon: Users,
      shortcut: 'G P',
      action: () => navigate('/crowd-intelligence'),
    },
    {
      id: 'cmd-worker',
      title: 'Open Worker Safety & PPE Compliance',
      category: 'NAVIGATION',
      icon: HardHat,
      shortcut: 'G W',
      action: () => navigate('/worker-safety'),
    },
    {
      id: 'cmd-incidents',
      title: 'View Incident Investigation Management',
      category: 'NAVIGATION',
      icon: AlertOctagon,
      shortcut: 'G I',
      action: () => navigate('/incidents'),
    },
    {
      id: 'cmd-map',
      title: 'Open 2D/3D Station Layout Map',
      category: 'NAVIGATION',
      icon: MapPin,
      shortcut: 'G M',
      action: () => navigate('/station-map'),
    },
    {
      id: 'cmd-theme',
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      category: 'SYSTEM',
      icon: theme === 'dark' ? Sun : Moon,
      shortcut: 'T',
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'cmd-demo',
      title: 'Run Integrated Operational Demo Scenario',
      category: 'DEMO',
      icon: Play,
      shortcut: 'D',
      action: () => {
        if (onRunDemo) onRunDemo();
        else dashboardService.triggerIntegratedDemo();
      },
    },
  ];

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSearchResults(null);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global search debounced query
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await dashboardService.globalSearch(query);
        setSearchResults(res);
        setSelectedIndex(0);
      } catch (e) {
        console.warn('Search error:', e);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Filtered commands list
  const filteredCommands = query.trim()
    ? defaultCommands.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : defaultCommands;

  // Keyboard navigation within command palette
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectResult = (item) => {
    if (item.route) {
      navigate(item.route, { state: item.state });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-raised">
          <Search className="w-5 h-5 text-accent flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search cameras, alerts, incidents, locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
            <span>ESC</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
          {/* If Search Results returned */}
          {searchResults && searchResults.total_results > 0 ? (
            <div className="space-y-3">
              {/* Cameras */}
              {searchResults.cameras?.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    CAMERAS ({searchResults.cameras.length})
                  </div>
                  {searchResults.cameras.map((cam) => (
                    <div
                      key={cam.id}
                      onClick={() => handleSelectResult(cam)}
                      className="px-3 py-2 rounded-lg hover:bg-surface-hover cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Camera className="w-4 h-4 text-accent" />
                        <div>
                          <div className="font-bold text-text-primary">{cam.title}</div>
                          <div className="text-[11px] text-text-muted">{cam.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border">
                        {cam.badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Alerts */}
              {searchResults.alerts?.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    ALERTS ({searchResults.alerts.length})
                  </div>
                  {searchResults.alerts.map((alt) => (
                    <div
                      key={alt.id}
                      onClick={() => handleSelectResult(alt)}
                      className="px-3 py-2 rounded-lg hover:bg-surface-hover cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <div>
                          <div className="font-bold text-text-primary">{alt.title}</div>
                          <div className="text-[11px] text-text-muted">{alt.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
                        {alt.badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Incidents */}
              {searchResults.incidents?.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    INCIDENTS ({searchResults.incidents.length})
                  </div>
                  {searchResults.incidents.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => handleSelectResult(inc)}
                      className="px-3 py-2 rounded-lg hover:bg-surface-hover cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertOctagon className="w-4 h-4 text-orange-500" />
                        <div>
                          <div className="font-bold text-text-primary">{inc.title}</div>
                          <div className="text-[11px] text-text-muted">{inc.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                        {inc.badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Locations */}
              {searchResults.locations?.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    LOCATIONS ({searchResults.locations.length})
                  </div>
                  {searchResults.locations.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectResult(loc)}
                      className="px-3 py-2 rounded-lg hover:bg-surface-hover cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-bold text-text-primary">{loc.title}</div>
                          <div className="text-[11px] text-text-muted">{loc.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {loc.badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : query.trim() && searchResults?.total_results === 0 && filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-text-muted">
              No matching commands or entities found for &quot;{query}&quot;.
            </div>
          ) : (
            /* Commands List */
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                COMMANDS & QUICK ACTIONS
              </div>
              {filteredCommands.map((cmd) => {
                const IconComponent = cmd.icon;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className="px-3 py-2 rounded-lg hover:bg-surface-hover cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-surface-raised border border-border text-accent">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary text-xs">{cmd.title}</div>
                        <div className="text-[10px] text-text-muted font-mono">{cmd.category}</div>
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <span className="font-mono text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                        {cmd.shortcut}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-surface-raised border-t border-border flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <span className="font-mono text-text-secondary font-semibold">Ctrl + K</span>
          </div>
          <span className="text-[10px] font-mono">ANVESHA Unified Command Desk</span>
        </div>
      </div>
    </div>
  );
}
