/**
 * Client-side image compression — keeps uploads fast and avoids
 * "file too large" errors on modern phone photos (iPhone 12MP can hit
 * 8–15 MB; resized to 1920px wide JPEG 85% it lands around 400-800 KB
 * with no visible quality loss for our use case).
 *
 * Used by both the profile photo and pet photo upload flows.
 */

const MAX_DIMENSION = 1920; // longest side, in pixels
const JPEG_QUALITY = 0.85;
const PASS_THROUGH_BYTES = 800 * 1024; // skip compression if already small

export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
}

/**
 * Resize + recompress an image File. Returns a new JPEG File suitable
 * for FormData upload. If the input is already small (< 800 KB) and
 * doesn't need resizing, returns the original to avoid quality loss.
 */
export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<File> {
  const maxDim = opts.maxDimension ?? MAX_DIMENSION;
  const quality = opts.quality ?? JPEG_QUALITY;

  // Quick exit for small images that don't need resizing
  if (file.size < PASS_THROUGH_BYTES) {
    return file;
  }

  // Some browsers don't support createImageBitmap with HEIC; fall back
  // to the <img> + dataURL path. We always re-encode as JPEG.
  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = await loadImage(file);
  }

  const { width: srcW, height: srcH } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const targetW = Math.round(srcW * scale);
  const targetH = Math.round(srcH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file; // canvas unsupported — let server enforce limit

  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, targetW, targetH);
  if ('close' in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) return file;

  // If compression made it BIGGER (rare — already-optimized JPEG), keep the original
  if (blob.size >= file.size) return file;

  // Name the new file so the server sees a sensible filename
  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
