require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');

async function testGet() {
  try {
    const { rows } = await db.query("SELECT * FROM club_elite_players ORDER BY number ASC");
    console.log("SUCCESS. Rows found:", rows.length);
    console.log("First row sample:", rows[0]);
  } catch (err) {
    console.error("FAILED. Error message:", err.message);
    console.error("Stack:", err.stack);
  } finally {
    process.exit(0);
  }
}

testGet();
