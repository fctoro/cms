require('dotenv').config({ path: '.env.local' });
const db = require('../src/server/db');

async function check() {
  try {
    // Check if hero_slides table exists
    const { rows } = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('hero_slides', 'home_slides', 'site_slides', 'home_page_settings', 'site_settings')
    `);
    console.log('=== Existing related tables ===');
    rows.forEach(r => console.log(' -', r.table_name));

    // Check home_page_settings columns
    const cols = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'home_page_settings'
    `);
    console.log('\n=== home_page_settings columns ===');
    cols.rows.forEach(c => console.log(' -', c.column_name));

    // Check site_settings columns
    const siteCols = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'site_settings'
    `);
    console.log('\n=== site_settings columns ===');
    siteCols.rows.forEach(c => console.log(' -', c.column_name));

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    process.exit();
  }
}
check();
