require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');

async function run() {
  try {
    // Update all 3 articles with local images for testing
    await db.query(
      "UPDATE articles SET cover_image = '/images/podcast.png' WHERE slug = 'fc-toro-lance-mache-sou-yo-podcast-officiel'"
    );
    await db.query(
      "UPDATE articles SET cover_image = '/images/u18.jpg' WHERE slug = 'fc-toro-u-18-remporte-tournoi-the-best'"
    );
    await db.query(
      "UPDATE articles SET cover_image = '/images/u18.jpg' WHERE slug = 'fc-toro-u-18-tournoi-the-best'"
    );
    console.log("Database updated for all 3 articles.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
