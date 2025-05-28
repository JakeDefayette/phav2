import { BaseService, ServiceError } from '@/shared/services/base';
import { supabase } from '@/lib/supabase';

// Types for the new schema
export interface Assessment {
  id: string;
  child_id: string;
  practice_id?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'abandoned';
  brain_o_meter_score?: number;
  started_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AssessmentInsert {
  child_id: string;
  practice_id?: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'abandoned';
  brain_o_meter_score?: number;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface AssessmentUpdate {
  status?: 'draft' | 'in_progress' | 'completed' | 'abandoned';
  brain_o_meter_score?: number;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface AssessmentWithResponses extends Assessment {
  survey_responses?: Array<{
    id: string;
    question_id: string;
    response_value: any;
    response_text?: string;
    created_at: string;
  }>;
  child?: {
    id: string;
    first_name: string;
    last_name?: string;
    date_of_birth: string;
  };
}

export interface AssessmentStats {
  total: number;
  completed: number;
  in_progress: number;
  abandoned: number;
  average_score?: number;
  completion_rate: number;
}

/**
 * Service for managing assessment operations
 */
export class AssessmentsService extends BaseService<
  Assessment,
  AssessmentInsert,
  AssessmentUpdate
> {
  constructor() {
    super('assessments');
  }

  /**
   * Find assessments by child ID
   */
  async findByChildId(childId: string, status?: string): Promise<Assessment[]> {
    try {
      const filters: Record<string, any> = { child_id: childId };
      if (status) {
        filters.status = status;
      }

      return await this.findAll(filters, '*', {
        column: 'started_at',
        ascending: false,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by child ID');
    }
  }

  /**
   * Find assessments by user ID
   * Note: This is a placeholder implementation. In a real application,
   * you would need to determine the relationship between users and assessments
   * (e.g., through practice_id for chiropractors, or child_id for parents)
   */
  async findByUserId(userId: string): Promise<Assessment[]> {
    try {
      // For now, return empty array as this needs proper implementation
      // based on your user-assessment relationship logic
      return [];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by user ID');
    }
  }

  /**
   * Find assessment with responses
   */
  async findByIdWithResponses(
    assessmentId: string
  ): Promise<AssessmentWithResponses | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          survey_responses (
            id,
            question_id,
            response_value,
            response_text,
            created_at
          ),
          children (
            id,
            first_name,
            last_name,
            date_of_birth
          )
        `
        )
        .eq('id', assessmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        this.handleError(error, 'Find by ID with responses');
      }

      return data as AssessmentWithResponses;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by ID with responses');
    }
  }

  /**
   * Start a new assessment
   */
  async startAssessment(
    childId: string,
    practiceId?: string
  ): Promise<Assessment> {
    try {
      const assessmentData: AssessmentInsert = {
        child_id: childId,
        practice_id: practiceId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      };

      return await this.create(assessmentData);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Start assessment');
    }
  }

  /**
   * Complete an assessment with brain-o-meter score
   */
  async completeAssessment(
    assessmentId: string,
    brainOMeterScore: number
  ): Promise<Assessment> {
    try {
      const updateData: AssessmentUpdate = {
        status: 'completed',
        brain_o_meter_score: brainOMeterScore,
        completed_at: new Date().toISOString(),
      };

      const updated = await this.update(assessmentId, updateData);
      if (!updated) {
        throw new ServiceError('Assessment not found', 'NOT_FOUND');
      }

      return updated;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Complete assessment');
    }
  }

  /**
   * Abandon an assessment
   */
  async abandonAssessment(assessmentId: string): Promise<Assessment> {
    try {
      const updateData: AssessmentUpdate = {
        status: 'abandoned',
      };

      const updated = await this.update(assessmentId, updateData);
      if (!updated) {
        throw new ServiceError('Assessment not found', 'NOT_FOUND');
      }

      return updated;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Abandon assessment');
    }
  }

  /**
   * Get assessment statistics for a child
   */
  async getStatsForChild(childId: string): Promise<AssessmentStats> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('status, brain_o_meter_score')
        .eq('child_id', childId);

      if (error) {
        this.handleError(error, 'Get stats for child');
      }

      const assessments = data || [];
      const total = assessments.length;
      const completed = assessments.filter(
        a => a.status === 'completed'
      ).length;
      const inProgress = assessments.filter(
        a => a.status === 'in_progress'
      ).length;
      const abandoned = assessments.filter(
        a => a.status === 'abandoned'
      ).length;

      const completedScores = assessments
        .filter(a => a.status === 'completed' && a.brain_o_meter_score !== null)
        .map(a => a.brain_o_meter_score);

      const averageScore =
        completedScores.length > 0
          ? completedScores.reduce((sum, score) => sum + score, 0) /
            completedScores.length
          : undefined;

      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        completed,
        in_progress: inProgress,
        abandoned,
        average_score: averageScore,
        completion_rate: completionRate,
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Get stats for child');
    }
  }

  /**
   * Get assessment statistics for a practice
   */
  async getStatsForPractice(
    practiceId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<AssessmentStats> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('status, brain_o_meter_score')
        .eq('practice_id', practiceId);

      if (dateFrom) {
        query = query.gte('started_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('started_at', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'Get stats for practice');
      }

      const assessments = data || [];
      const total = assessments.length;
      const completed = assessments.filter(
        a => a.status === 'completed'
      ).length;
      const inProgress = assessments.filter(
        a => a.status === 'in_progress'
      ).length;
      const abandoned = assessments.filter(
        a => a.status === 'abandoned'
      ).length;

      const completedScores = assessments
        .filter(a => a.status === 'completed' && a.brain_o_meter_score !== null)
        .map(a => a.brain_o_meter_score);

      const averageScore =
        completedScores.length > 0
          ? completedScores.reduce((sum, score) => sum + score, 0) /
            completedScores.length
          : undefined;

      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        completed,
        in_progress: inProgress,
        abandoned,
        average_score: averageScore,
        completion_rate: completionRate,
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Get stats for practice');
    }
  }

  /**
   * Find recent assessments
   */
  async findRecent(
    limit: number = 10,
    practiceId?: string
  ): Promise<AssessmentWithResponses[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(
          `
          *,
          children (
            id,
            first_name,
            last_name,
            date_of_birth
          )
        `
        )
        .order('started_at', { ascending: false })
        .limit(limit);

      if (practiceId) {
        query = query.eq('practice_id', practiceId);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'Find recent assessments');
      }

      return data as AssessmentWithResponses[];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find recent assessments');
    }
  }

  /**
   * Submit responses for an assessment
   */
  async submitResponses(
    assessmentId: string,
    responses: Array<{
      question_id: string;
      response_value: any;
      response_text?: string;
    }>
  ): Promise<void> {
    try {
      // Insert survey responses
      const responseData = responses.map(response => ({
        assessment_id: assessmentId,
        question_id: response.question_id,
        response_value: response.response_value,
        response_text: response.response_text,
      }));

      const { error } = await supabase
        .from('survey_responses')
        .insert(responseData);

      if (error) {
        this.handleError(error, 'Submit responses');
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Submit responses');
    }
  }

  /**
   * Get assessment statistics with filters
   */
  async getStatistics(filters?: {
    practiceId?: string;
    childId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AssessmentStats> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('status, brain_o_meter_score');

      if (filters?.practiceId) {
        query = query.eq('practice_id', filters.practiceId);
      }
      if (filters?.childId) {
        query = query.eq('child_id', filters.childId);
      }
      if (filters?.dateFrom) {
        query = query.gte('started_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('started_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'Get statistics');
      }

      const assessments = data || [];
      const total = assessments.length;
      const completed = assessments.filter(
        a => a.status === 'completed'
      ).length;
      const inProgress = assessments.filter(
        a => a.status === 'in_progress'
      ).length;
      const abandoned = assessments.filter(
        a => a.status === 'abandoned'
      ).length;

      const completedScores = assessments
        .filter(a => a.status === 'completed' && a.brain_o_meter_score !== null)
        .map(a => a.brain_o_meter_score);

      const averageScore =
        completedScores.length > 0
          ? completedScores.reduce((sum, score) => sum + score, 0) /
            completedScores.length
          : undefined;

      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        completed,
        in_progress: inProgress,
        abandoned,
        average_score: averageScore,
        completion_rate: completionRate,
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Get statistics');
    }
  }
}

// Export singleton instance
export const assessmentsService = new AssessmentsService();
