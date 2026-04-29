import { createClient } from "@supabase/supabase-js";

export async function uploadAsset(
  file: File,
  options?: { folder?: string; kind?: "image" | "video" },
) {
  // 1. Get presigned URL to bypass Vercel 4.5MB serverless limit
  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      folder: options?.folder,
      kind: options?.kind,
    }),
  });

  const presignPayload = await presignRes.json();
  if (!presignRes.ok) {
    throw new Error(presignPayload.error || "Erreur lors de la génération de l'URL d'upload.");
  }

  const { bucket, path, token } = presignPayload.data;

  // 2. Upload directly to Supabase from the client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Just used to initialize the client, the actual token is used for upload
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file);

  if (error) {
    throw new Error("Erreur lors de l'upload direct vers Supabase.");
  }

  // 3. Get the public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    url: data.publicUrl,
    path: path,
    bucket: bucket,
  };
}
