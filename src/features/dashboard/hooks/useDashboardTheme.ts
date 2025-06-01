/**
 * useDashboardTheme Hook
 *
 * Dashboard-specific hook for managing theme state and preferences.
 * Provides theme switching and persistence functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  DashboardTheme,
  ThemePreset,
  themePresets,
  themeUtils,
  defaultDashboardTheme,
} from '../config/theme';

interface DashboardThemeState {
  currentTheme: DashboardTheme;
  currentPreset: ThemePreset;
  isLoading: boolean;
  error: string | null;
}

interface DashboardThemeActions {
  setTheme: (preset: ThemePreset) => void;
  setCustomTheme: (theme: DashboardTheme) => void;
  resetTheme: () => void;
  toggleDarkMode: () => void;
  applyThemeToDocument: () => void;
}

type DashboardThemeHook = DashboardThemeState & DashboardThemeActions;

const THEME_STORAGE_KEY = 'dashboard-theme-preference';

/**
 * Custom hook for managing dashboard theme
 *
 * Provides theme state management, persistence, and document application.
 * Automatically applies theme CSS variables to the document root.
 *
 * @returns Theme state and actions for theme management
 *
 * @example
 * ```tsx
 * const { currentTheme, setTheme, toggleDarkMode } = useDashboardTheme();
 *
 * // Switch to dark theme
 * setTheme('dark');
 *
 * // Toggle between light and dark
 * toggleDarkMode();
 *
 * // Use theme colors in components
 * <div style={{ color: currentTheme.colors.primary }}>
 *   Themed content
 * </div>
 * ```
 */
export const useDashboardTheme = (): DashboardThemeHook => {
  const [state, setState] = useState<DashboardThemeState>({
    currentTheme: defaultDashboardTheme,
    currentPreset: 'default',
    isLoading: true,
    error: null,
  });

  /**
   * Load theme preference from localStorage
   */
  const loadThemePreference = useCallback(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const preference = JSON.parse(stored) as { preset: ThemePreset };
        if (preference.preset && themePresets[preference.preset]) {
          setState(prev => ({
            ...prev,
            currentTheme: themePresets[preference.preset],
            currentPreset: preference.preset,
            isLoading: false,
          }));
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load theme preference',
      }));
    }

    // Fallback to default theme
    setState(prev => ({
      ...prev,
      currentTheme: defaultDashboardTheme,
      currentPreset: 'default',
      isLoading: false,
    }));
  }, []);

  /**
   * Save theme preference to localStorage
   */
  const saveThemePreference = useCallback((preset: ThemePreset) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ preset }));
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to save theme preference',
      }));
    }
  }, []);

  /**
   * Apply theme CSS variables to document
   */
  const applyThemeToDocument = useCallback(() => {
    if (typeof document === 'undefined') return;

    const cssVariables = themeUtils.getCSSVariables(state.currentTheme);
    const root = document.documentElement;

    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [state.currentTheme]);

  /**
   * Set theme by preset name
   */
  const setTheme = useCallback(
    (preset: ThemePreset) => {
      if (!themePresets[preset]) {
        setState(prev => ({
          ...prev,
          error: `Invalid theme preset: ${preset}`,
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        currentTheme: themePresets[preset],
        currentPreset: preset,
        error: null,
      }));

      saveThemePreference(preset);
    },
    [saveThemePreference]
  );

  /**
   * Set custom theme (not persisted)
   */
  const setCustomTheme = useCallback((theme: DashboardTheme) => {
    setState(prev => ({
      ...prev,
      currentTheme: theme,
      currentPreset: 'default', // Reset to default preset
      error: null,
    }));
  }, []);

  /**
   * Reset to default theme
   */
  const resetTheme = useCallback(() => {
    setTheme('default');
  }, [setTheme]);

  /**
   * Toggle between light and dark themes
   */
  const toggleDarkMode = useCallback(() => {
    const newPreset = state.currentPreset === 'dark' ? 'default' : 'dark';
    setTheme(newPreset);
  }, [state.currentPreset, setTheme]);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

  // Apply theme to document when theme changes
  useEffect(() => {
    if (!state.isLoading) {
      applyThemeToDocument();
    }
  }, [state.currentTheme, state.isLoading, applyThemeToDocument]);

  // Detect system theme preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      const hasStoredPreference = localStorage.getItem(THEME_STORAGE_KEY);
      if (!hasStoredPreference) {
        setTheme(e.matches ? 'dark' : 'default');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Set initial theme based on system preference if no stored preference
    const hasStoredPreference = localStorage.getItem(THEME_STORAGE_KEY);
    if (!hasStoredPreference && mediaQuery.matches) {
      setTheme('dark');
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [setTheme]);

  return {
    currentTheme: state.currentTheme,
    currentPreset: state.currentPreset,
    isLoading: state.isLoading,
    error: state.error,
    setTheme,
    setCustomTheme,
    resetTheme,
    toggleDarkMode,
    applyThemeToDocument,
  };
};

export default useDashboardTheme;
