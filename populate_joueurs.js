require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');
const { v4: uuidv4 } = require('uuid');

const players = [
  { first_name: "Jean", last_name: "Pierre", position: "Attaquant", photo_url: "/images/players/591149277_18545355826012336_6701584250153829576_n.jpg", category: "U17", email: "jean.pierre@example.com" },
  { first_name: "Mikael", last_name: "Saintil", position: "Milieu", photo_url: "/images/players/558873526_18531024070012336_2541038537932974445_n.jpg", category: "U17", email: "mikael.saintil@example.com" },
  { first_name: "Nixon", last_name: "Louis", position: "Defenseur", photo_url: "/images/players/560388188_18531457003012336_702922180697776333_n.jpg", category: "U17", email: "nixon.louis@example.com" },
  { first_name: "Dylan", last_name: "Toro", position: "Ailier", photo_url: "/images/players/487859566_18496314202012336_4490722394926427967_n.jpg", category: "U15", email: "dylan.toro@example.com" },
  { first_name: "Ruben", last_name: "Alexis", position: "Capitaine", photo_url: "/images/players/636967631_18560895763012336_6262024514087135809_n.jpg", category: "U17", email: "ruben.alexis@example.com" },
  { first_name: "Aguero", last_name: "Michel", position: "Attaquant", photo_url: "/images/players/Aguero Michel.jpg.jpeg", category: "U20", email: "aguero.michel@example.com" },
  { first_name: "Angelo", last_name: "Lauré", position: "Milieu", photo_url: "/images/players/Angelo Lauré.jpg.jpeg", category: "U17", email: "angelo.laure@example.com" },
  { first_name: "Angelson", last_name: "Fils-Aimé", position: "Ailier", photo_url: "/images/players/Angelson Fils-Aimé (2).jpg.jpeg", category: "U17", email: "angelson.filsaime@example.com" },
  { first_name: "Billy", last_name: "Vilsaint", position: "Defenseur", photo_url: "/images/players/Billy Vilsaint.jpg.jpeg", category: "U17", email: "billy.vilsaint@example.com" },
  { first_name: "Dave Olivier", last_name: "Julbert", position: "Attaquant", photo_url: "/images/players/Dave Olivier Julbert.jpg.jpeg", category: "U17", email: "dave.julbert@example.com" },
  { first_name: "Meranvil", last_name: "Bill", position: "Milieu", photo_url: "/images/players/Meranvil Bill.jpg.jpeg", category: "U15", email: "meranvil.bill@example.com" },
  { first_name: "Taino Solh", last_name: "Moise", position: "Ailier", photo_url: "/images/players/Taino Solh Moise.jpg.jpeg", category: "U17", email: "taino.moise@example.com" },
  { first_name: "Louis", last_name: "Mathis", position: "Milieu", photo_url: "/images/players/Louis Mathis.jpeg", category: "U15", email: "louis.mathis@example.com" }
];

async function run() {
  try {
    for (const player of players) {
      const id = uuidv4();
      await db.query(
        `INSERT INTO club_players 
        (id, first_name, last_name, position, photo_url, category, status, registration_date) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [id, player.first_name, player.last_name, player.position, player.photo_url, player.category, 'actif']
      );
    }
    console.log(`Added ${players.length} players to the database.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
