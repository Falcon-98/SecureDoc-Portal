'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

export interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isLight: boolean;
  mounted: boolean;
}

const STORAGE_KEY = 'securedoc-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && (stored === 'light' || stored === 'dark')) {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): Theme {
  return getInitialTheme();
}

function getServerSnapshot(): Theme {
  return 'dark';
}

export function useTheme(): UseThemeReturn {
  const storedTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, setThemeState] = useState<Theme>(storedTheme);
  const [mounted, setMounted] = useState(false);

  // Sync mounted state after render using requestAnimationFrame
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      setThemeState(getInitialTheme());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;

    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    mounted,
  };
}
