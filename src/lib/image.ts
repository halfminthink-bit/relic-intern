import { IMAGE_MAX_EDGE, THUMBNAIL_MAX_EDGE } from "@/lib/constants";

/**
 * アップロード前にブラウザ側で画像を縮小・再圧縮する。
 * 長辺 1600px の本画像と、一覧用の長辺 400px サムネイルを JPEG で作る。
 */
export async function compressImage(file: File): Promise<{ blob: Blob; thumbnail: Blob; name: string; width: number; height: number }> {
  const bitmap = await loadImage(file);
  const main = await resize(bitmap, IMAGE_MAX_EDGE, 0.82);
  const thumb = await resize(bitmap, THUMBNAIL_MAX_EDGE, 0.75);
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return { blob: main.blob, thumbnail: thumb.blob, name, width: main.width, height: main.height };
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      // EXIF の向きを反映（スマホで撮った写真が横倒しにならないように）
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* フォールバック */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function resize(source: ImageBitmap | HTMLImageElement, maxEdge: number, quality: number) {
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
  return new Promise<{ blob: Blob; width: number; height: number }>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve({ blob, width, height }) : reject(new Error("画像の圧縮に失敗しました"))), "image/jpeg", quality),
  );
}

export function formatBytes(bytes?: number) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
