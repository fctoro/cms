const { createClient } = require("@supabase/supabase-js");

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 150 * 1024 * 1024;

function getStorageConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase storage configuration is missing.");
  }

  return {
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "videos",
    client: createClient(supabaseUrl, supabaseKey),
  };
}

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

async function uploadToStorage(file, options = {}) {
  if (!file || typeof file === "string") {
    throw new Error("Aucun fichier recu.");
  }

  const kind =
    options.kind === "video" ? "video" : options.kind === "file" ? "file" : "image";
  const folder = sanitizeSegment(options.folder || "cms");

  if (kind === "image" && !String(file.type || "").startsWith("image/")) {
    throw new Error("Type de fichier image non autorise.");
  }

  if (kind === "video" && !String(file.type || "").startsWith("video/")) {
    throw new Error("Type de fichier video non autorise.");
  }

  const sizeLimit = kind === "video" ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (file.size > sizeLimit) {
    throw new Error("Fichier trop volumineux.");
  }

  const { client, bucket } = getStorageConfig();
  const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const safeFilename = sanitizeFilename(file.name);
  const storagePath = `${folder}/${uniquePrefix}-${safeFilename}`;
  const bytes = await file.arrayBuffer();

  const { error } = await client.storage
    .from(bucket)
    .upload(storagePath, Buffer.from(bytes), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from(bucket).getPublicUrl(storagePath);

  return {
    bucket,
    path: storagePath,
    url: data.publicUrl,
  };
}

module.exports = {
  uploadToStorage,
};
