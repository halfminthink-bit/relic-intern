import type { EntryType } from "@/types/db";

export const TAG_GROUPS = [
  { key: "material", label: "材料", tags: ["CNT", "グラフェン", "フラーレン", "二次元材料", "その他ナノ材料"] },
  {
    key: "method",
    label: "手法",
    tags: ["合成", "精製", "分散", "分離", "評価・分析", "計算・シミュレーション", "デバイス応用"],
  },
  { key: "category", label: "区分", tags: ["実験", "理論"] },
] as const;

export type TagGroupKey = (typeof TAG_GROUPS)[number]["key"];

export const ALL_TAGS: string[] = TAG_GROUPS.flatMap((g) => [...g.tags]);

export function tagGroupOf(tag: string): TagGroupKey | null {
  return TAG_GROUPS.find((g) => (g.tags as readonly string[]).includes(tag))?.key ?? null;
}

export const ENTRY_TYPES: EntryType[] = ["memo", "trouble"];

export const ENTRY_TYPE_META: Record<EntryType, { label: string; description: string }> = {
  memo: { label: "メモ", description: "研究室内だけで見える記録" },
  trouble: { label: "相談中", description: "公開して、外部から相談を受け付けている記録" },
};


/** 画像圧縮の設定（長辺 px と WebP の品質） */
export const IMAGE_MAX_EDGE = 1200;
export const THUMBNAIL_MAX_EDGE = 400;
export const IMAGE_QUALITY = 0.7;
/** 1記録あたりの画像の上限 */
export const MAX_IMAGES_PER_ENTRY = 1;
