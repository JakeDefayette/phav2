import { createTestClient } from '../utils/database';
import {
  DatabaseTestHelper,
  expectSupabaseError,
  generateTestAssessment,
} from '../utils/database';
import { Database } from '../../src/shared/types/database';
import { randomUUID } from 'crypto';

describe('Assessments CRUD Operations', () => {
  let dbHelper: DatabaseTestHelper;

  beforeEach(() => {
    dbHelper = new DatabaseTestHelper();
  });

  afterEach(async () => {
    await dbHelper.cleanup();
  });

  describe('CREATE operations', () => {
    it('should create an assessment with valid data', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      const assessment = await dbHelper.createTestAssessment(
        child.id,
        practice.id,
        {
          status: 'completed',
          brain_o_meter_score: 85,
        }
      );

      expect(assessment.child_id).toBe(child.id);
      expect(assessment.practice_id).toBe(practice.id);
      expect(assessment.status).toBe('completed');
      expect(assessment.brain_o_meter_score).toBe(85);
      expect(assessment.parent_email).toBeDefined();
      expect(assessment.created_at).toBeDefined();
      expect(assessment.updated_at).toBeDefined();
    });

    it('should create an assessment with minimal required data', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      const assessment = await dbHelper.createTestAssessment(
        child.id,
        practice.id,
        {
          status: 'draft',
        }
      );

      expect(assessment.child_id).toBe(child.id);
      expect(assessment.practice_id).toBe(practice.id);
      expect(assessment.status).toBe('draft');
      expect(assessment.brain_o_meter_score).toBeNull();
      expect(assessment.completed_at).toBeNull();
    });

    it('should enforce foreign key constraint for child_id', async () => {
      const practice = await dbHelper.createTestPractice();
      const client = dbHelper.getClient();
      const nonExistentChildId = randomUUID();

      await expectSupabaseError(
        async () =>
          await client.from('assessments').insert({
            id: randomUUID(),
            child_id: nonExistentChildId,
            practice_id: practice.id,
            parent_email: 'test@example.com',
          }),
        '23503' // Foreign key constraint violation (actual database behavior)
      );
    });

    it('should enforce foreign key constraint for practice_id', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const child = await dbHelper.createTestChild(parent.id);
      const client = dbHelper.getClient();
      const nonExistentPracticeId = randomUUID();

      await expectSupabaseError(
        async () =>
          await client.from('assessments').insert({
            id: randomUUID(),
            child_id: child.id,
            practice_id: nonExistentPracticeId,
            parent_email: 'test@example.com',
          }),
        '23503' // Foreign key constraint violation (actual database behavior)
      );
    });

    it('should enforce valid status enum values', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);
      const client = dbHelper.getClient();

      await expectSupabaseError(
        async () =>
          await client.from('assessments').insert({
            id: randomUUID(),
            child_id: child.id,
            practice_id: practice.id,
            parent_email: 'test@example.com',
            status: 'invalid_status' as any,
          }),
        '22P02' // Invalid input value for enum
      );
    });
  });

  describe('READ operations', () => {
    it('should retrieve assessment by id', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      const assessment = await dbHelper.createTestAssessment(
        child.id,
        practice.id,
        {
          status: 'completed',
          brain_o_meter_score: 85,
        }
      );

      const client = dbHelper.getClient();
      const { data: retrievedAssessment, error } = await client
        .from('assessments')
        .select('*')
        .eq('id', assessment.id)
        .single();

      expect(error).toBeNull();
      expect(retrievedAssessment).toMatchObject({
        id: assessment.id,
        child_id: child.id,
        practice_id: practice.id,
        status: 'completed',
        brain_o_meter_score: 85,
      });
    });

    it('should retrieve assessments by child_id', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child1 = await dbHelper.createTestChild(parent.id, {
        first_name: 'Child1',
      });
      const child2 = await dbHelper.createTestChild(parent.id, {
        first_name: 'Child2',
      });

      await dbHelper.createTestAssessment(child1.id, practice.id);
      await dbHelper.createTestAssessment(child1.id, practice.id);
      await dbHelper.createTestAssessment(child2.id, practice.id);

      const client = dbHelper.getClient();
      const { data: child1Assessments, error } = await client
        .from('assessments')
        .select('*')
        .eq('child_id', child1.id);

      expect(error).toBeNull();
      expect(child1Assessments).toHaveLength(2);
      expect(child1Assessments?.every(a => a.child_id === child1.id)).toBe(
        true
      );
    });

    it('should retrieve assessments by practice_id', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice1 = await dbHelper.createTestPractice();
      const practice2 = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      await dbHelper.createTestAssessment(child.id, practice1.id);
      await dbHelper.createTestAssessment(child.id, practice1.id);
      await dbHelper.createTestAssessment(child.id, practice2.id);

      const client = dbHelper.getClient();
      const { data: practice1Assessments, error } = await client
        .from('assessments')
        .select('*')
        .eq('practice_id', practice1.id);

      expect(error).toBeNull();
      expect(practice1Assessments).toHaveLength(2);
      expect(
        practice1Assessments?.every(a => a.practice_id === practice1.id)
      ).toBe(true);
    });

    it('should filter assessments by status', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      await dbHelper.createTestAssessment(child.id, practice.id, {
        status: 'draft',
      });
      await dbHelper.createTestAssessment(child.id, practice.id, {
        status: 'completed',
      });
      await dbHelper.createTestAssessment(child.id, practice.id, {
        status: 'completed',
      });

      const client = dbHelper.getClient();
      const { data: completedAssessments, error } = await client
        .from('assessments')
        .select('*')
        .eq('status', 'completed');

      expect(error).toBeNull();
      expect(completedAssessments?.length).toBeGreaterThanOrEqual(2); // At least our 2 test records
      expect(completedAssessments?.every(a => a.status === 'completed')).toBe(
        true
      );
    });

    it('should join with child and practice data', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice({
        name: 'Test Clinic',
      });
      const child = await dbHelper.createTestChild(parent.id, {
        first_name: 'Test',
        last_name: 'Child',
      });

      const assessment = await dbHelper.createTestAssessment(
        child.id,
        practice.id
      );

      const client = dbHelper.getClient();
      const { data: joinedData, error } = await client
        .from('assessments')
        .select(
          `
          *,
          children:child_id(*),
          practices:practice_id(*)
        `
        )
        .eq('id', assessment.id)
        .single();

      expect(error).toBeNull();
      expect(joinedData?.children?.first_name).toBe('Test');
      expect(joinedData?.children?.last_name).toBe('Child');
      expect(joinedData?.practices?.name).toBe('Test Clinic');
    });
  });

  describe('UPDATE operations', () => {
    it('should update assessment fields', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      const assessment = await dbHelper.createTestAssessment(
        child.id,
        practice.id,
        {
          status: 'draft',
          brain_o_meter_score: null,
        }
      );

      const client = dbHelper.getClient();
      const { data: updatedAssessment, error } = await client
        .from('assessments')
        .update({
          status: 'completed',
          brain_o_meter_score: 90,
          completed_at: new Date().toISOString(),
        })
        .eq('id', assessment.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedAssessment?.status).toBe('completed');
      expect(updatedAssessment?.brain_o_meter_score).toBe(90);
      expect(updatedAssessment?.completed_at).toBeDefined();
      expect(updatedAssessment?.updated_at).not.toBe(assessment.updated_at);
    });

    it('should enforce foreign key constraints on update', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      const assessment = await dbHelper.createTestAssessment(
        child.id,
        practice.id
      );
      const nonExistentChildId = randomUUID();

      const client = dbHelper.getClient();
      await expectSupabaseError(
        async () =>
          await client
            .from('assessments')
            .update({ child_id: nonExistentChildId })
            .eq('id', assessment.id),
        '23503' // Foreign key violation
      );
    });

    it('should enforce valid status enum on update', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      const assessment = await dbHelper.createTestAssessment(
        child.id,
        practice.id
      );

      const client = dbHelper.getClient();
      await expectSupabaseError(
        async () =>
          await client
            .from('assessments')
            .update({ status: 'invalid_status' as any })
            .eq('id', assessment.id),
        '22P02' // Invalid input value for enum
      );
    });
  });

  describe('DELETE operations', () => {
    it('should delete assessment', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      const assessment = await dbHelper.createTestAssessment(
        child.id,
        practice.id
      );

      const client = dbHelper.getClient();
      const { error: deleteError } = await client
        .from('assessments')
        .delete()
        .eq('id', assessment.id);

      expect(deleteError).toBeNull();

      // Verify deletion
      const { data, error } = await client
        .from('assessments')
        .select('*')
        .eq('id', assessment.id)
        .single();

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should handle cascade deletion when child is deleted', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      const assessment = await dbHelper.createTestAssessment(
        child.id,
        practice.id
      );

      const client = dbHelper.getClient();
      // Delete the child - should cascade to assessments
      const { error: deleteError } = await client
        .from('children')
        .delete()
        .eq('id', child.id);

      expect(deleteError).toBeNull();

      // Verify assessment was also deleted
      const { data, error } = await client
        .from('assessments')
        .select('*')
        .eq('id', assessment.id)
        .single();

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should handle cascade deletion when practice is deleted', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      const assessment = await dbHelper.createTestAssessment(
        child.id,
        practice.id
      );

      const client = dbHelper.getClient();
      // Delete the practice - should cascade delete the assessment
      const { error: deleteError } = await client
        .from('practices')
        .delete()
        .eq('id', practice.id);

      expect(deleteError).toBeNull();

      // Verify assessment was also deleted due to cascade
      const { data, error } = await client
        .from('assessments')
        .select('*')
        .eq('id', assessment.id)
        .single();

      expect(data).toBeNull();
      expect(error).toBeTruthy(); // Should error because no rows found
    });
  });

  describe('Constraint enforcement', () => {
    it('should enforce NOT NULL constraints', async () => {
      const client = dbHelper.getClient();

      // Test missing child_id
      await expectSupabaseError(
        async () =>
          await client.from('assessments').insert({
            id: randomUUID(),
            practice_id: randomUUID(),
            parent_email: 'test@example.com',
          } as any),
        '23502' // NOT NULL violation for child_id
      );
    });

    it('should validate status enum values', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);
      const client = dbHelper.getClient();

      // Test valid enum values
      const validStatuses = ['completed', 'draft'];

      for (const status of validStatuses) {
        const { data, error } = await client
          .from('assessments')
          .insert({
            id: randomUUID(),
            child_id: child.id,
            practice_id: practice.id,
            status: status as any,
            parent_email: 'test@example.com', // Required field
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.status).toBe(status);

        // Clean up
        if (data) {
          await client.from('assessments').delete().eq('id', data.id);
        }
      }
    });
  });

  describe('Performance tests', () => {
    it('should efficiently query by child_id index', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      // Create multiple assessments
      await Promise.all(
        Array.from({ length: 10 }, () =>
          dbHelper.createTestAssessment(child.id, practice.id)
        )
      );

      const client = dbHelper.getClient();
      const startTime = Date.now();

      const { data, error } = await client
        .from('assessments')
        .select('*')
        .eq('child_id', child.id);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThanOrEqual(10);
      expect(queryTime).toBeLessThan(1000); // Should be fast with index
    });

    it('should efficiently query by practice_id index', async () => {
      const parent = await dbHelper.createTestUserProfile({
        role: 'parent',
      });
      const practice = await dbHelper.createTestPractice();
      const child = await dbHelper.createTestChild(parent.id);

      // Create multiple assessments
      await Promise.all(
        Array.from({ length: 10 }, () =>
          dbHelper.createTestAssessment(child.id, practice.id)
        )
      );

      const client = dbHelper.getClient();
      const startTime = Date.now();

      const { data, error } = await client
        .from('assessments')
        .select('*')
        .eq('practice_id', practice.id);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThanOrEqual(10);
      expect(queryTime).toBeLessThan(1000); // Should be fast with index
    });
  });
});
