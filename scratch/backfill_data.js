require('dotenv').config({ path: '.env.local' });
const db = require('../src/server/db');
const { createClient } = require('@supabase/supabase-js');

async function backfill() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.SUPABASE_SERVICE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'videos';

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase config missing!');
    process.exit(1);
  }

  const client = createClient(supabaseUrl, supabaseKey);

  // Find all docs that have a path but empty/null data
  const { rows } = await db.query(`
    SELECT id, path, content_type
    FROM player_registration_documents
    WHERE path IS NOT NULL
      AND (data IS NULL OR length(data) = 0)
  `);

  console.log(`Found ${rows.length} documents to backfill.`);
  let success = 0;
  let failed = 0;

  for (const doc of rows) {
    const pathStr = String(doc.path);
    // Storage path inside the bucket (strip leading slashes)
    const storagePath = pathStr.replace(/^\/+/, '').replace(/^uploads\//, 'uploads/');

    try {
      console.log(`Downloading: ${storagePath}`);
      const { data, error } = await client.storage.from(bucket).download(storagePath);
      if (error) {
        // Try with 'registrations/' prefix
        const altPath = `registrations/${storagePath}`;
        const { data: data2, error: error2 } = await client.storage.from(bucket).download(altPath);
        if (error2) {
          console.warn(`  SKIP: ${error.message}`);
          failed++;
          continue;
        }
        const bytes = Buffer.from(await data2.arrayBuffer());
        await db.query('UPDATE player_registration_documents SET data = $1 WHERE id = $2', [bytes, doc.id]);
        console.log(`  OK (alt path): doc ${doc.id}, ${bytes.length} bytes`);
        success++;
        continue;
      }
      const bytes = Buffer.from(await data.arrayBuffer());
      await db.query('UPDATE player_registration_documents SET data = $1 WHERE id = $2', [bytes, doc.id]);
      console.log(`  OK: doc ${doc.id}, ${bytes.length} bytes`);
      success++;
    } catch (e) {
      console.warn(`  ERROR doc ${doc.id}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} backfilled, ${failed} failed.`);
  process.exit();
}

backfill().catch(e => { console.error(e); process.exit(1); });
