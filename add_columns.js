require('dotenv').config({path: '.env.local'});
const db = require('./src/server/db');

async function run() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    console.log("Adding columns to player_registrations...");
    await client.query(`
      ALTER TABLE player_registrations 
      ADD COLUMN IF NOT EXISTS ordered_uniforms JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS financial_commitment_name TEXT,
      ADD COLUMN IF NOT EXISTS financial_commitment_date DATE,
      ADD COLUMN IF NOT EXISTS financial_commitment_phone TEXT,
      ADD COLUMN IF NOT EXISTS financial_commitment_signature TEXT
    `);
    await client.query("COMMIT");
    console.log("Columns added successfully!");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error adding columns:", e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
