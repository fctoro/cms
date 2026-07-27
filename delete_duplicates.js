const db = require('./src/server/db');

(async () => {
  try {
    const { rows } = await db.query(
      `DELETE FROM site_messages 
       WHERE type = 'joueur' 
       AND payload::text LIKE '%_synced_from_registration%'
       RETURNING id`
    );
    console.log(`Successfully deleted ${rows.length} duplicate messages.`);
  } catch(e) {
    console.error("Error deleting duplicates:", e);
  } finally {
    process.exit(0);
  }
})();
