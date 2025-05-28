import { BaseService, ServiceError } from '@/shared/services/base';
import { supabase } from '@/shared/services/supabase';
import type {
  Child,
  ChildInsert,
  ChildUpdate,
  ChildWithAssessments,
  CreateChildData,
  UpdateChildData,
} from '../types';

/**
 * Service for managing child operations
 */
export class ChildrenService extends BaseService<
  Child,
  ChildInsert,
  ChildUpdate
> {
  constructor() {
    super('children');
  }

  /**
   * Find children by parent ID
   */
  async findByParentId(parentId: string): Promise<Child[]> {
    try {
      return await this.findAll({ parent_id: parentId }, '*', {
        column: 'first_name',
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by parent ID');
    }
  }

  /**
   * Find child with their assessments
   */
  async findByIdWithAssessments(
    childId: string
  ): Promise<ChildWithAssessments | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          assessments (
            id,
            status,
            brain_o_meter_score,
            started_at,
            completed_at
          )
        `
        )
        .eq('id', childId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        this.handleError(error, 'Find by ID with assessments');
      }

      return data as ChildWithAssessments;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by ID with assessments');
    }
  }

  /**
   * Find children by age range
   */
  async findByAgeRange(
    minAge: number,
    maxAge: number,
    parentId?: string
  ): Promise<Child[]> {
    try {
      const today = new Date();
      const maxBirthDate = new Date(
        today.getFullYear() - minAge,
        today.getMonth(),
        today.getDate()
      );
      const minBirthDate = new Date(
        today.getFullYear() - maxAge - 1,
        today.getMonth(),
        today.getDate()
      );

      let query = supabase
        .from(this.tableName)
        .select('*')
        .gte('date_of_birth', minBirthDate.toISOString().split('T')[0])
        .lte('date_of_birth', maxBirthDate.toISOString().split('T')[0])
        .order('date_of_birth', { ascending: false });

      if (parentId) {
        query = query.eq('parent_id', parentId);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'Find by age range');
      }

      return data as Child[];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by age range');
    }
  }

  /**
   * Calculate child's age in years
   */
  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Find children with recent assessments
   */
  async findWithRecentAssessments(
    parentId?: string,
    daysBack: number = 30
  ): Promise<ChildWithAssessments[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      let query = supabase
        .from(this.tableName)
        .select(
          `
          *,
          assessments!inner (
            id,
            status,
            brain_o_meter_score,
            started_at,
            completed_at
          )
        `
        )
        .gte('assessments.started_at', cutoffDate.toISOString())
        .order('first_name');

      if (parentId) {
        query = query.eq('parent_id', parentId);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'Find with recent assessments');
      }

      return data as ChildWithAssessments[];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find with recent assessments');
    }
  }

  /**
   * Get assessment count for a child
   */
  async getAssessmentCount(childId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', childId);

      if (error) {
        this.handleError(error, 'Get assessment count');
      }

      return count || 0;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Get assessment count');
    }
  }

  /**
   * Get completed assessment count for a child
   */
  async getCompletedAssessmentCount(childId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', childId)
        .eq('status', 'completed');

      if (error) {
        this.handleError(error, 'Get completed assessment count');
      }

      return count || 0;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Get completed assessment count');
    }
  }

  /**
   * Find children by practice (for practitioners)
   */
  async findByPracticeId(practiceId: string): Promise<Child[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          user_profiles!inner (
            practice_id
          )
        `
        )
        .eq('user_profiles.practice_id', practiceId)
        .order('first_name');

      if (error) {
        this.handleError(error, 'Find by practice ID');
      }

      return data as Child[];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by practice ID');
    }
  }
}

// Export singleton instance
export const childrenService = new ChildrenService();
