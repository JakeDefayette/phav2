import { Database } from '@/shared/types/database';
import type { PracticesAPI } from '@/shared/types/api';

export type Child = Database['public']['Tables']['children']['Row'];
export type ChildInsert = Database['public']['Tables']['children']['Insert'];
export type ChildUpdate = Database['public']['Tables']['children']['Update'];

export interface ChildWithAssessments extends Child {
  assessments: Array<{
    id: string;
    title: string;
    created_at: string;
    status: string;
  }>;
}

export interface CreateChildData {
  first_name: string;
  last_name?: string;
  date_of_birth: string;
  parent_id: string;
  gender?: string;
}

export interface UpdateChildData {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  parent_id?: string;
  gender?: string;
}

// Practice types
export type Practice = Database['public']['Tables']['practices']['Row'];
export type PracticeInsert =
  Database['public']['Tables']['practices']['Insert'];
export type PracticeUpdate =
  Database['public']['Tables']['practices']['Update'];

// Aliases for API types that hooks expect
export type CreatePracticeData = PracticesAPI.CreateRequest;
export type UpdatePracticeData = PracticesAPI.UpdateRequest;

/**
 * Dashboard Feature Types
 *
 * TypeScript type definitions specific to the dashboard feature.
 * These types should only be used within the dashboard feature.
 */

// ==========================================
// DASHBOARD DATA TYPES
// ==========================================

export interface PatientSummary {
  totalPatients: number;
  newPatientsThisWeek: number;
  activePatients: number;
  upcomingAppointments: number;
}

export interface AppointmentSummary {
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  cancelledToday: number;
}

export interface DashboardMetrics {
  patients: PatientSummary;
  appointments: AppointmentSummary;
  lastUpdated: string;
}

// ==========================================
// DASHBOARD COMPONENT PROPS
// ==========================================

export interface DashboardWidgetProps {
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
}

export interface PatientSummaryWidgetProps extends DashboardWidgetProps {
  detailed?: boolean;
  data?: PatientSummary | null;
}

export interface AppointmentWidgetProps extends DashboardWidgetProps {
  showDetails?: boolean;
  data?: AppointmentSummary | null;
}

// ==========================================
// DASHBOARD STATE TYPES
// ==========================================

export interface DashboardState {
  metrics: DashboardMetrics | null;
  recentActivity: RecentActivity[];
  filters: DashboardFilters;
  isLoading: boolean;
  error: Error | null;
  lastRefresh: Date | null;
}

export interface DashboardFilters {
  dateRange: DateRange;
  patientStatus: PatientStatus[];
  appointmentType: AppointmentType[];
}

// ==========================================
// DASHBOARD API TYPES
// ==========================================

export interface RecentActivity {
  id: string;
  type: 'assessment' | 'appointment' | 'note' | 'message';
  title: string;
  description: string;
  timestamp: string;
  patientName: string;
  patientId: string;
  status: 'completed' | 'pending' | 'cancelled' | 'in-progress';
}

export interface DashboardApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    cached: boolean;
  };
}

// ==========================================
// UTILITY TYPES
// ==========================================

export type DateRange = {
  start: Date;
  end: Date;
};

export type PatientStatus = 'active' | 'inactive' | 'new' | 'pending';

export type AppointmentType =
  | 'consultation'
  | 'follow-up'
  | 'assessment'
  | 'treatment';

export type DashboardViewType =
  | 'overview'
  | 'patients'
  | 'appointments'
  | 'analytics';

// ==========================================
// DASHBOARD CONFIGURATION TYPES
// ==========================================

export interface DashboardConfig {
  refreshInterval: number; // milliseconds
  autoRefresh: boolean;
  defaultView: DashboardViewType;
  widgetSettings: WidgetSettings;
}

export interface WidgetSettings {
  patientSummary: {
    enabled: boolean;
    detailed: boolean;
    refreshRate: number;
  };
  appointmentSummary: {
    enabled: boolean;
    showUpcoming: boolean;
    maxItems: number;
  };
  recentActivity: {
    enabled: boolean;
    maxItems: number;
    types: Array<RecentActivity['type']>;
  };
}

// ==========================================
// ERROR TYPES
// ==========================================

export interface DashboardError extends Error {
  code: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export type DashboardErrorCode =
  | 'FETCH_FAILED'
  | 'UNAUTHORIZED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

// ==========================================
// HOOK RETURN TYPES
// ==========================================

export interface UseDashboardDataReturn {
  patientSummary: PatientSummary | null;
  appointmentSummary: AppointmentSummary | null;
  recentActivity: RecentActivity[];
  isLoading: boolean;
  error: DashboardError | null;
  refreshData: () => Promise<void>;
  lastRefresh: Date | null;
}

export interface UseDashboardFiltersReturn {
  filters: DashboardFilters;
  updateFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  applyPreset: (preset: string) => void;
}

// ==========================================
// EXPORT ALL TYPES
// ==========================================

// Types are already exported above where they are defined
// No need for re-export block to avoid conflicts
