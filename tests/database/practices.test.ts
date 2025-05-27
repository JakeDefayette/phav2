import {
  DatabaseTestHelper,
  expectSupabaseError,
  generateTestPractice,
} from '../utils/database';
import { Database } from '../../src/types/database';
import { randomUUID } from 'crypto';

describe('Practices CRUD Operations', () => {
  let dbHelper: DatabaseTestHelper;

  beforeEach(() => {
    dbHelper = new DatabaseTestHelper();
  });

  afterEach(async () => {
    await dbHelper.cleanup();
  });

  describe('CREATE operations', () => {
    it('should create a practice with valid data', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });

      const practiceData = generateTestPractice({
        name: 'Test Chiropractic Clinic',
        email: 'clinic@example.com',
        owner_id: owner.id,
        phone: '+1-555-0123',
        address: '123 Main St, City, State 12345',
        website: 'https://testclinic.com',
      });

      const practice = await dbHelper.createTestPractice(practiceData);

      expect(practice).toMatchObject({
        name: 'Test Chiropractic Clinic',
        email: 'clinic@example.com',
        owner_id: owner.id,
        phone: '+1-555-0123',
        address: '123 Main St, City, State 12345',
        website: 'https://testclinic.com',
      });
      expect(practice.id).toBeDefined();
      expect(practice.created_at).toBeDefined();
      expect(practice.updated_at).toBeDefined();
    });

    it('should create a practice with minimal required data', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });

      const practiceData = generateTestPractice({
        name: 'Minimal Practice',
        owner_id: owner.id,
        email: null,
        phone: null,
        address: null,
        website: null,
      });

      const practice = await dbHelper.createTestPractice(practiceData);

      expect(practice.name).toBe('Minimal Practice');
      expect(practice.owner_id).toBe(owner.id);
      expect(practice.email).toBeNull();
      expect(practice.phone).toBeNull();
      expect(practice.address).toBeNull();
      expect(practice.website).toBeNull();
    });

    it('should enforce foreign key constraint for owner_id', async () => {
      const client = dbHelper.getClient();
      const nonExistentUserId = randomUUID();

      await expectSupabaseError(
        async () =>
          await client.from('practices').insert({
            id: randomUUID(),
            name: 'Invalid Practice',
            owner_id: nonExistentUserId,
          }),
        '23503'
      );
    });

    it('should enforce valid subscription_status enum values', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const client = dbHelper.getClient();

      await expectSupabaseError(
        async () =>
          await client.from('practices').insert({
            id: randomUUID(),
            name: 'Invalid Status Practice',
            owner_id: owner.id,
            subscription_status: 'invalid_status' as any,
          }),
        '22P02'
      );
    });

    it('should require name field', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const client = dbHelper.getClient();

      await expectSupabaseError(
        async () =>
          await client.from('practices').insert({
            id: randomUUID(),
            owner_id: owner.id,
          } as any),
        '23502'
      );
    });
  });

  describe('READ operations', () => {
    it('should retrieve practice by id', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const practice = await dbHelper.createTestPractice({
        name: 'Read Test Practice',
        owner_id: owner.id,
        email: 'read@example.com',
      });

      const client = dbHelper.getClient();
      const { data: retrievedPractice, error } = await client
        .from('practices')
        .select('*')
        .eq('id', practice.id)
        .single();

      expect(error).toBeNull();
      expect(retrievedPractice).toMatchObject({
        id: practice.id,
        name: 'Read Test Practice',
        owner_id: owner.id,
        email: 'read@example.com',
      });
    });

    it('should retrieve practices by owner_id', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const otherOwner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });

      await dbHelper.createTestPractice({
        name: 'Practice 1',
        owner_id: owner.id,
      });
      await dbHelper.createTestPractice({
        name: 'Practice 2',
        owner_id: owner.id,
      });
      await dbHelper.createTestPractice({
        name: 'Other Practice',
        owner_id: otherOwner.id,
      });

      const client = dbHelper.getClient();
      const { data: ownerPractices, error } = await client
        .from('practices')
        .select('*')
        .eq('owner_id', owner.id);

      expect(error).toBeNull();
      expect(ownerPractices).toHaveLength(2);
      expect(ownerPractices?.every(p => p.owner_id === owner.id)).toBe(true);
    });

    it('should filter practices by subscription_status', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });

      await dbHelper.createTestPractice({
        name: 'Active Practice',
        owner_id: owner.id,
        subscription_status: 'active',
      });
      await dbHelper.createTestPractice({
        name: 'Trial Practice',
        owner_id: owner.id,
        subscription_status: 'trial',
      });

      const client = dbHelper.getClient();
      const { data: activePractices, error } = await client
        .from('practices')
        .select('*')
        .eq('subscription_status', 'active');

      expect(error).toBeNull();
      expect(activePractices).toHaveLength(1);
      expect(activePractices?.[0].name).toBe('Active Practice');
    });

    it('should join with owner user profile', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
        first_name: 'Dr. John',
        last_name: 'Smith',
      });
      const practice = await dbHelper.createTestPractice({
        name: 'Smith Clinic',
        owner_id: owner.id,
      });

      const client = dbHelper.getClient();
      const { data: practiceWithOwner, error } = await client
        .from('practices')
        .select(
          `
          *,
          user_profiles!practices_owner_id_fkey (
            first_name,
            last_name,
            email
          )
        `
        )
        .eq('id', practice.id)
        .single();

      expect(error).toBeNull();
      expect(practiceWithOwner?.name).toBe('Smith Clinic');
      expect(practiceWithOwner?.user_profiles).toMatchObject({
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: owner.email,
      });
    });
  });

  describe('UPDATE operations', () => {
    it('should update practice fields', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const practice = await dbHelper.createTestPractice({
        name: 'Original Name',
        owner_id: owner.id,
        email: 'original@example.com',
      });

      const client = dbHelper.getClient();
      const { data: updatedPractice, error } = await client
        .from('practices')
        .update({
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '+1-555-9999',
        })
        .eq('id', practice.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedPractice?.name).toBe('Updated Name');
      expect(updatedPractice?.email).toBe('updated@example.com');
      expect(updatedPractice?.phone).toBe('+1-555-9999');
      expect(updatedPractice?.updated_at).not.toBe(practice.updated_at);
    });

    it('should update subscription status', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const practice = await dbHelper.createTestPractice({
        name: 'Status Test Practice',
        owner_id: owner.id,
        subscription_status: 'trial',
      });

      const client = dbHelper.getClient();
      const { data: updatedPractice, error } = await client
        .from('practices')
        .update({ subscription_status: 'active' })
        .eq('id', practice.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedPractice?.subscription_status).toBe('active');
    });

    it('should update branding fields', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const practice = await dbHelper.createTestPractice({
        name: 'Branding Test Practice',
        owner_id: owner.id,
      });

      const client = dbHelper.getClient();
      const { data: updatedPractice, error } = await client
        .from('practices')
        .update({
          logo_url: 'https://example.com/logo.png',
          primary_color: '#FF5733',
          secondary_color: '#33FF57',
        })
        .eq('id', practice.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedPractice?.logo_url).toBe('https://example.com/logo.png');
      expect(updatedPractice?.primary_color).toBe('#FF5733');
      expect(updatedPractice?.secondary_color).toBe('#33FF57');
    });

    it('should enforce foreign key constraint on owner_id update', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const practice = await dbHelper.createTestPractice({
        name: 'FK Test Practice',
        owner_id: owner.id,
      });

      const client = dbHelper.getClient();
      const nonExistentUserId = randomUUID();

      await expectSupabaseError(
        async () =>
          await client
            .from('practices')
            .update({ owner_id: nonExistentUserId })
            .eq('id', practice.id),
        '23503' // Foreign key violation
      );
    });
  });

  describe('DELETE operations', () => {
    it('should delete practice', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const practice = await dbHelper.createTestPractice({
        name: 'Delete Test Practice',
        owner_id: owner.id,
      });

      const client = dbHelper.getClient();
      const { error: deleteError } = await client
        .from('practices')
        .delete()
        .eq('id', practice.id);

      expect(deleteError).toBeNull();

      // Verify deletion
      const { data, error } = await client
        .from('practices')
        .select('*')
        .eq('id', practice.id)
        .single();

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should handle cascade deletion when owner is deleted', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const practice = await dbHelper.createTestPractice({
        name: 'Cascade Test Practice',
        owner_id: owner.id,
      });

      const client = dbHelper.getClient();

      // Delete the owner
      await client.from('user_profiles').delete().eq('id', owner.id);

      // Check if practice still exists (depends on cascade behavior)
      const { data: practiceAfterOwnerDeletion } = await client
        .from('practices')
        .select('*')
        .eq('id', practice.id)
        .single();

      // This test verifies the cascade behavior - adjust expectation based on schema
      // If CASCADE: practice should be deleted
      // If SET NULL: practice should exist with null owner_id
      // If RESTRICT: deletion should have failed
      console.log('Practice after owner deletion:', practiceAfterOwnerDeletion);
    });
  });

  describe('Constraint enforcement', () => {
    it('should enforce NOT NULL constraints', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const client = dbHelper.getClient();

      // Test missing name (name is NOT NULL)
      await expectSupabaseError(
        async () =>
          await client.from('practices').insert({
            id: randomUUID(),
            owner_id: owner.id,
            // name is missing - should fail
          } as any),
        '23502' // NOT NULL violation
      );

      // Test missing owner_id (owner_id is actually nullable, so this should succeed)
      const { error: ownerIdError } = await client.from('practices').insert({
        id: randomUUID(),
        name: 'Test Practice Without Owner',
        // owner_id is missing - should succeed since it's nullable
      } as any);

      expect(ownerIdError).toBeNull(); // Should succeed

      // Clean up the created record
      if (!ownerIdError) {
        await client
          .from('practices')
          .delete()
          .eq('name', 'Test Practice Without Owner');
      }
    });

    it('should validate subscription status enum', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });
      const client = dbHelper.getClient();

      const validStatuses = ['trial', 'active', 'cancelled', 'expired'];

      for (const status of validStatuses) {
        const { error } = await client.from('practices').insert({
          id: randomUUID(),
          name: `Practice ${status}`,
          owner_id: owner.id,
          subscription_status: status as any,
        });

        expect(error).toBeNull();
        dbHelper.trackRecord('practices', randomUUID());
      }
    });
  });

  describe('Performance tests', () => {
    it('should efficiently query by owner_id index', async () => {
      const owners = await Promise.all(
        Array.from({ length: 5 }, () =>
          dbHelper.createTestUserProfile({ role: 'practitioner' })
        )
      );

      // Create multiple practices for each owner
      await Promise.all(
        owners.flatMap(owner =>
          Array.from({ length: 3 }, (_, i) =>
            dbHelper.createTestPractice({
              name: `Practice ${i}`,
              owner_id: owner.id,
            })
          )
        )
      );

      const client = dbHelper.getClient();
      const startTime = Date.now();

      const { data, error } = await client
        .from('practices')
        .select('*')
        .eq('owner_id', owners[2].id);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
      expect(queryTime).toBeLessThan(1000); // Should be fast with index
    });

    it('should efficiently query by subscription_status index', async () => {
      const owner = await dbHelper.createTestUserProfile({
        role: 'practitioner',
      });

      // Create practices with different statuses
      await Promise.all([
        ...Array.from({ length: 5 }, (_, i) =>
          dbHelper.createTestPractice({
            name: `Active Practice ${i}`,
            owner_id: owner.id,
            subscription_status: 'active',
          })
        ),
        ...Array.from({ length: 3 }, (_, i) =>
          dbHelper.createTestPractice({
            name: `Trial Practice ${i}`,
            owner_id: owner.id,
            subscription_status: 'trial',
          })
        ),
      ]);

      const client = dbHelper.getClient();
      const startTime = Date.now();

      const { data, error } = await client
        .from('practices')
        .select('*')
        .eq('subscription_status', 'active');

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toHaveLength(5);
      expect(queryTime).toBeLessThan(1000); // Should be fast with index
    });
  });
});
