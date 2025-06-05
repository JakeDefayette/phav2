import { BaseService, ServiceError } from '@/shared/services/base';
import { supabase } from '@/shared/services/supabase';

// Types for the new schema
export interface SurveyResponse {
  id: string;
  assessment_id: string;
  question_id: string;
  response_value: any;
  response_text?: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponseInsert {
  assessment_id: string;
  question_id: string;
  response_value: any;
  response_text?: string;
}

export interface SurveyResponseUpdate {
  response_value?: any;
  response_text?: string;
}

export interface SurveyResponseWithQuestion extends SurveyResponse {
  survey_question_definitions?: {
    id: string;
    question_text: string;
    question_type: string;
    options?: any;
    category: string;
    order_index: number;
    is_required: boolean;
    validation_rules?: any;
  };
}

export interface ResponseSummary {
  question_id: string;
  question_text: string;
  question_type: string;
  category: string;
  responses: Array<{
    value: any;
    text?: string;
    count: number;
    percentage: number;
  }>;
  total_responses: number;
}

/**
 * Service for managing survey response operations
 */
export class SurveyResponsesService extends BaseService<
  SurveyResponse,
  SurveyResponseInsert,
  SurveyResponseUpdate
> {
  constructor() {
    super('survey_responses');
  }

  /**
   * Find responses by assessment ID
   */
  async findByAssessmentId(
    assessmentId: string
  ): Promise<SurveyResponseWithQuestion[]> {
    try {
      // TODO: Survey responses table not yet implemented in schema
      // Return empty array for now
      console.log(
        'Survey responses would be fetched for assessment:',
        assessmentId
      );
      return [];

      // In the future, when survey_responses table is added:
      // const { data, error } = await supabase
      //   .from(this.tableName)
      //   .select('*')
      //   .eq('assessment_id', assessmentId)
      //   .order('created_at');
      //
      // if (error) {
      //   this.handleError(error, 'Find by assessment ID');
      // }
      //
      // return (data || []) as unknown as SurveyResponseWithQuestion[];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by assessment ID');
    }
  }

  /**
   * Save or update a response
   */
  async saveResponse(
    assessmentId: string,
    questionId: string,
    responseValue: any,
    responseText?: string
  ): Promise<SurveyResponse> {
    try {
      // Check if response already exists
      const existing = await this.findOne({
        assessment_id: assessmentId,
        question_id: questionId,
      });

      if (existing) {
        // Update existing response
        const updated = await this.update(existing.id, {
          response_value: responseValue,
          response_text: responseText,
        });

        if (!updated) {
          throw new ServiceError('Failed to update response', 'UPDATE_FAILED');
        }

        return updated;
      } else {
        // Create new response
        return await this.create({
          assessment_id: assessmentId,
          question_id: questionId,
          response_value: responseValue,
          response_text: responseText,
        });
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Save response');
    }
  }

  /**
   * Save multiple responses at once
   */
  async saveMultipleResponses(
    responses: SurveyResponseInsert[]
  ): Promise<SurveyResponse[]> {
    try {
      // TODO: Survey responses table not yet implemented in schema
      // Return empty array for now
      console.log('Multiple survey responses would be saved:', responses);
      return [];

      // In the future, when survey_responses table is added:
      // const { data, error } = await supabase
      //   .from(this.tableName)
      //   .upsert(responses, {
      //     onConflict: 'assessment_id,question_id',
      //     ignoreDuplicates: false,
      //   })
      //   .select();
      //
      // if (error) {
      //   this.handleError(error, 'Save multiple responses');
      // }
      //
      // return (data || []) as unknown as SurveyResponse[];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Save multiple responses');
    }
  }

  /**
   * Get response summary for a question across multiple assessments
   */
  async getResponseSummary(
    questionId: string,
    practiceId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ResponseSummary | null> {
    try {
      // TODO: Survey responses table not yet implemented in schema
      // Return null for now
      console.log(
        'Survey response summary would be fetched for question:',
        questionId
      );
      return null;

      // In the future, when survey_responses and survey_question_definitions tables are added:
      // Implement the actual database query and processing logic
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Get response summary');
    }
  }

  /**
   * Get responses by category for an assessment
   */
  async getResponsesByCategory(
    assessmentId: string
  ): Promise<Record<string, SurveyResponseWithQuestion[]>> {
    try {
      const responses = await this.findByAssessmentId(assessmentId);

      const responsesByCategory: Record<string, SurveyResponseWithQuestion[]> =
        {};

      responses.forEach(response => {
        const category =
          response.survey_question_definitions?.category || 'uncategorized';
        if (!responsesByCategory[category]) {
          responsesByCategory[category] = [];
        }
        responsesByCategory[category].push(response);
      });

      // Sort responses within each category by order_index
      Object.keys(responsesByCategory).forEach(category => {
        responsesByCategory[category].sort((a, b) => {
          const orderA = a.survey_question_definitions?.order_index || 0;
          const orderB = b.survey_question_definitions?.order_index || 0;
          return orderA - orderB;
        });
      });

      return responsesByCategory;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Get responses by category');
    }
  }

  /**
   * Calculate brain-o-meter score from responses
   */
  async calculateBrainOMeterScore(assessmentId: string): Promise<number> {
    try {
      const responses = await this.findByAssessmentId(assessmentId);

      // This is a simplified scoring algorithm
      // In practice, you'd implement the actual brain-o-meter scoring logic
      let totalScore = 0;
      let scorableResponses = 0;

      responses.forEach(response => {
        const questionType =
          response.survey_question_definitions?.question_type;

        if (questionType === 'scale' || questionType === 'number') {
          const value = Number(response.response_value);
          if (!isNaN(value)) {
            totalScore += value;
            scorableResponses++;
          }
        } else if (questionType === 'boolean') {
          // Convert boolean to score (true = 1, false = 0)
          totalScore += response.response_value ? 1 : 0;
          scorableResponses++;
        }
      });

      if (scorableResponses === 0) {
        return 0;
      }

      // Normalize to 0-100 scale
      const averageScore = totalScore / scorableResponses;
      return Math.round(averageScore * 10); // Assuming scale questions are 1-10
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Calculate brain-o-meter score');
    }
  }

  /**
   * Delete all responses for an assessment
   */
  async deleteByAssessmentId(assessmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('assessment_id', assessmentId);

      if (error) {
        this.handleError(error, 'Delete by assessment ID');
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Delete by assessment ID');
    }
  }
}

// Export singleton instance
export const surveyResponsesService = new SurveyResponsesService();
