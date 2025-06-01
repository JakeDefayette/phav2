/**
 * Dashboard Theme Configuration
 *
 * Centralized theming system for dashboard components.
 * Provides consistent styling across all dashboard widgets and layouts.
 */

export interface DashboardTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
}

/**
 * Default dashboard theme configuration
 */
export const defaultDashboardTheme: DashboardTheme = {
  colors: {
    primary: '#3B82F6', // blue-500
    secondary: '#6B7280', // gray-500
    success: '#10B981', // emerald-500
    warning: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
    info: '#8B5CF6', // violet-500
    background: '#F9FAFB', // gray-50
    surface: '#FFFFFF', // white
    text: {
      primary: '#111827', // gray-900
      secondary: '#6B7280', // gray-500
      muted: '#9CA3AF', // gray-400
    },
  },
  spacing: {
    xs: '0.25rem', // 1
    sm: '0.5rem', // 2
    md: '1rem', // 4
    lg: '1.5rem', // 6
    xl: '2rem', // 8
  },
  borderRadius: {
    sm: '0.25rem', // rounded
    md: '0.375rem', // rounded-md
    lg: '0.5rem', // rounded-lg
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem', // text-xs
      sm: '0.875rem', // text-sm
      base: '1rem', // text-base
      lg: '1.125rem', // text-lg
      xl: '1.25rem', // text-xl
      '2xl': '1.5rem', // text-2xl
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};

/**
 * Dark theme variant for dashboard
 */
export const darkDashboardTheme: DashboardTheme = {
  ...defaultDashboardTheme,
  colors: {
    ...defaultDashboardTheme.colors,
    background: '#111827', // gray-900
    surface: '#1F2937', // gray-800
    text: {
      primary: '#F9FAFB', // gray-50
      secondary: '#D1D5DB', // gray-300
      muted: '#9CA3AF', // gray-400
    },
  },
};

/**
 * High contrast theme for accessibility
 */
export const highContrastDashboardTheme: DashboardTheme = {
  ...defaultDashboardTheme,
  colors: {
    primary: '#000000',
    secondary: '#666666',
    success: '#006600',
    warning: '#CC6600',
    error: '#CC0000',
    info: '#0066CC',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: {
      primary: '#000000',
      secondary: '#333333',
      muted: '#666666',
    },
  },
};

/**
 * Theme utility functions
 */
export const themeUtils = {
  /**
   * Get CSS custom properties for a theme
   */
  getCSSVariables: (theme: DashboardTheme): Record<string, string> => {
    return {
      '--dashboard-color-primary': theme.colors.primary,
      '--dashboard-color-secondary': theme.colors.secondary,
      '--dashboard-color-success': theme.colors.success,
      '--dashboard-color-warning': theme.colors.warning,
      '--dashboard-color-error': theme.colors.error,
      '--dashboard-color-info': theme.colors.info,
      '--dashboard-color-background': theme.colors.background,
      '--dashboard-color-surface': theme.colors.surface,
      '--dashboard-color-text-primary': theme.colors.text.primary,
      '--dashboard-color-text-secondary': theme.colors.text.secondary,
      '--dashboard-color-text-muted': theme.colors.text.muted,
      '--dashboard-spacing-xs': theme.spacing.xs,
      '--dashboard-spacing-sm': theme.spacing.sm,
      '--dashboard-spacing-md': theme.spacing.md,
      '--dashboard-spacing-lg': theme.spacing.lg,
      '--dashboard-spacing-xl': theme.spacing.xl,
      '--dashboard-border-radius-sm': theme.borderRadius.sm,
      '--dashboard-border-radius-md': theme.borderRadius.md,
      '--dashboard-border-radius-lg': theme.borderRadius.lg,
      '--dashboard-shadow-sm': theme.shadows.sm,
      '--dashboard-shadow-md': theme.shadows.md,
      '--dashboard-shadow-lg': theme.shadows.lg,
      '--dashboard-font-family': theme.typography.fontFamily,
    };
  },

  /**
   * Generate Tailwind CSS classes for theme colors
   */
  getTailwindClasses: (theme: DashboardTheme) => {
    return {
      primary: 'text-blue-600 bg-blue-50 border-blue-200',
      secondary: 'text-gray-600 bg-gray-50 border-gray-200',
      success: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      error: 'text-red-600 bg-red-50 border-red-200',
      info: 'text-purple-600 bg-purple-50 border-purple-200',
    };
  },
};

/**
 * Available theme presets
 */
export const themePresets = {
  default: defaultDashboardTheme,
  dark: darkDashboardTheme,
  highContrast: highContrastDashboardTheme,
} as const;

export type ThemePreset = keyof typeof themePresets;
