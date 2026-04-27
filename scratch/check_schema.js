const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.zvgqendnhealtfmohysf:Bravobravobenly123!@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });

async function checkSchema() {
  try {
    await client.connect();
    
    const tables = ['flagday_matches', 'flagday_match_scorers', 'flagday_categories'];
    for (const table of tables) {
      console.log(`--- Colonnes de ${table} ---`);
      const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
      console.table(res.rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkSchema();
