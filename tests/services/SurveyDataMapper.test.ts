import {
  SurveyDataMapper,
  MappedResponse,
  ReportDataStructure,
} from '@/services/SurveyDataMapper';
import { SurveyResponseWithQuestion } from '@/services/surveyResponses';
import { Database } from '../../src/types/database';

type QuestionType = Database['public']['Enums']['question_type_enum'];

describe('SurveyDataMapper', () => {
  let mapper: SurveyDataMapper;

  beforeEach(() => {
    mapper = SurveyDataMapper.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SurveyDataMapper.getInstance();
      const instance2 = SurveyDataMapper.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('mapSurveyData', () => {
    const mockResponses: SurveyResponseWithQuestion[] = [
      {
        id: '1',
        assessment_id: 'test-assessment',
        question_id: 'q1',
        response_value: 'Test response',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        survey_question_definitions: {
          id: 'q1',
          question_text: 'What is your name?',
          question_type: 'text',
          category: 'personal',
          order_index: 1,
          is_required: true,
          options: null,
          validation_rules: null,
        },
      },
      {
        id: '2',
        assessment_id: 'test-assessment',
        question_id: 'q2',
        response_value: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        survey_question_definitions: {
          id: 'q2',
          question_text: 'Rate your satisfaction',
          question_type: 'scale',
          category: 'satisfaction',
          order_index: 2,
          is_required: true,
          options: null,
          validation_rules: { min: 1, max: 10 },
        },
      },
    ];

    it('should successfully map survey data', async () => {
      const result = await mapper.mapSurveyData(
        mockResponses,
        'test-assessment'
      );

      expect(result).toBeDefined();
      expect(result.assessmentId).toBe('test-assessment');
      expect(result.totalQuestions).toBe(2);
      expect(result.answeredQuestions).toBe(2);
      expect(result.overallCompletionRate).toBe(100);
      expect(result.rawResponses).toHaveLength(2);
    });

    it('should handle empty responses', async () => {
      const result = await mapper.mapSurveyData([], 'test-assessment');

      expect(result.totalQuestions).toBe(0);
      expect(result.answeredQuestions).toBe(0);
      expect(result.overallCompletionRate).toBe(0);
      expect(Object.keys(result.categories)).toHaveLength(0);
    });

    it('should group responses by categories', async () => {
      const result = await mapper.mapSurveyData(
        mockResponses,
        'test-assessment'
      );

      expect(result.categories).toHaveProperty('personal');
      expect(result.categories).toHaveProperty('satisfaction');
      expect(result.categories.personal.responses).toHaveLength(1);
      expect(result.categories.satisfaction.responses).toHaveLength(1);
    });

    it('should calculate completion rates correctly', async () => {
      const result = await mapper.mapSurveyData(
        mockResponses,
        'test-assessment'
      );

      expect(result.categories.personal.completionRate).toBe(100);
      expect(result.categories.satisfaction.completionRate).toBe(100);
    });
  });

  describe('Question Type Processing', () => {
    describe('Text Questions', () => {
      it('should process valid text responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: 'Valid text response',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Text question',
              question_type: 'text',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: null,
              validation_rules: null,
            },
          },
        ];

        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];

        expect(response.isValid).toBe(true);
        expect(response.processedValue).toBe('Valid text response');
        expect(response.displayValue).toBe('Valid text response');
      });

      it('should handle empty text responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Text question',
              question_type: 'text',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: null,
              validation_rules: null,
            },
          },
        ];

        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];

        expect(response.isValid).toBe(false);
        expect(response.validationErrors).toContain('No response provided');
      });
    });

    describe('Scale Questions', () => {
      it('should process valid scale responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: 7,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Scale question',
              question_type: 'scale',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: null,
              validation_rules: { min_scale: 1, max_scale: 10 },
            },
          },
        ];

        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];

        expect(response.isValid).toBe(true);
        expect(response.processedValue).toBe(7);
        expect(response.displayValue).toBe('7/10');
      });

      it('should validate scale range', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: 15,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Scale question',
              question_type: 'scale',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: null,
              validation_rules: { min_scale: 1, max_scale: 10 },
            },
          },
        ];

        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];

        expect(response.isValid).toBe(false);
        expect(response.validationErrors).toContain(
          'Scale value must be between 1 and 10'
        );
      });
    });

    describe('Multiple Choice Questions', () => {
      it('should process valid multiple choice responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: 'option1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Multiple choice question',
              question_type: 'multiple_choice',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: {
                choices: [
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ],
              },
              validation_rules: null,
            },
          },
        ];

        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];

        expect(response.isValid).toBe(true);
        expect(response.processedValue).toBe('option1');
        expect(response.displayValue).toBe('Option 1');
      });

      it('should handle invalid multiple choice responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: 'invalid_option',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Multiple choice question',
              question_type: 'multiple_choice',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: { choices: [{ value: 'option1', label: 'Option 1' }] },
              validation_rules: null,
            },
          },
        ];
        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];
        expect(response.isValid).toBe(false);
        expect(response.validationErrors).toContain('Invalid option selected');
      });
    });

    describe('Checkbox Questions', () => {
      it('should process valid checkbox responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: ['opt1', 'opt3'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Checkbox question',
              question_type: 'checkbox',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: {
                choices: [
                  { value: 'opt1', label: 'Option 1' },
                  { value: 'opt2', label: 'Option 2' },
                  { value: 'opt3', label: 'Option 3' },
                ],
              },
              validation_rules: null,
            },
          },
        ];
        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];
        expect(response.isValid).toBe(true);
        expect(response.processedValue).toEqual(['opt1', 'opt3']);
        expect(response.displayValue).toBe('Option 1, Option 3');
      });

      it('should handle invalid checkbox responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: ['opt1', 'invalid_opt'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Checkbox question',
              question_type: 'checkbox',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: { choices: [{ value: 'opt1', label: 'Option 1' }] },
              validation_rules: null,
            },
          },
        ];
        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];
        expect(response.isValid).toBe(false);
        expect(response.validationErrors).toContain(
          'Invalid option(s) selected: invalid_opt'
        );
      });
    });

    describe('Date Questions', () => {
      it('should process valid date responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: '2023-10-26',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Date question',
              question_type: 'date',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: null,
              validation_rules: null,
            },
          },
        ];
        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];
        expect(response.isValid).toBe(true);
        expect(response.processedValue).toBeInstanceOf(Date);
        expect(
          (response.processedValue as Date)
            .toISOString()
            .startsWith('2023-10-26')
        ).toBe(true);
        expect(response.displayValue).toBe('10/26/2023');
      });

      it('should handle invalid date responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: 'invalid-date',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Date question',
              question_type: 'date',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: null,
              validation_rules: null,
            },
          },
        ];
        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];
        expect(response.isValid).toBe(false);
        expect(response.validationErrors).toContain('Invalid date format');
      });
    });

    describe('File Upload Questions', () => {
      it('should process file upload responses with URL', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: 'http://example.com/file.pdf',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'File upload question',
              question_type: 'file_upload',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: null,
              validation_rules: { file_types: ['pdf', 'jpg'] },
            },
          },
        ];
        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];
        expect(response.isValid).toBe(true);
        expect(response.processedValue).toBe('http://example.com/file.pdf');
        expect(response.displayValue).toBe('file.pdf (link)');
      });

      it('should validate file types for file uploads', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: 'http://example.com/file.txt', // Invalid type
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'File upload question',
              question_type: 'file_upload',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: null,
              validation_rules: { file_types: ['pdf', 'jpg'] },
            },
          },
        ];
        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];
        expect(response.isValid).toBe(false);
        expect(response.validationErrors).toContain(
          'Invalid file type: txt. Allowed types: pdf, jpg'
        );
      });
    });

    describe('Ranking Questions', () => {
      it('should process valid ranking responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: ['itemB', 'itemA', 'itemC'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Ranking question',
              question_type: 'ranking',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: {
                items_to_rank: [
                  { value: 'itemA', label: 'Item A' },
                  { value: 'itemB', label: 'Item B' },
                  { value: 'itemC', label: 'Item C' },
                ],
              },
              validation_rules: null,
            },
          },
        ];
        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];
        expect(response.isValid).toBe(true);
        expect(response.processedValue).toEqual(['itemB', 'itemA', 'itemC']);
        expect(response.displayValue).toBe('1. Item B, 2. Item A, 3. Item C');
      });

      it('should handle incomplete ranking responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: ['itemA'], // Incomplete ranking
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Ranking question',
              question_type: 'ranking',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: {
                items_to_rank: [
                  { value: 'itemA', label: 'Item A' },
                  { value: 'itemB', label: 'Item B' },
                ],
              },
              validation_rules: null,
            },
          },
        ];
        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];
        expect(response.isValid).toBe(false);
        expect(response.validationErrors).toContain(
          'All items must be ranked.'
        );
      });
    });

    describe('Matrix Questions', () => {
      it('should process valid matrix responses', async () => {
        const responses: SurveyResponseWithQuestion[] = [
          {
            id: '1',
            assessment_id: 'test',
            question_id: 'q1',
            response_value: { row1: 'colA', row2: 'colB' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            survey_question_definitions: {
              id: 'q1',
              question_text: 'Matrix question',
              question_type: 'matrix',
              category: 'test',
              order_index: 1,
              is_required: true,
              options: {
                rows: [
                  { value: 'row1', label: 'Row 1' },
                  { value: 'row2', label: 'Row 2' },
                ],
                columns: [
                  { value: 'colA', label: 'Column A' },
                  { value: 'colB', label: 'Column B' },
                ],
              },
              validation_rules: null,
            },
          },
        ];
        const result = await mapper.mapSurveyData(responses, 'test');
        const response = result.rawResponses[0];
        expect(response.isValid).toBe(true);
        expect(response.processedValue).toEqual({ row1: 'colA', row2: 'colB' });
        expect(response.displayValue).toContain('Row 1: Column A');
        expect(response.displayValue).toContain('Row 2: Column B');
      });
    });
  });

  describe('Overall Statistics Calculation', () => {
    const mockCategoryResponses: SurveyResponseWithQuestion[] = [
      // Category A: 2 questions, 1 answered (score 3/5), 1 unanswered
      {
        id: 'r1',
        assessment_id: 'a1',
        question_id: 'qA1',
        response_value: 3,
        created_at: 't',
        updated_at: 't',
        survey_question_definitions: {
          id: 'qA1',
          question_text: 'QA1',
          question_type: 'scale',
          category: 'CategoryA',
          order_index: 1,
          is_required: true,
          validation_rules: { min_scale: 1, max_scale: 5 },
        },
      },
      {
        id: 'r2',
        assessment_id: 'a1',
        question_id: 'qA2',
        response_value: null,
        created_at: 't',
        updated_at: 't',
        survey_question_definitions: {
          id: 'qA2',
          question_text: 'QA2',
          question_type: 'text',
          category: 'CategoryA',
          order_index: 2,
          is_required: false,
        },
      },
      // Category B: 1 question, answered (score 8/10)
      {
        id: 'r3',
        assessment_id: 'a1',
        question_id: 'qB1',
        response_value: 8,
        created_at: 't',
        updated_at: 't',
        survey_question_definitions: {
          id: 'qB1',
          question_text: 'QB1',
          question_type: 'scale',
          category: 'CategoryB',
          order_index: 1,
          is_required: true,
          validation_rules: { min_scale: 1, max_scale: 10 },
        },
      },
      // Category C (No valid responses, or question definitions missing for robust test)
      {
        id: 'r4',
        assessment_id: 'a1',
        question_id: 'qC1',
        response_value: 'text',
        created_at: 't',
        updated_at: 't',
        survey_question_definitions: {
          id: 'qC1',
          question_text: 'QC1',
          question_type: 'text',
          category: 'CategoryC',
          order_index: 1,
          is_required: true,
        },
      },
    ];

    it('should calculate correct overall statistics', async () => {
      const result = await mapper.mapSurveyData(mockCategoryResponses, 'a1');

      expect(result.totalQuestions).toBe(4); // qA1, qA2, qB1, qC1
      expect(result.answeredQuestions).toBe(3); // qA1, qB1, qC1 (text response for qC1 counts as answered)
      expect(result.overallCompletionRate).toBeCloseTo(75); // 3/4

      // Check that brain-o-meter score is calculated (exact value depends on complex logic)
      expect(typeof result.overallStatistics.brainOMeterScore).toBe('number');
      // strengthAreas and concernAreas also depend on thresholds and more complex logic
      expect(Array.isArray(result.overallStatistics.strengthAreas)).toBe(true);
      expect(Array.isArray(result.overallStatistics.concernAreas)).toBe(true);
    });

    it('should calculate category-specific statistics', async () => {
      const result = await mapper.mapSurveyData(mockCategoryResponses, 'a1');

      // Category A
      expect(result.categories.CategoryA.totalQuestions).toBe(2);
      expect(result.categories.CategoryA.answeredQuestions).toBe(1); // Only qA1 has a valid numeric response
      expect(result.categories.CategoryA.completionRate).toBeCloseTo(50); // 1/2
      expect(
        result.categories.CategoryA.statistics.scorePercentage
      ).toBeCloseTo((3 / 5) * 100); // 60%

      // Category B
      expect(result.categories.CategoryB.totalQuestions).toBe(1);
      expect(result.categories.CategoryB.answeredQuestions).toBe(1);
      expect(result.categories.CategoryB.completionRate).toBe(100);
      expect(
        result.categories.CategoryB.statistics.scorePercentage
      ).toBeCloseTo((8 / 10) * 100); // 80%

      // Category C (text question, no numeric score)
      expect(result.categories.CategoryC.totalQuestions).toBe(1);
      expect(result.categories.CategoryC.answeredQuestions).toBe(1);
      expect(result.categories.CategoryC.completionRate).toBe(100);
      expect(result.categories.CategoryC.statistics.scorePercentage).toBe(0); // No scorable questions
    });
  });

  describe('Visual Data Generation', () => {
    // ... (Tests for visual data generation will be complex and depend on ChartService interaction)
    // For now, just check if it's called and returns an array
    it('should attempt to generate visual data', async () => {
      const responses: SurveyResponseWithQuestion[] = [
        {
          id: 'r1',
          assessment_id: 'a1',
          question_id: 'q1',
          response_value: 5,
          created_at: 't',
          updated_at: 't',
          survey_question_definitions: {
            id: 'q1',
            question_text: 'Q1',
            question_type: 'scale',
            category: 'Cat1',
            order_index: 1,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 5 },
          },
        },
      ];
      const result = await mapper.mapSurveyData(responses, 'a1');
      expect(result.visualData).toBeDefined();
      expect(Array.isArray(result.visualData.charts)).toBe(true);
      // Further tests would mock ChartService.transformSurveyDataToCharts
    });
  });

  describe('Insight Generation', () => {
    // ... (Tests for insight generation)
    it('should generate insights', async () => {
      const responses: SurveyResponseWithQuestion[] = [
        {
          id: 'r1',
          assessment_id: 'a1',
          question_id: 'q1',
          response_value: 1,
          created_at: 't',
          updated_at: 't',
          survey_question_definitions: {
            id: 'q1',
            question_text: 'Low Score Q',
            question_type: 'scale',
            category: 'Health',
            order_index: 1,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
          },
        },
        {
          id: 'r2',
          assessment_id: 'a1',
          question_id: 'q2',
          response_value: 9,
          created_at: 't',
          updated_at: 't',
          survey_question_definitions: {
            id: 'q2',
            question_text: 'High Score Q',
            question_type: 'scale',
            category: 'Wellbeing',
            order_index: 1,
            is_required: true,
            validation_rules: { min_scale: 1, max_scale: 10 },
          },
        },
      ];
      const result = await mapper.mapSurveyData(responses, 'a1');
      const insights = mapper.generateInsights(result);
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      // Example: Check if insights reflect low/high scores
      // This requires knowing the insight generation logic, which might be complex.
      // For a basic test:
      expect(insights.length).toBeGreaterThan(0);
    });
  });

  describe('Metadata Population', () => {
    it('should populate metadata correctly', async () => {
      const responses: SurveyResponseWithQuestion[] = [
        {
          id: 'r1',
          assessment_id: 'a1',
          question_id: 'q1',
          response_value: 'yes',
          created_at: 't',
          updated_at: 't',
          survey_question_definitions: {
            id: 'q1',
            question_text: 'Q1',
            question_type: 'boolean',
            category: 'Cat1',
            order_index: 1,
            is_required: true,
          },
        },
      ];
      const result = await mapper.mapSurveyData(responses, 'a1');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.processedAt).toBeInstanceOf(Date);
      expect(['excellent', 'good', 'fair', 'poor']).toContain(
        result.metadata.dataQuality
      );
      expect(Array.isArray(result.metadata.validationErrors)).toBe(true);
      expect(Array.isArray(result.metadata.processingNotes)).toBe(true);
    });
  });
});

// Helper to create a basic SurveyResponseWithQuestion for testing specific question types
function createTestResponse(
  questionId: string,
  questionType: QuestionType,
  responseValue: any,
  category: string = 'test_category',
  options?: any,
  validationRules?: any,
  isRequired: boolean = true
): SurveyResponseWithQuestion {
  return {
    id: `resp-${questionId}`,
    assessment_id: 'test-assessment-id',
    question_id: questionId,
    response_value: responseValue,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    survey_question_definitions: {
      id: questionId,
      question_text: `Test question ${questionId}`,
      question_type: questionType,
      category: category,
      order_index: 1,
      is_required: isRequired,
      options: options || null,
      validation_rules: validationRules || null,
    },
  };
}
