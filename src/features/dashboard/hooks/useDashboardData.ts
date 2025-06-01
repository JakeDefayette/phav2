/**
 * useDashboardData Hook
 *
 * Dashboard-specific hook for managing dashboard data and state.
 * This hook is specific to the dashboard feature and encapsulates
 * all dashboard-related data fetching and state management.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks';
import { dashboardService } from '../services/dashboardService';

interface PatientSummary {
  totalPatients: number;
  newPatientsThisWeek: number;
  activePatients: number;
  upcomingAppointments: number;
}

interface AppointmentSummary {
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  cancelledToday: number;
}

interface DashboardData {
  patientSummary: PatientSummary | null;
  appointmentSummary: AppointmentSummary | null;
  isLoading: boolean;
  error: Error | null;
  refreshData: () => Promise<void>;
}

/**
 * Custom hook for managing dashboard data
 *
 * Provides centralized data management for all dashboard components
 * including patient summaries, appointment data, and error handling.
 *
 * @returns Dashboard data, loading state, error state, and refresh function
 *
 * @example
 * ```tsx
 * const { patientSummary, isLoading, error, refreshData } = useDashboardData();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <PatientSummaryWidget data={patientSummary} />;
 * ```
 */
export const useDashboardData = (): DashboardData => {
  const { user } = useAuth();
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(
    null
  );
  const [appointmentSummary, setAppointmentSummary] =
    useState<AppointmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = async () => {
    if (!user) {
      setError(new Error('User not authenticated'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch patient summary data
      const patientData = await dashboardService.getPatientSummary(user.id);
      setPatientSummary(patientData);

      // Fetch appointment summary data
      const appointmentData = await dashboardService.getAppointmentSummary(
        user.id
      );
      setAppointmentSummary(appointmentData);
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('Failed to fetch dashboard data');
      setError(error);
      console.error('Dashboard data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchDashboardData();
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (!isLoading) {
          fetchDashboardData();
        }
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [isLoading]);

  return {
    patientSummary,
    appointmentSummary,
    isLoading,
    error,
    refreshData,
  };
};

export default useDashboardData;
