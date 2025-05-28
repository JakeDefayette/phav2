// Application route constants

export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  DASHBOARD: {
    HOME: '/dashboard',
    PROFILE: '/dashboard/profile',
    SETTINGS: '/dashboard/settings',
  },
  SURVEYS: {
    LIST: '/surveys',
    CREATE: '/surveys/create',
    EDIT: '/surveys/edit',
    VIEW: '/surveys/view',
  },
  REPORTS: {
    LIST: '/reports',
    VIEW: '/reports/view',
    GENERATE: '/reports/generate',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    ANALYTICS: '/admin/analytics',
  },
} as const;

export type RouteKey = keyof typeof ROUTES;
