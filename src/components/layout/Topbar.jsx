import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  ChevronDown,
  Bell,
  Languages,
  Sun,
  Moon,
  Laptop,
  UserCheck,
  Search,
  Volume2,
  VolumeX,
  HelpCircle,
  Camera,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { SearchInput } from '../ui/SearchInput';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { mockStationData } from '../../data/mockStationData';
import { useTranslation, LANGUAGES } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { formatTime24 } from '../../utils/formatters';
import { soundService } from '../../services/soundService';
import { authService } from '../../services/authService';
import { cn } from '../../utils/cn';

export function Topbar({
  selectedStation,
  onSelectStation,
  unreadAlertsCount = 2,
  onOpenNotifications,
  onOpenShortcuts,
  alertsList = [],
}) {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [currentTime, setCurrentTime] = useState(() => formatTime24());
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSoundOn, setIsSoundOn] = useState(() => soundService.isSoundEnabled());
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(formatTime24()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener for Global Search ('/' key) and Shortcuts ('?' key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '?' && onOpenShortcuts) {
        e.preventDefault();
        onOpenShortcuts();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenShortcuts]);

  const handleToggleSound = () => {
    const newState = soundService.toggleSound();
    setIsSoundOn(newState);
  };

  const currentStation =
    mockStationData.stations.find((s) => s.id === selectedStation) ||
    mockStationData.stations[0];

  // Quick Search Results
  const searchResults = React.useMemo(() => {
    if (!searchValue.trim()) return [];
    const q = searchValue.trim().toLowerCase();

    const matchedAlerts = alertsList
      .filter((a) =>
        (a.id || '').toLowerCase().includes(q) ||
        (a.type || '').toLowerCase().includes(q) ||
        (a.message || '').toLowerCase().includes(q) ||
        (a.cameraId || a.camera_id || '').toLowerCase().includes(q)
      )
      .slice(0, 4);

    return matchedAlerts;
  }, [searchValue, alertsList]);

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-surface text-text-primary z-30 flex-shrink-0">
      {/* Left: Station / Division Context */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-canvas border border-border hover:border-border-strong transition-colors text-xs sm:text-sm font-medium"
            aria-expanded={stationDropdownOpen}
            aria-label="Select Station Context"
          >
            <Radio className="w-4 h-4 text-accent" />
            <span className="font-semibold text-text-primary">{currentStation.code}</span>
            <span className="text-text-muted hidden md:inline">· {currentStation.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted ml-1" />
          </button>

          {stationDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setStationDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1.5 w-64 rg-card p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  Station / Division Context
                </div>
                {mockStationData.stations.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      onSelectStation(st.id);
                      setStationDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-left transition-colors ${
                      st.id === selectedStation
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{st.name}</div>
                      <div className="text-[10px] text-text-muted">{st.zone}</div>
                    </div>
                    <span className="text-[10px] font-mono bg-canvas px-1.5 py-0.5 rounded border border-border">
                      {st.activeCameras} Cams
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Real-time Digital Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-canvas border border-border font-mono text-xs text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{currentTime} IST</span>
        </div>
      </div>

      {/* Center: Global Command Search Input */}
      <div className="relative flex-1 max-w-xs sm:max-w-md mx-4">
        <SearchInput
          inputRef={searchInputRef}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setSearchDropdownOpen(true);
          }}
          onFocus={() => setSearchDropdownOpen(true)}
          placeholder={t('topbar.searchPlaceholder', 'Search cameras, alerts, stations... (Press /)')}
          onClear={() => {
            setSearchValue('');
            setSearchDropdownOpen(false);
          }}
        />

        {/* Quick Search Dropdown */}
        {searchDropdownOpen && searchValue.trim().length > 1 && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setSearchDropdownOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1.5 rg-card p-2 shadow-xl z-50 space-y-1 animate-in fade-in slide-in-from-top-1">
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                <span>Matching Alerts & Safety Events</span>
                <span className="font-mono">{searchResults.length} results</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-muted text-center">
                  No matching active alerts found for "{searchValue}"
                </div>
              ) : (
                searchResults.map((alt) => (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      setSearchValue('');
                      navigate('/alerts');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-left hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-text-primary">
                          {alt.id} · {alt.type?.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-[10px] text-text-muted line-clamp-1">
                          {alt.message}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] bg-canvas px-1.5 py-0.5 rounded border border-border">
                      {alt.cameraId || alt.camera_id || 'CAM'}
                    </span>
                  </button>
                ))
              )}

              <div className="border-t border-border pt-1.5 px-2 flex items-center justify-between text-[10px] text-text-muted">
                <span>Jump to page:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      navigate('/alerts');
                    }}
                    className="hover:text-accent underline"
                  >
                    Alerts Center
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      navigate('/incidents');
                    }}
                    className="hover:text-accent underline"
                  >
                    Incidents Log
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Actions, Sound, Shortcuts, Language, Theme, Notifications & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sound Toggle Button */}
        <Tooltip content={isSoundOn ? 'Operational Audio Alerts: ON' : 'Operational Audio Alerts: MUTED'}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSound}
            ariaLabel={isSoundOn ? 'Mute operational audio' : 'Enable operational audio'}
            className={isSoundOn ? 'text-emerald-500' : 'text-text-muted'}
            icon={isSoundOn ? Volume2 : VolumeX}
          />
        </Tooltip>

        {/* Keyboard Shortcuts Helper */}
        {onOpenShortcuts && (
          <Tooltip content="Keyboard Shortcuts (Press ?)">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenShortcuts}
              ariaLabel="Keyboard Shortcuts Helper"
              icon={HelpCircle}
            />
          </Tooltip>
        )}

        {/* Language Selector */}
        <div className="relative">
          <Tooltip content={t('topbar.language', 'Language')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              ariaLabel="Select Language"
              icon={Languages}
            />
          </Tooltip>

          {langDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-36 rg-card p-1 shadow-lg z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                      language === lang.code
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    {lang.nativeName} ({lang.code.toUpperCase()})
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Theme Selector */}
        <div className="relative">
          <Tooltip content={`${t('topbar.theme', 'Theme')}: ${theme.toUpperCase()}`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              ariaLabel="Select Theme Mode"
              icon={theme === 'dark' ? Moon : theme === 'light' ? Sun : Laptop}
            />
          </Tooltip>

          {themeDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setThemeDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-32 rg-card p-1 shadow-lg z-50">
                {[
                  { key: 'light', label: t('topbar.light', 'Light'), icon: Sun },
                  { key: 'dark', label: t('topbar.dark', 'Dark'), icon: Moon },
                  { key: 'system', label: t('topbar.system', 'System'), icon: Laptop },
                ].map(({ key, label, icon: ModeIcon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTheme(key);
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
                      theme === key
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    <ModeIcon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <Tooltip content="Active Operational Notifications">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>
        </Tooltip>

        {/* Operator Profile / Status & Logout Dropdown */}
        <OperatorProfileMenu />
      </div>
    </header>
  );
}

function OperatorProfileMenu() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  const handleRoleSwitch = (role) => {
    const updated = authService.switchRole(role);
    setCurrentUser(updated);
    setMenuOpen(false);
  };

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="relative pl-2 border-l border-border">
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-hover transition-colors text-left focus:outline-none focus:ring-1 focus:ring-accent"
        aria-expanded={menuOpen}
        aria-label="User Profile and Session Menu"
      >
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border shadow-2xs",
          isAdmin
            ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800"
            : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
        )}>
          {currentUser.name ? currentUser.name.charAt(0) : 'R'}
        </div>
        <div className="hidden sm:block text-left text-xs leading-tight">
          <div className="font-semibold text-text-primary truncate max-w-[120px]">
            {currentUser.name || 'Rahul Sharma'}
          </div>
          <div className="text-[10px] text-text-muted font-mono flex items-center gap-1">
            <span>{currentUser.employee_id || 'RLY-10042'}</span>
            <span>·</span>
            <span className="font-bold text-accent">{currentUser.role}</span>
          </div>
        </div>
        <ChevronDown className="w-3 h-3 text-text-muted hidden sm:block" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-64 rg-card p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 text-xs select-none space-y-2.5">
            {/* Header info */}
            <div className="pb-2 border-b border-border space-y-1">
              <div className="font-bold text-text-primary text-sm flex items-center justify-between">
                <span>{currentUser.name}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold",
                  isAdmin
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                    : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                )}>
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[11px] text-text-muted font-mono">
                Employee ID: <strong>{currentUser.employee_id}</strong>
              </div>
              <div className="text-[10px] text-text-secondary">
                {currentUser.department || 'Platform Operations'} · {currentUser.station || 'Vadodara (BRC)'}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center justify-between"
              >
                <span>Operator Preferences</span>
                <span className="text-[10px] text-text-muted font-mono">/settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/system-health');
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center justify-between"
              >
                <span>System Security & Health</span>
                <span className="text-[10px] text-text-muted font-mono">/system-health</span>
              </button>

              {/* Demo role switch shortcut */}
              <button
                type="button"
                onClick={() => handleRoleSwitch(isAdmin ? 'OFFICER' : 'ADMIN')}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center justify-between text-[11px]"
              >
                <span>Switch to {isAdmin ? 'Duty Officer' : 'Station Admin'}</span>
                <span className="text-[9px] font-mono px-1 rounded bg-surface border border-border">Demo</span>
              </button>
            </div>

            {/* Sign Out Button */}
            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-1.5 px-3 rounded-md bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 font-bold transition-colors text-center"
              >
                Sign Out Session
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Topbar;
