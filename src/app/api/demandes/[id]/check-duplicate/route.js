import { NextResponse } from "next/server";
const db = require("@/server/db");
export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    }

    // Fetch the site_message
    const { rows: msgRows } = await db.query(
      "SELECT payload, type FROM site_messages WHERE id = $1",
      [id]
    );

    if (msgRows.length === 0) {
      return NextResponse.json({ error: "Message non trouve." }, { status: 404 });
    }

    const msg = msgRows[0];
    if (msg.type !== "joueur") {
      // Not a player registration, no duplicate check needed
      return NextResponse.json({ isDuplicate: false });
    }

    let payload = msg.payload;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch(e) {}
    }

    const firstName = payload.child_first_name?.trim();
    const lastName = payload.child_last_name?.trim();
    // Some basic normalization (lowercase, remove spaces) for better matching
    if (!firstName || !lastName) {
       return NextResponse.json({ isDuplicate: false });
    }

    const normalizedFirst = firstName.toLowerCase();
    const normalizedLast = lastName.toLowerCase();

    // Check in club_players
    const { rows: clubRows } = await db.query(
      `SELECT id, first_name, last_name, birth_date 
       FROM club_players 
       WHERE LOWER(first_name) = $1 AND LOWER(last_name) = $2`,
      [normalizedFirst, normalizedLast]
    );

    if (clubRows.length > 0) {
      return NextResponse.json({
        isDuplicate: true,
        source: "club_players",
        player: clubRows[0]
      });
    }

    // Check in player_registrations (ignoring the one associated with this message)
    // To do this reliably, we just check if any registration exists that is NOT this exact one
    // But since we just want to warn the admin, any older registration with the same name is a duplicate flag.
    const { rows: regRows } = await db.query(
      `SELECT id, child_first_name, child_last_name, child_birth_date, created_at 
       FROM player_registrations 
       WHERE LOWER(child_first_name) = $1 AND LOWER(child_last_name) = $2
       ORDER BY created_at DESC`,
      [normalizedFirst, normalizedLast]
    );

    // If we find registrations, we want to warn if there's more than 1 (meaning an older one exists)
    // Or if there's exactly 1, but its created_at doesn't match this message's roughly?
    // Actually, when a message is created, 1 player_registration is created at the exact same time.
    // So if regRows.length > 1, there is a duplicate.
    if (regRows.length > 1) {
      return NextResponse.json({
        isDuplicate: true,
        source: "player_registrations",
        player: regRows[1] // The older one
      });
    }

    return NextResponse.json({ isDuplicate: false });

  } catch (error) {
    console.error("[GET /api/demandes/[id]/check-duplicate]", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
