import { BaseService, ServiceError } from './base';
import { supabase } from '@/lib/supabase';

// Types for the new schema
export interface Report {
  id: string;
  assessment_id: string;
  practice_id?: string;
  report_type: 'standard' | 'detailed' | 'summary';
  content: Record<string, any>;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReportInsert {
  assessment_id: string;
  practice_id?: string;
  report_type?: 'standard' | 'detailed' | 'summary';
  content: Record<string, any>;
  generated_at?: string;
}

export interface ReportUpdate {
  report_type?: 'standard' | 'detailed' | 'summary';
  content?: Record<string, any>;
  generated_at?: string;
}

export interface ReportShare {
  id: string;
  report_id: string;
  share_token: string;
  shared_by_user_id?: string;
  recipient_email?: string;
  recipient_name?: string;
  share_method: 'email' | 'link' | 'qr_code';
  expires_at?: string;
  viewed_at?: string;
  conversion_assessment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportShareInsert {
  report_id: string;
  shared_by_user_id?: string;
  recipient_email?: string;
  recipient_name?: string;
  share_method: 'email' | 'link' | 'qr_code';
  expires_at?: string;
}

export interface ReportWithShares extends Report {
  report_shares?: ReportShare[];
  assessment?: {
    id: string;
    child_id: string;
    brain_o_meter_score?: number;
    started_at: string;
    completed_at?: string;
  };
  children?: {
    id: string;
    first_name: string;
    last_name?: string;
    date_of_birth: string;
  };
}

export interface ViralMetrics {
  total_shares: number;
  shares_by_method: Record<string, number>;
  total_views: number;
  conversion_rate: number;
  conversions: number;
  most_shared_reports: Array<{
    report_id: string;
    child_name: string;
    share_count: number;
    view_count: number;
  }>;
}

/**
 * Service for managing report operations and viral tracking
 */
export class ReportsService extends BaseService<
  Report,
  ReportInsert,
  ReportUpdate
> {
  constructor() {
    super('reports');
  }

  /**
   * Generate a report for an assessment
   */
  async generateReport(
    assessmentId: string,
    reportType: 'standard' | 'detailed' | 'summary' = 'standard',
    practiceId?: string
  ): Promise<Report> {
    try {
      // Get assessment with responses and child data
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select(
          `
          *,
          children (
            id,
            first_name,
            last_name,
            date_of_birth,
            gender
          ),
          survey_responses (
            id,
            question_id,
            response_value,
            response_text,
            survey_question_definitions (
              question_text,
              question_type,
              category,
              options
            )
          )
        `
        )
        .eq('id', assessmentId)
        .single();

      if (assessmentError) {
        this.handleError(assessmentError, 'Get assessment data for report');
      }

      if (!assessmentData) {
        throw new ServiceError('Assessment not found', 'NOT_FOUND');
      }

      // Generate report content based on type
      const content = this.generateReportContent(assessmentData, reportType);

      const reportData: ReportInsert = {
        assessment_id: assessmentId,
        practice_id: practiceId,
        report_type: reportType,
        content,
        generated_at: new Date().toISOString(),
      };

      return await this.create(reportData);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Generate report');
    }
  }

  /**
   * Generate report content based on assessment data and type
   */
  private generateReportContent(
    assessmentData: any,
    reportType: string
  ): Record<string, any> {
    const child = assessmentData.children;
    const responses = assessmentData.survey_responses || [];

    // Group responses by category
    const responsesByCategory: Record<string, any[]> = {};
    responses.forEach((response: any) => {
      const category =
        response.survey_question_definitions?.category || 'general';
      if (!responsesByCategory[category]) {
        responsesByCategory[category] = [];
      }
      responsesByCategory[category].push(response);
    });

    const baseContent = {
      child: {
        name: `${child.first_name} ${child.last_name || ''}`.trim(),
        age: this.calculateAge(child.date_of_birth),
        gender: child.gender,
      },
      assessment: {
        id: assessmentData.id,
        brain_o_meter_score: assessmentData.brain_o_meter_score,
        completed_at: assessmentData.completed_at,
        status: assessmentData.status,
      },
      categories: responsesByCategory,
      summary: this.generateSummary(
        responses,
        assessmentData.brain_o_meter_score
      ),
    };

    switch (reportType) {
      case 'detailed':
        return {
          ...baseContent,
          detailed_analysis: this.generateDetailedAnalysis(responses),
          recommendations: this.generateRecommendations(
            responses,
            assessmentData.brain_o_meter_score
          ),
        };

      case 'summary':
        return {
          child: baseContent.child,
          assessment: {
            brain_o_meter_score: baseContent.assessment.brain_o_meter_score,
            completed_at: baseContent.assessment.completed_at,
          },
          key_insights: this.generateKeyInsights(responses),
        };

      default: // standard
        return baseContent;
    }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
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
   * Generate summary from responses
   */
  private generateSummary(
    responses: any[],
    brainOMeterScore?: number
  ): Record<string, any> {
    return {
      total_questions: responses.length,
      brain_o_meter_score: brainOMeterScore,
      completion_status: responses.length > 0 ? 'completed' : 'incomplete',
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Generate detailed analysis
   */
  private generateDetailedAnalysis(responses: any[]): Record<string, any> {
    // This would contain more sophisticated analysis logic
    return {
      response_patterns: 'Analysis of response patterns would go here',
      strengths: 'Identified strengths based on responses',
      areas_for_improvement: 'Areas that may need attention',
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    responses: any[],
    brainOMeterScore?: number
  ): string[] {
    // This would contain logic to generate personalized recommendations
    const recommendations = [];

    if (brainOMeterScore && brainOMeterScore < 50) {
      recommendations.push(
        'Consider additional support in key developmental areas'
      );
    }

    recommendations.push('Continue regular assessments to track progress');

    return recommendations;
  }

  /**
   * Generate key insights for summary reports
   */
  private generateKeyInsights(responses: any[]): string[] {
    // This would contain logic to extract key insights
    return [
      'Assessment completed successfully',
      'Development appears to be on track',
      'Regular follow-up recommended',
    ];
  }

  /**
   * Find reports by assessment ID
   */
  async findByAssessmentId(assessmentId: string): Promise<Report[]> {
    try {
      return await this.findAll({ assessment_id: assessmentId }, '*', {
        column: 'generated_at',
        ascending: false,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by assessment ID');
    }
  }

  /**
   * Find report with shares and assessment data
   */
  async findByIdWithShares(reportId: string): Promise<ReportWithShares | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          report_shares (
            id,
            share_token,
            shared_by_user_id,
            recipient_email,
            recipient_name,
            share_method,
            expires_at,
            viewed_at,
            conversion_assessment_id,
            created_at
          ),
          assessments (
            id,
            child_id,
            brain_o_meter_score,
            started_at,
            completed_at,
            children (
              id,
              first_name,
              last_name,
              date_of_birth
            )
          )
        `
        )
        .eq('id', reportId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        this.handleError(error, 'Find by ID with shares');
      }

      return data as ReportWithShares;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by ID with shares');
    }
  }

  /**
   * Create a share for a report
   */
  async createShare(shareData: ReportShareInsert): Promise<ReportShare> {
    try {
      const { data, error } = await supabase
        .from('report_shares')
        .insert({
          ...shareData,
          share_token: this.generateShareToken(),
        })
        .select()
        .single();

      if (error) {
        this.handleError(error, 'Create share');
      }

      return data as ReportShare;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Create share');
    }
  }

  /**
   * Generate a unique share token
   */
  private generateShareToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Find report by share token
   */
  async findByShareToken(shareToken: string): Promise<ReportWithShares | null> {
    try {
      const { data, error } = await supabase
        .from('report_shares')
        .select(
          `
          *,
          reports (
            *,
            assessments (
              id,
              child_id,
              brain_o_meter_score,
              started_at,
              completed_at,
              children (
                id,
                first_name,
                last_name,
                date_of_birth
              )
            )
          )
        `
        )
        .eq('share_token', shareToken)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        this.handleError(error, 'Find by share token');
      }

      // Check if share has expired
      if (data?.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }

      return (data as any)?.reports as ReportWithShares;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by share token');
    }
  }

  /**
   * Mark a share as viewed
   */
  async markShareAsViewed(shareToken: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('report_shares')
        .update({ viewed_at: new Date().toISOString() })
        .eq('share_token', shareToken)
        .is('viewed_at', null); // Only update if not already viewed

      if (error) {
        this.handleError(error, 'Mark share as viewed');
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Mark share as viewed');
    }
  }

  /**
   * Record a conversion from a shared report
   */
  async recordConversion(
    shareToken: string,
    conversionAssessmentId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('report_shares')
        .update({ conversion_assessment_id: conversionAssessmentId })
        .eq('share_token', shareToken);

      if (error) {
        this.handleError(error, 'Record conversion');
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Record conversion');
    }
  }

  /**
   * Get viral metrics for a practice
   */
  async getViralMetrics(
    practiceId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ViralMetrics> {
    try {
      let query = supabase
        .from('report_shares')
        .select(
          `
          *,
          reports!inner (
            practice_id,
            assessments (
              children (
                first_name,
                last_name
              )
            )
          )
        `
        )
        .eq('reports.practice_id', practiceId);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'Get viral metrics');
      }

      const shares = data || [];
      const totalShares = shares.length;
      const totalViews = shares.filter(share => share.viewed_at).length;
      const conversions = shares.filter(
        share => share.conversion_assessment_id
      ).length;
      const conversionRate =
        totalViews > 0 ? (conversions / totalViews) * 100 : 0;

      // Count shares by method
      const sharesByMethod: Record<string, number> = {};
      shares.forEach(share => {
        sharesByMethod[share.share_method] =
          (sharesByMethod[share.share_method] || 0) + 1;
      });

      // Get most shared reports
      const reportShareCounts = new Map<
        string,
        { count: number; views: number; childName: string }
      >();
      shares.forEach(share => {
        const reportId = share.report_id;
        const existing = reportShareCounts.get(reportId) || {
          count: 0,
          views: 0,
          childName: '',
        };
        existing.count++;
        if (share.viewed_at) existing.views++;

        const child = share.reports?.assessments?.children;
        if (child) {
          existing.childName =
            `${child.first_name} ${child.last_name || ''}`.trim();
        }

        reportShareCounts.set(reportId, existing);
      });

      const mostSharedReports = Array.from(reportShareCounts.entries())
        .map(([reportId, data]) => ({
          report_id: reportId,
          child_name: data.childName,
          share_count: data.count,
          view_count: data.views,
        }))
        .sort((a, b) => b.share_count - a.share_count)
        .slice(0, 10);

      return {
        total_shares: totalShares,
        shares_by_method: sharesByMethod,
        total_views: totalViews,
        conversion_rate: conversionRate,
        conversions,
        most_shared_reports: mostSharedReports,
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Get viral metrics');
    }
  }
}

// Export singleton instance
export const reportsService = new ReportsService();
