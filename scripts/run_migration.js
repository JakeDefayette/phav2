#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * This script runs database migrations and seeds for the PHA project.
 * Usage: node scripts/run_migration.js [migration-file]
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local first, then .env as fallback
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runSQL(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }

    console.log(`🚀 Running SQL file: ${filePath}`);

    // Parse the Supabase URL to extract connection details
    const url = new URL(SUPABASE_URL);
    const host = url.hostname;
    const port = 6543; // Supabase database port (not 5432)
    const database = 'postgres';
    
    // Build psql connection string with proper format for Supabase
    const command = `PGPASSWORD="${SUPABASE_SERVICE_ROLE_KEY}" psql "sslmode=require host=${host} port=${port} dbname=${database} user=postgres" -f "${filePath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error running SQL:', error.message);
        console.error('stderr:', stderr);
        reject(error);
        return;
      }

      console.log('✅ SQL executed successfully');
      if (stdout) {
        console.log('Output:', stdout);
      }
      
      resolve(stdout);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const scriptPath = path.resolve(__dirname);
  
  if (args.length === 0) {
    console.log('📋 Available migration files:');
    const sqlFiles = fs.readdirSync(scriptPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    sqlFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    
    console.log('\n🔧 Usage: node scripts/run_migration.js <filename>');
    console.log('   Example: node scripts/run_migration.js seed_survey_questions.sql');
    return;
  }

  const fileName = args[0];
  const filePath = path.join(scriptPath, fileName);

  try {
    await runSQL(filePath);
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Check if psql is available
exec('psql --version', (error) => {
  if (error) {
    console.error('❌ PostgreSQL client (psql) is not installed or not in PATH');
    console.error('   Please install PostgreSQL client tools to run migrations');
    process.exit(1);
  }
  
  main().catch(console.error);
}); 