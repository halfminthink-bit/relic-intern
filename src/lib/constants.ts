import type { EntryType, ThemeVisibility } from "@/types/db";

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

export const ENTRY_TYPES: EntryType[] = ["progress", "trouble", "achievement", "memo"];

export const ENTRY_TYPE_META: Record<
  EntryType,
  { label: string; description: string; defaultPublic: boolean }
> = {
  progress: { label: "進捗", description: "今日やったこと・結果", defaultPublic: false },
  trouble: { label: "困りごと", description: "うまくいかない・相談したい", defaultPublic: true },
  achievement: { label: "達成", description: "できた・わかった", defaultPublic: true },
  memo: { label: "メモ", description: "条件・気づき・備忘録", defaultPublic: false },
};

export const THEME_VISIBILITY_META: Record<ThemeVisibility, { label: string; description: string }> = {
  private: { label: "非公開", description: "研究室メンバーのみ閲覧できます" },
  summary: { label: "概要のみ公開", description: "テーマの概要とタグだけが外部に表示されます" },
  public: { label: "記録も公開", description: "概要に加えて、公開にした記録が外部に表示されます" },
};

/** 画像圧縮の設定（長辺 px） */
export const IMAGE_MAX_EDGE = 1600;
export const THUMBNAIL_MAX_EDGE = 400;
