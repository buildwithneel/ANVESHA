import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'railguard_reduced_motion_preference';

export function useReducedMotion() {
  const [reducedMotion, setReducedMotionState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    } catch {
      // fallback
    }
    return window.matchMedia('(prefers-color-scheme: reduce)').matches;
  });

  const applyClass = useCallback((isReduced) => {
    const root = document.documentElement;
    if (isReduced) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, []);

  const setReducedMotion = useCallback((value) => {
    setReducedMotionState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch (err) {
      console.warn('Unable to persist motion preference:', err);
    }
    applyClass(value);
  }, [applyClass]);

  useEffect(() => {
    applyClass(reducedMotion);
  }, [reducedMotion, applyClass]);

  return { reducedMotion, setReducedMotion };
}
