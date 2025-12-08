require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres(process.env.POSTGRES_URL);

async function fix() {
  try {
    await sql`
      ALTER TABLE chat_feedback 
      ALTER COLUMN satisfaction TYPE varchar(1) USING satisfaction::text,
      ALTER COLUMN confidence TYPE varchar(1) USING confidence::text
    `;
    console.log('✅ Columns fixed successfully');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await sql.end();
  }
}

fix();
