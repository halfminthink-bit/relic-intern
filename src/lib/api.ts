/**
 * データアクセス層。
 *
 * 画面コンポーネントはこのファイルの関数だけを呼び出し、モックデータや Supabase を直接触らない。
 * Supabase 接続時は、各関数の中身を supabase-js の呼び出しに置き換えるだけで済むようにしている
 * （関数ごとに「Supabase 版」のクエリ例をコメントで残してある）。
 *
 * 現在はメモリ上のストアを localStorage に保存して、リロードしても投稿が残るようにしている。
 */
import type {
  Attachment,
  ConsultRequest,
  ConsultRequestWithContext,
  Entry,
  EntryWithTheme,
  Lab,
  Member,
  NewConsultRequest,
  NewEntry,
  Theme,
  ThemeVisibility,
  ThemeWithLab,
} from "@/types/db";
import type { CompressedImage } from "@/lib/image";
import { mockConsultRequests, mockEntries, mockLabs, mockMembers, mockThemes } from "@/data/mock";

/* ------------------------------------------------------------------ */
/* モックストア                                                         */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "labtrail:mock-db:v3";

interface MockDb {
  labs: Lab[];
  members: Member[];
  themes: Theme[];
  entries: Entry[];
  consult_requests: ConsultRequest[];
}

function seed(): MockDb {
  return structuredClone({
    labs: mockLabs,
    members: mockMembers,
    themes: mockThemes,
    entries: mockEntries,
    consult_requests: mockConsultRequests,
  });
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    /* 破損していたら初期化 */
  }
  return seed();
}

let db: MockDb = load();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // 画像を多く添付すると容量超過になることがある。モックなのでメモリ上だけで続行する。
    console.warn("[mock] localStorage への保存に失敗しました（容量超過の可能性）");
  }
}

/** 通信しているように見せるための小さな遅延 */
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

/** モックデータを初期状態に戻す（ログイン画面の「デモデータをリセット」用） */
export async function resetMockData() {
  db = seed();
  persist();
}

/* ------------------------------------------------------------------ */
/* 公開範囲のルール（Supabase では RLS ポリシーで同じことを表現する）     */
/* ------------------------------------------------------------------ */

function isLabVisible(lab: Lab) {
  return lab.is_public;
}
function isThemeVisible(theme: Theme, lab: Lab) {
  return isLabVisible(lab) && theme.visibility !== "private";
}
function isEntryVisible(entry: Entry, theme: Theme, lab: Lab) {
  return isThemeVisible(theme, lab) && theme.visibility === "public" && entry.is_public;
}

const byNewest = (a: { created_at: string }, b: { created_at: string }) => b.created_at.localeCompare(a.created_at);

function labOf(theme: Theme) {
  return db.labs.find((l) => l.id === theme.lab_id)!;
}
function memberOf(id: string) {
  return db.members.find((m) => m.id === id)!;
}
function withLab(theme: Theme): ThemeWithLab {
  return { ...theme, lab: labOf(theme), owner: memberOf(theme.owner_id) };
}

/* ------------------------------------------------------------------ */
/* 外部向け（ログイン不要）                                             */
/* ------------------------------------------------------------------ */

export interface ExploreQuery {
  /** フリーワード（研究室名・大学名・テーマ名・概要に部分一致） */
  q?: string;
  /** すべてを含むものに絞り込む（AND 検索） */
  tags?: string[];
}

export interface ExploreResult {
  labs: (Lab & { themeCount: number })[];
  themes: (ThemeWithLab & { publicEntryCount: number; lastActivity: string | null })[];
}

/**
 * Supabase 版の例:
 *   supabase.from("themes").select("*, lab:labs!inner(*)").neq("visibility", "private")
 *     .eq("lab.is_public", true).contains("tags", tags).or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
 */
export async function explore({ q = "", tags = [] }: ExploreQuery): Promise<ExploreResult> {
  await delay();
  const kw = q.trim().toLowerCase();
  const hasAll = (itemTags: string[]) => tags.every((t) => itemTags.includes(t));

  const visibleLabs = db.labs.filter(isLabVisible);
  const visibleThemes = db.themes.filter((t) => isThemeVisible(t, labOf(t)));

  const themes = visibleThemes
    .filter((t) => hasAll(t.tags))
    .filter((t) => {
      if (!kw) return true;
      const lab = labOf(t);
      return [t.title, t.summary, lab.name, lab.university].some((s) => s.toLowerCase().includes(kw));
    })
    .map((t) => {
      const entries = db.entries.filter((e) => e.theme_id === t.id && isEntryVisible(e, t, labOf(t))).sort(byNewest);
      return { ...withLab(t), publicEntryCount: entries.length, lastActivity: entries[0]?.created_at ?? null };
    })
    .sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));

  const labs = visibleLabs
    .filter((l) => hasAll(l.tags))
    .filter((l) => !kw || [l.name, l.university, l.description].some((s) => s.toLowerCase().includes(kw)))
    .map((l) => ({ ...l, themeCount: visibleThemes.filter((t) => t.lab_id === l.id).length }));

  return { labs, themes };
}

/** 外部に公開されている最近の困りごと（トップページの「相談を待っている困りごと」） */
export async function listRecentPublicTroubles(limit = 5): Promise<EntryWithTheme[]> {
  await delay();
  return db.entries
    .filter((e) => e.type === "trouble")
    .map((e) => {
      const theme = db.themes.find((t) => t.id === e.theme_id)!;
      return { e, theme, lab: labOf(theme) };
    })
    .filter(({ e, theme, lab }) => isEntryVisible(e, theme, lab))
    .sort((a, b) => byNewest(a.e, b.e))
    .slice(0, limit)
    .map(({ e, theme, lab }) => ({ ...e, theme, lab, author: memberOf(e.author_id) }));
}

export interface LabDetail {
  lab: Lab;
  themes: (Theme & { owner: Member; publicEntryCount: number; lastActivity: string | null })[];
  /** 学年ごとの人数（実名は出さない） */
  gradeCounts: { grade: string; count: number }[];
}

/** Supabase 版の例: supabase.from("labs").select("*, themes(*), members(grade)").eq("slug", slug).single() */
export async function getPublicLab(slug: string): Promise<LabDetail | null> {
  await delay();
  const lab = db.labs.find((l) => l.slug === slug);
  if (!lab || !isLabVisible(lab)) return null;
  const themes = db.themes
    .filter((t) => t.lab_id === lab.id && isThemeVisible(t, lab))
    .map((t) => {
      const entries = db.entries.filter((e) => e.theme_id === t.id && isEntryVisible(e, t, lab)).sort(byNewest);
      return { ...t, owner: memberOf(t.owner_id), publicEntryCount: entries.length, lastActivity: entries[0]?.created_at ?? null };
    });
  const counts = new Map<string, number>();
  db.members.filter((m) => m.lab_id === lab.id).forEach((m) => counts.set(m.grade, (counts.get(m.grade) ?? 0) + 1));
  const order = ["教員", "PD", "D3", "D2", "D1", "M2", "M1", "B4", "B3"];
  const gradeCounts = [...counts.entries()]
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => order.indexOf(a.grade) - order.indexOf(b.grade));
  return { lab, themes, gradeCounts };
}

export interface ThemeDetail {
  theme: ThemeWithLab;
  /** visibility が "public" のときだけ中身が入る */
  entries: (Entry & { author: Member })[];
}

export async function getPublicTheme(labSlug: string, themeId: string): Promise<ThemeDetail | null> {
  await delay();
  const theme = db.themes.find((t) => t.id === themeId);
  if (!theme) return null;
  const lab = labOf(theme);
  if (lab.slug !== labSlug || !isThemeVisible(theme, lab)) return null;
  const entries = db.entries
    .filter((e) => e.theme_id === theme.id && isEntryVisible(e, theme, lab))
    .sort(byNewest)
    .map((e) => ({ ...e, author: memberOf(e.author_id) }));
  return { theme: withLab(theme), entries };
}

/** Supabase 版の例: supabase.from("consult_requests").insert(input).select().single() */
export async function createConsultRequest(input: NewConsultRequest): Promise<ConsultRequest> {
  await delay(300);
  const row: ConsultRequest = { ...input, id: newId("cr"), created_at: new Date().toISOString() };
  db.consult_requests.push(row);
  persist();
  return row;
}

/* ------------------------------------------------------------------ */
/* メンバー向け（ログイン後）                                           */
/* ------------------------------------------------------------------ */

export async function getMember(id: string): Promise<(Member & { lab: Lab }) | null> {
  await delay(0);
  const m = db.members.find((x) => x.id === id);
  if (!m) return null;
  return { ...m, lab: db.labs.find((l) => l.id === m.lab_id)! };
}

/** 自分が担当するテーマ（Supabase 版: .from("themes").select("*, lab:labs(*)").eq("owner_id", memberId)） */
export async function listMyThemes(memberId: string): Promise<(ThemeWithLab & { entryCount: number; publicEntryCount: number; lastActivity: string | null })[]> {
  await delay();
  return db.themes
    .filter((t) => t.owner_id === memberId)
    .map((t) => {
      const entries = db.entries.filter((e) => e.theme_id === t.id).sort(byNewest);
      return {
        ...withLab(t),
        entryCount: entries.length,
        publicEntryCount: entries.filter((e) => e.is_public).length,
        lastActivity: entries[0]?.created_at ?? null,
      };
    });
}

/** 投稿先として選べるテーマ（自分の研究室のテーマすべて） */
export async function listPostableThemes(memberId: string): Promise<Theme[]> {
  await delay(0);
  const me = memberOf(memberId);
  return db.themes
    .filter((t) => t.lab_id === me.lab_id)
    .sort((a, b) => Number(b.owner_id === memberId) - Number(a.owner_id === memberId));
}

export async function getThemeForMember(themeId: string): Promise<ThemeWithLab | null> {
  await delay();
  const t = db.themes.find((x) => x.id === themeId);
  return t ? withLab(t) : null;
}

export async function listThemeEntries(themeId: string): Promise<(Entry & { author: Member })[]> {
  await delay();
  return db.entries
    .filter((e) => e.theme_id === themeId)
    .sort(byNewest)
    .map((e) => ({ ...e, author: memberOf(e.author_id) }));
}

/** 草グラフ用: 投稿日時だけを返す（Supabase 版: .from("entries").select("created_at").eq("author_id", id).gte("created_at", since)） */
export async function listActivity(params: { authorId?: string; themeId?: string; sinceDays?: number }): Promise<string[]> {
  await delay(0);
  const since = new Date();
  since.setDate(since.getDate() - (params.sinceDays ?? 371));
  const sinceIso = since.toISOString();
  return db.entries
    .filter((e) => (!params.authorId || e.author_id === params.authorId) && (!params.themeId || e.theme_id === params.themeId))
    .filter((e) => e.created_at >= sinceIso)
    .map((e) => e.created_at);
}

/** Supabase 版の例: supabase.from("entries").insert(input).select().single() */
export async function createEntry(input: NewEntry): Promise<Entry> {
  await delay(300);
  const row: Entry = { ...input, id: newId("en"), created_at: new Date().toISOString() };
  db.entries.push(row);
  persist();
  return row;
}

export async function updateEntryVisibility(entryId: string, isPublic: boolean): Promise<void> {
  await delay(80);
  const e = db.entries.find((x) => x.id === entryId);
  if (e) e.is_public = isPublic;
  persist();
}

export async function deleteEntry(entryId: string): Promise<void> {
  await delay(80);
  db.entries = db.entries.filter((x) => x.id !== entryId);
  persist();
}

export async function updateThemeVisibility(themeId: string, visibility: ThemeVisibility): Promise<void> {
  await delay(80);
  const t = db.themes.find((x) => x.id === themeId);
  if (t) t.visibility = visibility;
  persist();
}

export async function updateLabVisibility(labId: string, isPublic: boolean): Promise<void> {
  await delay(80);
  const l = db.labs.find((x) => x.id === labId);
  if (l) l.is_public = isPublic;
  persist();
}

/** 自分が担当するテーマに届いた相談 */
export async function listConsultRequestsForOwner(memberId: string): Promise<ConsultRequestWithContext[]> {
  await delay();
  const myThemeIds = new Set(db.themes.filter((t) => t.owner_id === memberId).map((t) => t.id));
  return db.consult_requests
    .filter((c) => myThemeIds.has(c.theme_id))
    .sort(byNewest)
    .map((c) => ({
      ...c,
      theme: db.themes.find((t) => t.id === c.theme_id)!,
      entry: c.entry_id ? db.entries.find((e) => e.id === c.entry_id) ?? null : null,
    }));
}

/* ------------------------------------------------------------------ */
/* ファイル                                                            */
/* ------------------------------------------------------------------ */

/**
 * 圧縮済みの画像（本画像とサムネイル）をアップロードして Attachment を返す。
 * モックでは data URL のまま保持する。
 * Supabase 版: supabase.storage.from("attachments").upload(path, blob) → getPublicUrl(path)
 */
export async function uploadImage(image: CompressedImage): Promise<Attachment> {
  await delay(200);
  const [url, thumbnail_url] = await Promise.all([blobToDataUrl(image.blob), blobToDataUrl(image.thumbnail)]);
  return { kind: "image", url, thumbnail_url, name: image.name, size: image.blob.size };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

