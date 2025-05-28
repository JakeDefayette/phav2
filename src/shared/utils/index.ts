// Utility functions barrel export
// This file will be used to export all utility functions

// Example exports (to be added as utilities are created):
// export { formatDate } from './date';
// export { validateEmail } from './validation';
// export { debounce } from './performance';

export { cn } from './cn';
export {
  PerformanceMonitor,
  timed,
  timeOperation,
  debounce,
  throttle,
  getMemoryUsage,
  type PerformanceMetrics,
  type PerformanceReport,
} from './performance';
export {
  hasRole,
  hasAnyRole,
  isChiropractor,
  isParent,
  getRoleDisplayName,
  roleRequiresPracticeId,
  getRolePermissions,
  hasPermission,
  type RolePermissions,
} from './roleUtils';

// Error handling utilities
export {
  safeAsync,
  safeSync,
  handleDatabaseError,
  formatErrorResponse,
  withErrorHandling,
  validate,
  assertExists,
  withRetry,
  type RetryOptions,
} from './errorHandler';

// Memoization utilities
export {
  smartMemo,
  useMemoizedCalculation,
  useMemoizedCallback,
  useMemoizedObject,
  useMemoizedProps,
  useDebouncedValue,
  useThrottledValue,
  useVirtualizedList,
  useIntersectionObserver,
  useLazyComponent,
  usePerformanceMeasure,
  withMemoization,
  useStableProps,
} from './memoization';
