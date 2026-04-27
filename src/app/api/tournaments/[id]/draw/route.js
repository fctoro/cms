import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { categoryId } = body;

    if (!categoryId) {
      return NextResponse.json({ error: "ID de catégorie requis" }, { status: 400 });
    }

    // 1. Récupérer les infos de la catégorie
    const { data: categoryData, error: catError } = await supabase
      .from("flagday_categories")
      .select("*")
      .eq("id", categoryId)
      .single();

    if (catError || !categoryData) {
      return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 });
    }

    const categoryName = categoryData.name;

    // 2. Récupérer les équipes inscrites pour CETTE catégorie
    const { data: compTeams, error: teamsError } = await supabase
      .from("flagday_competition_teams")
      .select("team_id")
      .eq("competition_id", id)
      .eq("category_id", categoryId);

    if (teamsError) throw teamsError;

    if (!compTeams || compTeams.length < 8) {
      return NextResponse.json({ 
        error: `Il faut au moins 8 équipes pour générer les poules (Actuel: ${compTeams?.length || 0})` 
      }, { status: 400 });
    }

    // Limiter à 8 si plus
    const teamsToDraw = compTeams.slice(0, 8);

    // 3. Mélanger et diviser en 2 groupes de 4
    const shuffledTeams = [...teamsToDraw].sort(() => Math.random() - 0.5);
    const groupA = shuffledTeams.slice(0, 4);
    const groupB = shuffledTeams.slice(4, 8);

    // Nettoyage des anciens tirages/matchs pour CETTE catégorie
    await supabase.from("flagday_standings").delete().eq("category_id", categoryId);
    await supabase.from("flagday_matches").delete().eq("category_id", categoryId);

    // 4. Insérer dans flagday_standings
    const standingsData = [
      ...groupA.map(t => ({ category_id: categoryId, team_id: t.team_id, group_name: 'A' })),
      ...groupB.map(t => ({ category_id: categoryId, team_id: t.team_id, group_name: 'B' }))
    ];

    const { error: standingsErr } = await supabase
      .from("flagday_standings")
      .insert(standingsData);

    if (standingsErr) throw standingsErr;

    // 5. Générer les matchs de poule (Round Robin)
    const matches = [];
    const generateMatchesForGroup = (group, groupName) => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          matches.push({
            competition_id: id,
            category_id: categoryId,
            round: `${categoryName} - Groupe ${groupName}`,
            home_team_id: group[i].team_id,
            away_team_id: group[j].team_id,
            status: 'scheduled',
            kickoff: new Date().toISOString(),
            venue: 'Terrain Principal'
          });
        }
      }
    };

    generateMatchesForGroup(groupA, 'A');
    generateMatchesForGroup(groupB, 'B');

    const { error: matchesErr } = await supabase
      .from("flagday_matches")
      .insert(matches);

    if (matchesErr) throw matchesErr;

    // 6. Mettre à jour le statut du tournoi global si nécessaire
    await supabase.from("flagday_competitions").update({ status: 'in_progress' }).eq("id", id);

    return NextResponse.json({
      success: true,
      data: {
        message: `Tirage terminé pour ${categoryName}. 2 groupes de 4 créés.`,
      }
    });
  } catch (error) {
    console.error("Erreur Tirage:", error);
    return NextResponse.json({ error: error.message || "Erreur lors du tirage au sort" }, { status: 500 });
  }
}
