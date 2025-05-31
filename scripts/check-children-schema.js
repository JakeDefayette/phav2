#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkChildrenSchema() {
  console.log('🔍 Checking children table schema...\n');
  
  try {
    const { data, error } = await supabase.from('children').select('*').limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ children table columns:');
      Object.keys(data[0]).forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('ℹ️ No data in children table');
      
      // Try a minimal insert to see what's required
      const { error: insertError } = await supabase
        .from('children')
        .insert({
          id: 'test-schema-check',
          parent_id: 'test-parent',
          first_name: 'Test'
        })
        .select();
      
      if (insertError) {
        console.log('Insert error (reveals schema info):', insertError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkChildrenSchema(); 