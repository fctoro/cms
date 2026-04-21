const db = require('../src/server/db');

async function checkTable() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'player_registration_documents'
    `);
    console.log('COLUMNS:', res.rows.map(r => r.column_name));
    
    // Check if column 'data' exists
    const hasData = res.rows.some(r => r.column_name === 'data');
    if (!hasData) {
      console.log('Column "data" is MISSING. It should be added as BYTEA.');
    } else {
      console.log('Column "data" is present.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

checkTable();
