const db = require('./src/server/db');

(async () => {
  try {
    const { rows } = await db.query(
      `SELECT id, email, created_at, payload::text
       FROM site_messages
       WHERE type = 'joueur' 
         AND payload::text LIKE '%_synced_from_registration%'`
    );
    console.log(`Found ${rows.length} duplicates.`);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
