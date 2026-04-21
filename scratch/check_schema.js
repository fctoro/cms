const db = require('./src/server/db');

async function checkSchema() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'player_registration_documents'
    `);
    console.log('Columns in player_registration_documents:');
    res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
  } catch (err) {
    console.error('Error fetching schema:', err);
  } finally {
    process.exit();
  }
}

checkSchema();
