import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Camera, ChevronRight, FolderGit2, Loader2, Lock, Send, X } from "lucide-react";
import { toast } from "sonner";
import { createEntry, listPostableThemes, listThemeEntries, uploadImage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/hooks/use-async";
import { compressImage, type CompressedImage } from "@/lib/image";
import { timeAgo } from "@/lib/format";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const LAST_THEME_KEY = "labtrail:last-theme";

type PendingImage = { preview: string; status: "compressing" | "ready"; data?: CompressedImage };

/**
 * クイック投稿。メモ帳と同じ感覚で「書いて送る」だけにしている。
 * 記録は常に非公開のメモとして保存し、相談したいときは記録一覧から「相談に出す」。
 */
export default function QuickPostPage() {
  const { member } = useAuth();
  const [params] = useSearchParams();
  const themes = useAsync(() => listPostableThemes(member!.id), [member!.id]);

  const [themeId, setThemeId] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<PendingImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  // 前回使ったテーマを自動選択（URL で指定があればそちらを優先）
  useEffect(() => {
    const list = themes.data;
    if (!list?.length || themeId) return;
    const wanted = params.get("theme") ?? localStorage.getItem(LAST_THEME_KEY);
    setThemeId(list.find((t) => t.id === wanted)?.id ?? list[0].id);
  }, [themes.data, params, themeId]);

  const recent = useAsync(async () => (themeId ? (await listThemeEntries(themeId)).slice(0, 5) : []), [themeId]);

  function chooseTheme(id: string) {
    setThemeId(id);
    localStorage.setItem(LAST_THEME_KEY, id);
  }

  async function pickImage(file: File | undefined) {
    if (!file) return;
    if (image) URL.revokeObjectURL(image.preview);
    const preview = URL.createObjectURL(file);
    setImage({ preview, status: "compressing" });
    try {
      const data = await compressImage(file);
      setImage((cur) => (cur?.preview === preview ? { preview, status: "ready", data } : cur));
    } catch {
      setImage(null);
      URL.revokeObjectURL(preview);
      toast.error("この画像は読み込めませんでした");
    }
  }

  function clearImage() {
    if (image) URL.revokeObjectURL(image.preview);
    setImage(null);
  }

  const canSubmit = !!themeId && body.trim().length > 0 && image?.status !== "compressing" && !submitting;

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const attachments = image?.data ? [await uploadImage(image.data)] : [];
      await createEntry({ theme_id: themeId, author_id: member!.id, type: "memo", body: body.trim(), attachments, is_public: false });
      localStorage.setItem(LAST_THEME_KEY, themeId);
      setBody("");
      clearImage();
      toast.success("保存しました");
      void recent.reload();
      textarea.current?.focus();
    } catch {
      toast.error("保存できませんでした。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  // Ctrl / ⌘ + Enter で送信
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void onSubmit();
  }

  if (themes.loading) return <LoadingState />;
  if (!themes.data!.length) {
    return (
      <div className="container max-w-xl py-8">
        <EmptyState icon={<FolderGit2 />} title="まずはテーマを作りましょう">
          記録はテーマごとに残します。研究テーマを1つ作ると、ここからすぐ書けるようになります。
          <Button asChild className="mt-4">
            <Link to="/app/themes">マイテーマへ</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const theme = themes.data!.find((t) => t.id === themeId);

  return (
    <div className="container max-w-xl py-4 sm:py-8">
      <form onSubmit={onSubmit} className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* テーマ（前回のものを自動選択。タップで切り替え） */}
        <div className="flex items-center gap-2 border-b bg-secondary/40 px-3 py-2">
          <FolderGit2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <NativeSelect
            value={themeId}
            onChange={(e) => chooseTheme(e.target.value)}
            aria-label="記録するテーマ"
            className="h-9 truncate border-transparent bg-transparent py-0 pl-1 text-[15px] font-medium shadow-none hover:bg-card sm:text-sm"
          >
            {themes.data!.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </NativeSelect>
        </div>

        <Textarea
          ref={textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="実験のメモを書く…（条件・結果・気づきなど）"
          aria-label="メモ"
          autoFocus
          className="min-h-[38dvh] resize-none rounded-none border-0 bg-card px-4 py-3 text-base leading-relaxed shadow-none focus-visible:ring-0 sm:min-h-[260px]"
        />

        {image && (
          <div className="px-4 pb-3">
            <div className="relative inline-block overflow-hidden rounded-md border bg-muted">
              <img src={image.preview} alt="添付する写真" className={cn("h-28 w-auto max-w-[200px] object-cover", image.status === "compressing" && "opacity-50")} />
              {image.status === "compressing" && (
                <span className="absolute inset-0 flex items-center justify-center text-xs">
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  圧縮中
                </span>
              )}
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-background hover:bg-foreground"
                aria-label="写真を外す"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 border-t px-3 py-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => imageInput.current?.click()} className="text-muted-foreground">
            <Camera />
            {image ? "写真を変更" : "写真"}
          </Button>
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void pickImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">⌘/Ctrl + Enter</span>
          <Button type="submit" disabled={!canSubmit} className="ml-auto min-w-24 sm:ml-0">
            {submitting ? <Loader2 className="animate-spin" /> : <Send />}
            保存
          </Button>
        </div>
      </form>

      <p className="mt-2 flex items-start gap-1.5 px-1 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        非公開のメモとして保存されます。相談したいときは、記録一覧から「相談に出す」を押してください。
      </p>

      {/* 直近のメモ */}
      {theme && (
        <section className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">このテーマの最近の記録</h2>
            <Link to={`/app/themes/${theme.id}`} className="flex items-center text-xs text-primary hover:underline">
              すべて見る
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recent.loading && !recent.data ? (
            <LoadingState className="py-6" />
          ) : recent.data!.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">まだ記録はありません</p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {recent.data!.map((e) => {
                const img = e.attachments.find((a) => a.kind === "image");
                return (
                  <li key={e.id} className="flex gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed">{e.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {timeAgo(e.created_at)}
                        {e.type === "trouble" && <span className="ml-2 text-trouble">相談中</span>}
                      </p>
                    </div>
                    {img && (
                      <img
                        src={img.thumbnail_url ?? img.url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-12 shrink-0 rounded border object-cover"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
