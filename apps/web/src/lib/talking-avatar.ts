/**
 * Client-side talking-head renderer — photo + speech-driven lip sync.
 * Produces a WebM video when D-ID API is not configured.
 */

export interface TalkingAvatarResult {
  videoDataUrl: string;
  durationMs: number;
  script: string;
}

function estimateDurationMs(script: string): number {
  const words = script.trim().split(/\s+/).length;
  return Math.max(3000, Math.min(60000, words * 420 + 800));
}

function mouthOpen(elapsed: number, duration: number, script: string): number {
  const progress = elapsed / duration;
  const syllables = Math.max(8, script.replace(/[^a-zA-Z]/g, "").length / 3);
  const wave = Math.sin(progress * syllables * Math.PI * 2);
  const burst = Math.sin(elapsed * 0.012) * 0.35;
  return Math.max(0, Math.min(1, 0.25 + wave * 0.35 + burst * 0.4));
}

export async function renderTalkingAvatar(
  imageDataUrl: string,
  script: string
): Promise<TalkingAvatarResult> {
  const durationMs = estimateDurationMs(script);

  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const drawFrame = (elapsed: number) => {
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    ctx.drawImage(img, x, y, w, h);

    const open = mouthOpen(elapsed, durationMs, script);
    const mouthY = canvas.height * 0.62;
    const mouthW = 90 + open * 50;
    const mouthH = 8 + open * 42;

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(30, 20, 20, ${0.15 + open * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, mouthY, mouthW / 2, mouthH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + open * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, mouthY - mouthH * 0.15, mouthW * 0.35, mouthH * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() });
  const chunks: Blob[] = [];

  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
    recorder.onerror = () => reject(new Error("Recording failed"));
  });

  recorder.start(100);
  const start = performance.now();

  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - start;
      drawFrame(elapsed);
      if (elapsed >= durationMs) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  recorder.stop();
  const blob = await recorded;
  const videoDataUrl = await blobToDataUrl(blob);

  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(script);
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }

  return { videoDataUrl, durationMs, script };
}

function pickMimeType(): string {
  const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "video/webm";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to encode video"));
    reader.readAsDataURL(blob);
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}