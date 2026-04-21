require('dotenv').config({ path: '.env.local' });
const db = require('../src/server/db');

async function run() {
  try {
    // Check if data column has any data
    const docs = await db.query(`
      SELECT id, doc_key, path, content_type, filename,
        CASE WHEN data IS NOT NULL THEN length(data) ELSE 0 END as data_size
      FROM player_registration_documents 
      LIMIT 10
    `);
    console.log('=== Sample docs with data size ===');
    docs.rows.forEach(r => console.log(JSON.stringify(r)));
    
    // Check the Supabase bucket
    console.log('\n=== Storage Config ===');
    console.log('SUPABASE_STORAGE_BUCKET:', process.env.SUPABASE_STORAGE_BUCKET || '(not set, default: videos)');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    process.exit();
  }
}

run();
