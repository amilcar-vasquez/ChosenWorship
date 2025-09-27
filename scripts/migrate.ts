#!/usr/bin/env node

/**
 * Database Migration Script
 * Run with: npm run migrate
 */

import { readFileSync } from 'fs';
import { migrateJsonToDatabase, testDatabaseConnection } from '../src/lib/server/db/migration.js';
import '../src/lib/server/db/migrate-db.js'; // Load the migration-specific database connection

// Load JSON data
const jsonData = JSON.parse(readFileSync(new URL('../src/lib/data/chosenWorship.json', import.meta.url), 'utf8'));

async function main() {
  console.log('🚀 ChosenWorship Database Migration');
  console.log('=====================================');
  
  // Test database connection first
  console.log('🔌 Testing database connection...');
  const connectionOk = await testDatabaseConnection();
  
  if (!connectionOk) {
    console.error('❌ Database connection failed! Please check your DATABASE_URL');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful!');
  
  // Run migration
  const result = await migrateJsonToDatabase(jsonData);
  
  if (result.success) {
    console.log('🎉 Migration completed successfully!');
    
    if (result.counts) {
      console.log('\n📊 Migration Summary:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━');
      Object.entries(result.counts).forEach(([table, count]) => {
        console.log(`${table.padEnd(20)} ${count.toString().padStart(4)} records`);
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Warnings:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━');
      result.errors.forEach(error => console.log(`• ${error}`));
    }
    
    console.log('\n✨ Your database is ready! You can now:');
    console.log('• Update your components to use database queries');
    console.log('• Run the development server: npm run dev');
    console.log('• View your database: npm run db:studio');
    
  } else {
    console.error('❌ Migration failed:', result.message);
    
    if (result.errors) {
      console.log('\n🐛 Errors:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━');
      result.errors.forEach(error => console.error(`• ${error}`));
    }
    
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

main().catch(console.error);