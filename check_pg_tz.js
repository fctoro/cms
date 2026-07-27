const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  // Set local timezone to EST (-04:00)
  process.env.TZ = 'America/Port-au-Prince';

  const d = new Date('2026-07-25T13:40:49.660Z');
  console.log("JS DATE:", d);

  try {
    const { rows } = await client.query(
      `SELECT $1::timestamptz as test_tz, $1::text as test_text`, 
      [d]
    );
    console.log("PG PARSED:", rows[0]);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
})();
