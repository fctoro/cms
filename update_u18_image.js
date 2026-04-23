require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');

async function run() {
  try {
    // Update the U18 article with the new image
    await db.query(
      "UPDATE articles SET cover_image = '/images/articles/u18-victory.jpg' WHERE slug = 'fc-toro-u-18-remporte-tournoi-the-best'"
    );
    console.log("U18 article image updated.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
