require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres(process.env.POSTGRES_URL);

async function fix() {
  try {
    await sql`
      ALTER TABLE chat_votes 
      DROP CONSTRAINT IF EXISTS chat_votes_message_id_chat_messages_id_fk
    `;
    console.log('✅ Foreign key constraint removed');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await sql.end();
  }
}

fix();
