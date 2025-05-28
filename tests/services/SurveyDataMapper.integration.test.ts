import { SurveyDataMapper } from '@/services/SurveyDataMapper';
import { SurveyResponseWithQuestion } from '@/services/surveyResponses';

describe('SurveyDataMapper Integration Tests', () => {
  let mapper: SurveyDataMapper;

  beforeEach(() => {
    mapper = SurveyDataMapper.getInstance();
  });

  describe('Integration with Realistic Survey Data', () => {
    it('should process realistic survey responses', async () => {
      // Create realistic test data that mimics database responses
      const mockResponses: SurveyResponseWithQuestion[] = [
        {
          id: '1',
          assessment_id: 'test-assessment',
          question_id: 'q1',
          response_value: 'John Doe',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q1',
            question_text: 'What is your name?',
            question_type: 'text',
            category: 'personal',
            order_index: 1,
            is_required: true,
            validation_rules: null,
            options: null,
          },
        },
        {
          id: '2',
          assessment_id: 'test-assessment',
          question_id: 'q2',
          response_value: 8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q2',
            question_text: 'Rate your satisfaction (1-10)',
            question_type: 'scale',
            category: 'satisfaction',
            order_index: 2,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
            options: null,
          },
        },
      ];

      // Process through mapper
      const result = await mapper.mapSurveyData(
        mockResponses,
        'test-assessment'
      );

      expect(result).toBeDefined();
      expect(result.assessmentId).toBe('test-assessment');
      expect(result.totalQuestions).toBe(2);
      expect(result.answeredQuestions).toBe(2);
      expect(result.overallCompletionRate).toBe(100);

      // Verify categories
      expect(result.categories).toHaveProperty('personal');
      expect(result.categories).toHaveProperty('satisfaction');

      // Verify data quality
      expect(result.metadata.dataQuality).toBe('excellent');
    });

    it('should handle mixed valid and invalid responses', async () => {
      const mockResponses: SurveyResponseWithQuestion[] = [
        {
          id: '1',
          assessment_id: 'test-assessment',
          question_id: 'q1',
          response_value: 'Valid response',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q1',
            question_text: 'Valid question',
            question_type: 'text',
            category: 'test',
            order_index: 1,
            is_required: true,
            validation_rules: null,
            options: null,
          },
        },
        {
          id: '2',
          assessment_id: 'test-assessment',
          question_id: 'q2',
          response_value: '', // Invalid empty response
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q2',
            question_text: 'Required question',
            question_type: 'text',
            category: 'test',
            order_index: 2,
            is_required: true,
            validation_rules: null,
            options: null,
          },
        },
        {
          id: '3',
          assessment_id: 'test-assessment',
          question_id: 'q3',
          response_value: 15, // Invalid scale value
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q3',
            question_text: 'Scale question',
            question_type: 'scale',
            category: 'test',
            order_index: 3,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
            options: null,
          },
        },
      ];

      const result = await mapper.mapSurveyData(
        mockResponses,
        'test-assessment'
      );

      expect(result.totalQuestions).toBe(3);
      expect(result.answeredQuestions).toBe(1); // Only one valid response (empty text and out-of-range scale are invalid)
      expect(result.overallCompletionRate).toBeCloseTo(33.33, 1);
      expect(result.metadata.dataQuality).toBe('poor');
      expect(result.metadata.validationErrors.length).toBeGreaterThan(0);
    });

    it('should calculate accurate statistics from real data', async () => {
      const mockResponses: SurveyResponseWithQuestion[] = [
        {
          id: '1',
          assessment_id: 'test-assessment',
          question_id: 'q1',
          response_value: 7,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q1',
            question_text: 'Performance rating 1',
            question_type: 'scale',
            category: 'performance',
            order_index: 1,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
            options: null,
          },
        },
        {
          id: '2',
          assessment_id: 'test-assessment',
          question_id: 'q2',
          response_value: 9,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q2',
            question_text: 'Performance rating 2',
            question_type: 'scale',
            category: 'performance',
            order_index: 2,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
            options: null,
          },
        },
        {
          id: '3',
          assessment_id: 'test-assessment',
          question_id: 'q3',
          response_value: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q3',
            question_text: 'Cognitive rating',
            question_type: 'scale',
            category: 'cognitive',
            order_index: 3,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
            options: null,
          },
        },
      ];

      const result = await mapper.mapSurveyData(
        mockResponses,
        'test-assessment'
      );

      expect(result.totalQuestions).toBe(3);
      expect(result.answeredQuestions).toBe(3);
      expect(result.overallCompletionRate).toBe(100);

      // Check performance category statistics
      const performanceCategory = result.categories['performance'];
      expect(performanceCategory).toBeDefined();
      expect(performanceCategory.statistics.averageScore).toBe(8); // (7+9)/2
      expect(performanceCategory.totalQuestions).toBe(2);

      // Check cognitive category statistics
      const cognitiveCategory = result.categories['cognitive'];
      expect(cognitiveCategory).toBeDefined();
      expect(cognitiveCategory.statistics.averageScore).toBe(5);
      expect(cognitiveCategory.totalQuestions).toBe(1);

      // Check Brain-O-Meter score calculation
      expect(result.overallStatistics.brainOMeterScore).toBeGreaterThan(0);
      expect(result.overallStatistics.brainOMeterScore).toBeLessThanOrEqual(
        100
      );
    });

    it('should handle performance with large datasets', async () => {
      // Generate a large dataset
      const mockResponses: SurveyResponseWithQuestion[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `${i + 1}`,
          assessment_id: 'performance-test',
          question_id: `q${i + 1}`,
          response_value: Math.floor(Math.random() * 10) + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: `q${i + 1}`,
            question_text: `Performance question ${i + 1}`,
            question_type: 'scale',
            category: `category_${i % 5}`, // 5 different categories
            order_index: i + 1,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
            options: null,
          },
        })
      );

      const startTime = Date.now();
      const result = await mapper.mapSurveyData(
        mockResponses,
        'performance-test'
      );
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result.totalQuestions).toBe(100);
      expect(result.answeredQuestions).toBe(100);
      expect(Object.keys(result.categories)).toHaveLength(5);
      expect(processingTime).toBeLessThan(1000); // Should process in under 1 second
      expect(result.metadata.dataQuality).toBe('excellent');
    });

    it('should handle empty assessment gracefully', async () => {
      const result = await mapper.mapSurveyData([], 'empty-assessment');

      expect(result.assessmentId).toBe('empty-assessment');
      expect(result.totalQuestions).toBe(0);
      expect(result.answeredQuestions).toBe(0);
      expect(result.overallCompletionRate).toBe(0);
      expect(Object.keys(result.categories)).toHaveLength(0);
      expect(result.metadata.dataQuality).toBe('poor');
      expect(result.rawResponses).toHaveLength(0);
    });

    it('should generate comprehensive insights from real data patterns', async () => {
      const mockResponses: SurveyResponseWithQuestion[] = [
        // High performance scores
        {
          id: '1',
          assessment_id: 'insight-test',
          question_id: 'q1',
          response_value: 9,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q1',
            question_text: 'Performance metric 1',
            question_type: 'scale',
            category: 'performance',
            order_index: 1,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
            options: null,
          },
        },
        {
          id: '2',
          assessment_id: 'insight-test',
          question_id: 'q2',
          response_value: 8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q2',
            question_text: 'Performance metric 2',
            question_type: 'scale',
            category: 'performance',
            order_index: 2,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
            options: null,
          },
        },
        // Low cognitive scores
        {
          id: '3',
          assessment_id: 'insight-test',
          question_id: 'q3',
          response_value: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q3',
            question_text: 'Cognitive metric 1',
            question_type: 'scale',
            category: 'cognitive',
            order_index: 3,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
            options: null,
          },
        },
        {
          id: '4',
          assessment_id: 'insight-test',
          question_id: 'q4',
          response_value: 4,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          survey_question_definitions: {
            id: 'q4',
            question_text: 'Cognitive metric 2',
            question_type: 'scale',
            category: 'cognitive',
            order_index: 4,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
            options: null,
          },
        },
      ];

      const result = await mapper.mapSurveyData(mockResponses, 'insight-test');
      const insights = mapper.generateInsights(result);

      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);

      // Should identify performance as a strength
      expect(result.overallStatistics.strengthAreas).toContain('performance');

      // Should identify cognitive as a concern
      expect(result.overallStatistics.concernAreas).toContain('cognitive');

      // Should have visual data
      expect(result.visualData.charts.length).toBeGreaterThan(0);
      expect(result.visualData.tables.length).toBeGreaterThan(0);
    });
  });
});
