import { NextResponse } from "next/server";
const db = require("@/server/db");
export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    }

    const { rows: msgRows } = await db.query(
      "SELECT email, created_at FROM site_messages WHERE id = $1",
      [id]
    );

    if (msgRows.length === 0) {
      return NextResponse.json({ error: "Message non trouve." }, { status: 404 });
    }

    const { email, created_at } = msgRows[0];

    const { rows: regRows } = await db.query(
      `SELECT * FROM player_registrations
       WHERE guardian_email = $1
       ORDER BY ABS(EXTRACT(EPOCH FROM created_at) - EXTRACT(EPOCH FROM $2::timestamptz)) ASC
       LIMIT 1`,
      [email, created_at]
    );

    if (regRows.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    const reg = regRows[0];

    const { rows: docRows } = await db.query(
      "SELECT * FROM player_registration_documents WHERE registration_id = $1",
      [reg.id]
    );

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "videos";
    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || "http://localhost:3001";

    const documents = docRows.map((doc) => {
      let url = "";
      const pathStr = doc.path;

      if (pathStr.startsWith("http://") || pathStr.startsWith("https://")) {
        url = pathStr;
      } else if (pathStr.startsWith("documents/")) {
        url = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${pathStr.replace(/^\/+/, "")}`;
      } else {
        url = `${frontendUrl.replace(/\/$/, "")}/${pathStr.replace(/^\/+/, "")}`;
      }

      // Prettify the doc_key for the UI
      let label = doc.doc_key.replace(/_/g, " ").toUpperCase();
      if (doc.doc_key === "document_photo_id") label = "PHOTO D'IDENTITÉ";
      if (doc.doc_key === "document_birth_certificate") label = "ACTE DE NAISSANCE";
      if (doc.doc_key === "document_parent_id") label = "PIÈCE D'IDENTITÉ DU PARENT";

      return {
        id: doc.id,
        key: doc.doc_key,
        label: label,
        filename: doc.filename,
        url: url
      };
    });

    return NextResponse.json({ documents });

  } catch (error) {
    console.error("[GET /api/demandes/[id]/documents]", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
