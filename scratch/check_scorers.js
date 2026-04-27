const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.zvgqendnhealtfmohysf:Bravobravobenly123!@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });

async function checkScorers() {
  try {
    await client.connect();
    
    console.log("--- Buteurs par match et catégorie ---");
    const query = `
      SELECT 
        c.name as competition,
        cat.name as categorie,
        m.id as match_id,
        m.home_team_id,
        m.away_team_id,
        s.player_name,
        s.goals_count
      FROM flagday_match_scorers s
      JOIN flagday_matches m ON s.match_id = m.id
      JOIN flagday_categories cat ON m.category_id = cat.id
      JOIN flagday_competitions c ON cat.competition_id = c.id
      ORDER BY c.name, cat.name, m.id;
    `;
    
    const res = await client.query(query);
    console.table(res.rows);
    
    if (res.rows.length === 0) {
      console.log("Aucun buteur trouvé dans flagday_match_scorers.");
      // Check if they are in another table?
      const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'flagday_%'");
      console.log("Tables Flag Day existantes:", tables.rows.map(r => r.table_name));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkScorers();
