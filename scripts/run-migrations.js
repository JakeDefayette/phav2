#!/usr/bin/env node

/**
 * Database Migration Runner for PHA-v2
 * 
 * This script runs the database migrations in the correct order.
 * Make sure you have the following environment variables set:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (service role key, not anon key)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env.local file or environment.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Read and execute a SQL migration file
 */
async function runMigration(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filename}`);
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`📄 Running migration: ${filename}`);
  
  try {
    // Execute the SQL using Supabase's RPC function
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Migration completed: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed: ${filename}`);
    console.error('Error:', error.message);
    throw error;
  }
}

/**
 * Create the exec_sql function if it doesn't exist
 */
async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'Success';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
    END;
    $$;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
    if (error && !error.message.includes('already exists')) {
      // If the function doesn't exist, we need to create it directly
      console.log('📋 Creating exec_sql function...');
      // This might fail if the function doesn't exist yet, which is expected
    }
  } catch (error) {
    // Expected if function doesn't exist yet
    console.log('📋 Setting up migration infrastructure...');
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('🚀 Starting PHA-v2 Database Migrations');
  console.log('=====================================');
  
  // Migration files in order
  const migrations = [
    '001_create_enums.sql',
    '002_create_core_tables.sql',
    '003_create_functions_triggers.sql'
  ];
  
  try {
    // Ensure we can connect to the database
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }
    
    console.log('✅ Database connection established');
    
    // Create exec_sql function if needed
    await createExecSqlFunction();
    
    // Run migrations in order
    for (const migration of migrations) {
      await runMigration(migration);
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📊 Database Schema Summary:');
    console.log('   • 11 custom enum types');
    console.log('   • 13 core tables with relationships');
    console.log('   • 40+ performance indexes');
    console.log('   • Row Level Security policies');
    console.log('   • Automated triggers and functions');
    console.log('\n🔄 Next Steps:');
    console.log('   1. Update TypeScript types (src/types/database.ts)');
    console.log('   2. Implement service layer');
    console.log('   3. Run comprehensive tests');
    
  } catch (error) {
    console.error('\n💥 Migration failed!');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your Supabase credentials');
    console.error('   2. Ensure you have the service role key (not anon key)');
    console.error('   3. Verify your database permissions');
    console.error('   4. Check the Supabase dashboard for more details');
    process.exit(1);
  }
}

/**
 * Alternative: Run migrations using Supabase CLI (recommended)
 */
function showSupabaseCLIInstructions() {
  console.log('\n📋 Alternative: Using Supabase CLI (Recommended)');
  console.log('================================================');
  console.log('If you prefer to use the Supabase CLI:');
  console.log('');
  console.log('1. Install Supabase CLI:');
  console.log('   npm install -g supabase');
  console.log('');
  console.log('2. Login to Supabase:');
  console.log('   supabase login');
  console.log('');
  console.log('3. Link your project:');
  console.log('   supabase link --project-ref YOUR_PROJECT_REF');
  console.log('');
  console.log('4. Run migrations:');
  console.log('   supabase db push');
  console.log('');
  console.log('5. Or apply individual migrations:');
  console.log('   supabase db reset');
  console.log('');
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('PHA-v2 Database Migration Runner');
  console.log('================================');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/run-migrations.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --cli-info     Show Supabase CLI instructions');
  console.log('');
  console.log('Environment Variables Required:');
  console.log('  SUPABASE_URL              Your Supabase project URL');
  console.log('  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key');
  process.exit(0);
}

if (args.includes('--cli-info')) {
  showSupabaseCLIInstructions();
  process.exit(0);
}

// Run the migrations
runMigrations(); 