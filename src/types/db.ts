/**
 * Supabase のテーブル構造に対応する型定義。
 * 列名は DB と同じ snake_case にしておき、Supabase の select 結果をそのまま受け取れるようにする。
 *
 *   labs(id, slug, name, university, description, is_public, tags)
 *   members(id, lab_id, grade, role)
 *   themes(id, lab_id, owner_id, title, summary, tags, visibility)
 *   entries(id, theme_id, author_id, type, body, attachments, is_public, created_at)
 *   consult_requests(id, theme_id, entry_id, from_name, from_affiliation, from_email, message, created_at)
 */

export type UUID = string;
/** ISO 8601 文字列（Postgres の timestamptz） */
export type Timestamp = string;

/** タグは text[] に日本語ラベルをそのまま保存する（例: ["CNT", "分離", "実験"]） */
export type Tag = string;

export interface Lab {
  id: UUID;
  slug: string;
  name: string;
  university: string;
  description: string;
  is_public: boolean;
  tags: Tag[];
}

/** 学年。外部には学年のみ表示し、実名は扱わない */
export type Grade = "B3" | "B4" | "M1" | "M2" | "D1" | "D2" | "D3" | "PD" | "教員";
export type MemberRole = "admin" | "member";

export interface Member {
  id: UUID;
  lab_id: UUID;
  grade: Grade;
  role: MemberRole;
}

/** テーマの公開範囲: 非公開 / 概要のみ公開 / 記録も公開 */
export type ThemeVisibility = "private" | "summary" | "public";

export interface Theme {
  id: UUID;
  lab_id: UUID;
  owner_id: UUID;
  title: string;
  /** README 相当の概要（改行を含むプレーンテキスト） */
  summary: string;
  tags: Tag[];
  visibility: ThemeVisibility;
}

/**
 * 記録の種類。
 *   memo    … ふだんの記録（既定・非公開）
 *   trouble … 「相談に出す」を押した記録（公開され、外部から相談を受けられる）
 */
export type EntryType = "memo" | "trouble";

export type AttachmentKind = "image" | "file" | "link";

/** entries.attachments (jsonb) の要素 */
export interface Attachment {
  kind: AttachmentKind;
  /** Supabase Storage の公開URL、または外部リンク（Googleドライブ等） */
  url: string;
  name: string;
  /** 一覧表示用サムネイル（画像のみ） */
  thumbnail_url?: string;
  /** バイト数（ファイル・画像） */
  size?: number;
}

export interface Entry {
  id: UUID;
  theme_id: UUID;
  author_id: UUID;
  type: EntryType;
  body: string;
  attachments: Attachment[];
  is_public: boolean;
  created_at: Timestamp;
}

export interface ConsultRequest {
  id: UUID;
  theme_id: UUID;
  /** 特定の記録についての相談なら記録ID、テーマ全体なら null */
  entry_id: UUID | null;
  from_name: string;
  from_affiliation: string;
  from_email: string;
  message: string;
  created_at: Timestamp;
}

/* ---------- 挿入用（id / created_at は DB 側で採番） ---------- */

export type NewEntry = Omit<Entry, "id" | "created_at">;
export type NewConsultRequest = Omit<ConsultRequest, "id" | "created_at">;

/* ---------- 画面表示用に結合した型 ---------- */

export interface ThemeWithLab extends Theme {
  lab: Lab;
  owner: Member;
}

export interface EntryWithTheme extends Entry {
  theme: Theme;
  lab: Lab;
  author: Member;
}

export interface ConsultRequestWithContext extends ConsultRequest {
  theme: Theme;
  entry: Entry | null;
}
