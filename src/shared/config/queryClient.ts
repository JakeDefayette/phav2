/**
 * TanStack Query Configuration
 *
 * Configures the global QueryClient with optimized defaults for the application
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { config } from './index';

/**
 * Default query options for consistent behavior across the app
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Cache data for 5 minutes in production, 1 minute in development
    staleTime:
      config.app.environment === 'production' ? 5 * 60 * 1000 : 60 * 1000,

    // Keep unused data in cache for 10 minutes
    gcTime: 10 * 60 * 1000,

    // Retry failed requests based on environment
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.statusCode >= 400 && error?.statusCode < 500) {
        return false;
      }

      // Retry up to 3 times in production, 1 time in development
      const maxRetries = config.app.environment === 'production' ? 3 : 1;
      return failureCount < maxRetries;
    },

    // Retry delay with exponential backoff
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus in production only
    refetchOnWindowFocus: config.app.environment === 'production',

    // Don't refetch on reconnect to avoid unnecessary requests
    refetchOnReconnect: false,

    // Refetch on mount if data is stale
    refetchOnMount: true,
  },
  mutations: {
    // Retry mutations once on network errors
    retry: (failureCount, error: any) => {
      if (error?.statusCode >= 400 && error?.statusCode < 500) {
        return false;
      }
      return failureCount < 1;
    },

    // Mutation retry delay
    retryDelay: 1000,
  },
};

/**
 * Create and configure the global QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: queryConfig,
    logger: {
      log: (...args) => {
        if (config.app.environment === 'development') {
          console.log('[React Query]', ...args);
        }
      },
      warn: (...args) => {
        console.warn('[React Query]', ...args);
      },
      error: (...args) => {
        console.error('[React Query]', ...args);
      },
    },
  });
}

/**
 * Global QueryClient instance
 * Use this for imperative access to the query cache
 */
export const queryClient = createQueryClient();

/**
 * Query key factories for consistent cache key generation
 */
export const QueryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    user: () => [...QueryKeys.auth.all, 'user'] as const,
    session: () => [...QueryKeys.auth.all, 'session'] as const,
  },

  // Assessments
  assessments: {
    all: ['assessments'] as const,
    lists: () => [...QueryKeys.assessments.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...QueryKeys.assessments.lists(), filters] as const,
    details: () => [...QueryKeys.assessments.all, 'detail'] as const,
    detail: (id: string) => [...QueryKeys.assessments.details(), id] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    lists: () => [...QueryKeys.reports.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...QueryKeys.reports.lists(), filters] as const,
    details: () => [...QueryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...QueryKeys.reports.details(), id] as const,
    pdf: (id: string) => [...QueryKeys.reports.all, 'pdf', id] as const,
  },

  // Children
  children: {
    all: ['children'] as const,
    lists: () => [...QueryKeys.children.all, 'list'] as const,
    list: (parentId: string) =>
      [...QueryKeys.children.lists(), parentId] as const,
    details: () => [...QueryKeys.children.all, 'detail'] as const,
    detail: (id: string) => [...QueryKeys.children.details(), id] as const,
  },

  // Practices
  practices: {
    all: ['practices'] as const,
    lists: () => [...QueryKeys.practices.all, 'list'] as const,
    details: () => [...QueryKeys.practices.all, 'detail'] as const,
    detail: (id: string) => [...QueryKeys.practices.details(), id] as const,
  },

  // Survey responses
  surveyResponses: {
    all: ['surveyResponses'] as const,
    lists: () => [...QueryKeys.surveyResponses.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...QueryKeys.surveyResponses.lists(), filters] as const,
    details: () => [...QueryKeys.surveyResponses.all, 'detail'] as const,
    detail: (id: string) =>
      [...QueryKeys.surveyResponses.details(), id] as const,
  },

  // Branding
  branding: {
    all: ['branding'] as const,
    practice: (practiceId: string) =>
      [...QueryKeys.branding.all, 'practice', practiceId] as const,
  },
} as const;

/**
 * Utility function to invalidate related queries
 */
export function invalidateQueries(
  client: QueryClient,
  keys: readonly string[]
) {
  return client.invalidateQueries({ queryKey: keys });
}

/**
 * Utility function to update query data optimistically
 */
export function updateQueryData<T>(
  client: QueryClient,
  keys: readonly string[],
  updater: (oldData: T | undefined) => T
) {
  return client.setQueryData(keys, updater);
}
