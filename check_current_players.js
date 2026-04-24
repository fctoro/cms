require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');

async function checkPlayers() {
  try {
    const { rows } = await db.query("SELECT id, first_name, last_name, photo_url FROM club_players");
    console.log("Current Players:", JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkPlayers();
