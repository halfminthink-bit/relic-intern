import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Building2, FolderGit2, History, Lock, MessageSquareText, UserRound } from "lucide-react";
import type { Entry, EntryType } from "@/types/db";
import { getPublicTheme } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { Button } from "@/components/ui/button";
import { Readme } from "@/components/readme";
import { TagList } from "@/components/tags";
import { ThemeVisibilityBadge } from "@/components/visibility";
import { EntryTimeline } from "@/components/entry-timeline";
import { EntryTypeFilter, countByType } from "@/components/entry-type-filter";
import { ConsultDialog } from "@/components/consult-dialog";
import { EmptyState, LoadingState } from "@/components/states";
import { ENTRY_TYPE_META, ENTRY_TYPES } from "@/lib/constants";
import { ENTRY_TYPE_STYLE } from "@/components/entry-type";
import NotFoundPage from "@/pages/not-found";

export default function ThemePage() {
  const { slug = "", themeId = "" } = useParams();
  const { hash } = useLocation();
  const { data, loading } = useAsync(() => getPublicTheme(slug, themeId), [slug, themeId]);
  const [filter, setFilter] = useState<EntryType | "all">("all");
  const [consult, setConsult] = useState<{ open: boolean; entry: Entry | null }>({ open: false, entry: null });

  const entries = useMemo(() => (data?.entries ?? []).filter((e) => filter === "all" || e.type === filter), [data, filter]);
  const counts = useMemo(() => countByType(data?.entries ?? []), [data]);

  // 「相談を待っている困りごと」から来たとき、該当の記録までスクロール
  useEffect(() => {
    if (!data || !hash) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-trouble/50");
      setTimeout(() => el.classList.remove("ring-2", "ring-trouble/50"), 2400);
    }
  }, [data, hash]);

  if (loading) return <LoadingState />;
  if (!data) return <NotFoundPage message="このテーマは存在しないか、公開されていません。" />;
  const { theme } = data;
  const openConsult = (entry: Entry | null = null) => setConsult({ open: true, entry });

  return (
    <div>
      {/* GitHub のリポジトリヘッダー相当 */}
      <section className="border-b bg-card">
        <div className="container py-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg sm:text-xl">
            <FolderGit2 className="h-5 w-5 text-muted-foreground" aria-hidden />
            <Link to={`/labs/${theme.lab.slug}`} className="text-primary hover:underline">
              {theme.lab.name}
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-bold">{theme.title}</h1>
            <ThemeVisibilityBadge visibility={theme.visibility} className="ml-1" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <TagList tags={theme.tags} asLink />
            <Button onClick={() => openConsult()} className="w-full sm:w-auto">
              <MessageSquareText />
              このテーマについて相談する
            </Button>
          </div>
        </div>
      </section>

      <div className="container grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-8">
          <Readme text={theme.summary} />

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <History className="h-4 w-4 text-muted-foreground" />
              記録
            </h2>
            {theme.visibility !== "public" ? (
              <EmptyState icon={<Lock />} title="記録は公開されていません">
                このテーマは「概要のみ公開」です。詳しく知りたい場合は担当者に相談してみてください。
              </EmptyState>
            ) : data.entries.length === 0 ? (
              <EmptyState title="公開されている記録はまだありません" />
            ) : (
              <>
                <EntryTypeFilter value={filter} onChange={setFilter} counts={counts} />
                <div className="mt-4">
                  {entries.length === 0 ? (
                    <EmptyState title={`「${filter === "all" ? "" : ENTRY_TYPE_META[filter].label}」の記録はありません`} />
                  ) : (
                    <EntryTimeline
                      entries={entries}
                      renderActions={(e) => (
                        <Button
                          variant={e.type === "trouble" ? "outline" : "ghost"}
                          size="sm"
                          onClick={() => openConsult(e)}
                          className={e.type === "trouble" ? "border-trouble/40 text-trouble hover:bg-trouble-soft hover:text-trouble" : "text-muted-foreground"}
                        >
                          <MessageSquareText />
                          {e.type === "trouble" ? "アドバイスする" : "この記録について相談"}
                        </Button>
                      )}
                    />
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">このテーマについて</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <Link to={`/labs/${theme.lab.slug}`} className="text-primary hover:underline">
                    {theme.lab.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{theme.lab.university}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                担当 {theme.owner.grade}
              </div>
            </dl>
            {theme.visibility === "public" && (
              <ul className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
                {ENTRY_TYPES.map((t) => {
                  const Icon = ENTRY_TYPE_STYLE[t].icon;
                  return (
                    <li key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className={`h-3.5 w-3.5 ${ENTRY_TYPE_STYLE[t].text}`} />
                      {ENTRY_TYPE_META[t].label}
                      <span className="ml-auto font-mono tabular-nums text-foreground">{counts[t]}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-dashed bg-accent/40 p-4 text-sm">
            <p className="font-medium">同じ分野の研究者ですか？</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              似た経験や試した条件の共有は、学生にとって大きな助けになります。メールアドレスは担当者にのみ届きます。
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => openConsult()}>
              相談・アドバイスを送る
            </Button>
          </div>
        </aside>
      </div>

      <ConsultDialog open={consult.open} onOpenChange={(open) => setConsult((c) => ({ ...c, open }))} theme={theme} entry={consult.entry} />
    </div>
  );
}
