import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { chatSessions, chatMessages, chatVotes, chatFeedback, userInteractions } from './lib/db/schema';

// Load environment variables
config({ path: '.env.local' });

async function clearDatabase() {
  const connectionString = process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ POSTGRES_URL not found in environment variables');
    console.error('💡 Make sure you have .env.local file with POSTGRES_URL');
    process.exit(1);
  }

  console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!');
  console.log('⏳ Starting in 5 seconds... Press Ctrl+C to cancel');
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    console.log('🗑️  Deleting all data...');

    // Delete in correct order (respecting foreign keys)
    await db.delete(userInteractions);
    console.log('✅ Deleted user_interactions');

    await db.delete(chatFeedback);
    console.log('✅ Deleted chat_feedback');

    await db.delete(chatVotes);
    console.log('✅ Deleted chat_votes');

    await db.delete(chatMessages);
    console.log('✅ Deleted chat_messages');

    await db.delete(chatSessions);
    console.log('✅ Deleted chat_sessions');

    console.log('');
    console.log('✅ Database cleared successfully!');
    console.log('');
    console.log('📊 You can now deploy to production with clean data.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

clearDatabase();
