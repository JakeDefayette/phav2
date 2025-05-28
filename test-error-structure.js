const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const client = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testErrorStructure() {
  console.log('Testing Supabase error structure...\n');

  // Try to insert an assessment with a non-existent practice_id
  const nonExistentPracticeId = randomUUID();
  const nonExistentChildId = randomUUID();

  console.log(
    'Attempting to insert assessment with non-existent practice_id...'
  );
  const result = await client.from('assessments').insert({
    id: randomUUID(),
    child_id: nonExistentChildId,
    practice_id: nonExistentPracticeId,
    parent_email: 'test@example.com',
  });

  console.log('Full result object:');
  console.log(JSON.stringify(result, null, 2));

  console.log('\nError object:');
  console.log(JSON.stringify(result.error, null, 2));

  if (result.error) {
    console.log('\nError properties:');
    console.log('result.error.code:', result.error.code);
    console.log('result.error.message:', result.error.message);
    console.log('result.error.details:', result.error.details);
    console.log('result.error.hint:', result.error.hint);

    // Check if code is nested somewhere else
    console.log('\nChecking for nested error codes...');
    console.log('result.error.details?.code:', result.error.details?.code);
    console.log(
      'result.error.details?.error_code:',
      result.error.details?.error_code
    );

    // Check all properties of the error object
    console.log('\nAll error object keys:', Object.keys(result.error));
  }
}

testErrorStructure().catch(console.error);
