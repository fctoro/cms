import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");
}

function sanitizeFilename(value) {
  return String(value || "file")
    .trim()
    .replace(/[^a-zA-Z0-9.-]+/g, "_");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileName, folder, kind } = body;

    if (!fileName) {
      return NextResponse.json({ error: "fileName manquant" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuration Supabase manquante.");
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "videos";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const safeFolder = sanitizeSegment(folder || "cms");
    const safeFilename = sanitizeFilename(fileName);
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const storagePath = `${safeFolder}/${uniquePrefix}-${safeFilename}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: {
        bucket,
        path: storagePath,
        token: data.token,
        signedUrl: data.signedUrl,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("[POST /api/uploads/presign]", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la génération de l'URL signée." },
      { status: 500 }
    );
  }
}
