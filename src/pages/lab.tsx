import { Link, useParams } from "react-router-dom";
import { FlaskConical, FolderGit2, Users } from "lucide-react";
import { getPublicLab } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { plainSummary, timeAgo } from "@/lib/format";
import { TagList } from "@/components/tags";
import { ThemeVisibilityBadge } from "@/components/visibility";
import { EmptyState, LoadingState } from "@/components/states";
import NotFoundPage from "@/pages/not-found";

export default function LabPage() {
  const { slug = "" } = useParams();
  const { data, loading } = useAsync(() => getPublicLab(slug), [slug]);

  if (loading) return <LoadingState />;
  if (!data) return <NotFoundPage message="この研究室は存在しないか、公開されていません。" />;
  const { lab, themes, gradeCounts } = data;

  return (
    <div>
      <section className="border-b bg-card">
        <div className="container py-8">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-accent text-accent-foreground">
              <FlaskConical className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{lab.university}</p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{lab.name}</h1>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-foreground/85">{lab.description}</p>
          <TagList tags={lab.tags} asLink className="mt-4" />
        </div>
      </section>

      <div className="container grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <FolderGit2 className="h-4 w-4 text-muted-foreground" />
            研究テーマ
            <span className="rounded-full bg-secondary px-2 text-xs font-normal text-muted-foreground">{themes.length}</span>
          </h2>
          {themes.length === 0 ? (
            <EmptyState title="公開中のテーマはまだありません" />
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {themes.map((t) => (
                <li key={t.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/labs/${lab.slug}/themes/${t.id}`} className="font-semibold text-primary hover:underline">
                      {t.title}
                    </Link>
                    <ThemeVisibilityBadge visibility={t.visibility} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{plainSummary(t.summary)}</p>
                  <TagList tags={t.tags} className="mt-3" />
                  <div className="mt-3 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    <span>担当 {t.owner.grade}</span>
                    {t.visibility === "public" && <span>公開記録 {t.publicEntryCount}件</span>}
                    {t.lastActivity && <span>最終更新 {timeAgo(t.lastActivity)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-muted-foreground" />
              メンバー構成
            </h2>
            <ul className="flex flex-wrap gap-2">
              {gradeCounts.map((g) => (
                <li key={g.grade} className="rounded-md border bg-card px-2.5 py-1 text-sm">
                  {g.grade}
                  <span className="ml-1 text-xs text-muted-foreground">×{g.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">外部には学年のみ表示しています。</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
