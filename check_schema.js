require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  try {
    // Check user_profiles table structure
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        ORDER BY ordinal_position;
      `,
    });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('user_profiles table structure:');
    console.table(data);

    // Check foreign key constraints
    const { data: fkData, error: fkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'user_profiles';
      `,
    });

    if (fkError) {
      console.error('FK Error:', fkError);
      return;
    }

    console.log('\nuser_profiles foreign key constraints:');
    console.table(fkData);
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkSchema();
