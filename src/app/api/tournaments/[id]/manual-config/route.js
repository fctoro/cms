import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export async function POST(request, { params }) {
  try {
    const { id: tournamentId } = await params;
    const body = await request.json();
    const { categoryId, groups, matches } = body;

    if (!categoryId || !groups || !matches) {
      return NextResponse.json({ error: "Données manquantes (categoryId, groups ou matches)" }, { status: 400 });
    }

    // 1. Récupérer les infos de la catégorie pour le nom
    const { data: categoryData, error: catError } = await supabase
      .from("flagday_categories")
      .select("name")
      .eq("id", categoryId)
      .single();

    if (catError || !categoryData) {
      return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 });
    }

    const categoryName = categoryData.name;

    // 2. Nettoyage des anciens standings/matchs pour CETTE catégorie (si déjà existants)
    await supabase.from("flagday_standings").delete().eq("category_id", categoryId);
    await supabase.from("flagday_matches").delete().eq("category_id", categoryId);

    // 3. Insérer les standings (groupes)
    const standingsData = groups.map(g => ({
      category_id: categoryId,
      team_id: g.teamId,
      group_name: g.groupName
    }));

    const { error: standingsErr } = await supabase
      .from("flagday_standings")
      .insert(standingsData);

    if (standingsErr) throw standingsErr;

    // 4. Insérer les matchs
    const matchesData = matches.map(m => ({
      competition_id: tournamentId,
      category_id: categoryId,
      round: `${categoryName} - Groupe ${m.group}`,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      status: 'scheduled',
      kickoff: new Date(m.kickoff).toISOString(),
      venue: m.venue || 'Terrain Principal'
    }));

    const { error: matchesErr } = await supabase
      .from("flagday_matches")
      .insert(matchesData);

    if (matchesErr) throw matchesErr;

    // 5. Mettre à jour le statut du tournoi global
    await supabase.from("flagday_competitions").update({ status: 'in_progress' }).eq("id", tournamentId);

    return NextResponse.json({
      success: true,
      message: "Configuration manuelle enregistrée avec succès"
    });

  } catch (error) {
    console.error("Erreur Manual Config:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de la configuration manuelle" }, { status: 500 });
  }
}
