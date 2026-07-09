import type { MediaContext } from "@/lib/media-formats";
import { validateMediaFile } from "@/lib/media-formats";

const CONTENT_URL = process.env.NEXT_PUBLIC_CONTENT_URL || "http://localhost:8003";

export interface UploadedMedia {
  url: string;
  filename: string;
  original_name: string;
  mime_type: string;
  media_type: "image" | "video" | "file";
  size_bytes: number;
  context: string;
  max_duration_sec?: number | null;
  aspect_hint?: string | null;
}

export async function uploadMedia(
  token: string,
  file: File,
  context: MediaContext
): Promise<UploadedMedia> {
  const err = await validateMediaFile(file, context);
  if (err) throw new Error(err);

  const form = new FormData();
  form.append("file", file);
  form.append("context", context);

  const res = await fetch(`${CONTENT_URL}/api/v1/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const text = await res.text();
  let json: { success?: boolean; data?: UploadedMedia; detail?: string; error?: string };
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || `Upload failed: ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(
      typeof json.detail === "string" ? json.detail : json.error || `Upload failed: ${res.status}`
    );
  }
  if (!json.success || !json.data) {
    throw new Error(json.error || "Upload failed");
  }
  return json.data;
}