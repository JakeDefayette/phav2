/**
 * Dashboard Service
 *
 * Service layer for dashboard-specific data operations.
 * This service handles all dashboard-related API calls and data processing.
 */

import { supabase } from '@/shared/services/supabase';

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

/**
 * Dashboard Service Class
 *
 * Encapsulates all dashboard-related data operations.
 * Uses shared Supabase service for database operations.
 */
export class DashboardService {
  /**
   * Get patient summary statistics for a practitioner
   */
  async getPatientSummary(practitionerId: string): Promise<PatientSummary> {
    try {
      // Get total patients
      const { count: totalPatients, error: totalError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'patient')
        .eq('practitioner_id', practitionerId);

      if (totalError) throw totalError;

      // Get new patients this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count: newPatientsThisWeek, error: newError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'patient')
        .eq('practitioner_id', practitionerId)
        .gte('created_at', oneWeekAgo.toISOString());

      if (newError) throw newError;

      // Get active patients (patients with assessments in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activePatients, error: activeError } = await supabase
        .from('assessments')
        .select('user_id', { count: 'exact' })
        .eq('practitioner_id', practitionerId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (activeError) throw activeError;

      // Get upcoming appointments (mock data for now - would integrate with appointment system)
      const upcomingAppointments = Math.floor(Math.random() * 15) + 5; // Mock data

      return {
        totalPatients: totalPatients || 0,
        newPatientsThisWeek: newPatientsThisWeek || 0,
        activePatients: activePatients || 0,
        upcomingAppointments,
      };
    } catch (error) {
      console.error('Error fetching patient summary:', error);
      throw new Error('Failed to fetch patient summary data');
    }
  }

  /**
   * Get appointment summary statistics for a practitioner
   */
  async getAppointmentSummary(
    practitionerId: string
  ): Promise<AppointmentSummary> {
    try {
      // Note: This is mock data since we don't have an appointments table yet
      // In a real implementation, these would be actual database queries

      const today = new Date();
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      );
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Mock data - would be replaced with actual queries
      const mockData: AppointmentSummary = {
        todayAppointments: Math.floor(Math.random() * 8) + 2,
        weekAppointments: Math.floor(Math.random() * 25) + 10,
        monthAppointments: Math.floor(Math.random() * 100) + 40,
        cancelledToday: Math.floor(Math.random() * 3),
      };

      return mockData;
    } catch (error) {
      console.error('Error fetching appointment summary:', error);
      throw new Error('Failed to fetch appointment summary data');
    }
  }

  /**
   * Get recent activity for the dashboard
   */
  async getRecentActivity(practitionerId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(
          `
          id,
          created_at,
          status,
          user_profiles!inner(
            first_name,
            last_name,
            email
          )
        `
        )
        .eq('practitioner_id', practitionerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw new Error('Failed to fetch recent activity data');
    }
  }

  /**
   * Get dashboard metrics overview
   */
  async getDashboardMetrics(practitionerId: string) {
    try {
      const [patientSummary, appointmentSummary] = await Promise.all([
        this.getPatientSummary(practitionerId),
        this.getAppointmentSummary(practitionerId),
      ]);

      return {
        patients: patientSummary,
        appointments: appointmentSummary,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw new Error('Failed to fetch dashboard metrics');
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

export default dashboardService;
