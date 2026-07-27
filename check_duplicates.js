const db = require('./src/server/db');

(async () => {
  try {
    const { rows: columns } = await db.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('site_messages', 'player_registrations') 
      AND column_name = 'created_at'
    `);
    console.log(columns);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
