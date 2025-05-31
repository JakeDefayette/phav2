#!/usr/bin/env node

/**
 * Test script to verify database connectivity and table access
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔗 Testing Database Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
    console.log('✅ Basic connection successful');

    // Test 2: Check critical tables exist
    console.log('\n2️⃣ Checking critical tables...');
    
    const tables = [
      'user_profiles',
      'children', 
      'assessments',
      'survey_responses',
      'reports',
      'survey_question_definitions'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: accessible`);
        }
      } catch (err) {
        console.error(`❌ Table ${table}: ${err.message}`);
      }
    }

    // Test 3: Check question definitions exist
    console.log('\n3️⃣ Checking survey question definitions...');
    const { data: questions, error: questionsError } = await supabase
      .from('survey_question_definitions')
      .select('id, question_text')
      .limit(5);

    if (questionsError) {
      console.error('❌ Survey questions error:', questionsError.message);
    } else {
      console.log(`✅ Found ${questions.length} survey questions`);
      if (questions.length > 0) {
        console.log('Sample questions:');
        questions.forEach(q => {
          console.log(`  - ${q.id}: ${q.question_text?.substring(0, 50)}...`);
        });
      }
    }

    // Test 4: Test user creation (simulate anonymous user)
    console.log('\n4️⃣ Testing user profile creation...');
    const testUserId = `test-${Date.now()}`;
    
    const { data: newUser, error: userError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'parent',
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ User creation failed:', userError.message);
    } else {
      console.log('✅ User creation successful:', newUser.id);
      
      // Clean up test user
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId);
      console.log('✅ Test user cleaned up');
    }

    console.log('\n🎉 Database connection test completed!');
    
  } catch (error) {
    console.error('\n❌ Database connection test failed:', error.message);
    process.exit(1);
  }
}

// Run the test if called directly
if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection }; 