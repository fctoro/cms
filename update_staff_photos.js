require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');

const mappings = [
  { name: "Lucner Jean", photo: "/images/staff/C-Lucner.jpg.jpeg" },
  { name: "Patrick Bonnefil", photo: "/images/staff/patric.jpg" },
  { name: "Neil Moise", photo: "/images/staff/nill.jpg" },
  { name: "Samuel Bellevue", photo: "/images/staff/Sammuel Saint-Claire.jpg.jpeg" },
  { name: "Atoinette Anilus", photo: "/images/staff/Sheelove-2.jpg.jpeg" },
  { name: "Jessica", photo: "/images/staff/IMG_9350.jpg" },
  { name: "Benly", photo: "/images/staff/IMG_9131.jpg" },
  { name: "Louis Nico", photo: "/images/staff/M-Erns.jpg.jpeg" },
  { name: "Févilien James", photo: "/images/staff/M-Brunel.jpg.jpeg" },
  { name: "Piton", photo: "/images/staff/C Pierre Richard.jpg.jpeg" },
  { name: "piton", photo: "/images/staff/C Pierre Richard.jpg.jpeg" },
  { name: "Valdony Point Du Jour", photo: "/images/staff/IMG_9110.jpg" }
];

async function run() {
  try {
    for (const map of mappings) {
      await db.query(
        "UPDATE club_staff SET photo_url = $1 WHERE name ILIKE $2",
        [map.photo, map.name]
      );
    }
    console.log("Staff photos updated in database.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
