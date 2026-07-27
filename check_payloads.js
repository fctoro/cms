const db = require('./src/server/db');

(async () => {
  try {
    const { rows: messages } = await db.query(
      `SELECT id, payload FROM site_messages WHERE email = 'sneguerre@yahoo.fr'`
    );
    console.log("MESSAGES:", JSON.stringify(messages, null, 2));

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
