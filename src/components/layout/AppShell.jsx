import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { I18nProvider } from '../../i18n';
import { Drawer } from '../ui/Drawer';
import { AlertCard } from '../common/AlertCard';
import { CriticalAlertToast } from '../common/CriticalAlertToast';
import { AlertDetailsDrawer } from '../alerts/AlertDetailsDrawer';
import { ShortcutsHelpModal } from '../common/ShortcutsHelpModal';
import { CommandPaletteModal } from '../common/CommandPaletteModal';
import { alertService } from '../../services/alertService';
import { webSocketService } from '../../services/websocket';
import { soundService } from '../../services/soundService';
import { mockAlerts } from '../../data/mockAlerts';
import { Wifi, WifiOff, RefreshCw, Radio, Clock, Camera, ShieldAlert, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';
import { getSeverityConfig } from '../../utils/severity';
import { cn } from '../../utils/cn';

export function AppShell() {
  const navigate = useNavigate();
  const [selectedStation, setSelectedStation] = useState('BRC');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [alertsList, setAlertsList] = useState(mockAlerts);
  const [activeToastAlert, setActiveToastAlert] = useState(null);
  const [selectedNotificationAlert, setSelectedNotificationAlert] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [showStatusBanner, setShowStatusBanner] = useState(false);
  const statusTimerRef = useRef(null);

  // Global Ctrl + K listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial alerts from REST backend
  useEffect(() => {
    let isMounted = true;
    async function loadAlerts() {
      try {
        const liveAlerts = await alertService.getAlerts();
        if (isMounted && Array.isArray(liveAlerts) && liveAlerts.length > 0) {
          const formatted = liveAlerts.map((a) => ({
            id: a.id,
            camera_id: a.camera_id,
            cameraId: a.camera_id,
            type: a.type,
            severity: (a.severity || 'MEDIUM').toUpperCase(),
            status: (a.status || 'ACTIVE').toUpperCase(),
            message: a.message,
            confidence: a.confidence,
            riskScore: a.risk_score || a.riskScore || 75,
            risk_score: a.risk_score || 75,
            timestamp: a.created_at || new Date().toISOString(),
            createdAt: a.created_at,
          }));
          setAlertsList(formatted);
        }
      } catch (err) {
        console.warn('[AppShell] Falling back to initial alerts dataset:', err);
      }
    }
    loadAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  // WebSocket Connection & Real-Time Event Subscriptions
  useEffect(() => {
    // Connect WebSocket
    webSocketService.connect();

    // Listen for connection status changes
    const unsubStatus = webSocketService.onStatusChange((status) => {
      setWsStatus(status);
      setShowStatusBanner(true);

      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (status === 'connected') {
        statusTimerRef.current = setTimeout(() => setShowStatusBanner(false), 3500);
      }
    });

    // 1. Subscribe to new_alert
    const unsubNewAlert = webSocketService.subscribe('new_alert', (newAlert) => {
      console.log('[Real-Time]: Received new_alert event:', newAlert);
      const sev = (newAlert.severity || 'HIGH').toUpperCase();
      const formatted = {
        id: newAlert.id || `ALT-${Date.now()}`,
        camera_id: newAlert.camera_id,
        cameraId: newAlert.camera_id,
        type: newAlert.type,
        severity: sev,
        status: 'ACTIVE',
        message: newAlert.message || `${newAlert.type?.replace('_', ' ').toUpperCase()} detected`,
        confidence: newAlert.confidence || 0.94,
        riskScore: newAlert.risk_score || 90,
        risk_score: newAlert.risk_score || 90,
        timestamp: newAlert.created_at || new Date().toISOString(),
        createdAt: newAlert.created_at || new Date().toISOString(),
      };

      setAlertsList((prev) => [formatted, ...prev.filter((a) => a.id !== formatted.id)]);

      // Play audio chime for CRITICAL alerts
      if (sev === 'CRITICAL') {
        soundService.playAlertSound('CRITICAL');
      }

      // Display professional toast for CRITICAL / HIGH alerts
      if (sev === 'CRITICAL' || sev === 'HIGH') {
        setActiveToastAlert(formatted);
      }
    });

    // 2. Subscribe to alert_updated
    const unsubAlertUpdated = webSocketService.subscribe('alert_updated', (updatedAlert) => {
      console.log('[Real-Time]: Received alert_updated event:', updatedAlert);
      setAlertsList((prev) =>
        prev.map((a) =>
          a.id === updatedAlert.id
            ? { ...a, status: updatedAlert.status?.toUpperCase() || a.status, severity: updatedAlert.severity || a.severity }
            : a
        )
      );
    });

    // 3. Subscribe to new_detection
    const unsubDetection = webSocketService.subscribe('new_detection', (detection) => {
      console.log('[Real-Time]: Received live detection:', detection);
    });

    return () => {
      unsubStatus();
      unsubNewAlert();
      unsubAlertUpdated();
      unsubDetection();
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const handleAcknowledge = useCallback(async (alertId) => {
    setAlertsList((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
    );
    try {
      await alertService.acknowledgeAlert(alertId);
    } catch (e) {
      console.warn('Could not sync acknowledge to backend:', e);
    }
  }, []);

  const handleResolve = useCallback(async (alertId) => {
    setAlertsList((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED' } : a))
    );
    try {
      await alertService.resolveAlert(alertId);
    } catch (e) {
      console.warn('Could not sync resolve to backend:', e);
    }
  }, []);

  const activeUnreadCount = alertsList.filter((a) => (a.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;

  return (
    <I18nProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-canvas text-text-primary">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Work Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          <Topbar
            selectedStation={selectedStation}
            onSelectStation={setSelectedStation}
            unreadAlertsCount={activeUnreadCount}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            alertsList={alertsList}
          />

          {/* Non-intrusive Connection Status Toast/Banner */}
          {showStatusBanner && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full text-[11px] font-medium shadow-md flex items-center gap-1.5 transition-all duration-300 pointer-events-none">
              {wsStatus === 'connected' && (
                <div className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 px-3 py-0.5 rounded-full">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-time connection active</span>
                </div>
              )}
              {wsStatus === 'reconnecting' && (
                <div className="bg-amber-950/90 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 px-3 py-0.5 rounded-full">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Real-time connection unavailable · Attempting to reconnect...</span>
                </div>
              )}
              {wsStatus === 'disconnected' && (
                <div className="bg-slate-900/90 text-slate-300 border border-slate-700 flex items-center gap-1.5 px-3 py-0.5 rounded-full">
                  <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Real-time connection unavailable · Attempting to reconnect...</span>
                </div>
              )}
            </div>
          )}

          {/* Active Critical Alert Toast */}
          <CriticalAlertToast
            alert={activeToastAlert}
            onAcknowledge={(id) => handleAcknowledge(id)}
            onDismiss={() => setActiveToastAlert(null)}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet context={{ selectedStation, setSelectedStation, alertsList, activeUnreadCount }} />
          </main>
        </div>

        {/* Global Notifications Drawer (Notification Center) */}
        <Drawer
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          title="Operational Notification Center"
          subtitle="Real-time priority CCTV detection stream and safety notifications"
        >
          <div className="space-y-3">
            {alertsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted">
                No active notifications recorded.
              </div>
            ) : (
              alertsList.map((alert) => {
                const sev = (alert.severity || 'MEDIUM').toUpperCase();
                const sevConfig = getSeverityConfig(sev);
                const camId = alert.cameraId || alert.camera_id || 'CAM-01';
                const timeAgo = formatRelativeTime(alert.timestamp || alert.created_at || alert.createdAt);

                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setSelectedNotificationAlert(alert);
                    }}
                    className={cn(
                      'p-3 rounded-lg border bg-surface hover:bg-surface-hover cursor-pointer transition-all space-y-1.5 border-l-4 group',
                      sevConfig.borderClass
                    )}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.2 rounded uppercase font-mono', sevConfig.bgClass, sevConfig.textClass)}>
                          {sev}
                        </span>
                        <span className="font-bold text-text-primary text-xs group-hover:text-accent transition-colors">
                          {alert.type ? alert.type.replace(/_/g, ' ').toUpperCase() : alert.title || 'SECURITY ALERT'}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted font-mono">{alert.id}</span>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-1">
                      {alert.message || alert.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/40 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3 h-3 text-text-muted" />
                        <span>{camId}</span>
                        <span>·</span>
                        <span>{alert.location || 'Vadodara Station'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Drawer>

        {/* Direct Alert Details Drawer (Triggered from Notification click) */}
        <AlertDetailsDrawer
          isOpen={!!selectedNotificationAlert}
          onClose={() => setSelectedNotificationAlert(null)}
          alert={selectedNotificationAlert}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
          onViewFeed={(alt) => {
            setSelectedNotificationAlert(null);
            setNotificationsOpen(false);
            const camId = alt.cameraId || alt.camera_id || 'CAM-01';
            navigate('/live-monitoring', {
              state: {
                cameraId: camId,
                alertId: alt.id,
                highlightDetection: true,
                eventTitle: alt.type || alt.title || alt.message,
              },
            });
          }}
        />

        {/* Global Shortcuts Help Modal */}
        <ShortcutsHelpModal
          isOpen={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />

        {/* Universal Command Palette (Ctrl + K) */}
        <CommandPaletteModal
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </div>
    </I18nProvider>
  );
}

export default AppShell;
