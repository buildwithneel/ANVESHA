import { useState, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  Clock,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import { stations } from '../../data/mockData';
import { useAppContext } from './AppLayout';

export default function Header() {
  const {
    selectedStation,
    setSelectedStation,
    isDemoMode,
    setIsDemoMode,
    soundEnabled,
    setSoundEnabled,
    notifications,
  } = useAppContext();

  const [time, setTime] = useState(new Date());
  const [stationDropdown, setStationDropdown] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentStation = stations.find((s) => s.id === selectedStation) || stations[0];
  const unreadCount = notifications.length;

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-surface z-50">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Station Selector */}
        <div className="relative">
          <button
            onClick={() => setStationDropdown(!stationDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas border border-border hover:border-border-strong transition-colors"
          >
            <Radio size={14} className="text-accent" />
            <span className="text-sm font-medium text-text-primary">{currentStation.name}</span>
            <span className="text-[10px] text-text-muted hidden lg:inline">·</span>
            <span className="text-[10px] text-text-muted hidden lg:inline">{currentStation.zone}</span>
            <ChevronDown size={14} className="text-text-muted" />
          </button>
          {stationDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setStationDropdown(false)} />
              <div className="absolute top-full left-0 mt-1 w-64 card p-1 z-50 animate-slide-in shadow-lg shadow-black/8">
                {stations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => {
                      setSelectedStation(station.id);
                      setStationDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      station.id === selectedStation
                        ? 'bg-accent-soft text-accent'
                        : 'text-text-secondary hover:bg-canvas hover:text-text-primary'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{station.name}</p>
                      <p className="text-[10px] text-text-muted">{station.zone}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Live / Demo Mode Toggle */}
        <button
          onClick={() => setIsDemoMode(!isDemoMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            isDemoMode
              ? 'bg-status-attention-bg border-status-attention-border text-status-attention'
              : 'bg-status-normal-bg border-status-normal-border text-status-normal'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-status-attention' : 'bg-status-normal'}`} />
          {isDemoMode ? 'DEMO' : 'LIVE'}
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors"
          title={soundEnabled ? 'Sound on' : 'Sound muted'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors">
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-status-critical text-white text-[9px] flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas border border-border">
          <Clock size={12} className="text-text-muted" />
          <span className="text-xs font-mono text-text-secondary">
            {time.toLocaleTimeString('en-IN', { hour12: false })}
          </span>
        </div>
      </div>
    </header>
  );
}
