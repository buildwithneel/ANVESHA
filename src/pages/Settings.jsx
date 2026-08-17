import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Server,
  Camera,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Wifi,
  Volume2,
} from 'lucide-react';
import { getSettings, saveSettings } from '../services/api';

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        enabled ? 'bg-accent' : 'bg-border-strong'
      }`}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
        style={{ transform: enabled ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getSettings();
      setSettings(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      aiConfidenceThreshold: 75,
      overcrowdingLimit: 80,
      alertSoundEnabled: true,
      autoDispatch: false,
      backendUrl: 'http://localhost:8000',
      useMockData: true,
    });
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading || !settings) {
    return (
      <div className="space-y-4 animate-fade-in max-w-4xl">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <SettingsIcon size={20} className="text-accent" />
            Settings
          </h1>
          <p className="text-sm text-text-muted mt-0.5">Configure system thresholds, notifications, and backend connectivity</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="btn btn-ghost text-xs"
          >
            <RotateCcw size={14} />
            Reset defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary text-xs disabled:opacity-50"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle2 size={14} />
            ) : (
              <Save size={14} />
            )}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </div>

      {/* ── Detection Settings ────────────────────────────── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-5">
          <Sliders size={16} className="text-accent" />
          Detection configuration
        </h2>
        <div className="space-y-5">
          {/* Confidence Threshold */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary font-medium">Minimum detection confidence</p>
              <p className="text-xs text-text-muted mt-0.5">Only display alerts when detection confidence exceeds this percentage</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="99"
                value={settings.aiConfidenceThreshold}
                onChange={(e) => updateSetting('aiConfidenceThreshold', Number(e.target.value))}
                className="w-40 accent-accent"
              />
              <span className="text-sm font-mono text-accent w-10 text-right font-medium">{settings.aiConfidenceThreshold}%</span>
            </div>
          </div>

          {/* Overcrowding Limit */}
          <div className="flex items-center justify-between border-t border-border pt-5">
            <div>
              <p className="text-sm text-text-primary font-medium">Overcrowding density threshold</p>
              <p className="text-xs text-text-muted mt-0.5">Trigger crowd alert when zone density exceeds this percentage</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="40"
                max="100"
                value={settings.overcrowdingLimit}
                onChange={(e) => updateSetting('overcrowdingLimit', Number(e.target.value))}
                className="w-40 accent-status-attention"
              />
              <span className="text-sm font-mono text-status-attention w-10 text-right font-medium">{settings.overcrowdingLimit}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notification Settings ────────────────────────────── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-5">
          <Bell size={16} className="text-status-attention" />
          Notifications & Sound
        </h2>
        <div className="space-y-5">
          {/* Alert Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 size={16} className="text-text-muted" />
              <div>
                <p className="text-sm text-text-primary font-medium">Notification sound</p>
                <p className="text-xs text-text-muted mt-0.5">Play a soft audio chime for critical incident alerts</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.alertSoundEnabled}
              onChange={(val) => updateSetting('alertSoundEnabled', val)}
            />
          </div>

          {/* Auto Dispatch */}
          <div className="flex items-center justify-between border-t border-border pt-5">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-text-muted" />
              <div>
                <p className="text-sm text-text-primary font-medium">Recommended response prompts</p>
                <p className="text-xs text-text-muted mt-0.5">Automatically surface recommended actions for high-severity events</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.autoDispatch}
              onChange={(val) => updateSetting('autoDispatch', val)}
            />
          </div>
        </div>
      </div>

      {/* ── Backend Configuration ────────────────────────────── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-5">
          <Server size={16} className="text-status-normal" />
          Backend connection
        </h2>
        <div className="space-y-5">
          {/* Backend URL */}
          <div>
            <label className="text-sm text-text-primary font-medium block mb-2">FastAPI backend URL</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Wifi size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={settings.backendUrl}
                  onChange={(e) => updateSetting('backendUrl', e.target.value)}
                  className="input-field w-full pl-9 text-sm font-mono"
                  placeholder="http://localhost:8000"
                />
              </div>
              <button className="btn btn-ghost text-xs">
                Test connection
              </button>
            </div>
          </div>

          {/* Mock Data Toggle */}
          <div className="flex items-center justify-between border-t border-border pt-5">
            <div className="flex items-center gap-3">
              <Sliders size={16} className="text-text-muted" />
              <div>
                <p className="text-sm text-text-primary font-medium">DEMO mode data</p>
                <p className="text-xs text-text-muted mt-0.5">Use local station dataset for standalone operation and presentations</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.useMockData}
              onChange={(val) => updateSetting('useMockData', val)}
            />
          </div>
        </div>
      </div>

      {/* ── System Info ──────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Camera size={16} className="text-accent" />
          System information
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-text-muted">Application version</p>
            <p className="text-text-primary font-mono mt-1">v2.4.0</p>
          </div>
          <div>
            <p className="text-text-muted">Station profile</p>
            <p className="text-text-primary font-mono mt-1">Central Railway · CSMT</p>
          </div>
          <div>
            <p className="text-text-muted">Frontend framework</p>
            <p className="text-text-primary font-mono mt-1">React 19 + Vite</p>
          </div>
          <div>
            <p className="text-text-muted">Data source</p>
            <p className="text-text-primary font-mono mt-1">{settings.useMockData ? 'Demo Mode (Local)' : 'FastAPI Backend'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
