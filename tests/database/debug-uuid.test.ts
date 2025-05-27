import { DatabaseTestHelper, generateTestUserProfile } from '../utils/database';
import { randomUUID } from 'crypto';

describe('Debug UUID Generation', () => {
  let dbHelper: DatabaseTestHelper;

  beforeEach(async () => {
    dbHelper = new DatabaseTestHelper();

    // Clean up any existing test data before starting
    const client = dbHelper.getClient();
    await client.from('user_profiles').delete().like('email', '%@example.com');
  });

  afterEach(async () => {
    await dbHelper.cleanup();

    // Double-check cleanup worked
    const client = dbHelper.getClient();
    const { data } = await client
      .from('user_profiles')
      .select('count')
      .like('email', '%@example.com');
    if (data && data.length > 0) {
      console.warn('Cleanup may not have worked completely');
    }
  });

  it('should generate unique UUIDs', () => {
    const uuids = new Set();
    for (let i = 0; i < 10; i++) {
      const uuid = randomUUID();
      console.log(`Generated UUID ${i}: ${uuid}`);
      expect(uuids.has(uuid)).toBe(false);
      uuids.add(uuid);
    }
  });

  it('should generate unique test user profiles', () => {
    const profiles = [];
    for (let i = 0; i < 5; i++) {
      const profile = generateTestUserProfile();
      console.log(`Generated profile ${i}:`, {
        id: profile.id,
        email: profile.email,
      });
      profiles.push(profile);
    }

    // Check for duplicate IDs
    const ids = profiles.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Check for duplicate emails
    const emails = profiles.map(p => p.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(emails.length);
  });

  it('should create a single user profile successfully', async () => {
    // Generate the profile data once
    const profileData = {
      first_name: 'Debug',
      last_name: 'Test',
    };

    console.log('Attempting to create profile with data:', profileData);

    try {
      const user = await dbHelper.createTestUserProfile(profileData);

      console.log('Successfully created user:', {
        id: user.id,
        email: user.email,
      });
      expect(user.first_name).toBe('Debug');
      expect(user.last_name).toBe('Test');
    } catch (error) {
      console.error('Failed to create user:', error);

      // Check if there are any existing test records
      const client = dbHelper.getClient();
      const { data: existingRecords } = await client
        .from('user_profiles')
        .select('id, email')
        .like('email', '%@example.com');

      console.log('Existing test records:', existingRecords);
      throw error;
    }
  });
});
