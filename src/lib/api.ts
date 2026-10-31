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
  Grade,
  Lab,
  LabJoinCode,
  Member,
  NewLab,
  NewTheme,
  NewConsultRequest,
  NewEntry,
  Theme,
  ThemeWithLab,
} from "@/types/db";
import type { CompressedImage } from "@/lib/image";
import { mockConsultRequests, mockEntries, mockJoinCodes, mockLabs, mockMembers, mockThemes } from "@/data/mock";

/* ------------------------------------------------------------------ */
/* モックストア                                                         */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "labtrail:mock-db:v4";

interface MockDb {
  labs: Lab[];
  members: Member[];
  themes: Theme[];
  entries: Entry[];
  consult_requests: ConsultRequest[];
  lab_join_codes: LabJoinCode[];
}

function seed(): MockDb {
  return structuredClone({
    labs: mockLabs,
    members: mockMembers,
    themes: mockThemes,
    entries: mockEntries,
    consult_requests: mockConsultRequests,
    lab_join_codes: mockJoinCodes,
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
/*   研究室・テーマ … 存在（名前・概要・タグ・担当の学年）は常に公開          */
/*   記録          … 既定は非公開。「相談に出す」を押したものだけ公開         */
/* ------------------------------------------------------------------ */

function isLabVisible(lab: Lab) {
  return lab.is_public;
}
function isThemeVisible(theme: Theme, lab: Lab) {
  return isLabVisible(lab) && theme.visibility !== "private";
}
function isEntryVisible(entry: Entry, theme: Theme, lab: Lab) {
  return isThemeVisible(theme, lab) && entry.is_public;
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

export type ExploreTheme = Theme & { owner: Member; openConsultCount: number; lastActivity: string | null };

export interface ExploreResult {
  /** 研究室ごとに、条件に合うテーマを入れ子にしたもの */
  labs: (Lab & { themes: ExploreTheme[] })[];
  /** 条件に合うテーマの中で、相談を待っている記録（新しい順） */
  troubles: EntryWithTheme[];
}

/**
 * 探す画面の検索。研究室を主役にし、条件に合うテーマを入れ子で返す。
 * - 研究室そのものが条件に合えば、その研究室のテーマはすべて表示
 * - そうでなければ、条件に合うテーマを持つ研究室だけを、合うテーマだけ付けて表示
 *
 * Supabase 版の例:
 *   supabase.from("labs").select("*, themes(*, owner:members(grade))").eq("is_public", true)
 *   → タグは .contains("tags", tags)、キーワードは .or("name.ilike.%q%,...") や全文検索で絞り込む
 */
export async function explore({ q = "", tags = [] }: ExploreQuery): Promise<ExploreResult> {
  await delay();
  const kw = q.trim().toLowerCase();
  const hasAll = (itemTags: string[]) => tags.every((t) => itemTags.includes(t));
  const hasKw = (...fields: string[]) => !kw || fields.some((f) => f.toLowerCase().includes(kw));

  const toExploreTheme = (t: Theme): ExploreTheme => {
    const open = db.entries.filter((e) => e.theme_id === t.id && isEntryVisible(e, t, labOf(t))).sort(byNewest);
    const all = db.entries.filter((e) => e.theme_id === t.id).sort(byNewest);
    return { ...t, owner: memberOf(t.owner_id), openConsultCount: open.length, lastActivity: all[0]?.created_at ?? null };
  };

  const labs = db.labs
    .filter(isLabVisible)
    .map((lab) => {
      const labThemes = db.themes.filter((t) => t.lab_id === lab.id && isThemeVisible(t, lab));
      const labMatches = hasAll(lab.tags) && hasKw(lab.name, lab.university, lab.description);
      const matched = labThemes.filter((t) => hasAll(t.tags) && hasKw(t.title, t.summary, lab.name, lab.university));
      const shown = labMatches ? labThemes : matched;
      return { lab, matched: labMatches || matched.length > 0, themes: shown.map(toExploreTheme) };
    })
    .filter((x) => x.matched)
    .map(({ lab, themes }) => ({
      ...lab,
      themes: themes.sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? "")),
    }))
    // 最近動きのある研究室を上に
    .sort((a, b) => (b.themes[0]?.lastActivity ?? "").localeCompare(a.themes[0]?.lastActivity ?? ""));

  const themeIds = new Set(labs.flatMap((l) => l.themes.map((t) => t.id)));
  const troubles = db.entries
    .filter((e) => e.type === "trouble" && themeIds.has(e.theme_id))
    .map((e) => {
      const theme = db.themes.find((t) => t.id === e.theme_id)!;
      return { ...e, theme, lab: labOf(theme), author: memberOf(e.author_id) };
    })
    .filter((e) => isEntryVisible(e, e.theme, e.lab))
    .sort(byNewest);

  return { labs, troubles };
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

export async function listThemeEntries(themeId: string): Promise<(Entry & { author: Member; consultCount: number })[]> {
  await delay();
  return db.entries
    .filter((e) => e.theme_id === themeId)
    .sort(byNewest)
    .map((e) => ({
      ...e,
      author: memberOf(e.author_id),
      consultCount: db.consult_requests.filter((c) => c.entry_id === e.id).length,
    }));
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

/**
 * 「相談に出す」（open = true）: 困りごととして公開し、外部から相談を受け付ける。
 * 「相談を取り下げる」（open = false）: 非公開のメモに戻す。届いた相談は残る。
 * Supabase 版: supabase.from("entries").update({ type, is_public }).eq("id", entryId)
 */
export async function setEntryConsultation(entryId: string, open: boolean): Promise<void> {
  await delay(150);
  const e = db.entries.find((x) => x.id === entryId);
  if (e) {
    e.type = open ? "trouble" : "memo";
    e.is_public = open;
  }
  persist();
}

export async function deleteEntry(entryId: string): Promise<void> {
  await delay(80);
  db.entries = db.entries.filter((x) => x.id !== entryId);
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
/* 研究室の作成・参加、テーマの作成                                     */
/* ------------------------------------------------------------------ */

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 0/O・1/I など紛らわしい文字を除く

function generateJoinCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

/** 入力されたコードを正規化（小文字・ハイフン・空白を許容） */
export function normalizeJoinCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** 表示用に4桁ごとに区切る: ABCD2345 → ABCD-2345 */
export function formatJoinCode(code: string) {
  return code.replace(/^(.{4})(.+)$/, "$1-$2");
}

/**
 * 代表者が研究室を作成する。作成者は role = "admin"（代表者）のメンバーになり、参加コードが発行される。
 * Supabase 版: RPC `create_lab(name, university, description, tags, grade)` を security definer で用意し、
 *             labs / members / lab_join_codes への挿入を1トランザクションで行う。
 */
export async function createLab(input: NewLab, owner: { userId: string; grade: Grade }): Promise<{ lab: Lab; code: string }> {
  await delay(400);
  if (db.members.some((m) => m.id === owner.userId)) throw new Error("すでに研究室に所属しています");
  const lab: Lab = { ...input, id: newId("lab"), slug: `lab-${crypto.randomUUID().slice(0, 6)}`, is_public: true };
  const code = generateJoinCode();
  db.labs.push(lab);
  db.members.push({ id: owner.userId, lab_id: lab.id, grade: owner.grade, role: "admin" });
  db.lab_join_codes.push({ lab_id: lab.id, code });
  persist();
  return { lab, code };
}

/** 参加コードから研究室を探す（参加前の確認表示用）。Supabase 版: RPC `lookup_lab_by_code(code)` */
export async function findLabByJoinCode(input: string): Promise<Lab | null> {
  await delay(200);
  const code = normalizeJoinCode(input);
  const row = db.lab_join_codes.find((c) => c.code === code);
  return row ? db.labs.find((l) => l.id === row.lab_id) ?? null : null;
}

/** 参加コードで研究室に参加する。Supabase 版: RPC `join_lab(code, grade)` */
export async function joinLab(input: string, user: { userId: string; grade: Grade }): Promise<Member> {
  await delay(300);
  const code = normalizeJoinCode(input);
  const row = db.lab_join_codes.find((c) => c.code === code);
  if (!row) throw new Error("参加コードが正しくありません");
  if (db.members.some((m) => m.id === user.userId)) throw new Error("すでに研究室に所属しています");
  const member: Member = { id: user.userId, lab_id: row.lab_id, grade: user.grade, role: "member" };
  db.members.push(member);
  persist();
  return member;
}

/** 代表者向け: 参加コードを取得 */
export async function getJoinCode(labId: string): Promise<LabJoinCode | null> {
  await delay(0);
  return db.lab_join_codes.find((c) => c.lab_id === labId) ?? null;
}

/** 代表者向け: 参加コードを作り直す（古いコードは使えなくなる） */
export async function regenerateJoinCode(labId: string): Promise<string> {
  await delay(200);
  const code = generateJoinCode();
  db.lab_join_codes = [...db.lab_join_codes.filter((c) => c.lab_id !== labId), { lab_id: labId, code }];
  persist();
  return code;
}

export async function countLabMembers(labId: string): Promise<number> {
  await delay(0);
  return db.members.filter((m) => m.lab_id === labId).length;
}

/** 自分のテーマを作る。存在（タイトル・概要・タグ・担当の学年）は公開される */
export async function createTheme(input: NewTheme, owner: Member): Promise<Theme> {
  await delay(300);
  const theme: Theme = { ...input, id: newId("th"), lab_id: owner.lab_id, owner_id: owner.id, visibility: "public" };
  db.themes.push(theme);
  persist();
  return theme;
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

