"use client";

import { Button } from "@nexus/ui";
import { useCallback, useRef, useState } from "react";
import {
  formatFileSize,
  getMediaSpec,
  isImageUrl,
  isVideoUrl,
  resolveMediaUrl,
  type MediaContext,
} from "@/lib/media-formats";
import { uploadMedia, type UploadedMedia } from "@/lib/media-upload";

export function MediaUploader({
  context,
  token,
  label,
  onUploaded,
  onClear,
  previewUrl,
  compact,
}: {
  context: MediaContext;
  token: string;
  label?: string;
  onUploaded: (media: UploadedMedia) => void;
  onClear?: () => void;
  previewUrl?: string | null;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const spec = getMediaSpec(context);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const result = await uploadMedia(token, file, context);
        onUploaded(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [token, context, onUploaded]
  );

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const resolved = previewUrl ? resolveMediaUrl(previewUrl) : null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <input
        ref={inputRef}
        type="file"
        accept={spec.accept}
        className="hidden"
        onChange={onInput}
      />

      {resolved ? (
        <div className="relative overflow-hidden rounded-lg border border-[#2A2A2A] bg-black aspect-video max-h-48">
          {isVideoUrl(resolved) ? (
            <video src={resolved} controls playsInline className="h-full w-full object-contain" />
          ) : isImageUrl(resolved) ? (
            <img src={resolved} alt="" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#8A8A8A]">
              Media attached
            </div>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[10px] text-[#FF5252]"
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-lg border border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-[#00E5FF]/60 bg-[#00E5FF]/5"
              : "border-[#2A2A2A] hover:border-[#3A3A3A] bg-[#0A0A0A]/50"
          }`}
        >
          <p className="text-sm text-[#F5F5F5]">{label || `Upload ${spec.label}`}</p>
          <p className="text-[10px] text-[#5A5A5A] mt-1">
            {spec.extensions.join(" · ")} · max {formatFileSize(spec.maxBytes)}
          </p>
          <p className="text-[10px] text-[#7C4DFF] mt-1">{spec.platforms}</p>
          {spec.aspectHint && (
            <p className="text-[10px] text-[#5A5A5A] mt-0.5">{spec.aspectHint}</p>
          )}
          {spec.maxDurationSec && (
            <p className="text-[10px] text-[#5A5A5A]">
              Max {Math.floor(spec.maxDurationSec / 60)} min video
            </p>
          )}
        </div>
      )}

      <Button
        size="sm"
        variant="secondary"
        className="w-full"
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {resolved ? "Replace file" : "Choose file"}
      </Button>
      {error && <p className="text-[10px] text-[#FF5252]">{error}</p>}
    </div>
  );
}