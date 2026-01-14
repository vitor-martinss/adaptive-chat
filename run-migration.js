#!/usr/bin/env node

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = postgres(process.env.POSTGRES_URL);
  
  try {
    console.log('Running migrations...');
    
    // Run topic classification migration
    const topicSQL = fs.readFileSync(
      path.join(__dirname, 'lib/db/migrations/0016_add_topic_classification.sql'),
      'utf8'
    );
    await client.unsafe(topicSQL);
    console.log('✅ Topic classification migration completed');
    
    // Run user tracking migration
    const userSQL = fs.readFileSync(
      path.join(__dirname, 'lib/db/migrations/0017_add_user_tracking.sql'),
      'utf8'
    );
    await client.unsafe(userSQL);
    console.log('✅ User tracking migration completed');
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };