import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Enum Values Check', () => {
  test('should check what user role enum values exist', async () => {
    console.log('🔍 Checking actual enum values...');

    // Try different role values to see which ones work
    const roleValues = ['parent', 'practitioner', 'admin'];

    for (const role of roleValues) {
      console.log(`Testing role: "${role}"`);

      const testUser = {
        id: `00000000-0000-0000-0000-00000000000${roleValues.indexOf(role) + 1}`,
        email: `test-${role.toLowerCase().replace('/', '-')}@example.com`,
        first_name: 'Test',
        last_name: 'User',
        role: role,
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(testUser)
        .select();

      console.log(`Role "${role}" result:`, {
        success: !error,
        error: error?.message,
      });

      if (data) {
        console.log(`Successfully created user with role: "${role}"`);
        console.log('User data:', data[0]);

        // Clean up successful insert
        await supabase.from('user_profiles').delete().eq('id', testUser.id);
      }
    }
  });

  test('should check existing user data to understand schema', async () => {
    console.log('🔍 Checking existing user data...');

    // Get existing users to see their structure
    const { data: existingUsers, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    console.log('Existing users:', { existingUsers, error });

    if (existingUsers && existingUsers.length > 0) {
      console.log('Sample user structure:');
      console.log('- Columns:', Object.keys(existingUsers[0]));
      console.log('- Role value:', existingUsers[0].role);
      console.log('- Has createdAt:', 'createdAt' in existingUsers[0]);
      console.log('- Has created_at:', 'created_at' in existingUsers[0]);
      console.log('- Has updatedAt:', 'updatedAt' in existingUsers[0]);
      console.log('- Has updated_at:', 'updated_at' in existingUsers[0]);
    }
  });
});
