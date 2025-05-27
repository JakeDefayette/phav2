import { createTestClient } from '../utils/database';

describe('Debug Database Schema', () => {
  it('should show actual practices table structure', async () => {
    const client = createTestClient();

    // Try to get the table structure
    const { data, error } = await client.from('practices').select('*').limit(1);

    console.log('Practices table query result:', { data, error });

    // Try to create a minimal practice to see what fields are required
    const testData = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Debug Test Practice',
      owner_id: '00000000-0000-0000-0000-000000000002',
    };

    const { data: insertData, error: insertError } = await client
      .from('practices')
      .insert(testData)
      .select();

    console.log('Insert result:', { insertData, insertError });

    // Clean up
    if (insertData && insertData.length > 0) {
      await client.from('practices').delete().eq('id', testData.id);
    }
  });

  it('should show actual user_profiles table structure', async () => {
    const client = createTestClient();

    // Try to get the table structure
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .limit(1);

    console.log('User profiles table query result:', { data, error });

    if (data && data.length > 0) {
      console.log('Sample user profile structure:', Object.keys(data[0]));
    }
  });
});
