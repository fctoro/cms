require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function listBuckets() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.SUPABASE_SERVICE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const client = createClient(supabaseUrl, supabaseKey);

  // List all buckets
  const { data: buckets, error: bucketsErr } = await client.storage.listBuckets();
  if (bucketsErr) {
    console.error('Error listing buckets:', bucketsErr.message);
  } else {
    console.log('=== Buckets ===');
    buckets.forEach(b => console.log(`  ${b.id}: public=${b.public}`));
  }

  // List files in the 'videos' bucket
  const { data: files, error: filesErr } = await client.storage.from('videos').list('uploads', { limit: 5 });
  if (filesErr) {
    console.log('\nError listing files in videos/uploads:', filesErr.message);
  } else {
    console.log('\n=== Files in videos/uploads ===');
    (files || []).forEach(f => console.log(`  ${f.name}`));
    if (!files || files.length === 0) console.log('  (empty or no access)');
  }

  // Try registrations
  const { data: regFiles, error: regErr } = await client.storage.from('videos').list('registrations', { limit: 5 });
  if (regErr) {
    console.log('\nError listing files in videos/registrations:', regErr.message);
  } else {
    console.log('\n=== Files in videos/registrations ===');
    (regFiles || []).forEach(f => console.log(`  ${f.name}`));
    if (!regFiles || regFiles.length === 0) console.log('  (empty or no access)');
  }

  process.exit();
}

listBuckets().catch(e => { console.error(e); process.exit(1); });
