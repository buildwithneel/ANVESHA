import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useOperatorPreferences } from '../hooks/useOperatorPreferences';
import { useTranslation, LANGUAGES } from '../i18n';
import {
  Sun,
  Moon,
  Laptop,
  Eye,
  Languages as LangIcon,
  Type,
  Sliders,
  Volume2,
  Clock,
  Bell,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function SettingsPage() {
  const { t } = useTranslation();
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast,
    soundEnabled,
    setSoundEnabled,
    timeFormat,
    setTimeFormat,
    notificationTier,
    setNotificationTier,
  } = useOperatorPreferences();

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in select-none">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="p-4 bg-surface rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-accent" />
          <h1 className="text-base font-bold text-text-primary">
            {t('settings.title', 'Control Desk & Accessibility Preferences')}
          </h1>
        </div>
        <p className="text-xs text-text-muted mt-1">
          {t('settings.subtitle', 'Configure operational interface appearance, language, font size, high-contrast, and notification preferences')}
        </p>
      </div>

      {/* ── 1. Interface Language (i18n) ────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <LangIcon className="w-4 h-4 text-accent" />
            <span>{t('settings.languageTitle', 'Interface Language (i18n)')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-text-muted">
            {t('settings.languageSubtitle', 'Select your operational language. Preference persists across browser sessions.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'p-3.5 rounded-xl border text-left transition-all flex items-center justify-between',
                  language === lang.code
                    ? 'border-accent bg-accent-soft text-accent font-bold shadow-xs ring-1 ring-accent'
                    : 'border-border bg-surface-raised text-text-secondary hover:border-border-strong hover:bg-surface-hover'
                )}
              >
                <div>
                  <div className="text-sm font-bold text-text-primary">{lang.nativeName}</div>
                  <div className="text-xs text-text-muted">{lang.name}</div>
                </div>
                {language === lang.code && (
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Color Theme Preference ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sun className="w-4 h-4 text-accent" />
            <span>{t('settings.themeTitle', 'Color Theme Preference')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-text-muted">
            {t('settings.themeSubtitle', 'Choose light mode, dark mode, or follow system preferences for long-session control room comfort.')}
          </p>

          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { key: 'light', label: t('topbar.light', 'Light'), icon: Sun },
              { key: 'dark', label: t('topbar.dark', 'Dark'), icon: Moon },
              { key: 'system', label: t('topbar.system', 'System'), icon: Laptop },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all',
                  theme === key
                    ? 'border-accent bg-accent-soft text-accent shadow-xs ring-1 ring-accent'
                    : 'border-border bg-surface-raised text-text-secondary hover:border-border-strong hover:bg-surface-hover'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Font Size Scaling Tokens ───────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Type className="w-4 h-4 text-accent" />
            <span>{t('settings.fontSizeTitle', 'Interface Font Size Scaling')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-text-muted">
            {t('settings.fontSizeSubtitle', 'Scale typography across all operational tables, feeds, and dashboards.')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {[
              { key: 'sm', label: t('settings.fontSmall', 'Small (13px)') },
              { key: 'base', label: t('settings.fontNormal', 'Normal (14px)') },
              { key: 'lg', label: t('settings.fontLarge', 'Large (16px)') },
              { key: 'xl', label: t('settings.fontExtraLarge', 'Extra Large (18px)') },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFontSize(key)}
                className={cn(
                  'p-3 rounded-xl border text-xs font-semibold text-center transition-all',
                  fontSize === key
                    ? 'border-accent bg-accent-soft text-accent shadow-xs ring-1 ring-accent'
                    : 'border-border bg-surface-raised text-text-secondary hover:border-border-strong hover:bg-surface-hover'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Accessibility & Operator Ergonomics ───────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-accent" />
            <span>{t('settings.accessibilityTitle', 'Accessibility & Operator Ergonomics')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 divide-y divide-border">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs font-semibold text-text-primary">
                {t('settings.reducedMotionTitle', 'Reduced Motion Mode')}
              </div>
              <div className="text-[11px] text-text-muted">
                {t('settings.reducedMotionSubtitle', 'Disables decorative UI animations and transitions for distraction-free monitoring.')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReducedMotion(!reducedMotion)}
              className={cn(
                'w-11 h-6 flex items-center rounded-full p-1 transition-colors',
                reducedMotion ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white shadow-xs transition-transform',
                  reducedMotion ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-semibold text-text-primary">
                {t('settings.highContrastTitle', 'High Contrast Mode')}
              </div>
              <div className="text-[11px] text-text-muted">
                {t('settings.highContrastSubtitle', 'Enhances border boundaries, status indicator contrast, and focus outlines.')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className={cn(
                'w-11 h-6 flex items-center rounded-full p-1 transition-colors',
                highContrast ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white shadow-xs transition-transform',
                  highContrast ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Critical Alert Audio */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-semibold text-text-primary">
                {t('settings.soundTitle', 'Critical Alert Audio Chime')}
              </div>
              <div className="text-[11px] text-text-muted">
                {t('settings.soundSubtitle', 'Plays audible chime tone upon receiving CRITICAL security and safety alerts.')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                'w-11 h-6 flex items-center rounded-full p-1 transition-colors',
                soundEnabled ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white shadow-xs transition-transform',
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Time Format & Clock ───────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <span>{t('settings.timeFormatTitle', 'Clock & Timestamp Format')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-text-muted">
            {t('settings.timeFormatSubtitle', 'Select preferred operational time display format across all feeds and logs.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              { key: '24h', label: t('settings.time24', '24-Hour (18:42:21 - Standard)') },
              { key: '12h', label: t('settings.time12', '12-Hour (06:42:21 PM)') },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTimeFormat(key)}
                className={cn(
                  'p-3 rounded-xl border text-xs font-semibold text-center font-mono transition-all',
                  timeFormat === key
                    ? 'border-accent bg-accent-soft text-accent shadow-xs ring-1 ring-accent'
                    : 'border-border bg-surface-raised text-text-secondary hover:border-border-strong hover:bg-surface-hover'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Notification Fatigue Threshold ─────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            <span>{t('settings.notificationPreferencesTitle', 'Notification Alert Fatigue Filtering')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-text-muted">
            {t('settings.notificationPreferencesSubtitle', 'Select notification priority threshold to prevent operator cognitive fatigue.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              { key: 'all', label: t('settings.allAlerts', 'All Operational Alerts') },
              { key: 'high_critical', label: t('settings.highAndCritical', 'High & Critical Only') },
              { key: 'critical_only', label: t('settings.criticalOnly', 'Critical Alerts Only') },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setNotificationTier(key)}
                className={cn(
                  'p-3 rounded-xl border text-xs font-semibold text-center transition-all',
                  notificationTier === key
                    ? 'border-accent bg-accent-soft text-accent shadow-xs ring-1 ring-accent'
                    : 'border-border bg-surface-raised text-text-secondary hover:border-border-strong hover:bg-surface-hover'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
