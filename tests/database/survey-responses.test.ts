import {
  createTestClient,
  DatabaseTestHelper,
  generateTestSurveyQuestion,
} from '../utils/database';

describe('Survey Responses Database Tests', () => {
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
    let testAssessment: any;
    let testQuestion: any;

    beforeEach(async () => {
      // Create required dependencies
      const practice = await testHelper.createTestPractice();
      const userProfile = await testHelper.createTestUserProfile({
        practice_id: practice.id,
      });
      const child = await testHelper.createTestChild(userProfile.id);
      testAssessment = await testHelper.createTestAssessment(
        child.id,
        practice.id
      );

      const questionData = generateTestSurveyQuestion({
        question_text:
          'How often does your child have difficulty concentrating?',
        question_type: 'scale',
        options: { min: 1, max: 5 },
      });

      const { data } = await supabase
        .from('survey_question_definitions')
        .insert(questionData)
        .select()
        .single();

      testQuestion = data;
      testHelper.trackRecord('survey_question_definitions', data!.id);
    });

    it('should create a survey response with valid data', async () => {
      const responseData = {
        assessment_id: testAssessment.id,
        question_id: testQuestion.id,
        response_value: '4',
      };

      const { data, error } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.assessment_id).toBe(responseData.assessment_id);
      expect(data?.question_id).toBe(responseData.question_id);
      expect(data?.response_value).toBe(responseData.response_value);
      expect(data?.id).toBeDefined();
      expect(data?.created_at).toBeDefined();
      expect(data?.updated_at).toBeDefined();

      testHelper.trackRecord('survey_responses', data!.id);
    });

    it('should create a text response', async () => {
      const responseData = {
        assessment_id: testAssessment.id,
        question_id: testQuestion.id,
        response_value:
          'My child has trouble focusing during homework time and gets easily distracted.',
      };

      const { data, error } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.response_value).toBe(responseData.response_value);

      testHelper.trackRecord('survey_responses', data!.id);
    });

    it('should create a boolean response', async () => {
      const responseData = {
        assessment_id: testAssessment.id,
        question_id: testQuestion.id,
        response_value: 'true',
      };

      const { data, error } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.response_value).toBe('true');

      testHelper.trackRecord('survey_responses', data!.id);
    });

    it('should enforce foreign key constraint for assessment_id', async () => {
      const responseData = {
        assessment_id: '00000000-0000-0000-0000-000000000000',
        question_id: testQuestion.id,
        response_value: '3',
      };

      const { error } = await supabase
        .from('survey_responses')
        .insert(responseData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('violates foreign key constraint');
    });

    it('should enforce foreign key constraint for question_id', async () => {
      const responseData = {
        assessment_id: testAssessment.id,
        question_id: '00000000-0000-0000-0000-000000000000',
        response_value: '3',
      };

      const { error } = await supabase
        .from('survey_responses')
        .insert(responseData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('violates foreign key constraint');
    });

    it('should enforce unique constraint on assessment_id and question_id', async () => {
      const responseData = {
        assessment_id: testAssessment.id,
        question_id: testQuestion.id,
        response_value: '3',
      };

      // Create first response
      const { data: firstResponse } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      testHelper.trackRecord('survey_responses', firstResponse!.id);

      // Try to create duplicate response
      const { error } = await supabase
        .from('survey_responses')
        .insert(responseData);

      expect(error).toBeDefined();
      expect(error?.message).toContain(
        'duplicate key value violates unique constraint'
      );
    });

    it('should enforce NOT NULL constraints', async () => {
      const { error } = await supabase.from('survey_responses').insert({
        question_id: testQuestion.id,
        response_value: '3',
        // Missing required assessment_id
      } as any);

      expect(error).toBeDefined();
      expect(error?.message).toContain('null value in column "assessment_id"');
    });
  });

  describe('READ Operations', () => {
    let testAssessment: any;
    let testQuestion1: any;
    let testQuestion2: any;
    let testResponse: any;

    beforeEach(async () => {
      // Create required dependencies
      const practice = await testHelper.createTestPractice();
      const userProfile = await testHelper.createTestUserProfile({
        practice_id: practice.id,
      });
      const child = await testHelper.createTestChild(userProfile.id);
      testAssessment = await testHelper.createTestAssessment(
        child.id,
        practice.id
      );

      // Create test questions
      const question1Data = generateTestSurveyQuestion({
        question_text: 'Question 1',
        order_index: 1,
      });
      const question2Data = generateTestSurveyQuestion({
        question_text: 'Question 2',
        order_index: 2,
      });

      const { data: q1 } = await supabase
        .from('survey_question_definitions')
        .insert(question1Data)
        .select()
        .single();

      const { data: q2 } = await supabase
        .from('survey_question_definitions')
        .insert(question2Data)
        .select()
        .single();

      testQuestion1 = q1;
      testQuestion2 = q2;
      testHelper.trackRecord('survey_question_definitions', q1!.id);
      testHelper.trackRecord('survey_question_definitions', q2!.id);

      // Create test response
      const responseData = {
        assessment_id: testAssessment.id,
        question_id: testQuestion1.id,
        response_value: '4',
      };

      const { data } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      testResponse = data;
      testHelper.trackRecord('survey_responses', data!.id);
    });

    it('should retrieve response by ID', async () => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('id', testResponse.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(testResponse.id);
      expect(data?.response_value).toBe(testResponse.response_value);
    });

    it('should filter responses by assessment_id', async () => {
      // Create additional response for the same assessment
      const additionalResponseData = {
        assessment_id: testAssessment.id,
        question_id: testQuestion2.id,
        response_value: '2',
      };

      const { data: additionalResponse } = await supabase
        .from('survey_responses')
        .insert(additionalResponseData)
        .select()
        .single();

      testHelper.trackRecord('survey_responses', additionalResponse!.id);

      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('assessment_id', testAssessment.id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBe(2);
      data?.forEach(response => {
        expect(response.assessment_id).toBe(testAssessment.id);
      });
    });

    it('should filter responses by question_id', async () => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('question_id', testQuestion1.id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBe(1);
      expect(data?.[0].question_id).toBe(testQuestion1.id);
    });

    it('should join with assessment data', async () => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select(
          `
          *,
          assessments (
            id,
            status,
            created_at
          )
        `
        )
        .eq('id', testResponse.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.assessments).toBeDefined();
      expect((data?.assessments as any)?.id).toBe(testAssessment.id);
    });

    it('should join with question data', async () => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select(
          `
          *,
          survey_question_definitions (
            id,
            question_text,
            question_type
          )
        `
        )
        .eq('id', testResponse.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.survey_question_definitions).toBeDefined();
      expect((data?.survey_question_definitions as any)?.id).toBe(
        testQuestion1.id
      );
    });

    it('should handle non-existent response ID', async () => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe('UPDATE Operations', () => {
    let testAssessment: any;
    let testQuestion: any;
    let testResponse: any;

    beforeEach(async () => {
      // Create required dependencies
      const practice = await testHelper.createTestPractice();
      const userProfile = await testHelper.createTestUserProfile({
        practice_id: practice.id,
      });
      const child = await testHelper.createTestChild(userProfile.id);
      testAssessment = await testHelper.createTestAssessment(
        child.id,
        practice.id
      );

      const questionData = generateTestSurveyQuestion();
      const { data: question } = await supabase
        .from('survey_question_definitions')
        .insert(questionData)
        .select()
        .single();

      testQuestion = question;
      testHelper.trackRecord('survey_question_definitions', question!.id);

      const responseData = {
        assessment_id: testAssessment.id,
        question_id: testQuestion.id,
        response_value: '3',
      };

      const { data } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      testResponse = data;
      testHelper.trackRecord('survey_responses', data!.id);
    });

    it('should update response value', async () => {
      const newValue = '5';

      const { data, error } = await supabase
        .from('survey_responses')
        .update({ response_value: newValue })
        .eq('id', testResponse.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.response_value).toBe(newValue);
      // Note: Database doesn't have auto-update trigger for updated_at
    });

    it('should update response value again', async () => {
      const newValue = '1';

      const { data, error } = await supabase
        .from('survey_responses')
        .update({ response_value: newValue })
        .eq('id', testResponse.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.response_value).toBe(newValue);
    });

    it('should enforce foreign key constraints on update', async () => {
      const { error } = await supabase
        .from('survey_responses')
        .update({ assessment_id: '00000000-0000-0000-0000-000000000000' })
        .eq('id', testResponse.id);

      expect(error).toBeDefined();
      expect(error?.message).toContain('violates foreign key constraint');
    });
  });

  describe('DELETE Operations', () => {
    let testAssessment: any;
    let testQuestion: any;

    beforeEach(async () => {
      // Create required dependencies
      const practice = await testHelper.createTestPractice();
      const userProfile = await testHelper.createTestUserProfile({
        practice_id: practice.id,
      });
      const child = await testHelper.createTestChild(userProfile.id);
      testAssessment = await testHelper.createTestAssessment(
        child.id,
        practice.id
      );

      const questionData = generateTestSurveyQuestion();
      const { data: question } = await supabase
        .from('survey_question_definitions')
        .insert(questionData)
        .select()
        .single();

      testQuestion = question;
      testHelper.trackRecord('survey_question_definitions', question!.id);
    });

    it('should delete a response', async () => {
      const responseData = {
        assessment_id: testAssessment.id,
        question_id: testQuestion.id,
        response_value: '3',
      };

      const { data: created } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      const { error } = await supabase
        .from('survey_responses')
        .delete()
        .eq('id', created!.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data: deleted } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('id', created!.id)
        .single();

      expect(deleted).toBeNull();
    });

    it('should cascade delete when assessment is deleted', async () => {
      const responseData = {
        assessment_id: testAssessment.id,
        question_id: testQuestion.id,
        response_value: '3',
      };

      const { data: response } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      // Delete the assessment
      await supabase.from('assessments').delete().eq('id', testAssessment.id);

      // Verify response was cascade deleted
      const { data: deletedResponse } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('id', response!.id)
        .single();

      expect(deletedResponse).toBeNull();
    });

    it('should cascade delete when question is deleted', async () => {
      const responseData = {
        assessment_id: testAssessment.id,
        question_id: testQuestion.id,
        response_value: '3',
      };

      const { data: response } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      // Delete the question
      await supabase
        .from('survey_question_definitions')
        .delete()
        .eq('id', testQuestion.id);

      // Verify response was cascade deleted
      const { data: deletedResponse } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('id', response!.id)
        .single();

      expect(deletedResponse).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    let testAssessment: any;
    let testQuestions: any[];

    beforeEach(async () => {
      // Create required dependencies
      const practice = await testHelper.createTestPractice();
      const userProfile = await testHelper.createTestUserProfile({
        practice_id: practice.id,
      });
      const child = await testHelper.createTestChild(userProfile.id);
      testAssessment = await testHelper.createTestAssessment(
        child.id,
        practice.id
      );

      // Create multiple questions
      const questions = Array.from({ length: 5 }, (_, i) =>
        generateTestSurveyQuestion({
          question_text: `Performance test question ${i + 1}`,
          order_index: i + 1,
        })
      );

      const { data: createdQuestions } = await supabase
        .from('survey_question_definitions')
        .insert(questions)
        .select();

      testQuestions = createdQuestions!;
      createdQuestions?.forEach(question => {
        testHelper.trackRecord('survey_question_definitions', question.id);
      });

      // Create responses for performance testing
      const responses = testQuestions.map((question, i) => ({
        assessment_id: testAssessment.id,
        question_id: question.id,
        response_value: (i + 1).toString(),
      }));

      const { data: createdResponses } = await supabase
        .from('survey_responses')
        .insert(responses)
        .select();

      createdResponses?.forEach(response => {
        testHelper.trackRecord('survey_responses', response.id);
      });
    });

    it('should efficiently query by assessment_id index', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('assessment_id', testAssessment.id);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(5);
      expect(queryTime).toBeLessThan(200); // Should be fast with index
    });

    it('should efficiently query by question_id index', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('question_id', testQuestions[0].id);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(queryTime).toBeLessThan(200); // Should be fast with index
    });
  });

  describe('Complex Queries', () => {
    let testAssessment1: any;
    let testAssessment2: any;
    let testQuestions: any[];

    beforeEach(async () => {
      // Create required dependencies
      const practice = await testHelper.createTestPractice();
      const userProfile = await testHelper.createTestUserProfile({
        practice_id: practice.id,
      });
      const child1 = await testHelper.createTestChild(userProfile.id, {
        first_name: 'Child1',
      });
      const child2 = await testHelper.createTestChild(userProfile.id, {
        first_name: 'Child2',
      });

      testAssessment1 = await testHelper.createTestAssessment(
        child1.id,
        practice.id
      );
      testAssessment2 = await testHelper.createTestAssessment(
        child2.id,
        practice.id
      );

      // Create test questions
      const questions = [
        generateTestSurveyQuestion({
          question_text: 'Attention question',
          category: 'attention',
          order_index: 1,
        }),
        generateTestSurveyQuestion({
          question_text: 'Behavior question',
          category: 'behavior',
          order_index: 2,
        }),
      ];

      const { data: createdQuestions } = await supabase
        .from('survey_question_definitions')
        .insert(questions)
        .select();

      testQuestions = createdQuestions!;
      createdQuestions?.forEach(question => {
        testHelper.trackRecord('survey_question_definitions', question.id);
      });

      // Create responses for both assessments
      const responses = [
        {
          assessment_id: testAssessment1.id,
          question_id: testQuestions[0].id,
          response_value: '4',
        },
        {
          assessment_id: testAssessment1.id,
          question_id: testQuestions[1].id,
          response_value: '3',
        },
        {
          assessment_id: testAssessment2.id,
          question_id: testQuestions[0].id,
          response_value: '5',
        },
      ];

      const { data: createdResponses } = await supabase
        .from('survey_responses')
        .insert(responses)
        .select();

      createdResponses?.forEach(response => {
        testHelper.trackRecord('survey_responses', response.id);
      });
    });

    it('should get complete assessment responses with question details', async () => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select(
          `
          *,
          survey_question_definitions (
            question_text,
            question_type,
            category,
            order_index
          )
        `
        )
        .eq('assessment_id', testAssessment1.id)
        .order('survey_question_definitions(order_index)');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(2);
      data!.forEach(response => {
        expect(response.survey_question_definitions).toBeDefined();
        expect(response.assessment_id).toBe(testAssessment1.id);
      });
    });

    it('should aggregate responses by question category', async () => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select(
          `
          response_value,
          survey_question_definitions!inner (
            category
          )
        `
        )
        .eq('assessment_id', testAssessment1.id);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const attentionResponses = data!.filter(
        r => r.survey_question_definitions.category === 'attention'
      );
      const behaviorResponses = data!.filter(
        r => r.survey_question_definitions.category === 'behavior'
      );

      expect(attentionResponses.length).toBe(1);
      expect(behaviorResponses.length).toBe(1);
    });
  });
});
