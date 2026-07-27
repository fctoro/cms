const db = require('./src/server/db');
(async () => {
  const { rows: msgRows } = await db.query('SELECT id, email, created_at FROM site_messages WHERE type = $1 ORDER BY created_at DESC LIMIT 5', ['joueur']);
  for (const msg of msgRows) {
    console.log('--- Message ID:', msg.id, msg.email);
    const { email, created_at } = msg;
    const { rows: regRows } = await db.query(
      `SELECT id, guardian_email, created_at FROM player_registrations 
       WHERE guardian_email = $1 
       ORDER BY ABS(EXTRACT(EPOCH FROM created_at) - EXTRACT(EPOCH FROM $2::timestamptz)) ASC 
       LIMIT 1`,
      [email, created_at]
    );
    if (regRows.length > 0) {
      console.log('  Found registration:', regRows[0].id);
      const { rows: docRows } = await db.query('SELECT * FROM player_registration_documents WHERE registration_id = $1', [regRows[0].id]);
      console.log('  Found documents:', docRows.length);
      for (const d of docRows) {
        console.log('   - doc:', d.doc_key, 'path:', d.path);
      }
    } else {
      console.log('  No registration found');
    }
  }
  process.exit(0);
})().catch(console.error);
