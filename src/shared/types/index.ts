// Type definitions barrel export
// This file will be used to export all type definitions

// Example exports (to be added as types are created):
// export type { User } from './user';
// export type { ApiResponse } from './api';
// export type { ComponentProps } from './components';

// Assessment types
export type {
  Assessment,
  AssessmentInsert,
  AssessmentUpdate,
  AssessmentWithResponses,
  AssessmentStats,
  CreateAssessmentData,
  UpdateAssessmentData,
} from '@/features/assessment/types';

// Auth types
export type {
  UserRole,
  UserProfile,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from './auth';

// API types
export * from './api';

// Error types
export * from './errors';

// Database types
export type * from './database';

// Re-export feature types
export type {
  Child,
  ChildInsert,
  ChildUpdate,
  ChildWithAssessments,
  CreateChildData,
  UpdateChildData,
  Practice,
  PracticeInsert,
  PracticeUpdate,
  CreatePracticeData,
  UpdatePracticeData,
} from '@/features/dashboard';
