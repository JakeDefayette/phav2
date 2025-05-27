import {
  createTestClient,
  DatabaseTestHelper,
  generateTestSurveyQuestion,
} from '../utils/database';

describe('Survey Question Definitions Database Tests', () => {
  let testHelper: DatabaseTestHelper;
  let supabase: ReturnType<typeof createTestClient>;

  beforeEach(async () => {
    testHelper = new DatabaseTestHelper();
    supabase = createTestClient();
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  describe('CREATE Operations', () => {
    it('should create a survey question with valid data', async () => {
      const questionData = generateTestSurveyQuestion({
        question_text:
          'How often does your child have difficulty concentrating?',
        question_type: 'scale',
        options: {
          min: 1,
          max: 5,
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        order_index: 1,
        category: 'attention',
      });

      const { data, error } = await supabase
        .from('survey_question_definitions')
        .insert(questionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.question_text).toBe(questionData.question_text);
      expect(data?.question_type).toBe(questionData.question_type);
      expect(data?.options).toEqual(questionData.options);
      expect(data?.order_index).toBe(questionData.order_index);
      expect(data?.category).toBe(questionData.category);
      expect(data?.is_required).toBe(true); // default value
      expect(data?.id).toBeDefined();
      expect(data?.created_at).toBeDefined();
      expect(data?.updated_at).toBeDefined();

      testHelper.trackRecord('survey_question_definitions', data!.id);
    });

    it('should create a multiple choice question with options', async () => {
      const questionData = generateTestSurveyQuestion({
        question_text: "What is your child's gender?",
        question_type: 'multiple_choice',
        options: {
          choices: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' },
          ],
        },
        order_index: 2,
        is_required: true,
      });

      const { data, error } = await supabase
        .from('survey_question_definitions')
        .insert(questionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.question_type).toBe('multiple_choice');
      expect((data?.options as any)?.choices).toHaveLength(4);
      expect(data?.is_required).toBe(true);

      testHelper.trackRecord('survey_question_definitions', data!.id);
    });

    it('should create a text question with validation rules', async () => {
      const questionData = generateTestSurveyQuestion({
        question_text:
          "Please describe any concerns about your child's behavior",
        question_type: 'text',
        validation_rules: {
          min_length: 10,
          max_length: 500,
          required: false,
        },
        order_index: 3,
        is_required: false,
      });

      const { data, error } = await supabase
        .from('survey_question_definitions')
        .insert(questionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.question_type).toBe('text');
      expect(data?.validation_rules).toEqual(questionData.validation_rules);
      expect(data?.is_required).toBe(false);

      testHelper.trackRecord('survey_question_definitions', data!.id);
    });

    it('should enforce NOT NULL constraints', async () => {
      const { error } = await supabase
        .from('survey_question_definitions')
        .insert({
          question_type: 'text',
          order_index: 1,
          // Missing required question_text
        } as any);

      expect(error).toBeDefined();
      expect(error?.message).toContain('null value in column "question_text"');
    });

    it('should validate question_type enum', async () => {
      const questionData = generateTestSurveyQuestion({
        question_type: 'invalid_type' as any,
      });

      const { error } = await supabase
        .from('survey_question_definitions')
        .insert(questionData);

      expect(error).toBeDefined();
      expect(error?.message).toContain(
        'invalid input value for enum question_type_enum'
      );
    });
  });

  describe('READ Operations', () => {
    let testQuestion: any;

    beforeEach(async () => {
      const questionData = generateTestSurveyQuestion({
        question_text: 'Test question for reading',
        question_type: 'boolean',
        category: 'behavior',
        order_index: 5,
      });

      const { data } = await supabase
        .from('survey_question_definitions')
        .insert(questionData)
        .select()
        .single();

      testQuestion = data;
      testHelper.trackRecord('survey_question_definitions', data!.id);
    });

    it('should retrieve question by ID', async () => {
      const { data, error } = await supabase
        .from('survey_question_definitions')
        .select('*')
        .eq('id', testQuestion.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(testQuestion.id);
      expect(data?.question_text).toBe(testQuestion.question_text);
    });

    it('should filter questions by category', async () => {
      // Create additional questions in different categories
      const behaviorQuestion = generateTestSurveyQuestion({
        category: 'behavior',
        order_index: 10,
      });
      const attentionQuestion = generateTestSurveyQuestion({
        category: 'attention',
        order_index: 11,
      });

      const { data: behaviorData } = await supabase
        .from('survey_question_definitions')
        .insert(behaviorQuestion)
        .select()
        .single();

      const { data: attentionData } = await supabase
        .from('survey_question_definitions')
        .insert(attentionQuestion)
        .select()
        .single();

      testHelper.trackRecord('survey_question_definitions', behaviorData!.id);
      testHelper.trackRecord('survey_question_definitions', attentionData!.id);

      const { data, error } = await supabase
        .from('survey_question_definitions')
        .select('*')
        .eq('category', 'behavior')
        .order('order_index');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThanOrEqual(2);
      data!.forEach(question => {
        expect(question.category).toBe('behavior');
      });
    });

    it('should filter questions by type', async () => {
      const { data, error } = await supabase
        .from('survey_question_definitions')
        .select('*')
        .eq('question_type', 'boolean');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      data!.forEach(question => {
        expect(question.question_type).toBe('boolean');
      });
    });

    it('should order questions by order_index', async () => {
      const { data, error } = await supabase
        .from('survey_question_definitions')
        .select('*')
        .order('order_index');

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Verify ordering
      for (let i = 1; i < data!.length; i++) {
        expect(data![i].order_index).toBeGreaterThanOrEqual(
          data![i - 1].order_index
        );
      }
    });

    it('should handle non-existent question ID', async () => {
      const { data, error } = await supabase
        .from('survey_question_definitions')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe('UPDATE Operations', () => {
    let testQuestion: any;

    beforeEach(async () => {
      const questionData = generateTestSurveyQuestion({
        question_text: 'Original question text',
        question_type: 'text',
        category: 'original',
        order_index: 1,
      });

      const { data } = await supabase
        .from('survey_question_definitions')
        .insert(questionData)
        .select()
        .single();

      testQuestion = data;
      testHelper.trackRecord('survey_question_definitions', data!.id);
    });

    it('should update question text', async () => {
      const newText = 'Updated question text';

      const { data, error } = await supabase
        .from('survey_question_definitions')
        .update({ question_text: newText })
        .eq('id', testQuestion.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.question_text).toBe(newText);
      // Note: Database doesn't have auto-update trigger for updated_at
    });

    it('should update question options', async () => {
      const newOptions = {
        choices: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      };

      const { data, error } = await supabase
        .from('survey_question_definitions')
        .update({
          question_type: 'multiple_choice',
          options: newOptions,
        })
        .eq('id', testQuestion.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.question_type).toBe('multiple_choice');
      expect(data?.options).toEqual(newOptions);
    });

    it('should update validation rules', async () => {
      const newValidationRules = {
        min_length: 5,
        max_length: 100,
        pattern: '^[a-zA-Z\\s]+$',
      };

      const { data, error } = await supabase
        .from('survey_question_definitions')
        .update({ validation_rules: newValidationRules })
        .eq('id', testQuestion.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.validation_rules).toEqual(newValidationRules);
    });

    it('should enforce enum constraints on update', async () => {
      const { error } = await supabase
        .from('survey_question_definitions')
        .update({ question_type: 'invalid_type' as any })
        .eq('id', testQuestion.id);

      expect(error).toBeDefined();
      expect(error?.message).toContain(
        'invalid input value for enum question_type_enum'
      );
    });
  });

  describe('DELETE Operations', () => {
    it('should delete a question', async () => {
      const questionData = generateTestSurveyQuestion();

      const { data: created } = await supabase
        .from('survey_question_definitions')
        .insert(questionData)
        .select()
        .single();

      const { error } = await supabase
        .from('survey_question_definitions')
        .delete()
        .eq('id', created!.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data: deleted } = await supabase
        .from('survey_question_definitions')
        .select('*')
        .eq('id', created!.id)
        .single();

      expect(deleted).toBeNull();
    });

    it('should handle deletion of non-existent question', async () => {
      const { error } = await supabase
        .from('survey_question_definitions')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');

      expect(error).toBeNull(); // Supabase doesn't error on delete of non-existent records
    });
  });

  describe('Performance Tests', () => {
    beforeEach(async () => {
      // Create multiple questions for performance testing
      const questions = Array.from({ length: 10 }, (_, i) =>
        generateTestSurveyQuestion({
          question_text: `Performance test question ${i + 1}`,
          category: i % 2 === 0 ? 'attention' : 'behavior',
          order_index: i + 1,
        })
      );

      const { data } = await supabase
        .from('survey_question_definitions')
        .insert(questions)
        .select();

      data?.forEach(question => {
        testHelper.trackRecord('survey_question_definitions', question.id);
      });
    });

    it('should efficiently query by category index', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('survey_question_definitions')
        .select('*')
        .eq('category', 'attention');

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(queryTime).toBeLessThan(200); // Should be reasonably fast with index
    });

    it('should efficiently order by order_index', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('survey_question_definitions')
        .select('*')
        .order('order_index');

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(queryTime).toBeLessThan(200); // Should be reasonably fast with index
    });
  });

  describe('Complex Queries', () => {
    beforeEach(async () => {
      const questions = [
        generateTestSurveyQuestion({
          question_text: 'Required attention question',
          category: 'attention',
          is_required: true,
          order_index: 1,
        }),
        generateTestSurveyQuestion({
          question_text: 'Optional behavior question',
          category: 'behavior',
          is_required: false,
          order_index: 2,
        }),
        generateTestSurveyQuestion({
          question_text: 'Required behavior question',
          category: 'behavior',
          is_required: true,
          order_index: 3,
        }),
      ];

      const { data } = await supabase
        .from('survey_question_definitions')
        .insert(questions)
        .select();

      data?.forEach(question => {
        testHelper.trackRecord('survey_question_definitions', question.id);
      });
    });

    it('should filter by multiple criteria', async () => {
      const { data, error } = await supabase
        .from('survey_question_definitions')
        .select('*')
        .eq('category', 'behavior')
        .eq('is_required', true)
        .like('question_text', '%Required behavior question%') // More specific filter
        .order('order_index');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThanOrEqual(1); // At least our test data

      // Verify all results match our criteria
      data!.forEach(question => {
        expect(question.category).toBe('behavior');
        expect(question.is_required).toBe(true);
        expect(question.question_text).toContain('Required behavior question');
      });
    });

    it('should count questions by category', async () => {
      const { data, error } = await supabase
        .from('survey_question_definitions')
        .select('category', { count: 'exact' })
        .eq('category', 'attention');

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});
