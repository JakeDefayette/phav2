#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('🔍 Checking user_profiles schema...\n');
  
  try {
    // First try to get existing data to see columns
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
    
    if (error) {
      console.error('Error selecting:', error.message);
    }
    
    if (data && data.length > 0) {
      console.log('✅ Existing columns in user_profiles:');
      Object.keys(data[0]).forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('ℹ️ No existing data in user_profiles table');
    }
    
    // Try a minimal insert to see what's required
    console.log('\n🧪 Testing minimal insert to see required fields...');
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: 'test-schema-check',
        email: 'test@test.com'
      })
      .select();
    
    if (insertError) {
      console.log('Insert error (reveals schema info):', insertError.message);
    } else {
      console.log('✅ Minimal insert successful');
      
      // Clean up
      await supabase.from('user_profiles').delete().eq('id', 'test-schema-check');
      console.log('✅ Test record cleaned up');
    }
    
  } catch (error) {
    console.error('Schema check failed:', error.message);
  }
}

checkSchema(); 