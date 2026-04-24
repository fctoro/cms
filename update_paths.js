require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');

async function run() {
  try {
    await db.query(
      "UPDATE articles SET cover_image = '/images/articles/podcast.png' WHERE slug = 'fc-toro-lance-mache-sou-yo-podcast-officiel'"
    );
    await db.query(
      "UPDATE articles SET cover_image = '/images/articles/u18.jpg' WHERE slug = 'fc-toro-u-18-remporte-tournoi-the-best'"
    );
    console.log("Database updated with new image paths.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
