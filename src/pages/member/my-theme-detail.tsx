import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, History, PenLine, Sprout } from "lucide-react";
import { toast } from "sonner";
import type { EntryType, ThemeVisibility } from "@/types/db";
import { getThemeForMember, listActivity, listThemeEntries, updateEntryVisibility, updateThemeVisibility } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { THEME_VISIBILITY_META } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ContributionGraph } from "@/components/contribution-graph";
import { EntryTimeline } from "@/components/entry-timeline";
import { EntryTypeFilter, countByType } from "@/components/entry-type-filter";
import { TagList } from "@/components/tags";
import { ThemeVisibilitySelector } from "@/components/visibility";
import { EmptyState, LoadingState } from "@/components/states";
import NotFoundPage from "@/pages/not-found";
import { cn } from "@/lib/utils";

export default function MyThemeDetailPage() {
  const { themeId = "" } = useParams();
  const theme = useAsync(() => getThemeForMember(themeId), [themeId]);
  const entries = useAsync(() => listThemeEntries(themeId), [themeId]);
  const activity = useAsync(() => listActivity({ themeId }), [themeId]);
  const [filter, setFilter] = useState<EntryType | "all">("all");

  const filtered = useMemo(() => (entries.data ?? []).filter((e) => filter === "all" || e.type === filter), [entries.data, filter]);
  const counts = useMemo(() => countByType(entries.data ?? []), [entries.data]);

  if (theme.loading) return <LoadingState />;
  if (!theme.data) return <NotFoundPage message="テーマが見つかりませんでした。" />;
  const t = theme.data;
  const externallyVisible = t.lab.is_public && t.visibility !== "private";

  async function changeVisibility(v: ThemeVisibility) {
    theme.setData({ ...t, visibility: v });
    await updateThemeVisibility(t.id, v);
    toast.success(`公開範囲を「${THEME_VISIBILITY_META[v].label}」にしました`);
  }

  async function toggleEntry(id: string, isPublic: boolean) {
    entries.setData((xs) => xs?.map((e) => (e.id === id ? { ...e, is_public: isPublic } : e)));
    await updateEntryVisibility(id, isPublic);
  }

  return (
    <div className="container max-w-4xl space-y-6 py-5 sm:py-8">
      <div>
        <Link to="/app/themes" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          マイテーマ
        </Link>
        <h1 className="text-xl font-bold leading-snug">{t.title}</h1>
        <TagList tags={t.tags} className="mt-2" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to={`/app/new?theme=${t.id}`}>
              <PenLine />
              このテーマに記録する
            </Link>
          </Button>
          {externallyVisible && (
            <Button asChild size="sm" variant="outline">
              <Link to={`/labs/${t.lab.slug}/themes/${t.id}`}>
                <ExternalLink />
                公開ページを見る
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">テーマの公開範囲</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ThemeVisibilitySelector value={t.visibility} onChange={changeVisibility} />
          <p className="text-xs text-muted-foreground">{THEME_VISIBILITY_META[t.visibility].description}</p>
          {!t.lab.is_public && (
            <p className="text-xs text-trouble">研究室が非公開のため、現在はどの設定でも外部には表示されません。</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sprout className="h-4 w-4 text-primary" />
            このテーマの記録
          </CardTitle>
        </CardHeader>
        <CardContent>{activity.loading ? <LoadingState className="py-8" /> : <ContributionGraph timestamps={activity.data!} weeks={26} />}</CardContent>
      </Card>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <History className="h-4 w-4 text-muted-foreground" />
          タイムライン
        </h2>
        {entries.loading ? (
          <LoadingState />
        ) : entries.data!.length === 0 ? (
          <EmptyState title="まだ記録がありません">実験の合間に、まずは一行メモから始めてみましょう。</EmptyState>
        ) : (
          <>
            <EntryTypeFilter value={filter} onChange={setFilter} counts={counts} />
            <div className="mt-4">
              <EntryTimeline
                entries={filtered}
                renderMeta={(e) => {
                  const effective = e.is_public && t.visibility === "public" && t.lab.is_public;
                  return (
                    <label className="flex cursor-pointer items-center gap-2" title={e.is_public && !effective ? "テーマ／研究室が非公開のため外部には表示されません" : undefined}>
                      <span className={cn("text-xs", e.is_public ? "text-primary" : "text-muted-foreground", e.is_public && !effective && "line-through decoration-muted-foreground")}>
                        {e.is_public ? "公開" : "非公開"}
                      </span>
                      <Switch checked={e.is_public} onCheckedChange={(v) => toggleEntry(e.id, v)} aria-label="この記録を公開する" size="sm" />
                    </label>
                  );
                }}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
