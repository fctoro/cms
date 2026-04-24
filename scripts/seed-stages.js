const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.zvgqendnhealtfmohysf:Bravobravobenly123!@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });

const stageOpenings = [
  {
    slug: 'assistant-coach-u13',
    title: 'Assistant Coach U13',
    category: 'Coaching',
    type: 'Stage',
    location: 'Petion-Ville, Haiti',
    ageGroup: 'U13',
    languages: 'Creole, Francais',
    department: 'Equipe technique FC TORO',
    supervisor: 'Responsable Academie',
    startDate: '2026-06-01',
    duration: 'Stage de 3 mois',
    image: '/joueur/extracted/583167774_18542869372012336_2307311757000245016_n.jpg',
    summary: 'Accompagner les seances U13, soutenir les coachs principaux et renforcer les fondamentaux techniques des jeunes joueurs.',
    intro: 'FC TORO cherche un profil de terrain capable d accompagner le groupe U13 dans un cadre structure, exigeant et bienveillant.\nLe stage permet de vivre le quotidien du club, d observer la planification technique et de participer activement au developpement des jeunes.',
    mission: 'Ce role soutient la mise en place des exercices, la gestion du groupe et la qualite des transitions pendant les seances.\nLe stagiaire contribue aussi a la preparation des matchs, au suivi individuel et a la transmission des valeurs du club.',
    responsibilities: 'Assister le coach principal sur les seances U13 et les matchs de week-end.\nAider a l installation du materiel et au rythme des ateliers techniques.\nObserver les joueurs et remonter les points de progression au staff.\nEncourager la discipline, la ponctualite et la concentration du groupe.',
    club_life: 'Participer aux reunions techniques courtes avant et apres les seances.\nRepresenter l identite FC TORO dans les interactions avec joueurs et parents.\nContribuer aux temps forts du club pendant les tournois et activites academie.',
    profile_searched: 'Bonne base en pedagogie sportive ou en football de formation.\nCapacite a communiquer clairement avec des jeunes joueurs.\nInteret marque pour l apprentissage du coaching de terrain.\nDisponibilite sur plusieurs fins de journee et certains week-ends.'
  },
  {
    slug: 'analyste-video-performance',
    title: 'Analyste Video Performance',
    category: 'Performance',
    type: 'Stage',
    location: 'Petion-Ville, Haiti',
    ageGroup: 'Elite',
    languages: 'Creole, Francais, Anglais',
    department: 'Cellule performance FC TORO',
    supervisor: 'Coordinateur Performance',
    startDate: '2026-05-01',
    duration: 'Stage de 4 mois',
    image: '/joueur/extracted/591149277_18545355826012336_6701584250153829576_n.jpg',
    summary: 'Structurer la video match et entrainement pour aider le staff a mieux lire le jeu et accompagner la progression individuelle.',
    intro: 'Le programme Elite a besoin d un regard rigoureux sur la video pour mieux preparer les matchs et capitaliser sur les seances.\nCe stage s adresse a un profil organise, curieux et capable de transformer des observations en retours utiles.',
    mission: 'Le stagiaire aide au derush des videos, a la preparation de clips courts et a la production de sequences exploitables par le staff.\nLe role consiste aussi a ordonner l information pour rendre la lecture plus rapide et plus claire apres les matchs.',
    responsibilities: 'Classer les sequences match par phases de jeu et situations clefs.\nProduire des clips courts pour les feedbacks d equipe et les suivis individuels.\nIdentifier des tendances sur la sortie de balle, les transitions et les duels.',
    club_life: 'Echanger regulierement avec le staff technique sur les priorites video.\nParticiper a la preparation des supports de debrief et pre-match.\nMaintenir une bibliotheque video propre et facile a consulter.',
    profile_searched: 'Interet fort pour l analyse tactique et la lecture du jeu.\nAisance avec l organisation de fichiers et les outils video.\nCapacite a synthese, rigueur et confidentialite.\nConnaissance du football de formation ou competitif appreciee.'
  },
  {
    slug: 'community-manager-matchday',
    title: 'Community Manager Matchday',
    category: 'Media',
    type: 'Stage',
    location: 'Petion-Ville, Haiti',
    ageGroup: 'Club',
    languages: 'Creole, Francais',
    department: 'Media club FC TORO',
    supervisor: 'Responsable Communication',
    startDate: '2026-04-01',
    duration: 'Stage de 3 mois',
    image: '/joueur/extracted/634150827_18560832649012336_7495873752742897530_n.jpg',
    summary: 'Animer les reseaux du club pendant les seances, les matchs et les activites communautaires avec une ligne editoriale forte.',
    intro: 'FC TORO veut renforcer sa presence digitale avec un contenu plus regulier, plus propre et plus proche du terrain.\nLe stage permet de participer a la couverture des temps forts du club et a la valorisation des jeunes talents.',
    mission: 'Le stagiaire contribue a la prise de contenu, a la redaction de captions et a la publication rapide des moments importants.\nIl aide aussi a maintenir une coherence visuelle et editoriale sur les canaux du club.',
    responsibilities: 'Capturer photos, reels et stories sur les matchs et entrainements.\nRediger des textes courts, clairs et alignes avec l identite FC TORO.\nProgrammer ou publier les contenus prioritaires selon le calendrier du club.',
    club_life: 'Echanger avec le staff et les coachs pour recuperer les infos fiables.\nMettre en valeur joueurs, staff, sponsors et projets du club.\nSuivre les retours d audience et proposer des formats plus efficaces.',
    profile_searched: 'Bonne sensibilite image, video courte et narration digitale.\nCapacite a travailler vite les jours de match.\nOrthographe correcte et sens du detail.\nInteret reel pour le football, la jeunesse et l image de club.'
  },
  {
    slug: 'coordinateur-stage-vacances',
    title: 'Coordinateur Stage Vacances',
    category: 'Operations',
    type: 'Stage',
    location: 'Petion-Ville, Haiti',
    ageGroup: 'U11-U17',
    languages: 'Creole, Francais',
    department: 'Operations FC TORO',
    supervisor: 'Direction du club',
    startDate: '2026-07-01',
    duration: 'Mission saisonniere',
    image: '/joueur/extracted/542448727_18525142066012336_8843479393054800058_n.jpg',
    summary: 'Organiser les stages vacances du club avec une logistique fiable, un accueil propre et un lien fluide avec les familles.',
    intro: 'Pendant les periodes de vacances, FC TORO met en place des formats intensifs pour accelerer les acquis techniques et la vie collective.\nLe coordinateur stage accompagne la mise en route et la qualite operationnelle de ces programmes.',
    mission: 'Le role assure la fluidite entre planning, accueil, communication et execution terrain.\nIl soutient les coachs et la direction pour offrir une experience serieuse et rassurante aux familles.',
    responsibilities: 'Centraliser les listes participants, les horaires et les informations pratiques.\nCoordonner l accueil quotidien, le pointage et la circulation des groupes.\nVerifier la disponibilite du materiel, des espaces et des besoins du staff.',
    club_life: 'Repondre aux questions courantes des parents avant et pendant les stages.\nPartager les rappels utiles et les consignes logistiques.\nContribuer a une experience club claire, ponctuelle et professionnelle.',
    profile_searched: 'Bonne organisation, aisance relationnelle et sens du service.\nCapacite a gerer plusieurs priorites dans la meme journee.\nExperience en evenementiel, sport ou coordination appreciee.\nDisponibilite forte pendant la periode vacances.'
  },
  {
    slug: 'assistant-scouting-developpement',
    title: 'Assistant Scouting & Developpement',
    category: 'Scouting',
    type: 'Stage',
    location: 'Petion-Ville, Haiti',
    ageGroup: 'U15-U20',
    languages: 'Creole, Francais',
    department: 'Scouting FC TORO',
    supervisor: 'Responsable Detection',
    startDate: '2026-05-01',
    duration: 'Stage de 3 mois',
    image: '/joueur/extracted/621203459_18554581459012336_4537330016788795057_n.jpg',
    summary: 'Observer les profils, structurer les notes de terrain et aider la cellule detection a mieux suivre les potentiels du club.',
    intro: 'FC TORO veut consolider sa capacite a reperer, suivre et comprendre les profils en progression.\nCe stage s adresse a une personne attentive, rigoureuse et proche de la realite du terrain.',
    mission: 'Le stagiaire accompagne les observations en entrainement et en competition, puis structure les retours dans un format clair.\nIl aide aussi a identifier les signaux utiles pour la suite du parcours academie, Elite ou detection externe.',
    responsibilities: 'Prendre des notes de terrain sur les comportements, le rythme et la lecture du jeu.\nSuivre les profils sur plusieurs seances pour eviter les lectures trop rapides.\nMettre en avant les points forts, les axes de progression et le potentiel.',
    club_life: 'Rassembler les informations dans un format simple et exploitable.\nPartager des retours synthetiques avec le responsable detection.\nMaintenir une base de suivi propre sur les profils observes.',
    profile_searched: 'Bonne culture football et capacite d observation.\nPatience, rigueur et sens de la nuance dans l evaluation.\nAisance ecrite pour formaliser les retours.\nVolonte d apprendre les standards FC TORO en detection.'
  },
  {
    slug: 'preparateur-physique-junior',
    title: 'Preparateur Physique Junior',
    category: 'Performance',
    type: 'Stage',
    location: 'Petion-Ville, Haiti',
    ageGroup: 'Elite-U17',
    languages: 'Creole, Francais',
    department: 'Performance FC TORO',
    supervisor: 'Responsable Performance',
    startDate: '2026-05-01',
    duration: 'Stage de 4 mois',
    image: '/joueur/extracted/575274167_18540323572012336_6438757876049095178_n.jpg',
    summary: 'Soutenir les seances de preparation physique, le retour a l effort et la prevention dans un cadre de formation exigeant.',
    intro: 'La progression des joueurs passe aussi par une meilleure culture de l effort, de la recuperation et de la prevention.\nCe stage aide a structurer les routines physiques en lien avec les besoins du terrain et l age des joueurs.',
    mission: 'Le stagiaire assiste la planification physique et contribue au bon deroulement des routines avant, pendant et apres les seances.\nIl collabore avec le staff pour rendre la charge de travail plus lisible et plus adaptee au profil des groupes.',
    responsibilities: 'Assister l echauffement, les routines motrices et les activations.\nSuivre la qualite d execution et corriger les details simples.\nAider a installer les ateliers lies a la vitesse, coordination et gainage.',
    club_life: 'Reporter les observations sur la fatigue, la disponibilite et la recuperation.\nParticiper a la mise en place d habitudes de prevention et d hygiene sportive.\nContribuer a une culture performance simple, claire et applicable.',
    profile_searched: 'Base solide en preparation physique ou sciences du sport.\nCapacite a communiquer sur le terrain avec energie et clarte.\nInteret pour la formation des jeunes et la progression long terme.\nDisponibilite reguliere en semaine.'
  }
];

async function seed() {
  await client.connect();
  for (const s of stageOpenings) {
    const { rows } = await client.query('SELECT id FROM stages WHERE slug = $1', [s.slug]);
    if (rows.length === 0) {
      await client.query(`
        INSERT INTO stages (
          title, excerpt, content, cover_image, department, location, work_mode, duration, 
          supervisor, start_date, stage_type, main_group, languages, about_club, 
          about_mission, responsibilities, club_life, profile_searched, category, 
          status, slug, published_at
        ) VALUES (
          $1, $2, '', $3, $4, $5, 'hybrid', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'published', $18, NOW()
        )
      `, [
        s.title, s.summary, s.image, s.department, s.location, s.duration,
        s.supervisor, s.startDate, s.type, s.ageGroup, s.languages, s.intro,
        s.mission, s.responsibilities, s.club_life, s.profile_searched, s.category, s.slug
      ]);
      console.log('Inserted', s.slug);
    } else {
      console.log('Exists', s.slug);
    }
  }
  await client.end();
}
seed().catch(console.error);
