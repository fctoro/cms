import { NextResponse } from "next/server";

const db = require("@/server/db");
export const runtime = "nodejs";

async function syncMissingPlayerDemandes() {
  const { rows: registrations } = await db.query(`
    SELECT *
    FROM player_registrations
    ORDER BY created_at DESC
    LIMIT 300
  `);

  for (const player of registrations) {
    const { rows: existing } = await db.query(
      `SELECT id
       FROM site_messages
       WHERE type = 'joueur'
         AND email = $1
         AND created_at = $2
       LIMIT 1`,
      [player.guardian_email, player.created_at],
    );

    if (existing.length > 0) {
      continue;
    }

    const payload = {
      program: player.program,
      child_first_name: player.child_first_name,
      child_last_name: player.child_last_name,
      child_birth_date: player.child_birth_date,
      child_gender: player.child_gender,
      child_address: player.child_address,
      child_school: player.child_school,
      child_soccer_experience: player.child_soccer_experience,
      guardian_name: player.guardian_name,
      guardian_email: player.guardian_email,
      guardian_phone: player.guardian_phone,
      guardian_address: player.guardian_address,
      emergency_name: player.emergency_name,
      emergency_relation: player.emergency_relation,
      emergency_phone: player.emergency_phone,
      emergency_email: player.emergency_email,
      emergency_address: player.emergency_address,
      uniform_top_size: player.uniform_top_size,
      uniform_short_size: player.uniform_short_size,
      preferred_numbers: player.preferred_numbers,
      payment_plan: player.payment_plan,
      payment_method: player.payment_method,
      signature_name: player.signature_name,
      consents: player.consents,
      _synced_from_registration: true,
    };

    await db.query(
      `INSERT INTO site_messages (type, name, email, phone, message, payload, created_at, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        "joueur",
        `${player.guardian_name} (Enfant: ${player.child_first_name} ${player.child_last_name})`,
        player.guardian_email,
        player.guardian_phone,
        `Nouvelle inscription Joueur confirmee pour le programme ${player.program}.`,
        JSON.stringify(payload),
        player.created_at,
        false,
      ],
    );
  }
}

export async function GET() {
  try {
    await syncMissingPlayerDemandes();

    const { rows } = await db.query(
      "SELECT * FROM site_messages ORDER BY created_at DESC LIMIT 200",
    );

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[GET /api/demandes]", err.message);
    return NextResponse.json(
      { error: "Erreur lecture demandes." },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const id = body.id;
    const is_read = body.is_read;
    const status = body.status;
    const payload = body.payload;

    if (!id) {
      return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    }

    const queryParts = [];
    const params = [];
    let paramIndex = 1;

    if (is_read !== undefined) {
      queryParts.push(`is_read = $${paramIndex++}`);
      params.push(is_read);
    }

    if (status !== undefined) {
      queryParts.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (payload !== undefined) {
      queryParts.push(`payload = $${paramIndex++}`);
      params.push(typeof payload === "string" ? payload : JSON.stringify(payload));
    }

    if (queryParts.length === 0) {
      return NextResponse.json({ error: "Rien a mettre a jour." }, { status: 400 });
    }

    const query = `UPDATE site_messages SET ${queryParts.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const { rows } = await db.query(query, params);

    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error("[PUT /api/demandes]", err.message);
    return NextResponse.json({ error: "Erreur mise a jour demande." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    }

    await db.query("DELETE FROM site_messages WHERE id = $1", [id]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/demandes]", err.message);
    return NextResponse.json({ error: "Erreur suppression demande." }, { status: 500 });
  }
}
