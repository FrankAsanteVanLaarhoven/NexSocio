export type MediaContext = "reel" | "photo" | "shop" | "business" | "avatar";

export interface MediaFormatSpec {
  id: MediaContext;
  label: string;
  accept: string;
  extensions: string[];
  maxBytes: number;
  maxDurationSec?: number;
  aspectHint?: string;
  platforms: string;
}

export const MEDIA_SPECS: Record<MediaContext, MediaFormatSpec> = {
  reel: {
    id: "reel",
    label: "Video",
    accept: "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.m4v",
    extensions: [".mp4", ".mov", ".webm", ".m4v", ".avi"],
    maxBytes: 287 * 1024 * 1024,
    maxDurationSec: 600,
    platforms: "NexSocio Studio",
  },
  photo: {
    id: "photo",
    label: "Photo",
    accept: "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,.heic",
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"],
    maxBytes: 20 * 1024 * 1024,
    aspectHint: "1:1 · 4:5 · 9:16",
    platforms: "Instagram · Feed",
  },
  shop: {
    id: "shop",
    label: "Shop listing",
    accept:
      "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm",
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm"],
    maxBytes: 100 * 1024 * 1024,
    maxDurationSec: 180,
    aspectHint: "1:1 product · 9:16 demo",
    platforms: "Shop · Marketplace",
  },
  business: {
    id: "business",
    label: "Business promo",
    accept:
      "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm",
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm"],
    maxBytes: 100 * 1024 * 1024,
    maxDurationSec: 300,
    aspectHint: "16:9 or 9:16",
    platforms: "Business profile · Ads",
  },
  avatar: {
    id: "avatar",
    label: "Profile photo",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxBytes: 10 * 1024 * 1024,
    aspectHint: "1:1 square",
    platforms: "Profile",
  },
};

export function getMediaSpec(context: MediaContext): MediaFormatSpec {
  return MEDIA_SPECS[context];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateFile(file: File, context: MediaContext): string | null {
  const spec = getMediaSpec(context);
  const name = file.name.toLowerCase();
  const extOk = spec.extensions.some((e) => name.endsWith(e));
  const mimeOk = !file.type || spec.accept.includes(file.type) || extOk;
  if (!extOk && !mimeOk) {
    return `Use ${spec.extensions.join(", ")} (${spec.platforms})`;
  }
  if (file.size > spec.maxBytes) {
    return `Max size ${formatFileSize(spec.maxBytes)} for ${spec.label}`;
  }
  return null;
}

export async function getVideoDurationSec(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video"));
    };
    video.src = url;
  });
}

export async function validateMediaFile(
  file: File,
  context: MediaContext
): Promise<string | null> {
  const basic = validateFile(file, context);
  if (basic) return basic;
  const spec = getMediaSpec(context);
  if (spec.maxDurationSec && file.type.startsWith("video/")) {
    try {
      const dur = await getVideoDurationSec(file);
      if (dur > spec.maxDurationSec) {
        const mins = Math.floor(spec.maxDurationSec / 60);
        return `Video too long. Max ${mins} minutes for ${spec.label}`;
      }
    } catch {
      return "Could not validate video duration";
    }
  }
  return null;
}

export function isVideoUrl(url: string): boolean {
  return (
    url.startsWith("data:video") ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) ||
    url.includes("/media/files/") && /\.(mp4|webm|mov)/i.test(url)
  );
}

export function isImageUrl(url: string): boolean {
  return (
    url.startsWith("data:image") ||
    /\.(jpe?g|png|webp|gif|heic)(\?|$)/i.test(url)
  );
}

export function resolveMediaUrl(url: string): string {
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const base = process.env.NEXT_PUBLIC_CONTENT_URL || "http://localhost:8003";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}