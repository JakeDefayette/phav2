#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraints() {
  console.log('🔍 Checking foreign key constraints...\n');
  
  try {
    // Test 1: Try inserting with a random UUID
    console.log('1️⃣ Testing random UUID insertion...');
    const testId = 'test-constraint-check';
    
    const { error: randomError } = await supabase
      .from('user_profiles')
      .insert({
        id: testId,
        email: 'test@test.com',
        role: 'parent'
      });
    
    console.log('Random UUID error:', randomError?.message);
    
    // Test 2: Check if we need to create auth user first
    console.log('\n2️⃣ Testing auth user creation...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'test-constraint@example.com',
      password: 'temporary123',
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ Auth user creation error:', authError.message);
    } else {
      console.log('✅ Auth user created:', authUser.user?.id);
      
      // Try creating profile with auth user ID
      console.log('\n3️⃣ Testing profile creation with auth user ID...');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authUser.user.id,
          email: authUser.user.email,
          role: 'parent',
          first_name: 'Test',
          last_name: 'User'
        });
      
      if (profileError) {
        console.log('❌ Profile creation error:', profileError.message);
      } else {
        console.log('✅ Profile created successfully!');
      }
      
      // Clean up
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.log('✅ Test user cleaned up');
    }
    
    // Test 3: Check existing user profiles to see the pattern
    console.log('\n4️⃣ Checking existing user profiles...');
    const { data: existingProfiles, error: selectError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(3);
    
    if (selectError) {
      console.log('❌ Error fetching profiles:', selectError.message);
    } else {
      console.log('✅ Existing profiles:');
      existingProfiles.forEach(profile => {
        console.log(`  - ID: ${profile.id} | Email: ${profile.email} | Role: ${profile.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

checkConstraints(); 