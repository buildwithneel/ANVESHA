import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

import OverviewPage from './pages/OverviewPage';
import LiveMonitoringPage from './pages/LiveMonitoringPage';
import StationMapPage from './pages/StationMapPage';
import AlertsPage from './pages/AlertsPage';
import IncidentsPage from './pages/IncidentsPage';
import CrowdIntelligencePage from './pages/CrowdIntelligencePage';
import WorkerSafetyPage from './pages/WorkerSafetyPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import SystemCamerasPage from './pages/SystemCamerasPage';
import SystemHealthPage from './pages/SystemHealthPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Railway Operations Workspace */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<OverviewPage />} />
          <Route path="live-monitoring" element={<LiveMonitoringPage />} />
          <Route path="station-map" element={<StationMapPage />} />

          <Route path="alerts" element={<AlertsPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="crowd-intelligence" element={<CrowdIntelligencePage />} />
          <Route path="worker-safety" element={<WorkerSafetyPage />} />

          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="reports" element={<ReportsPage />} />

          <Route path="system-cameras" element={<SystemCamerasPage />} />
          <Route path="system-health" element={<SystemHealthPage />} />

          <Route path="settings" element={<SettingsPage />} />
          <Route path="help" element={<HelpPage />} />

          {/* Legacy route fallbacks */}
          <Route path="cctv" element={<Navigate to="/live-monitoring" replace />} />
          <Route path="cameras" element={<Navigate to="/system-cameras" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
