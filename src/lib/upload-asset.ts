export async function uploadAsset(
  file: File,
  options?: { folder?: string; kind?: "image" | "video" },
) {
  const formData = new FormData();
  formData.append("file", file);

  if (options?.folder) {
    formData.append("folder", options.folder);
  }

  if (options?.kind) {
    formData.append("kind", options.kind);
  }

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Erreur upload.");
  }

  return payload.data as { url: string; path: string; bucket: string };
}
