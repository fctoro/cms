const db = require('../src/server/db');

async function addColumn() {
  try {
    console.log('Attempting to add "data" column to player_registration_documents...');
    await db.query(`
      ALTER TABLE player_registration_documents 
      ADD COLUMN IF NOT EXISTS data BYTEA
    `);
    console.log('SUCCESS: Column "data" added or already exists.');
  } catch (err) {
    console.error('FAILURE:', err.message);
  } finally {
    process.exit();
  }
}

addColumn();
