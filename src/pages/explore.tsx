import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Building2, CircleHelp, FlaskConical, FolderGit2, Search, SlidersHorizontal, X } from "lucide-react";
import { explore, listRecentPublicTroubles } from "@/lib/api";
import { TAG_GROUPS } from "@/lib/constants";
import { useAsync } from "@/hooks/use-async";
import { plainSummary, timeAgo } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagList } from "@/components/tags";
import { EmptyState, LoadingState } from "@/components/states";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const tags = params.get("tags")?.split(",").filter(Boolean) ?? [];
  const tab = params.get("tab") ?? "themes";
  const [draft, setDraft] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, loading } = useAsync(() => explore({ q, tags }), [q, tags.join(",")]);
  const troubles = useAsync(() => listRecentPublicTroubles(5), []);

  const update = (next: { q?: string; tags?: string[]; tab?: string }) => {
    const p = new URLSearchParams(params);
    const set = (k: string, v: string) => (v ? p.set(k, v) : p.delete(k));
    if (next.q !== undefined) set("q", next.q);
    if (next.tags !== undefined) set("tags", next.tags.join(","));
    if (next.tab !== undefined) set("tab", next.tab === "themes" ? "" : next.tab);
    setParams(p, { replace: true });
  };
  const toggleTag = (t: string) => update({ tags: tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t] });

  const filters = (
    <div className="space-y-5">
      {TAG_GROUPS.map((g) => (
        <fieldset key={g.key}>
          <legend className="mb-2 text-xs font-semibold text-muted-foreground">{g.label}</legend>
          <div className="flex flex-wrap gap-1.5">
            {g.tags.map((t) => {
              const active = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleTag(t)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50 hover:bg-accent",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {tags.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => update({ tags: [] })} className="-ml-2">
          <X />
          絞り込みを解除
        </Button>
      )}
    </div>
  );

  return (
    <div>
      {/* ヒーロー */}
      <section className="border-b bg-ruled">
        <div className="container py-10 sm:py-14">
          <p className="mb-2 font-mono text-xs text-primary">Explore</p>
          <h1 className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
            実験の「途中」を、研究室の外へ。
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            論文には載らない進捗・失敗・困りごとを、研究テーマごとに残して公開できます。
            材料と手法から、同じ分野の研究室を横断して探してみましょう。
          </p>
          <form
            className="mt-6 flex max-w-2xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: draft });
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="研究室名・大学名・テーマ名で検索"
                className="h-11 pl-9"
                aria-label="キーワード検索"
              />
            </div>
            <Button type="submit" className="h-11">
              検索
            </Button>
          </form>
        </div>
      </section>

      <div className="container grid gap-8 py-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        {/* 絞り込み（PC） */}
        <aside className="hidden lg:block">
          <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            タグで絞り込む
          </h2>
          {filters}
        </aside>

        {/* 結果 */}
        <div className="min-w-0">
          {/* 絞り込み（スマホ） */}
          <div className="mb-4 lg:hidden">
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
              <SlidersHorizontal />
              タグで絞り込む{tags.length > 0 && `（${tags.length}）`}
            </Button>
            {filtersOpen && <div className="mt-3 rounded-lg border bg-card p-4">{filters}</div>}
          </div>

          {(tags.length > 0 || q) && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">条件:</span>
              {q && (
                <button onClick={() => (setDraft(""), update({ q: "" }))} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                  「{q}」 <X className="h-3 w-3" />
                </button>
              )}
              {tags.map((t) => (
                <button key={t} onClick={() => toggleTag(t)} className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">
                  {t} <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          <Tabs value={tab} onValueChange={(v) => update({ tab: v })}>
            <TabsList>
              <TabsTrigger value="themes">
                <FolderGit2 />
                研究テーマ
                <Count n={data?.themes.length} />
              </TabsTrigger>
              <TabsTrigger value="labs">
                <Building2 />
                研究室
                <Count n={data?.labs.length} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="themes">
              {loading ? (
                <LoadingState />
              ) : data!.themes.length === 0 ? (
                <EmptyState icon={<Search />} title="条件に合うテーマが見つかりませんでした">
                  タグを減らすか、別のキーワードで探してみてください。
                </EmptyState>
              ) : (
                <ul className="divide-y rounded-lg border bg-card">
                  {data!.themes.map((t) => (
                    <li key={t.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <FolderGit2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                        <Link to={`/labs/${t.lab.slug}`} className="text-muted-foreground hover:text-primary hover:underline">
                          {t.lab.name}
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <Link to={`/labs/${t.lab.slug}/themes/${t.id}`} className="font-semibold text-primary hover:underline">
                          {t.title}
                        </Link>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{plainSummary(t.summary)}</p>
                      <TagList tags={t.tags} className="mt-3" />
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{t.lab.university}</span>
                        <span>担当 {t.owner.grade}</span>
                        {t.publicEntryCount > 0 && <span className="text-trouble">相談中 {t.publicEntryCount}件</span>}
                        {t.lastActivity && <span>最終更新 {timeAgo(t.lastActivity)}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="labs">
              {loading ? (
                <LoadingState />
              ) : data!.labs.length === 0 ? (
                <EmptyState icon={<Search />} title="条件に合う研究室が見つかりませんでした" />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {data!.labs.map((l) => (
                    <li key={l.id}>
                      <Link to={`/labs/${l.slug}`} className="flex h-full flex-col rounded-lg border bg-card p-4 transition-colors hover:border-primary/40">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                            <FlaskConical className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-primary">{l.name}</div>
                            <div className="text-xs text-muted-foreground">{l.university}</div>
                          </div>
                        </div>
                        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{l.description}</p>
                        <TagList tags={l.tags} className="mt-3" />
                        <div className="mt-3 text-xs text-muted-foreground">公開テーマ {l.themeCount}件</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* 相談を待っている困りごと */}
        <aside className="lg:col-start-2 xl:col-start-auto">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <CircleHelp className="h-4 w-4 text-trouble" />
            相談を待っている困りごと
          </h2>
          {troubles.loading ? (
            <LoadingState className="py-6" />
          ) : (
            <ul className="space-y-2">
              {troubles.data!.map((e) => (
                <li key={e.id}>
                  <Link
                    to={`/labs/${e.lab.slug}/themes/${e.theme.id}#entry-${e.id}`}
                    className="block rounded-lg border border-l-4 border-l-trouble/70 bg-card p-3 transition-colors hover:bg-trouble-soft/40"
                  >
                    <p className="line-clamp-3 text-sm leading-relaxed">{e.body}</p>
                    <div className="mt-2 truncate text-xs text-muted-foreground">
                      {e.lab.name}・{e.author.grade}・{timeAgo(e.created_at)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function Count({ n }: { n?: number }) {
  if (n == null) return null;
  return <span className="rounded-full bg-secondary px-1.5 text-xs font-normal tabular-nums text-muted-foreground">{n}</span>;
}
