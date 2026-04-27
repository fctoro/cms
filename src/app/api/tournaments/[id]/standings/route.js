import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export async function GET(request, { params }) {
  try {
    const { id: competitionId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json({ error: "ID de catégorie requis" }, { status: 400 });
    }

    // 1. Récupérer les infos de la catégorie
    const { data: categoryData } = await supabase
      .from("flagday_categories")
      .select("name")
      .eq("id", categoryId)
      .single();

    const categoryName = categoryData?.name || "U9";

    // 2. Récupérer les groupes assignés lors du tirage
    const { data: standingsMapping } = await supabase
      .from("flagday_standings")
      .select("team_id, group_name, flagday_teams:team_id(id, name, logo_url, color)")
      .eq("category_id", categoryId);

    if (!standingsMapping || standingsMapping.length === 0) {
      return NextResponse.json({ data: { [categoryName]: [] }, success: true });
    }

    // 3. Initialiser les stats
    const teamStats = {};
    standingsMapping.forEach(s => {
      const team = s.flagday_teams;
      teamStats[s.team_id] = {
        teamId: s.team_id,
        teamName: team.name,
        teamLogo: team.logo_url,
        teamColor: team.color,
        groupName: s.group_name,
        points: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goalDifference: 0,
      };
    });

    // 4. Récupérer et traiter les matchs terminés pour CETTE catégorie
    const { data: matches } = await supabase
      .from("flagday_matches")
      .select("*")
      .eq("category_id", categoryId)
      .eq("status", "finished")
      .ilike("round", "%Groupe%");

    matches?.forEach((match) => {
      const home = teamStats[match.home_team_id];
      const away = teamStats[match.away_team_id];

      if (home && away) {
        home.played += 1;
        away.played += 1;
        home.goals_for += match.home_score || 0;
        home.goals_against += match.away_score || 0;
        away.goals_for += match.away_score || 0;
        away.goals_against += match.home_score || 0;

        if (match.home_score > match.away_score) {
          home.won += 1;
          home.points += 3;
          away.lost += 1;
        } else if (match.home_score < match.away_score) {
          away.won += 1;
          away.points += 3;
          home.lost += 1;
        } else {
          home.drawn += 1;
          away.drawn += 1;
          home.points += 1;
          away.points += 1;
        }
      }
    });

    // 5. Calculer la différence de buts et trier
    const result = Object.values(teamStats).map(s => ({
      ...s,
      goalDifference: s.goals_for - s.goals_against
    })).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goals_for - a.goals_for);

    return NextResponse.json({ data: { [categoryName]: result }, success: true });
  } catch (error) {
    console.error("Erreur standings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: competitionId } = await params;
    const { teamId, groupName, categoryId } = await request.json();

    if (!teamId || !groupName || !categoryId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // On récupère d'abord pour voir si ça existe déjà (car pas de contrainte unique garantie dans le schema.sql)
    const { data: existing } = await supabase
      .from("flagday_standings")
      .select("id")
      .eq("category_id", categoryId)
      .eq("team_id", teamId)
      .single();
    
    if (existing) {
      await supabase.from("flagday_standings").update({ group_name: groupName }).eq("id", existing.id);
    } else {
      await supabase.from("flagday_standings").insert({ category_id: categoryId, team_id: teamId, group_name: groupName });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur [POST /api/tournaments/[id]/standings]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    const categoryId = searchParams.get("categoryId");

    const { error } = await supabase
      .from("flagday_standings")
      .delete()
      .eq("category_id", categoryId)
      .eq("team_id", teamId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur [DELETE /api/tournaments/[id]/standings]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
