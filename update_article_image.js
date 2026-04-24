require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');

async function run() {
  try {
    // Update the Podcast article with the new image
    await db.query(
      "UPDATE articles SET cover_image = '/images/articles/mache-sou-yo-podcast.png' WHERE slug = 'fc-toro-lance-mache-sou-yo-podcast-officiel'"
    );
    console.log("Podcast article image updated.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
