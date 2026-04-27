import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

// Inscription massive d'équipes à un championnat
export async function POST(request, { params }) {
  try {
    const { id: competitionId } = await params;
    const body = await request.json();
    const { teamIds, categoryId } = body;

    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return NextResponse.json({ error: "Liste d'équipes requise" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "ID de catégorie requis" }, { status: 400 });
    }

    // 1. Nettoyer les anciennes inscriptions pour cette catégorie spécifique
    await supabase
      .from("flagday_competition_teams")
      .delete()
      .eq("competition_id", competitionId)
      .eq("category_id", categoryId);

    // 2. Préparer les données d'insertion
    const teamsData = teamIds.map((teamId) => ({
      competition_id: competitionId,
      category_id: categoryId,
      team_id: teamId,
    }));

    // 3. Insérer les nouvelles équipes
    const { data, error } = await supabase
      .from("flagday_competition_teams")
      .insert(teamsData)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("Erreur [POST /api/tournaments/[id]/teams]:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription des équipes" },
      { status: 500 }
    );
  }
}

// Récupérer les équipes d'un championnat
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    let query = supabase
      .from("flagday_competition_teams")
      .select(
        `
        id,
        team_id,
        category_id,
        flagday_teams (
          id,
          name,
          slug,
          logo_url,
          color
        )
      `
      )
      .eq("competition_id", id);
    
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query.order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], success: true });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des équipes" },
      { status: 500 }
    );
  }
}
