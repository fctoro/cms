const db = require('./src/server/db');

(async () => {
  try {
    const { rows } = await db.query(
      `SELECT email, COUNT(*) as count
       FROM site_messages
       WHERE type = 'joueur'
       GROUP BY email
       HAVING COUNT(*) > 1`
    );
    console.log("Emails with multiple messages:", rows);
    
    let totalDups = 0;
    for (const r of rows) {
      totalDups += (parseInt(r.count, 10) - 1);
    }
    console.log("Total duplicates to clean (if 1 original per email):", totalDups);
    
    const { rows: syncRows } = await db.query(
      `SELECT id, email, created_at, payload::text
       FROM site_messages
       WHERE type = 'joueur' 
         AND payload::text LIKE '%_synced_from_registration%'`
    );
    console.log(`Found ${syncRows.length} duplicates with sync flag.`);
    
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
