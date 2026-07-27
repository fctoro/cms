const db = require('./src/server/db');

async function syncMissingPlayerDemandes() {
  const { rows: registrations } = await db.query(`
    SELECT *
    FROM player_registrations
    WHERE guardian_email = 'sneguerre@yahoo.fr'
    ORDER BY created_at DESC
    LIMIT 300
  `);

  for (const player of registrations) {
    const { rows: existing } = await db.query(
      `SELECT id, created_at, EXTRACT(EPOCH FROM created_at) as epoch_db, EXTRACT(EPOCH FROM $2::timestamptz) as epoch_param
       FROM site_messages
       WHERE type = 'joueur'
         AND email = $1
         AND ABS(EXTRACT(EPOCH FROM created_at) - EXTRACT(EPOCH FROM $2::timestamptz)) < 60
       LIMIT 1`,
      [player.guardian_email, player.created_at],
    );

    console.log("existing matches:", existing);
  }
}

syncMissingPlayerDemandes().then(() => process.exit(0));
