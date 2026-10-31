import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, FlaskConical, FolderGit2, MessageCircleQuestion, Search, SlidersHorizontal, X } from "lucide-react";
import { explore } from "@/lib/api";
import { TAG_GROUPS } from "@/lib/constants";
import { useAsync } from "@/hooks/use-async";
import { timeAgo } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TagList } from "@/components/tags";
import { EmptyState, LoadingState } from "@/components/states";
import { cn } from "@/lib/utils";

const MATERIALS = TAG_GROUPS.find((g) => g.key === "material")!.tags as readonly string[];
const MORE_GROUPS = TAG_GROUPS.filter((g) => g.key !== "material");
const TROUBLES_PREVIEW = 3;

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const tags = params.get("tags")?.split(",").filter(Boolean) ?? [];
  const [draft, setDraft] = useState(q);
  const [moreOpen, setMoreOpen] = useState(false);
  const [allTroubles, setAllTroubles] = useState(false);

  const { data, loading } = useAsync(() => explore({ q, tags }), [q, tags.join(",")]);

  const update = (next: { q?: string; tags?: string[] }) => {
    const p = new URLSearchParams(params);
    const set = (k: string, v: string) => (v ? p.set(k, v) : p.delete(k));
    if (next.q !== undefined) set("q", next.q);
    if (next.tags !== undefined) set("tags", next.tags.join(","));
    setParams(p, { replace: true });
  };
  const toggleTag = (t: string) => update({ tags: tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t] });
  const moreSelected = tags.filter((t) => !MATERIALS.includes(t));
  const filtering = tags.length > 0 || q !== "";
  const troubles = data?.troubles ?? [];

  return (
    <div>
      {/* ヒーロー＋検索 */}
      <section className="border-b bg-ruled">
        <div className="container max-w-4xl py-8 sm:py-12">
          <h1 className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">実験の「途中」を、研究室の外へ。</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            論文には載らない試行錯誤を残し、困ったときは同じ分野の研究者に相談できます。
          </p>
          <form
            className="mt-5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: draft.trim() });
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (e.target.value === "" && q) update({ q: "" });
                }}
                placeholder="研究室・大学・テーマで検索"
                className="h-11 pl-9"
                aria-label="キーワード検索"
              />
            </div>
            <Button type="submit" className="h-11">
              検索
            </Button>
          </form>

          {/* 材料タグは1列だけ。手法・区分は「絞り込み」の中 */}
          <div className="mt-4 flex items-center gap-2">
            <div className="-ml-4 flex flex-1 gap-1.5 overflow-x-auto pl-4 scrollbar-none sm:ml-0 sm:flex-wrap sm:pl-0" aria-label="材料で絞り込む">
              {MATERIALS.map((t) => (
                <Chip key={t} active={tags.includes(t)} onClick={() => toggleTag(t)}>
                  {t}
                </Chip>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              className={cn("shrink-0", moreSelected.length > 0 && "border-primary text-primary")}
            >
              <SlidersHorizontal />
              絞り込み{moreSelected.length > 0 && `（${moreSelected.length}）`}
            </Button>
          </div>
          {moreOpen && (
            <div className="mt-3 space-y-3 rounded-lg border bg-card p-4">
              {MORE_GROUPS.map((g) => (
                <fieldset key={g.key}>
                  <legend className="mb-1.5 text-xs font-semibold text-muted-foreground">{g.label}</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {g.tags.map((t) => (
                      <Chip key={t} active={tags.includes(t)} onClick={() => toggleTag(t)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setDraft("");
                update({ q: "", tags: [] });
              }}
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              条件をすべて解除
            </button>
          )}
        </div>
      </section>

      <div className="container max-w-4xl space-y-10 py-8">
        {loading && !data ? (
          <LoadingState />
        ) : (
          <>
            {/* 相談を待っている困りごと（ここ1か所だけ） */}
            {troubles.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                  <MessageCircleQuestion className="h-4 w-4 text-trouble" />
                  相談を待っている困りごと
                  <span className="text-sm font-normal text-muted-foreground">{troubles.length}</span>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {(allTroubles ? troubles : troubles.slice(0, TROUBLES_PREVIEW)).map((e) => (
                    <li key={e.id}>
                      <Link
                        to={`/labs/${e.lab.slug}/themes/${e.theme.id}#entry-${e.id}`}
                        className="flex h-full flex-col rounded-lg border border-l-4 border-l-trouble/60 bg-card p-3 transition-colors hover:bg-trouble-soft/40"
                      >
                        <p className="line-clamp-3 flex-1 text-sm leading-relaxed">{e.body}</p>
                        <p className="mt-2 truncate text-xs text-muted-foreground">
                          {e.lab.name}・{e.author.grade}・{timeAgo(e.created_at)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
                {troubles.length > TROUBLES_PREVIEW && (
                  <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground" onClick={() => setAllTroubles((v) => !v)}>
                    <ChevronDown className={cn("transition-transform", allTroubles && "rotate-180")} />
                    {allTroubles ? "閉じる" : `すべて見る（${troubles.length}件）`}
                  </Button>
                )}
              </section>
            )}

            {/* 研究室（主役） */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
                研究室
                <span className="text-sm font-normal text-muted-foreground">{data!.labs.length}</span>
              </h2>
              {data!.labs.length === 0 ? (
                <EmptyState icon={<Search />} title="条件に合う研究室が見つかりませんでした">
                  タグを減らすか、別のキーワードで探してみてください。
                </EmptyState>
              ) : (
                <ul className="space-y-4">
                  {data!.labs.map((lab) => (
                    <li key={lab.id} className="rounded-lg border bg-card">
                      <div className="p-4 sm:p-5">
                        <Link to={`/labs/${lab.slug}`} className="group inline-block">
                          <span className="font-semibold text-primary group-hover:underline">{lab.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{lab.university}</span>
                        </Link>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{lab.description}</p>
                        <TagList tags={lab.tags} className="mt-3" />
                      </div>
                      {lab.themes.length > 0 && (
                        <ul className="divide-y border-t">
                          {lab.themes.map((t) => (
                            <li key={t.id}>
                              <Link
                                to={`/labs/${lab.slug}/themes/${t.id}`}
                                className="flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-secondary/50 sm:px-5"
                              >
                                <FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium leading-snug">{t.title}</span>
                                  <span className="mt-0.5 block text-xs text-muted-foreground">
                                    担当 {t.owner.grade}
                                    {t.lastActivity && `・最終更新 ${timeAgo(t.lastActivity)}`}
                                  </span>
                                </span>
                                {t.openConsultCount > 0 && (
                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-trouble-soft px-2 py-0.5 text-xs font-medium text-trouble">
                                    <MessageCircleQuestion className="h-3 w-3" aria-hidden />
                                    相談中 {t.openConsultCount}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50 hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
