import { config } from 'dotenv';

// Load environment variables from .env.local, .env.test, or .env
config({ path: '.env.local' });
config({ path: '.env.test' });
config({ path: '.env' });

// Ensure required environment variables are present for testing
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables for testing:');
  missingVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n📝 To fix this:');
  console.error('   1. Create a .env.local file in the project root');
  console.error('   2. Add your Supabase test database credentials:');
  console.error(
    '      NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co'
  );
  console.error('      NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key');
  console.error('      SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key');
  console.error(
    '\n⚠️  Use a separate test database, not your production database!'
  );
  console.error('\n');

  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}`
  );
}

// Set test timeout globally
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
  console.log('🧪 Running database tests...');
});

afterAll(async () => {
  // Any global cleanup can go here
  console.log('✅ Database tests completed');
});
