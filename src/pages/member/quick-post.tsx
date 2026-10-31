import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Camera, Check, Eye, EyeOff, FileUp, Link2, Loader2, Paperclip, Plus, Send, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import type { Attachment, EntryType } from "@/types/db";
import { createEntry, listPostableThemes, MAX_FILE_BYTES, uploadFile, uploadImage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/hooks/use-async";
import { compressImage, formatBytes } from "@/lib/image";
import { ENTRY_TYPE_META, ENTRY_TYPES, IMAGE_MAX_EDGE } from "@/lib/constants";
import { ENTRY_TYPE_STYLE } from "@/components/entry-type";
import { ThemeVisibilityBadge } from "@/components/visibility";
import { LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const LAST_THEME_KEY = "labtrail:last-theme";

const PLACEHOLDER: Record<EntryType, string> = {
  progress: "例：SDS 1.6%、18℃でゲル分離。(6,5)の純度 72%。",
  trouble: "例：遠心後の上澄みの回収量がばらつく。みなさんどうしていますか？",
  achievement: "例：(6,5)の純度 91% を達成！ポイントは遠心条件の変更。",
  memo: "例：ゲルの再利用は3回まで。洗浄は1% SDSで5カラム体積。",
};

type PendingImage = { id: string; preview: string; status: "compressing" | "ready" | "error"; data?: Awaited<ReturnType<typeof compressImage>> };
type PendingFile = { id: string; file: File };

export default function QuickPostPage() {
  const { member } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: themes, loading } = useAsync(() => listPostableThemes(member!.id), [member!.id]);

  const [themeId, setThemeId] = useState<string>("");
  const [type, setType] = useState<EntryType>("progress");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(ENTRY_TYPE_META.progress.defaultPublic);
  const [publicTouched, setPublicTouched] = useState(false);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [links, setLinks] = useState<Attachment[]>([]);
  const [linkForm, setLinkForm] = useState<{ open: boolean; url: string; name: string }>({ open: false, url: "", name: "" });
  const [submitting, setSubmitting] = useState(false);

  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // 初期テーマ: URL指定 → 前回使ったテーマ → 先頭
  useEffect(() => {
    if (!themes?.length || themeId) return;
    const wanted = params.get("theme") ?? localStorage.getItem(LAST_THEME_KEY);
    setThemeId(themes.find((t) => t.id === wanted)?.id ?? themes[0].id);
  }, [themes, params, themeId]);

  // 種類を変えたら公開の初期値も切り替える（ユーザーが手で切り替えた後は尊重する）
  const chooseType = (t: EntryType) => {
    setType(t);
    if (!publicTouched) setIsPublic(ENTRY_TYPE_META[t].defaultPublic);
  };

  async function addImages(list: FileList | null) {
    if (!list) return;
    for (const file of Array.from(list)) {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setImages((xs) => [...xs, { id, preview, status: "compressing" }]);
      try {
        const data = await compressImage(file);
        setImages((xs) => xs.map((x) => (x.id === id ? { ...x, status: "ready", data } : x)));
      } catch {
        setImages((xs) => xs.map((x) => (x.id === id ? { ...x, status: "error" } : x)));
        toast.error(`${file.name} を読み込めませんでした`);
      }
    }
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} は ${formatBytes(MAX_FILE_BYTES)} を超えています`, {
          description: "大きな生データは Googleドライブ等に置いて「リンク」で添付してください。",
        });
        continue;
      }
      setFiles((xs) => [...xs, { id: crypto.randomUUID(), file }]);
    }
  }

  function addLink() {
    const url = linkForm.url.trim();
    if (!/^https?:\/\//.test(url)) {
      toast.error("http(s):// から始まるURLを入力してください");
      return;
    }
    setLinks((xs) => [...xs, { kind: "link", url, name: linkForm.name.trim() || url }]);
    setLinkForm({ open: false, url: "", name: "" });
  }

  const theme = themes?.find((t) => t.id === themeId);
  const compressing = images.some((i) => i.status === "compressing");
  const canSubmit = !!theme && body.trim().length > 0 && !compressing && !submitting;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !theme) return;
    setSubmitting(true);
    try {
      const uploaded = await Promise.all([
        ...images.filter((i) => i.status === "ready").map((i) => uploadImage(i.data!)),
        ...files.map((f) => uploadFile(f.file)),
      ]);
      await createEntry({
        theme_id: theme.id,
        author_id: member!.id,
        type,
        body: body.trim(),
        attachments: [...uploaded, ...links],
        is_public: isPublic,
      });
      localStorage.setItem(LAST_THEME_KEY, theme.id);
      toast.success("記録しました", { description: `${theme.title}・${ENTRY_TYPE_META[type].label}` });
      navigate(`/app/themes/${theme.id}`);
    } catch {
      toast.error("保存に失敗しました。もう一度お試しください。");
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState />;

  const externallyVisible = isPublic && theme?.visibility === "public";

  return (
    <form onSubmit={onSubmit} className="container max-w-xl py-5 sm:py-8">
      <h1 className="mb-5 text-xl font-bold">記録する</h1>

      {/* 1. テーマ */}
      <Step n={1} title="テーマ">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-col sm:px-0">
          {themes!.map((t) => {
            const active = t.id === themeId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                aria-pressed={active}
                className={cn(
                  "flex w-64 shrink-0 items-start gap-2 rounded-lg border bg-card p-3 text-left transition-colors sm:w-full",
                  active ? "border-primary ring-1 ring-primary" : "hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm font-medium leading-snug">{t.title}</span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <ThemeVisibilityBadge visibility={t.visibility} />
                    {t.owner_id !== member!.id && <span className="text-[11px] text-muted-foreground">研究室の共有テーマ</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Step>

      {/* 2. 種類 */}
      <Step n={2} title="種類">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="記録の種類">
          {ENTRY_TYPES.map((t) => {
            const s = ENTRY_TYPE_STYLE[t];
            const active = t === type;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => chooseType(t)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors",
                  active ? cn(s.bg, s.ring, "ring-1 ring-current", s.text) : "hover:bg-secondary/60",
                )}
              >
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", active ? "bg-card" : s.bg, s.text)}>
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-semibold", !active && "text-foreground")}>{ENTRY_TYPE_META[t].label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{ENTRY_TYPE_META[t].description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Step>

      {/* 3. 本文 */}
      <Step n={3} title="本文">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder={PLACEHOLDER[type]}
          aria-label="本文"
          className="min-h-[140px]"
        />
        <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">{body.length} 文字</p>
      </Step>

      {/* 4. 添付 */}
      <Step n={4} title="写真・ファイル" optional>
        <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => imageInput.current?.click()}>
            <Camera className="!size-5" />
            <span className="text-xs">写真</span>
          </Button>
          <Button type="button" variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => fileInput.current?.click()}>
            <FileUp className="!size-5" />
            <span className="text-xs">ファイル</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto flex-col gap-1 py-3"
            onClick={() => setLinkForm((f) => ({ ...f, open: !f.open }))}
            aria-expanded={linkForm.open}
          >
            <Link2 className="!size-5" />
            <span className="text-xs">リンク</span>
          </Button>
        </div>
        <input ref={imageInput} type="file" accept="image/*" multiple hidden onChange={(e) => (addImages(e.target.files), (e.target.value = ""))} />
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />

        {linkForm.open && (
          <div className="mt-3 grid gap-2 rounded-lg border bg-secondary/40 p-3">
            <Input
              type="url"
              inputMode="url"
              placeholder="https://drive.google.com/…"
              value={linkForm.url}
              onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
              aria-label="URL"
            />
            <Input
              placeholder="表示名（例：生データ一式）"
              value={linkForm.name}
              onChange={(e) => setLinkForm((f) => ({ ...f, name: e.target.value }))}
              aria-label="リンクの表示名"
            />
            <Button type="button" size="sm" onClick={addLink} className="justify-self-end">
              <Plus />
              追加
            </Button>
          </div>
        )}

        {images.length > 0 && (
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img) => (
              <li key={img.id} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                <img src={img.preview} alt="" className={cn("h-full w-full object-cover", img.status !== "ready" && "opacity-50")} />
                {img.status === "compressing" && (
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] text-foreground">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    圧縮中
                  </span>
                )}
                {img.status === "ready" && img.data && (
                  <span className="absolute bottom-1 left-1 rounded bg-foreground/70 px-1 text-[10px] text-background">{formatBytes(img.data.blob.size)}</span>
                )}
                <RemoveButton onClick={() => setImages((xs) => xs.filter((x) => x.id !== img.id))} />
              </li>
            ))}
          </ul>
        )}
        {(files.length > 0 || links.length > 0) && (
          <ul className="mt-3 space-y-1.5">
            {files.map((f) => (
              <AttachmentRow key={f.id} icon={<Paperclip />} name={f.file.name} sub={formatBytes(f.file.size)} onRemove={() => setFiles((xs) => xs.filter((x) => x.id !== f.id))} />
            ))}
            {links.map((l, i) => (
              <AttachmentRow key={i} icon={<Link2 />} name={l.name} sub={l.url} onRemove={() => setLinks((xs) => xs.filter((_, j) => j !== i))} />
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          写真は送信前に長辺 {IMAGE_MAX_EDGE}px に自動圧縮されます。大きな生データは Googleドライブ等に置いて「リンク」で添付してください（ファイルは {formatBytes(MAX_FILE_BYTES)} まで）。
        </p>
      </Step>

      {/* 5. 公開 */}
      <Step n={5} title="公開範囲">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3">
          {isPublic ? <Eye className="h-5 w-5 text-primary" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
          <span className="flex-1">
            <span className="block text-sm font-medium">{isPublic ? "公開する" : "非公開（研究室内のみ）"}</span>
            <span className="block text-xs text-muted-foreground">
              {ENTRY_TYPE_META[type].label}の初期設定は「{ENTRY_TYPE_META[type].defaultPublic ? "公開" : "非公開"}」です
            </span>
          </span>
          <Switch
            checked={isPublic}
            onCheckedChange={(v) => {
              setIsPublic(v);
              setPublicTouched(true);
            }}
            aria-label="外部に公開する"
          />
        </label>
        {isPublic && theme && theme.visibility !== "public" && (
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-trouble">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            テーマが「{theme.visibility === "private" ? "非公開" : "概要のみ公開"}」のため、この記録は外部には表示されません。
            テーマの公開範囲はマイテーマから変更できます。
          </p>
        )}
        {externallyVisible && <p className="mt-2 text-xs text-muted-foreground">外部には学年（{member!.grade}）のみ表示され、実名は出ません。</p>}
      </Step>

      {/* 送信（スマホでは下部タブの上に固定） */}
      <div className="sticky bottom-20 z-30 -mx-4 mt-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
        <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
          {submitting ? <Loader2 className="animate-spin" /> : <Send />}
          {compressing ? "画像を圧縮しています…" : "記録する"}
        </Button>
      </div>
    </form>
  );
}

function Step({ n, title, optional, children }: { n: number; title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/85 font-mono text-[11px] text-background">{n}</span>
        {title}
        {optional && <span className="text-xs font-normal text-muted-foreground">任意</span>}
      </h2>
      {children}
    </section>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-background hover:bg-foreground"
      aria-label="削除"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

function AttachmentRow({ icon, name, sub, onRemove }: { icon: React.ReactNode; name: string; sub: string; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-foreground" aria-label={`${name} を削除`}>
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}
