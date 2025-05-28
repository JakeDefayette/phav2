// Custom hooks barrel export
// This file will be used to export all custom hooks

// Example exports (to be added as hooks are created):
// export { useAuth } from './useAuth';
// export { useLocalStorage } from './useLocalStorage';
// export { useApi } from './useApi';

// Hooks barrel export
// Re-export hooks from their new locations after refactoring

// Shared hooks
export { useAuth, AuthProvider } from '@/shared/hooks/useAuth';
export { useRole } from '@/shared/hooks/useRole';
export { useBranding } from '@/shared/hooks/useBranding';
export {
  useCurrentUser,
  useSession,
  useLogin,
  useRegister,
  useLogout,
  useUpdateProfile,
  useResetPassword,
  useUpdatePassword,
  useIsAuthenticated,
  useUserRole,
} from '@/shared/hooks/useAuthQuery';

// Import types separately to avoid conflicts
export type { UserRole } from '@/shared/types/auth';

// Feature-specific hooks
export { useAssessments } from '@/features/assessment/hooks/useAssessments';
export { useChildren } from '@/features/dashboard/hooks/useChildren';
export { usePractices } from '@/features/dashboard/hooks/usePractices';
export { useReports } from '@/features/reports/hooks/useReports';
export { useChartToPDF } from '@/features/reports/hooks/useChartToPDF';

// Chart-related types
export interface ChartImageData {
  dataUrl: string;
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'svg';
  quality?: number;
  title?: string;
  imageData?: string; // Base64 encoded image data or data URL
}

export {};
