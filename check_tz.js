const db = require('./src/server/db');

(async () => {
  try {
    const { rows } = await db.query(`SHOW TIMEZONE`);
    console.log("DB TIMEZONE:", rows[0]);
    
    // Also test the parameterization
    const d = new Date('2026-07-25T13:40:49.660Z');
    const { rows: test } = await db.query(
      `SELECT EXTRACT(EPOCH FROM $1::timestamptz) as epoch_param, 
              EXTRACT(EPOCH FROM '2026-07-25 13:40:49.660+00'::timestamptz) as epoch_actual`, 
      [d]
    );
    console.log("TEST:", test[0]);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
