import { NextResponse } from "next/server";

const { uploadToStorage } = require("@/server/storage");

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");
    const kind = formData.get("kind");

    const uploaded = await uploadToStorage(file, {
      folder: typeof folder === "string" ? folder : "cms",
      kind: kind === "video" ? "video" : "image",
    });

    return NextResponse.json({ data: uploaded }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/uploads]", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'upload." },
      { status: 500 },
    );
  }
}
