import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'railguard_theme_preference';

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const applyTheme = useCallback((targetTheme) => {
    const root = document.documentElement;
    const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = targetTheme === 'dark' || (targetTheme === 'system' && isDarkSystem);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (err) {
      console.warn('Unable to persist theme preference:', err);
    }
    applyTheme(newTheme);
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  return { theme, setTheme };
}
