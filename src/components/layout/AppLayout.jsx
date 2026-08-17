import { Outlet } from 'react-router-dom';
import { useState, useCallback, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationToast from '../common/NotificationToast';

// Global app context for theme, mode, sound, notifications
const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

export default function AppLayout() {
  const [selectedStation, setSelectedStation] = useState('CSMT');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const contextValue = {
    selectedStation,
    setSelectedStation,
    isDemoMode,
    setIsDemoMode,
    soundEnabled,
    setSoundEnabled,
    notifications,
    addNotification,
    dismissNotification,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="flex h-screen w-screen overflow-hidden bg-canvas">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-5 lg:p-6">
            <Outlet context={contextValue} />
          </main>
        </div>

        {/* Notification Toast Layer */}
        <NotificationToast
          notifications={notifications}
          onDismiss={dismissNotification}
          soundEnabled={soundEnabled}
        />
      </div>
    </AppContext.Provider>
  );
}
