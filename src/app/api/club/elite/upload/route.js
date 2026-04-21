import { NextResponse } from "next/server";

const { uploadToStorage } = require("@/server/storage");

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const uploaded = await uploadToStorage(file, {
      folder: "club/elite/videos",
      kind: "video",
    });

    return NextResponse.json({ data: { url: uploaded.url } }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/club/elite/upload]", err);
    return NextResponse.json({ error: "Erreur lors de l'upload: " + err.message }, { status: 500 });
  }
}
