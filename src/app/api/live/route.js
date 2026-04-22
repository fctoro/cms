import { NextResponse } from "next/server";
const db = require("@/server/db");
import { v4 as uuidv4 } from 'uuid';
export const runtime = "nodejs";

export async function GET() {
  try {
    const { rows } = await db.query(
      `SELECT 
        e.*, 
        CASE WHEN ht.id IS NOT NULL THEN json_build_object('name', ht.name, 'logo_url', ht.logo_url) ELSE NULL END as home_team,
        CASE WHEN at.id IS NOT NULL THEN json_build_object('name', at.name, 'logo_url', at.logo_url) ELSE NULL END as away_team
       FROM club_events e
       LEFT JOIN flagday_teams ht on ht.id = e.home_team_id
       LEFT JOIN flagday_teams at on at.id = e.away_team_id
       WHERE e.type = 'live_diffusion'
       LIMIT 1`
    );
    return NextResponse.json({ data: rows[0] || null });
  } catch (error) {
    console.error("[GET /api/live]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request) {
  const client = await db.connect();
  try {
    const row = await request.json();

    const eventDate = row.event_date ? new Date(row.event_date).toISOString() : new Date().toISOString();

    await client.query("BEGIN");
    
    // On efface l'ancien event live s'il en existe un (ou on en garde qu'un seul par conception)
    await client.query("DELETE FROM club_events WHERE type = 'live_diffusion'");
    
    // On insère le nouveau
    const newId = uuidv4();
    await client.query(
      `INSERT INTO club_events (
        id, title, event_date, location, type, youtube_url, home_team_id, away_team_id, home_score, away_score
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        newId,
        row.title || "Live Diffusion",
        eventDate,
        row.location || "Stade FC TORO",
        "live_diffusion",
        row.youtube_url || null,
        row.home_team_id || null,
        row.away_team_id || null,
        row.home_score !== undefined && row.home_score !== '' ? parseInt(row.home_score, 10) : null,
        row.away_score !== undefined && row.away_score !== '' ? parseInt(row.away_score, 10) : null,
      ],
    );

    await client.query("COMMIT");
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[POST /api/live]", err.message);
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === "development" ? err.message : "Erreur création live.",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
