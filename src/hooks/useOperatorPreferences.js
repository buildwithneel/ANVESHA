import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  LANGUAGE: 'railguard_language_preference',
  THEME: 'railguard_theme_preference',
  FONT_SIZE: 'railguard_font_size_preference',
  REDUCED_MOTION: 'railguard_reduced_motion_preference',
  HIGH_CONTRAST: 'railguard_high_contrast_preference',
  SOUND: 'railguard_sound_preference',
  TIME_FORMAT: 'railguard_time_format_preference',
  NOTIFICATION_TIER: 'railguard_notification_tier_preference',
};

export function useOperatorPreferences() {
  // 1. Language
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
    } catch {
      return 'en';
    }
  });

  // 2. Theme
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) || 'system';
    } catch {
      return 'system';
    }
  });

  // 3. Font Size Scaling ('sm' | 'base' | 'lg' | 'xl')
  const [fontSize, setFontSizeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || 'base';
    } catch {
      return 'base';
    }
  });

  // 4. Reduced Motion
  const [reducedMotion, setReducedMotionState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REDUCED_MOTION);
      if (saved !== null) return saved === 'true';
    } catch {
      // fallback
    }
    return typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  });

  // 5. High Contrast Mode
  const [highContrast, setHighContrastState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST) === 'true';
    } catch {
      return false;
    }
  });

  // 6. Sound Enabled
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // 7. Time Format ('24h' | '12h')
  const [timeFormat, setTimeFormatState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TIME_FORMAT) || '24h';
    } catch {
      return '24h';
    }
  });

  // 8. Notification Tier ('all' | 'high_critical' | 'critical_only')
  const [notificationTier, setNotificationTierState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.NOTIFICATION_TIER) || 'all';
    } catch {
      return 'all';
    }
  });

  // ── Apply DOM Classes for Font Size, High Contrast, Motion, Theme ──
  const applyDOMPreferences = useCallback(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Font size scaling classes
    root.classList.remove('font-size-sm', 'font-size-base', 'font-size-lg', 'font-size-xl');
    root.classList.add(`font-size-${fontSize}`);

    // High contrast class
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion class
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Theme class
    const isDarkSystem = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && isDarkSystem);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [fontSize, highContrast, reducedMotion, theme]);

  useEffect(() => {
    applyDOMPreferences();
  }, [applyDOMPreferences]);

  // Setters with localStorage persistence
  const setLanguage = useCallback((val) => {
    setLanguageState(val);
    try { localStorage.setItem(STORAGE_KEYS.LANGUAGE, val); } catch (e) { console.warn(e); }
  }, []);

  const setTheme = useCallback((val) => {
    setThemeState(val);
    try { localStorage.setItem(STORAGE_KEYS.THEME, val); } catch (e) { console.warn(e); }
  }, []);

  const setFontSize = useCallback((val) => {
    setFontSizeState(val);
    try { localStorage.setItem(STORAGE_KEYS.FONT_SIZE, val); } catch (e) { console.warn(e); }
  }, []);

  const setReducedMotion = useCallback((val) => {
    setReducedMotionState(val);
    try { localStorage.setItem(STORAGE_KEYS.REDUCED_MOTION, String(val)); } catch (e) { console.warn(e); }
  }, []);

  const setHighContrast = useCallback((val) => {
    setHighContrastState(val);
    try { localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(val)); } catch (e) { console.warn(e); }
  }, []);

  const setSoundEnabled = useCallback((val) => {
    setSoundEnabledState(val);
    try { localStorage.setItem(STORAGE_KEYS.SOUND, String(val)); } catch (e) { console.warn(e); }
  }, []);

  const setTimeFormat = useCallback((val) => {
    setTimeFormatState(val);
    try { localStorage.setItem(STORAGE_KEYS.TIME_FORMAT, val); } catch (e) { console.warn(e); }
  }, []);

  const setNotificationTier = useCallback((val) => {
    setNotificationTierState(val);
    try { localStorage.setItem(STORAGE_KEYS.NOTIFICATION_TIER, val); } catch (e) { console.warn(e); }
  }, []);

  return {
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
  };
}
