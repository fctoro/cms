require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');

async function test() {
  try {
    const { rows } = await db.query("SELECT * FROM club_elite_players ORDER BY number ASC");
    console.log("Success! Data length:", rows.length);
  } catch (err) {
    console.error("Database query failed:", err.message);
  }
}

test();
