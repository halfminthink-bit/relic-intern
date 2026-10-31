import { IMAGE_MAX_EDGE, IMAGE_QUALITY, THUMBNAIL_MAX_EDGE } from "@/lib/constants";

export interface CompressedImage {
  blob: Blob;
  thumbnail: Blob;
  name: string;
  width: number;
  height: number;
}

/**
 * アップロード前にブラウザ側で画像を縮小・再圧縮する。
 * - 本画像: 長辺 1200px / サムネイル: 長辺 400px
 * - 形式は WebP（品質 0.7）。WebP を書き出せないブラウザ（古い Safari）では JPEG にする
 * - canvas で描き直して書き出すため、撮影位置などの EXIF 情報はすべて消える
 *   （向きだけは描画前に反映するので、スマホ写真が横倒しにならない）
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const source = await loadImage(file);
  const main = await resize(source, IMAGE_MAX_EDGE, IMAGE_QUALITY);
  const thumb = await resize(source, THUMBNAIL_MAX_EDGE, IMAGE_QUALITY);
  if ("close" in source) source.close();
  const ext = main.blob.type === "image/webp" ? "webp" : "jpg";
  const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
  return { blob: main.blob, thumbnail: thumb.blob, name, width: main.width, height: main.height };
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* HEIC など createImageBitmap が読めない形式は <img> で試す */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("画像を読み込めませんでした"));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function resize(source: ImageBitmap | HTMLImageElement, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  let blob = await toBlob(canvas, "image/webp", quality);
  // WebP 非対応だと PNG が返ってくるので JPEG に切り替える
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
  if (!blob) throw new Error("画像の圧縮に失敗しました");
  return { blob, width, height };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export function formatBytes(bytes?: number) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
