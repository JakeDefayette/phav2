import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../src/shared/types/database';
import { randomUUID } from 'crypto';

// Create a test client with service role key for full access
export const createTestClient = (): SupabaseClient<Database> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Test data generators
export const generateTestUserProfile = (
  overrides: Partial<
    Database['public']['Tables']['user_profiles']['Insert']
  > = {}
) => {
  // Add more entropy to ensure unique UUIDs across test runs
  const id = randomUUID();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const processEntropy = process.pid.toString(36);
  const email = `test-${processEntropy}-${timestamp}-${random}@example.com`;

  return {
    id,
    email,
    first_name: 'Test',
    last_name: 'User',
    role: 'parent' as const, // Correct enum value from actual database
    practice_id: null, // Will be set when creating with a practice
    ...overrides,
  };
};

export const generateTestPractice = (
  overrides: Partial<Database['public']['Tables']['practices']['Insert']> = {}
) => {
  const baseData: any = {
    id: randomUUID(),
    name: `Test Practice ${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    email: `practice-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    subscription_tier: 'basic' as const,
    owner_id: null, // Will be set after user creation
  };

  return {
    ...baseData,
    ...overrides,
  };
};

export const generateTestChild = (
  parentId: string,
  overrides: Partial<Database['public']['Tables']['children']['Insert']> = {}
) => ({
  id: randomUUID(),
  parent_id: parentId,
  first_name: 'Child',
  last_name:
    overrides.last_name === null ? null : overrides.last_name || 'Child',
  date_of_birth: '2020-01-01',
  gender: null,
  ...overrides,
});

// Note: Based on actual database schema from Supabase MCP
export const generateTestAssessment = (
  childId: string,
  practiceId: string,
  overrides: Partial<Database['public']['Tables']['assessments']['Insert']> = {}
) => ({
  id: randomUUID(),
  child_id: childId,
  practice_id: practiceId,
  parent_email: `parent-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
  status: 'draft' as const, // Valid enum values from actual schema: 'draft', 'completed', 'shared'
  ...overrides,
});

export const generateTestSurveyQuestion = (
  overrides: Partial<
    Database['public']['Tables']['survey_question_definitions']['Insert']
  > = {}
) => ({
  id: randomUUID(),
  question_text: `Test question ${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  question_type: 'text' as const,
  order_index: 1,
  is_required: true,
  category: 'general',
  ...overrides,
});

// Cleanup utilities
export class DatabaseTestHelper {
  private client: SupabaseClient<Database>;
  private createdRecords: {
    table: string;
    id: string;
  }[] = [];
  private createdAuthUsers: string[] = []; // Track auth users separately

  constructor() {
    this.client = createTestClient();
  }

  // Get the client for direct access
  getClient() {
    return this.client;
  }

  // Track created records for cleanup
  trackRecord(table: string, id: string) {
    this.createdRecords.push({ table, id });
  }

  // Track auth users for cleanup
  trackAuthUser(id: string) {
    this.createdAuthUsers.push(id);
  }

  // Create test user profile
  async createTestUserProfile(
    data?: Partial<Database['public']['Tables']['user_profiles']['Insert']>
  ) {
    const profileData = generateTestUserProfile(data); // Renamed to avoid confusion

    // If no practice_id is provided and it's not explicitly set to null, create a practice first
    if (!profileData.practice_id && data?.practice_id !== null) {
      const practice = await this.createTestPractice({ owner_id: null });
      profileData.practice_id = practice.id;
    }

    // Create the auth user first
    const { data: authUserData, error: authError } =
      await this.client.auth.admin.createUser({
        email: profileData.email,
        password: 'password123',
        email_confirm: true, // Auto-confirm email for tests
        // Not providing an ID, let Supabase generate it
      });

    if (authError) {
      // Log specific error if it's not 'User already registered' which can happen in retries/parallel tests
      if (authError.message !== 'User already registered') {
        console.warn(
          `Failed to create auth user ${profileData.email} with admin client (Supabase generated ID attempt):`,
          JSON.stringify(authError, null, 2) // Stringify for better error object logging
        );
      }
      // If user creation failed and it wasn't because they already existed, we can't proceed.
      if (authError.message !== 'User already registered') throw authError;
    }

    // If auth user creation was successful (or user already existed), proceed to create/upsert profile
    // Use the ID from the successfully created/retrieved auth user for the profile
    const authUserIdToUse = authUserData?.user?.id;
    if (!authUserIdToUse) {
      // This case should ideally be covered by the 'User already registered' check, but if not, attempt to fetch the user
      console.warn(
        `Auth user ID not returned for ${profileData.email}, attempting to fetch by email.`
      );
      const { data: existingUser, error: fetchError } =
        await this.client.auth.admin.listUsers();
      if (fetchError || !existingUser?.users?.length) {
        const errMsg = `Failed to create or fetch auth user ${profileData.email}. Create error: ${JSON.stringify(authError)}, Fetch error: ${JSON.stringify(fetchError)}`;
        console.error(errMsg);
        throw new Error(errMsg);
      }
      const foundUser = existingUser.users.find(
        (user: any) => user.email === profileData.email
      );
      if (!foundUser) {
        const errMsg = `Could not find auth user with email ${profileData.email}`;
        console.error(errMsg);
        throw new Error(errMsg);
      }
      profileData.id = foundUser.id;
      console.log(
        `Fetched existing auth user ${profileData.email} with ID ${profileData.id}`
      );
    } else {
      profileData.id = authUserIdToUse;
    }

    const finalProfileData = {
      ...profileData,
      // id is now set above
      email: authUserData?.user?.email || profileData.email, // Ensure email consistency
    };

    this.trackRecord('user_profiles', finalProfileData.id);
    this.trackAuthUser(finalProfileData.id); // Track by the ID used in user_profiles

    const { data: userProfile, error: profileError } = await this.client
      .from('user_profiles')
      .upsert(finalProfileData)
      .select()
      .single();

    if (profileError) {
      console.error(
        `Failed to upsert user profile for auth user ID ${finalProfileData.id} with email ${finalProfileData.email}:`,
        JSON.stringify(profileError, null, 2), // Stringify for better error object logging
        'Profile Data Attempted:',
        JSON.stringify(finalProfileData, null, 2)
      );
      throw profileError;
    }

    return userProfile;
  }

  // Create test practice
  async createTestPractice(
    data?: Partial<Database['public']['Tables']['practices']['Insert']>
  ) {
    // Generate practice data with provided overrides
    let practiceData = generateTestPractice(data);

    // Only create an owner if explicitly requested and not already provided
    if (
      !practiceData.owner_id &&
      data?.owner_id !== null &&
      data?.owner_id !== undefined
    ) {
      // Create a user profile with this practice's ID (circular dependency handling)
      const tempPracticeId = practiceData.id;
      const owner = await this.createTestUserProfile({
        practice_id: tempPracticeId,
      });
      practiceData.owner_id = owner.id;
    }

    const { data: practice, error } = await this.client
      .from('practices')
      .insert(practiceData)
      .select()
      .single();

    if (error) throw error;
    this.trackRecord('practices', practice.id);
    return practice;
  }

  // Create test child
  async createTestChild(
    parentId: string,
    data?: Partial<Database['public']['Tables']['children']['Insert']>
  ) {
    const childData = generateTestChild(parentId, data);
    const { data: child, error } = await this.client
      .from('children')
      .insert(childData)
      .select()
      .single();

    if (error) throw error;
    this.trackRecord('children', child.id);
    return child;
  }

  // Create test assessment
  async createTestAssessment(
    childId: string,
    practiceId: string,
    data?: Partial<Database['public']['Tables']['assessments']['Insert']>
  ) {
    const assessmentData = generateTestAssessment(childId, practiceId, data);
    const { data: assessment, error } = await this.client
      .from('assessments')
      .insert(assessmentData)
      .select()
      .single();

    if (error) throw error;
    this.trackRecord('assessments', assessment.id);
    return assessment;
  }

  // Helper method to perform updates with correct timestamp handling
  async updateRecord(table: string, id: string, updateData: any) {
    // user_profiles uses camelCase, all other tables use snake_case
    const timestampField =
      table === 'user_profiles' ? 'updatedAt' : 'updated_at';

    // Just do a regular update - the database triggers should handle timestamps
    const { data, error } = await this.client
      .from(table as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  // Clean up all created records
  async cleanup() {
    // Clean up in reverse order to respect foreign key constraints
    const tables = [
      'survey_responses',
      'reports',
      'assessments',
      'children',
      'survey_question_definitions',
      'email_campaigns',
      'email_subscribers',
      'practices',
      'user_profiles', // user_profiles before auth users
    ];

    for (const { table, id } of [...this.createdRecords].reverse()) {
      // Special handling for user_profiles to avoid conflicts with auth.users cleanup
      if (table === 'user_profiles') {
        // Check if auth user was also created and delete it first if not already handled
        if (this.createdAuthUsers.includes(id)) {
          try {
            // Attempt to delete from user_profiles first
            console.log(`Cleanup: Deleting from user_profiles, ID: ${id}`);
            await this.client.from('user_profiles').delete().match({ id });
            console.log(
              `Cleanup: Successfully deleted from user_profiles, ID: ${id}`
            );
          } catch (profileError) {
            console.warn(
              `Warn: Failed to delete from user_profiles for id ${id} during mixed cleanup:`,
              JSON.stringify(profileError, null, 2)
            );
          }
          try {
            console.log(`Cleanup: Deleting auth user, ID: ${id}`);
            await this.client.auth.admin.deleteUser(id);
            console.log(`Cleanup: Successfully deleted auth user, ID: ${id}`);
            this.createdAuthUsers = this.createdAuthUsers.filter(
              uid => uid !== id
            );
          } catch (authDeleteError) {
            const err = authDeleteError as any;
            if (
              err.status === 404 ||
              (err.message && err.message.includes('User not found'))
            ) {
              console.log(
                `Cleanup: Auth user ${id} already deleted or not found (possibly by cascade).`
              );
            } else {
              console.warn(
                `Warn: Failed to delete auth user ${id} during mixed cleanup:`,
                JSON.stringify(authDeleteError, null, 2)
              );
            }
          }
        } else {
          // If not in createdAuthUsers, it might have been created differently or already cleaned.
          // Still attempt to delete from user_profiles.
          try {
            console.log(
              `Cleanup: Deleting from user_profiles (general table cleanup), ID: ${id}`
            );
            await this.client.from('user_profiles').delete().match({ id });
            console.log(
              `Cleanup: Successfully deleted from user_profiles (general table cleanup), ID: ${id}`
            );
          } catch (e) {
            console.warn(
              `Warn: Failed to delete from user_profiles (id: ${id}) during general table cleanup:`,
              JSON.stringify(e, null, 2)
            );
          }
        }
      } else {
        try {
          console.log(`Cleanup: Deleting from table ${table}, ID: ${id}`);
          await this.client
            .from(table as any)
            .delete()
            .match({ id });
          console.log(
            `Cleanup: Successfully deleted from table ${table}, ID: ${id}`
          );
        } catch (e) {
          console.warn(
            `Warn: Failed to delete from table ${table} (id: ${id}):`,
            JSON.stringify(e, null, 2)
          );
        }
      }
    }
    this.createdRecords = [];

    // Cleanup any remaining auth users that might not have had user_profiles or were tracked separately
    for (const userId of [...this.createdAuthUsers]) {
      try {
        console.log(`Cleanup: Deleting remaining auth user, ID: ${userId}`);
        await this.client.auth.admin.deleteUser(userId);
        console.log(
          `Cleanup: Successfully deleted remaining auth user, ID: ${userId}`
        );
      } catch (error) {
        // Check if error is because user was already deleted (e.g. by cascade from user_profiles)
        const err = error as any;
        if (
          err.status === 404 ||
          (err.message && err.message.includes('User not found'))
        ) {
          console.warn(
            `Cleanup: Auth user ${userId} (remaining) already deleted or not found.`
          );
        } else {
          console.warn(
            `Failed to delete auth user ${userId} (remaining):`,
            JSON.stringify(error, null, 2)
          );
        }
      }
    }
    this.createdAuthUsers = [];
  }
}

// Utility function to wait for a condition
export const waitFor = async (
  condition: () => Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Helper function to test Supabase operations that should fail
export const expectSupabaseError = async (
  operation: () => Promise<any>,
  expectedErrorCode?: string
): Promise<void> => {
  const result = await operation();
  expect(result.error).toBeTruthy();
  if (expectedErrorCode) {
    expect(result.error.code).toBe(expectedErrorCode);
  }
};
