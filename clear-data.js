#!/usr/bin/env node

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function clearData() {
  const client = postgres(process.env.POSTGRES_URL);
  
  try {
    console.log('Clearing all collected data...');
    
    const clearSQL = fs.readFileSync(
      path.join(__dirname, 'clear-data.sql'),
      'utf8'
    );
    
    await client.unsafe(clearSQL);
    console.log('✅ All data cleared successfully!');
    console.log('Database is ready for fresh data collection with new metrics.');
    
  } catch (error) {
    console.error('❌ Failed to clear data:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  clearData();
}

module.exports = { clearData };