require('dotenv').config({path: '.env.local'});
const db = require('./src/server/db');
async function run() {
  const { rows } = await db.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'player_registrations'");
  console.log(rows);
}
run();
