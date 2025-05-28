'use client';

import React, { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/shared/config/queryClient';
import { config } from '@/shared/config';

/**
 * Props for the QueryProvider component
 */
export interface QueryProviderProps {
  /** Child components to wrap with query provider */
  children: ReactNode;
  /** Optional custom query client (for testing) */
  client?: QueryClient;
  /** Whether to show React Query devtools */
  showDevtools?: boolean;
}

/**
 * React Query Provider Component
 *
 * Provides React Query context to the entire application.
 * Includes devtools in development mode.
 *
 * @example
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 */
export function QueryProvider({
  children,
  client,
  showDevtools = config.app.environment === 'development',
}: QueryProviderProps) {
  // Create a stable query client instance
  const [queryClient] = useState(() => client || createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition='bottom-right'
          position='bottom'
        />
      )}
    </QueryClientProvider>
  );
}

/**
 * Hook to access the query client imperatively
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const queryClient = useQueryClient();
 *
 *   const handleRefresh = () => {
 *     queryClient.invalidateQueries({ queryKey: ['data'] });
 *   };
 * }
 * ```
 */
export { useQueryClient } from '@tanstack/react-query';

export default QueryProvider;
