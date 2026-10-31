import { Link } from "react-router-dom";
import { ChevronRight, FolderGit2, PenLine, Sprout } from "lucide-react";
import { listActivity, listMyThemes } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/hooks/use-async";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContributionGraph } from "@/components/contribution-graph";
import { TagList } from "@/components/tags";
import { EmptyState, LoadingState } from "@/components/states";

export default function MyThemesPage() {
  const { member } = useAuth();
  const themes = useAsync(() => listMyThemes(member!.id), [member!.id]);
  const activity = useAsync(() => listActivity({ authorId: member!.id }), [member!.id]);

  return (
    <div className="container max-w-4xl space-y-6 py-5 sm:py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{member!.lab.university}・{member!.lab.name}</p>
          <h1 className="text-xl font-bold">マイテーマ</h1>
        </div>
        <Button asChild size="sm" className="hidden md:inline-flex">
          <Link to="/app/new">
            <PenLine />
            記録する
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sprout className="h-4 w-4 text-primary" />
            記録の継続
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.loading ? <LoadingState className="py-8" /> : <ContributionGraph timestamps={activity.data!} weeks={30} />}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <FolderGit2 className="h-4 w-4 text-muted-foreground" />
          担当しているテーマ
        </h2>
        {themes.loading ? (
          <LoadingState />
        ) : themes.data!.length === 0 ? (
          <EmptyState title="担当しているテーマはまだありません" />
        ) : (
          <ul className="space-y-3">
            {themes.data!.map((t) => (
              <li key={t.id}>
                <Link to={`/app/themes/${t.id}`} className="group block rounded-lg border bg-card p-4 transition-colors hover:border-primary/40">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold leading-snug text-primary group-hover:underline">{t.title}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <TagList tags={t.tags} />
                      </div>
                    </div>
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>記録 {t.entryCount}件</span>
                    {t.publicEntryCount > 0 && <span className="text-trouble">相談中 {t.publicEntryCount}件</span>}
                    {t.lastActivity && <span>最終記録 {timeAgo(t.lastActivity)}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
