import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(request, { params }) {
  try {
    const { id: competitionId } = await params;

    // 1. Récupérer les infos du tournoi (catégorie)
    const { data: tournament } = await supabase
      .from("flagday_competitions")
      .select("age_category")
      .eq("id", competitionId)
      .single();

    const category = tournament?.age_category || "U9";

    // 2. Récupérer les groupes assignés lors du tirage
    const { data: catData } = await supabase
      .from("flagday_categories")
      .select("id")
      .eq("competition_id", competitionId)
      .eq("name", category)
      .single();

    if (!catData) return NextResponse.json({ data: {}, success: true });

    const { data: standingsMapping } = await supabase
      .from("flagday_standings")
      .select("team_id, group_name, flagday_teams:team_id(id, name, logo_url, color)")
      .eq("category_id", catData.id);

    if (!standingsMapping || standingsMapping.length === 0) {
      return NextResponse.json({ data: {}, success: true });
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
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      };
    });

    // 4. Récupérer et traiter les matchs terminés
    const { data: matches } = await supabase
      .from("flagday_matches")
      .select("*")
      .eq("competition_id", competitionId)
      .eq("status", "finished")
      .filter("round", "ilike", `%${category}%Groupe%`);

    matches?.forEach((match) => {
      const home = teamStats[match.home_team_id];
      const away = teamStats[match.away_team_id];

      if (home && away) {
        home.played += 1;
        away.played += 1;
        home.goalsFor += match.home_score || 0;
        home.goalsAgainst += match.away_score || 0;
        away.goalsFor += match.away_score || 0;
        away.goalsAgainst += match.home_score || 0;

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
      goalDifference: s.goalsFor - s.goalsAgainst
    })).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);

    return NextResponse.json({ data: { [category]: result }, success: true });
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
