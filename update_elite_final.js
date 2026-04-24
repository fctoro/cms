require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');

const players = [
  { no: "1", nom: "Pierre", prenom: "Wendy", poste: "GK", club: "Fc Flambo", poids: "58KG", hauteur: "1M5", photo: "/elite/photos/Pierre-Paul-Brod-Sebastien - Modifié.png", video: "" },
  { no: "2", nom: "Traine", prenom: "Johnlove", poste: "Ailier", club: "Star des Jeunes", poids: "63kg", hauteur: "1M45", photo: "/elite/photos/Jhon-Love-Estime - Modifié.png", video: "" },
  { no: "3", nom: "LAURE", prenom: "Angelo", poste: "Aillier Attaquant", club: "FC TORO", poids: "1M40", hauteur: "1M45", photo: "/elite/photos/Angelo Lauré.jpg.jpeg", video: "" },
  { no: "4", nom: "Meranvil", prenom: "Bill", poste: "Milieu Defensif", club: "Fc Toro", poids: "59KG", hauteur: "1M30", photo: "/elite/photos/Méranvil-Bill - Modifié.png", video: "/elite/videos/BILL MERANVIL #6.MP4" },
  { no: "5", nom: "Paul", prenom: "Jefferson", poste: "Lateral Gauche", club: "Abinadi", poids: "62KG", hauteur: "1M50", photo: "/elite/photos/Paul-Jefferson - Modifié.png", video: "/elite/videos/PAUL JEFFERSON #12 LATERALE GAUCHE.MP4" },
  { no: "6", nom: "Andre", prenom: "Ralpholdy", poste: "Lateral Droit", club: "Violette", poids: "62KG", hauteur: "1M69", photo: "/elite/photos/André-Rayoholdy - Modifié.png", video: "/elite/videos/ANDRE RAYOHOLDY #5.MP4" },
  { no: "7", nom: "Joseph", prenom: "Jean Wood", poste: "Defenseur Central", club: "Fc Toro", poids: "65KG", hauteur: "1M50", photo: "/elite/photos/Joseph-Jean-Wood - Modifié.png", video: "/elite/videos/JOSEPH JEAN WOOD #14.MP4" },
  { no: "8", nom: "Orelus", prenom: "Andy", poste: "Milieu", club: "Fc Flambo", poids: "66KG", hauteur: "1M48", photo: "/elite/photos/Orelus-Andy - Modifié.png", video: "" },
  { no: "9", nom: "Jacquet", prenom: "Fegens", poste: "GK", club: "Racing Fc", poids: "79KG", hauteur: "1M60", photo: "/elite/photos/Jacquet-Feguens - Modifié.png", video: "/elite/videos/JACQUET FEGUENS #1.MP4" },
  { no: "10", nom: "Sanon", prenom: "Christopher", poste: "GK", club: "ANAC", poids: "78KG", hauteur: "1M68", photo: "/elite/photos/Samon-Christopher - Modifié.png", video: "" }
];

async function run() {
  try {
    await db.query("DELETE FROM club_elite_players");
    for (const row of players) {
       await db.query(
          `INSERT INTO club_elite_players 
            (number, first_name, last_name, position, club, weight, height, photo_url, video_url) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
           [
              row.no,
              row.prenom, 
              row.nom, 
              row.poste,
              row.club,
              row.poids,
              row.hauteur,
              row.photo,
              row.video
            ]
        );
    }
    console.log("Elite database updated with corrected photo paths.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
