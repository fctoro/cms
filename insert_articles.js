require('dotenv').config({ path: '.env.local' });
const db = require('./src/server/db');
const { v4: uuidv4 } = require('uuid');

const articles = [
  {
    title_fr: "FC Toro lance « Mache sou yo », son podcast officiel",
    slug: "fc-toro-lance-mache-sou-yo-podcast-officiel",
    category: "actualite",
    content_fr: `Une nouvelle plateforme pour rapprocher joueurs, supporters et passionnés de football

Le FC Toro franchit une nouvelle étape dans sa communication en annonçant le lancement de son podcast officiel « Mache sou yo », une initiative destinée à renforcer les liens entre les joueurs, le public et tous les passionnés de football.

Pensé comme un espace d’échange et de partage, ce podcast proposera des interviews, des discussions et des contenus exclusifs, offrant une immersion au cœur du club et mettant en lumière ses principaux acteurs.

La réalisation de ce projet est assurée par Fulmoun Production, qui accompagnera le club dans la création d’un contenu dynamique, authentique et de qualité.

À travers cette initiative, le FC Toro confirme sa volonté de rester proche de sa communauté et d’innover dans sa manière de communiquer avec ses supporters.

Les premières diffusions sont attendues très prochainement.`
  },
  {
    title_fr: "FC Toro U-18 surclasse la concurrence et remporte le tournoi The Best",
    slug: "fc-toro-u-18-remporte-tournoi-the-best",
    category: "actualite",
    content_fr: `Vendredi 17, au Parc Sainte Thérèse, le FC Toro U-18 a remporté avec autorité le tournoi The Best en dominant Stars des Jeunes 2-0 en finale, concluant une campagne impressionnante marquée par la solidité, l’efficacité et une récolte complète de distinctions individuelles.

Portée par le slogan « Mache sou yo » et guidée par le thème de la saison « Devenir invincible », l’équipe U-18 du FC Toro a parfaitement illustré cette ambition en s’imposant comme la grande force du tournoi, lancé depuis décembre 2025.

Dès le début de la compétition, le FC Toro a imposé son rythme, affichant une progression constante et une mentalité conquérante, fidèle à son objectif de devenir une équipe invincible.

Lors du premier match, les jeunes Toro ont dominé Perfection sur le score de 3-1, grâce à un doublé de Fortin Kelly et un but de Junior.

Le deuxième match, face à Stars des Jeunes, s’est soldé par un match nul (0-0) dans une rencontre disputée.

En demi-finale, le FC Toro s’est imposé 1-0 contre FC Champion grâce à une réalisation de Angelo Lauré, confirmant sa solidité.

En finale, face à Stars des Jeunes, les joueurs ont fait la différence en s’imposant 2-0, avec des buts de Lexis Geralson et Angelo Lauré.

Avec un bilan de 6 buts marqués pour seulement 1 encaissé, le FC Toro U-18 termine la compétition avec une maîtrise totale, alliant rigueur défensive et efficacité offensive.

Les distinctions individuelles viennent couronner cette domination, puisque toutes les récompenses ont été remportées par des joueurs du FC Toro :
- Meilleur gardien : Barreau Dawayder
- Meilleur joueur : Jean Michael
- Meilleur buteur : Fortin Kelly

Ce sacre confirme la montée en puissance du FC Toro U-18. Match après match, l’équipe a imposé sa discipline, sa rigueur et sa détermination, affirmant clairement son statut de référence dans la compétition.`
  }
];

async function run() {
  try {
    for (const article of articles) {
      const id = uuidv4();
      await db.query(
        `INSERT INTO articles 
        (id, slug, title_fr, content_fr, category, status, published_at, author_name, cover_image) 
        VALUES ($1, $2, $3, $4, $5, 'published', NOW(), 'Admin', '/banner.png')`,
        [id, article.slug, article.title_fr, article.content_fr, article.category]
      );
    }
    console.log(`Inserted ${articles.length} articles.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
