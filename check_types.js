const db = require('./src/server/db');

(async () => {
  try {
    const { rows: messages } = await db.query(
      `SELECT id, type, is_read, created_at FROM site_messages WHERE email = 'sneguerre@yahoo.fr'`
    );
    console.log("MESSAGES:", messages);

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
