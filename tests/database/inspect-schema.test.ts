import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Database Schema Inspection', () => {
  test('should inspect user_profiles table schema', async () => {
    // Query the information_schema to get column details
    const { data, error } = await supabase.rpc('get_table_columns', {
      table_name: 'user_profiles',
    });

    if (error) {
      console.log('RPC error, trying direct query...');

      // Try a direct query to get column info
      const { data: directData, error: directError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'user_profiles')
        .eq('table_schema', 'public');

      console.log('Direct query result:', { directData, directError });
    } else {
      console.log('RPC result:', { data, error });
    }

    // Also try to get a sample record to see actual field names
    const { data: sampleData, error: sampleError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    console.log('Sample data:', { sampleData, sampleError });

    if (sampleData && sampleData.length > 0) {
      console.log(
        'Actual column names in user_profiles:',
        Object.keys(sampleData[0])
      );
    }
  });

  test('should inspect practices table schema', async () => {
    // Get sample record to see actual field names
    const { data: sampleData, error: sampleError } = await supabase
      .from('practices')
      .select('*')
      .limit(1);

    console.log('Practices sample data:', { sampleData, sampleError });

    if (sampleData && sampleData.length > 0) {
      console.log(
        'Actual column names in practices:',
        Object.keys(sampleData[0])
      );
    }
  });

  test('should inspect assessments table schema', async () => {
    // Get sample record to see actual field names
    const { data: sampleData, error: sampleError } = await supabase
      .from('assessments')
      .select('*')
      .limit(1);

    console.log('Assessments sample data:', { sampleData, sampleError });

    if (sampleData && sampleData.length > 0) {
      console.log(
        'Actual column names in assessments:',
        Object.keys(sampleData[0])
      );
    } else {
      console.log('No assessments found, checking table structure...');
    }
  });

  test('should inspect survey_responses table schema', async () => {
    // Get sample record to see actual field names
    const { data: sampleData, error: sampleError } = await supabase
      .from('survey_responses')
      .select('*')
      .limit(1);

    console.log('Survey responses sample data:', { sampleData, sampleError });

    if (sampleData && sampleData.length > 0) {
      console.log(
        'Actual column names in survey_responses:',
        Object.keys(sampleData[0])
      );
    } else {
      console.log('No survey responses found, checking table structure...');
    }
  });
});
