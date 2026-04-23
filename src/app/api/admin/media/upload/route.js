import { NextResponse } from "next/server";

const db = require("@/server/db");
const { requireAuth } = require("@/server/auth");
const { logAction } = require("@/server/logger");
const { uploadToStorage } = require("@/server/storage");

export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export async function POST(request) {
  const auth = requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("fichier");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Aucun fichier recu." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorise." },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux." }, { status: 400 });
    }

    logAction({
      user: auth.user,
      method: "POST",
      route: "/api/admin/media/upload",
    });

    const saved = await uploadToStorage(file, {
      folder: "admin/media",
      kind: file.type.startsWith("image/") ? "image" : "file",
    });

    const { rows } = await db.query(
      `INSERT INTO media (nom_fichier, url, type, uploade_par)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [file.name, saved.url, file.type, auth.user.id],
    );

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/media/upload]", err.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
