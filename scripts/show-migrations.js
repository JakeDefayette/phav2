#!/usr/bin/env node

/**
 * Migration Display Script for PHA-v2
 * 
 * This script displays the migration files content for easy copying
 * to the Supabase SQL Editor.
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// Migration files in order
const migrations = [
  '001_create_enums.sql',
  '002_create_core_tables.sql',
  '003_create_functions_triggers.sql'
];

function displayMigration(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${filename}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 MIGRATION: ${filename}`);
  console.log(`${'='.repeat(80)}`);
  console.log(content);
  console.log(`${'='.repeat(80)}`);
  console.log(`✅ End of ${filename}`);
  console.log(`${'='.repeat(80)}\n`);
}

function showInstructions() {
  console.log('🚀 PHA-v2 Database Migration Display');
  console.log('====================================');
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste each migration below in order');
  console.log('4. Execute each migration one by one');
  console.log('');
  console.log('⚠️  Important: Execute migrations in the exact order shown below!');
  console.log('');
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('PHA-v2 Migration Display Script');
  console.log('===============================');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/show-migrations.js [migration_number]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/show-migrations.js        # Show all migrations');
  console.log('  node scripts/show-migrations.js 1      # Show only migration 001');
  console.log('  node scripts/show-migrations.js 2      # Show only migration 002');
  console.log('  node scripts/show-migrations.js 3      # Show only migration 003');
  process.exit(0);
}

// Show specific migration or all
const migrationNumber = args[0];

if (migrationNumber) {
  const migrationIndex = parseInt(migrationNumber) - 1;
  if (migrationIndex >= 0 && migrationIndex < migrations.length) {
    showInstructions();
    displayMigration(migrations[migrationIndex]);
  } else {
    console.error(`❌ Invalid migration number. Use 1, 2, or 3.`);
    process.exit(1);
  }
} else {
  showInstructions();
  migrations.forEach(displayMigration);
}

console.log('🎉 Migration display complete!');
console.log('');
console.log('📊 After running all migrations, your database will have:');
console.log('   • 11 custom enum types');
console.log('   • 13 core tables with relationships');
console.log('   • 40+ performance indexes');
console.log('   • Row Level Security policies');
console.log('   • Automated triggers and functions'); 