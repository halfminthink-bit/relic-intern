/**
 * ブラウザ（localStorage）に保存しているモック用データのキー。
 * データの形を変えたときや、古いデータを確実に消したいときは版を上げる。
 * 現在のキー以外の "labtrail:" で始まるデータは、起動時にすべて削除する。
 */
export const STORAGE_KEYS = {
  db: "labtrail:mock-db:v5",
  session: "labtrail:mock-session:v3",
  lastTheme: "labtrail:last-theme:v2",
} as const;

const PREFIX = "labtrail:";

export function purgeLegacyStorage() {
  try {
    const keep = new Set<string>(Object.values(STORAGE_KEYS));
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX) && !keep.has(key)) stale.push(key);
    }
    stale.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* localStorage が使えない環境では何もしない */
  }
}
