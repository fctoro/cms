import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export async function POST(request, { params }) {
  try {
    const { id: competitionId } = await params;
    const body = await request.json();
    const { matchId, categoryId, homeScore, awayScore, scorers, ...metadata } = body;

    // 1. Création ou Mise à jour de score
    if (matchId) {
      // MISE À JOUR DE SCORE
      const { data: currentMatch, error: matchError } = await supabase
        .from("flagday_matches")
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: "finished",
        })
        .eq("id", matchId)
        .select()
        .single();

      if (matchError) throw matchError;

      const catId = categoryId || currentMatch.category_id;

      // 2. Enregistrer les buteurs
      if (scorers && Array.isArray(scorers)) {
        await supabase.from("flagday_match_scorers").delete().eq("match_id", matchId);
        if (scorers.length > 0) {
          await supabase.from("flagday_match_scorers").insert(
            scorers.map((s) => ({
              match_id: matchId,
              player_name: s.playerName,
              team_name: s.teamName,
              goals: s.goals || 1,
            }))
          );
        }
      }
      
      // 3. RECULCUL ET MISE À JOUR DU CLASSEMENT (STANDINGS)
      if (currentMatch.round.includes("Groupe") && catId) {
        // Récupérer tous les matchs de poule terminés pour cette catégorie
        const { data: groupMatches } = await supabase
          .from("flagday_matches")
          .select("*")
          .eq("category_id", catId)
          .eq("status", "finished")
          .ilike("round", "%Groupe%");

        // Récupérer le mapping des équipes dans les standings
        const { data: standings } = await supabase
          .from("flagday_standings")
          .select("*")
          .eq("category_id", catId);

        if (standings) {
          for (const standing of standings) {
            const teamId = standing.team_id;
            let pts = 0, played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;

            groupMatches?.forEach(m => {
              if (m.home_team_id === teamId || m.away_team_id === teamId) {
                played++;
                const isHome = m.home_team_id === teamId;
                const myScore = isHome ? m.home_score : m.away_score;
                const oppScore = isHome ? m.away_score : m.home_score;
                
                gf += myScore;
                ga += oppScore;

                if (myScore > oppScore) { pts += 3; won++; }
                else if (myScore < oppScore) { lost++; }
                else { pts += 1; drawn++; }
              }
            });

            await supabase
              .from("flagday_standings")
              .update({
                points: pts,
                played: played,
                won: won,
                drawn: drawn,
                lost: lost,
                goals_for: gf,
                goals_against: ga
              })
              .eq("id", standing.id);
          }
        }

        // 3.1 Vérifier si on doit générer la phase finale (Demi-finales)
        const { data: allGroupMatches } = await supabase
          .from("flagday_matches")
          .select("*")
          .eq("category_id", catId)
          .ilike("round", "%Groupe%");

        const allFinished = allGroupMatches?.every(m => m.status === "finished") && allGroupMatches?.length > 0;

        if (allFinished) {
          const { data: category } = await supabase.from("flagday_categories").select("name").eq("id", catId).single();
          const categoryName = category?.name || "U9";

          const teamStats = {};
          standings?.forEach(s => teamStats[s.team_id] = { id: s.team_id, group: s.group_name, pts: 0, diff: 0, gf: 0 });

          allGroupMatches.forEach(m => {
            const hId = m.home_team_id;
            const aId = m.away_team_id;
            if (teamStats[hId] && teamStats[aId]) {
              teamStats[hId].gf += m.home_score;
              teamStats[hId].diff += (m.home_score - m.away_score);
              teamStats[aId].gf += m.away_score;
              teamStats[aId].diff += (m.away_score - m.home_score);
              if (m.home_score > m.away_score) teamStats[hId].pts += 3;
              else if (m.home_score < m.away_score) teamStats[aId].pts += 3;
              else { teamStats[hId].pts += 1; teamStats[aId].pts += 1; }
            }
          });

          const sortedA = Object.values(teamStats).filter((s) => s.group === 'A').sort((a,b) => b.pts - a.pts || b.diff - a.diff || b.gf - a.gf);
          const sortedB = Object.values(teamStats).filter((s) => s.group === 'B').sort((a,b) => b.pts - a.pts || b.diff - a.diff || b.gf - a.gf);

          const { data: existingSF } = await supabase.from("flagday_matches").select("id").eq("category_id", catId).ilike("round", "%Demi-finale%");
          
          if (existingSF?.length === 0 && sortedA.length >= 2 && sortedB.length >= 2) {
            await supabase.from("flagday_matches").insert([
              { competition_id: competitionId, category_id: catId, round: `${categoryName} - Demi-finale 1`, home_team_id: sortedA[0].id, away_team_id: sortedB[1].id, status: 'scheduled', kickoff: new Date().toISOString(), venue: 'Terrain Principal' },
              { competition_id: competitionId, category_id: catId, round: `${categoryName} - Demi-finale 2`, home_team_id: sortedB[0].id, away_team_id: sortedA[1].id, status: 'scheduled', kickoff: new Date().toISOString(), venue: 'Terrain Principal' }
            ]);
          }
        }
      }

      // 4. Vérifier si on doit générer la Finale
      if (currentMatch.round.includes("Demi-finale") && catId) {
        const { data: category } = await supabase.from("flagday_categories").select("name").eq("id", catId).single();
        const categoryName = category?.name || "U9";

        const { data: allSFMatches } = await supabase
          .from("flagday_matches")
          .select("*")
          .eq("category_id", catId)
          .ilike("round", "%Demi-finale%");

        const allFinished = allSFMatches.every(m => m.status === "finished");

        if (allFinished && allSFMatches.length === 2) {
          const getWinner = (m) => m.home_score >= m.away_score ? m.home_team_id : m.away_team_id;
          const sf1 = allSFMatches.find(m => m.round.includes("1"));
          const sf2 = allSFMatches.find(m => m.round.includes("2"));

          const { data: existingFinal } = await supabase
            .from("flagday_matches")
            .select("id")
            .eq("category_id", catId)
            .ilike("round", "%Finale%")
            .not("round", "ilike", "%Demi%");

          if (existingFinal.length === 0) {
            await supabase.from("flagday_matches").insert({
              competition_id: competitionId,
              category_id: catId,
              round: `${categoryName} - Finale`,
              home_team_id: getWinner(sf1),
              away_team_id: getWinner(sf2),
              status: 'scheduled',
              kickoff: new Date().toISOString(),
              venue: 'Terrain d\'Honneur'
            });
          }
        }
      }

      return NextResponse.json({ data: currentMatch, success: true });
    } else {
      // CRÉATION MANUELLE DE MATCH
      const { data, error } = await supabase
        .from("flagday_matches")
        .insert({
          competition_id: competitionId,
          category_id: metadata.categoryId || null,
          round: metadata.round,
          kickoff: metadata.kickoff,
          home_team_id: metadata.home_team_id,
          away_team_id: metadata.away_team_id,
          venue: metadata.venue || "Terrain Principal",
          status: metadata.status || "scheduled"
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data, success: true });
    }
  } catch (error) {
    console.error("Erreur [POST /api/tournaments/[id]/matches]:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'opération sur le match" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const { matchId, ...updates } = body;

    const { data, error } = await supabase
      .from("flagday_matches")
      .update(updates)
      .eq("id", matchId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("Erreur [PATCH /api/tournaments/[id]/matches]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    const { error } = await supabase
      .from("flagday_matches")
      .delete()
      .eq("id", matchId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur [DELETE /api/tournaments/[id]/matches]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    let query = supabase
      .from("flagday_matches")
      .select(`
        *,
        home_team:home_team_id(id, name, logo_url, color),
        away_team:away_team_id(id, name, logo_url, color)
      `)
      .eq("competition_id", id);
    
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query.order("kickoff", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], success: true });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des matchs" },
      { status: 500 }
    );
  }
}
