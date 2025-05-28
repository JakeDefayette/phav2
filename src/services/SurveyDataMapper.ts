import { ServiceError } from './base';
import { SurveyResponseWithQuestion, ResponseSummary } from './surveyResponses';
import { Database } from '@/types/database';

// Type definitions for the data mapper
export type QuestionType = Database['public']['Enums']['question_type_enum'];

// Types for mapped data structures
export interface MappedResponse {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  category: string;
  rawValue: any;
  processedValue: any;
  displayValue: string;
  isValid: boolean;
  validationErrors: string[];
  metadata: {
    orderIndex: number;
    isRequired: boolean;
    options?: any;
    validationRules?: any;
  };
}

export interface CategorySummary {
  categoryName: string;
  totalQuestions: number;
  answeredQuestions: number;
  completionRate: number;
  statistics: CategoryStatistics;
  responses: MappedResponse[];
}

export interface CategoryStatistics {
  averageScore?: number;
  totalScore?: number;
  maxPossibleScore?: number;
  scorePercentage?: number;
  responseDistribution: Record<string, number>;
  commonResponses: Array<{ value: string; count: number; percentage: number }>;
  insights: string[];
}

export interface ReportDataStructure {
  assessmentId: string;
  totalQuestions: number;
  answeredQuestions: number;
  overallCompletionRate: number;
  categories: Record<string, CategorySummary>;
  overallStatistics: {
    brainOMeterScore?: number;
    categoryScores: Record<string, number>;
    strengthAreas: string[];
    concernAreas: string[];
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  visualData: {
    charts: Array<{
      type: 'pie' | 'bar' | 'line' | 'radar';
      title: string;
      data: any;
      category?: string;
    }>;
    tables: Array<{
      title: string;
      headers: string[];
      rows: any[][];
      category?: string;
    }>;
  };
  metadata: {
    processedAt: string;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
    validationErrors: string[];
    processingNotes: string[];
    reportType?: string;
    assessmentId?: string;
    totalResponses?: number;
  };
  rawResponses: MappedResponse[];
}

export interface ValidationRule {
  type: 'required' | 'range' | 'length' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

/**
 * Singleton service for mapping survey data into structured report formats
 */
export class SurveyDataMapper {
  private static instance: SurveyDataMapper;
  private validationErrors: string[] = [];
  private processingNotes: string[] = [];

  private constructor() {}

  public static getInstance(): SurveyDataMapper {
    if (!SurveyDataMapper.instance) {
      SurveyDataMapper.instance = new SurveyDataMapper();
    }
    return SurveyDataMapper.instance;
  }

  /**
   * Main method to map survey responses into structured report data
   */
  async mapSurveyData(
    responses: SurveyResponseWithQuestion[],
    assessmentId: string
  ): Promise<ReportDataStructure> {
    this.resetState();

    try {
      // Process individual responses
      const mappedResponses = await this.processResponses(responses);

      // Group by categories
      const categories = this.groupByCategories(mappedResponses);

      // Calculate statistics for each category
      const categoriesWithStats = this.calculateCategoryStatistics(categories);

      // Calculate overall statistics
      const overallStats = this.calculateOverallStatistics(
        categoriesWithStats,
        mappedResponses
      );

      // Generate visual data
      const visualData = this.generateVisualData(categoriesWithStats);

      // Assess data quality
      const dataQuality = this.assessDataQuality(mappedResponses);

      return {
        assessmentId,
        totalQuestions: mappedResponses.length,
        answeredQuestions: mappedResponses.filter(
          r => r.isValid && r.rawValue != null
        ).length,
        overallCompletionRate: this.calculateCompletionRate(mappedResponses),
        categories: categoriesWithStats,
        overallStatistics: overallStats,
        visualData,
        metadata: {
          processedAt: new Date().toISOString(),
          dataQuality,
          validationErrors: this.validationErrors,
          processingNotes: this.processingNotes,
          reportType: 'survey',
          assessmentId,
          totalResponses: mappedResponses.length,
        },
        rawResponses: mappedResponses,
      };
    } catch (error) {
      this.validationErrors.push(
        `Critical error during data mapping: ${error}`
      );
      throw new Error(`Survey data mapping failed: ${error}`);
    }
  }

  /**
   * Process individual survey responses
   */
  private async processResponses(
    responses: SurveyResponseWithQuestion[]
  ): Promise<MappedResponse[]> {
    const mappedResponses: MappedResponse[] = [];

    for (const response of responses) {
      try {
        const mapped = await this.processIndividualResponse(response);
        mappedResponses.push(mapped);

        // Collect validation errors from individual responses
        if (!mapped.isValid && mapped.validationErrors.length > 0) {
          mapped.validationErrors.forEach(error => {
            this.validationErrors.push(
              `Question ${mapped.questionId}: ${error}`
            );
          });
        }
      } catch (error) {
        this.validationErrors.push(
          `Failed to process response ${response.id}: ${error}`
        );
        // Create a fallback mapped response for failed processing
        mappedResponses.push(this.createFallbackResponse(response));
      }
    }

    return mappedResponses.sort(
      (a, b) => a.metadata.orderIndex - b.metadata.orderIndex
    );
  }

  /**
   * Process a single survey response
   */
  private async processIndividualResponse(
    response: SurveyResponseWithQuestion
  ): Promise<MappedResponse> {
    const questionDef = response.survey_question_definitions;
    if (!questionDef) {
      throw new Error('Question definition not found');
    }

    const rawValue = response.response_value;
    const questionType = questionDef.question_type as QuestionType;

    // Process value based on question type
    const { processedValue, displayValue, isValid, errors } =
      this.processValueByType(
        rawValue,
        questionType,
        questionDef.options,
        questionDef.validation_rules
      );

    return {
      questionId: response.question_id,
      questionText: questionDef.question_text,
      questionType,
      category: questionDef.category || 'uncategorized',
      rawValue,
      processedValue,
      displayValue,
      isValid,
      validationErrors: errors,
      metadata: {
        orderIndex: questionDef.order_index,
        isRequired: questionDef.is_required,
        options: questionDef.options,
        validationRules: questionDef.validation_rules,
      },
    };
  }

  /**
   * Process value based on question type
   */
  private processValueByType(
    rawValue: any,
    questionType: QuestionType,
    options?: any,
    validationRules?: any
  ): {
    processedValue: any;
    displayValue: string;
    isValid: boolean;
    errors: string[];
  } {
    let errors: string[] = [];
    let processedValue: any = rawValue;
    let displayValue: string = '';
    let isValid = true;

    // Handle null/undefined values
    if (rawValue == null || rawValue === '') {
      return {
        processedValue: null,
        displayValue: 'No response',
        isValid: false,
        errors: ['No response provided'],
      };
    }

    try {
      switch (questionType) {
        case 'multiple_choice':
          ({ processedValue, displayValue, isValid, errors } =
            this.processMultipleChoice(rawValue, options));
          break;

        case 'text':
          ({ processedValue, displayValue, isValid, errors } = this.processText(
            rawValue,
            validationRules
          ));
          break;

        case 'number':
          ({ processedValue, displayValue, isValid, errors } =
            this.processNumber(rawValue, validationRules));
          break;

        case 'boolean':
          ({ processedValue, displayValue, isValid, errors } =
            this.processBoolean(rawValue));
          break;

        case 'scale':
          ({ processedValue, displayValue, isValid, errors } =
            this.processScale(rawValue, validationRules));
          break;

        case 'date':
          ({ processedValue, displayValue, isValid, errors } =
            this.processDate(rawValue));
          break;

        default:
          errors.push(`Unsupported question type: ${questionType}`);
          isValid = false;
          displayValue = String(rawValue);
      }
    } catch (error) {
      errors.push(`Processing error: ${error}`);
      isValid = false;
      displayValue = String(rawValue);
    }

    return { processedValue, displayValue, isValid, errors };
  }

  /**
   * Process multiple choice responses
   */
  private processMultipleChoice(
    rawValue: any,
    options?: any
  ): {
    processedValue: any;
    displayValue: string;
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!options || !options.choices) {
      return {
        processedValue: rawValue,
        displayValue: String(rawValue),
        isValid: false,
        errors: ['No valid options defined for multiple choice question'],
      };
    }

    const choices = options.choices;
    const selectedValue = String(rawValue);

    // Find matching choice
    const matchingChoice = choices.find(
      (choice: any) =>
        choice.value === selectedValue || choice.label === selectedValue
    );

    if (matchingChoice) {
      return {
        processedValue: matchingChoice.value,
        displayValue: matchingChoice.label || matchingChoice.value,
        isValid: true,
        errors: [],
      };
    } else {
      return {
        processedValue: selectedValue,
        displayValue: selectedValue,
        isValid: false,
        errors: [`Invalid choice: ${selectedValue}`],
      };
    }
  }

  /**
   * Process text responses
   */
  private processText(
    rawValue: any,
    validationRules?: any
  ): {
    processedValue: string;
    displayValue: string;
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const textValue = String(rawValue).trim();

    // Apply validation rules
    if (validationRules) {
      if (
        validationRules.min_length &&
        textValue.length < validationRules.min_length
      ) {
        errors.push(
          `Text too short (minimum ${validationRules.min_length} characters)`
        );
      }
      if (
        validationRules.max_length &&
        textValue.length > validationRules.max_length
      ) {
        errors.push(
          `Text too long (maximum ${validationRules.max_length} characters)`
        );
      }
      if (validationRules.pattern) {
        const regex = new RegExp(validationRules.pattern);
        if (!regex.test(textValue)) {
          errors.push('Text does not match required pattern');
        }
      }
    }

    return {
      processedValue: textValue,
      displayValue: textValue,
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process number responses
   */
  private processNumber(
    rawValue: any,
    validationRules?: any
  ): {
    processedValue: number;
    displayValue: string;
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const numValue = Number(rawValue);

    if (isNaN(numValue)) {
      return {
        processedValue: 0,
        displayValue: String(rawValue),
        isValid: false,
        errors: ['Invalid number format'],
      };
    }

    // Apply validation rules
    if (validationRules) {
      if (validationRules.min !== undefined && numValue < validationRules.min) {
        errors.push(`Number too small (minimum ${validationRules.min})`);
      }
      if (validationRules.max !== undefined && numValue > validationRules.max) {
        errors.push(`Number too large (maximum ${validationRules.max})`);
      }
    }

    return {
      processedValue: numValue,
      displayValue: numValue.toString(),
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process boolean responses
   */
  private processBoolean(rawValue: any): {
    processedValue: boolean;
    displayValue: string;
    isValid: boolean;
    errors: string[];
  } {
    let boolValue: boolean;

    if (typeof rawValue === 'boolean') {
      boolValue = rawValue;
    } else if (typeof rawValue === 'string') {
      const lowerValue = rawValue.toLowerCase();
      if (['true', 'yes', '1', 'on'].includes(lowerValue)) {
        boolValue = true;
      } else if (['false', 'no', '0', 'off'].includes(lowerValue)) {
        boolValue = false;
      } else {
        return {
          processedValue: false,
          displayValue: String(rawValue),
          isValid: false,
          errors: ['Invalid boolean value'],
        };
      }
    } else if (typeof rawValue === 'number') {
      boolValue = rawValue !== 0;
    } else {
      return {
        processedValue: false,
        displayValue: String(rawValue),
        isValid: false,
        errors: ['Cannot convert to boolean'],
      };
    }

    return {
      processedValue: boolValue,
      displayValue: boolValue ? 'Yes' : 'No',
      isValid: true,
      errors: [],
    };
  }

  /**
   * Process scale responses (1-10, 1-5, etc.)
   */
  private processScale(
    rawValue: any,
    validationRules?: any
  ): {
    processedValue: number;
    displayValue: string;
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const numValue = Number(rawValue);

    if (isNaN(numValue)) {
      return {
        processedValue: 0,
        displayValue: String(rawValue),
        isValid: false,
        errors: ['Invalid scale value'],
      };
    }

    // Default scale validation (1-10)
    const minScale = validationRules?.min_scale || 1;
    const maxScale = validationRules?.max_scale || 10;

    if (numValue < minScale || numValue > maxScale) {
      errors.push(`Scale value must be between ${minScale} and ${maxScale}`);
    }

    return {
      processedValue: numValue,
      displayValue: `${numValue}/${maxScale}`,
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process date responses
   */
  private processDate(rawValue: any): {
    processedValue: Date;
    displayValue: string;
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    let dateValue: Date;

    try {
      dateValue = new Date(rawValue);
      if (isNaN(dateValue.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return {
        processedValue: new Date(),
        displayValue: String(rawValue),
        isValid: false,
        errors: ['Invalid date format'],
      };
    }

    return {
      processedValue: dateValue,
      displayValue: dateValue.toLocaleDateString(),
      isValid: true,
      errors: [],
    };
  }

  /**
   * Group responses by categories
   */
  private groupByCategories(
    responses: MappedResponse[]
  ): Record<string, MappedResponse[]> {
    const categories: Record<string, MappedResponse[]> = {};

    for (const response of responses) {
      const category = response.category || 'uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(response);
    }

    return categories;
  }

  /**
   * Calculate statistics for each category
   */
  private calculateCategoryStatistics(
    categories: Record<string, MappedResponse[]>
  ): Record<string, CategorySummary> {
    const categoriesWithStats: Record<string, CategorySummary> = {};

    for (const [categoryName, responses] of Object.entries(categories)) {
      const validResponses = responses.filter(
        r => r.isValid && r.processedValue != null
      );
      const totalQuestions = responses.length;
      const answeredQuestions = validResponses.length;
      const completionRate =
        totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

      // Calculate statistics
      const statistics = this.calculateStatisticsForCategory(validResponses);

      categoriesWithStats[categoryName] = {
        categoryName,
        totalQuestions,
        answeredQuestions,
        completionRate,
        statistics,
        responses,
      };
    }

    return categoriesWithStats;
  }

  /**
   * Calculate statistics for a specific category
   */
  private calculateStatisticsForCategory(
    responses: MappedResponse[]
  ): CategoryStatistics {
    const responseDistribution: Record<string, number> = {};
    const numericValues: number[] = [];

    // Collect response distribution and numeric values
    for (const response of responses) {
      const displayValue = response.displayValue;
      responseDistribution[displayValue] =
        (responseDistribution[displayValue] || 0) + 1;

      // Collect numeric values for statistical calculations
      if (typeof response.processedValue === 'number') {
        numericValues.push(response.processedValue);
      } else if (typeof response.processedValue === 'boolean') {
        numericValues.push(response.processedValue ? 1 : 0);
      }
    }

    // Calculate common responses
    const commonResponses = Object.entries(responseDistribution)
      .map(([value, count]) => ({
        value,
        count,
        percentage: (count / responses.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 most common responses

    // Calculate numeric statistics
    let averageScore: number | undefined;
    let totalScore: number | undefined;
    let maxPossibleScore: number | undefined;
    let scorePercentage: number | undefined;

    if (numericValues.length > 0) {
      totalScore = numericValues.reduce((sum, val) => sum + val, 0);
      averageScore = totalScore / numericValues.length;

      // Estimate max possible score (assuming scale questions use max 10)
      maxPossibleScore = numericValues.length * 10;
      scorePercentage = (totalScore / maxPossibleScore) * 100;
    }

    // Generate insights
    const insights = this.generateCategoryInsights(
      responses,
      commonResponses,
      averageScore
    );

    return {
      averageScore,
      totalScore,
      maxPossibleScore,
      scorePercentage,
      responseDistribution,
      commonResponses,
      insights,
    };
  }

  /**
   * Generate insights for a category
   */
  private generateCategoryInsights(
    responses: MappedResponse[],
    commonResponses: Array<{
      value: string;
      count: number;
      percentage: number;
    }>,
    averageScore?: number
  ): string[] {
    const insights: string[] = [];

    // Completion insight
    const completionRate =
      (responses.filter(r => r.isValid).length / responses.length) * 100;
    if (completionRate < 80) {
      insights.push(
        `Low completion rate (${completionRate.toFixed(1)}%) - consider reviewing question clarity`
      );
    }

    // Score-based insights
    if (averageScore !== undefined) {
      if (averageScore >= 8) {
        insights.push('Strong performance in this category');
      } else if (averageScore <= 4) {
        insights.push('Area of concern - may need attention');
      } else {
        insights.push('Moderate performance - room for improvement');
      }
    }

    // Common response insights
    if (commonResponses.length > 0 && commonResponses[0].percentage > 70) {
      insights.push(
        `Highly consistent responses (${commonResponses[0].percentage.toFixed(1)}% gave "${commonResponses[0].value}")`
      );
    }

    return insights;
  }

  /**
   * Calculate overall statistics across all categories
   */
  private calculateOverallStatistics(
    categories: Record<string, CategorySummary>,
    allResponses: MappedResponse[]
  ): ReportDataStructure['overallStatistics'] {
    const categoryScores: Record<string, number> = {};
    const strengthAreas: string[] = [];
    const concernAreas: string[] = [];

    // Calculate category scores
    for (const [categoryName, category] of Object.entries(categories)) {
      if (category.statistics.scorePercentage !== undefined) {
        categoryScores[categoryName] = category.statistics.scorePercentage;

        if (category.statistics.scorePercentage >= 75) {
          strengthAreas.push(categoryName);
        } else if (category.statistics.scorePercentage <= 40) {
          concernAreas.push(categoryName);
        }
      }
    }

    // Calculate brain-o-meter score (weighted average of category scores)
    const brainOMeterScore = this.calculateBrainOMeterScore(categoryScores);

    // Assess data quality
    const dataQuality = this.assessDataQuality(allResponses);

    return {
      brainOMeterScore,
      categoryScores,
      strengthAreas,
      concernAreas,
      dataQuality,
    };
  }

  /**
   * Calculate brain-o-meter score
   */
  private calculateBrainOMeterScore(
    categoryScores: Record<string, number>
  ): number {
    const scores = Object.values(categoryScores);
    if (scores.length === 0) return 0;

    const averageScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(averageScore);
  }

  /**
   * Generate visual data for charts and tables
   */
  private generateVisualData(
    categories: Record<string, CategorySummary>
  ): ReportDataStructure['visualData'] {
    const charts: any[] = [];
    const tables: any[] = [];

    // Category scores pie chart
    const categoryScoreData = Object.entries(categories)
      .filter(
        ([_, category]) => category.statistics.scorePercentage !== undefined
      )
      .map(([name, category]) => ({
        name,
        value: category.statistics.scorePercentage,
      }));

    if (categoryScoreData.length > 0) {
      charts.push({
        type: 'pie' as const,
        title: 'Category Performance Distribution',
        data: categoryScoreData,
      });
    }

    // Category completion rates bar chart
    const completionData = Object.entries(categories).map(
      ([name, category]) => ({
        category: name,
        completion: category.completionRate,
      })
    );

    charts.push({
      type: 'bar' as const,
      title: 'Category Completion Rates',
      data: completionData,
    });

    // Detailed responses table for each category
    for (const [categoryName, category] of Object.entries(categories)) {
      const tableData = category.responses.map(response => [
        response.questionText,
        response.displayValue,
        response.isValid ? 'Valid' : 'Invalid',
      ]);

      tables.push({
        title: `${categoryName} Responses`,
        headers: ['Question', 'Response', 'Status'],
        rows: tableData,
        category: categoryName,
      });
    }

    return { charts, tables };
  }

  /**
   * Assess overall data quality
   */
  private assessDataQuality(
    responses: MappedResponse[]
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const totalResponses = responses.length;
    const validResponses = responses.filter(r => r.isValid).length;
    const completionRate =
      totalResponses > 0 ? (validResponses / totalResponses) * 100 : 0;

    if (completionRate >= 95) return 'excellent';
    if (completionRate >= 85) return 'good';
    if (completionRate >= 70) return 'fair';
    return 'poor';
  }

  /**
   * Calculate completion rate
   */
  private calculateCompletionRate(responses: MappedResponse[]): number {
    const totalQuestions = responses.length;
    const answeredQuestions = responses.filter(
      r => r.isValid && r.rawValue != null
    ).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }

  /**
   * Generate insights from mapped data
   */
  public generateInsights(mappedData: ReportDataStructure): string[] {
    const insights: string[] = [];

    // Overall completion insight
    if (mappedData.overallCompletionRate >= 90) {
      insights.push(
        'Excellent survey completion rate indicates high engagement'
      );
    } else if (mappedData.overallCompletionRate < 70) {
      insights.push(
        'Low completion rate may indicate survey length or complexity issues'
      );
    }

    // Brain-o-meter insights
    if (mappedData.overallStatistics.brainOMeterScore) {
      const score = mappedData.overallStatistics.brainOMeterScore;
      if (score >= 80) {
        insights.push('Strong overall brain health indicators');
      } else if (score <= 50) {
        insights.push('Several areas may benefit from attention and support');
      }
    }

    // Category-specific insights
    if (mappedData.overallStatistics.strengthAreas.length > 0) {
      insights.push(
        `Strength areas: ${mappedData.overallStatistics.strengthAreas.join(', ')}`
      );
    }

    if (mappedData.overallStatistics.concernAreas.length > 0) {
      insights.push(
        `Areas needing attention: ${mappedData.overallStatistics.concernAreas.join(', ')}`
      );
    }

    // Data quality insights
    if (mappedData.metadata.dataQuality === 'poor') {
      insights.push(
        'Data quality concerns detected - results should be interpreted with caution'
      );
    }

    return insights;
  }

  /**
   * Create fallback response for failed processing
   */
  private createFallbackResponse(
    response: SurveyResponseWithQuestion
  ): MappedResponse {
    const questionDef = response.survey_question_definitions;

    return {
      questionId: response.question_id,
      questionText: questionDef?.question_text || 'Unknown question',
      questionType: (questionDef?.question_type as QuestionType) || 'text',
      category: questionDef?.category || 'uncategorized',
      rawValue: response.response_value,
      processedValue: null,
      displayValue: 'Processing failed',
      isValid: false,
      validationErrors: ['Failed to process response'],
      metadata: {
        orderIndex: questionDef?.order_index || 999,
        isRequired: questionDef?.is_required || false,
        options: questionDef?.options,
        validationRules: questionDef?.validation_rules,
      },
    };
  }

  /**
   * Reset internal state for new processing
   */
  private resetState(): void {
    this.validationErrors = [];
    this.processingNotes = [];
  }
}

export default SurveyDataMapper;
