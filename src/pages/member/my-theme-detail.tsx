import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, History, Inbox, Loader2, MessageCircleQuestion, PenLine, Sprout, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { EntryType } from "@/types/db";
import { getThemeForMember, listActivity, listThemeEntries, setEntryConsultation } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/hooks/use-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContributionGraph } from "@/components/contribution-graph";
import { EntryTimeline } from "@/components/entry-timeline";
import { EntryTypeFilter, countByType } from "@/components/entry-type-filter";
import { TagList } from "@/components/tags";
import { EmptyState, LoadingState } from "@/components/states";
import NotFoundPage from "@/pages/not-found";

type Entries = NonNullable<Awaited<ReturnType<typeof listThemeEntries>>>;

export default function MyThemeDetailPage() {
  const { themeId = "" } = useParams();
  const { member } = useAuth();
  const theme = useAsync(() => getThemeForMember(themeId), [themeId]);
  const entries = useAsync(() => listThemeEntries(themeId), [themeId]);
  const activity = useAsync(() => listActivity({ themeId }), [themeId]);
  const [filter, setFilter] = useState<EntryType | "all">("all");
  const [confirming, setConfirming] = useState<Entries[number] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => (entries.data ?? []).filter((e) => filter === "all" || e.type === filter), [entries.data, filter]);
  const counts = useMemo(() => countByType(entries.data ?? []), [entries.data]);

  if (theme.loading) return <LoadingState />;
  if (!theme.data) return <NotFoundPage message="テーマが見つかりませんでした。" />;
  const t = theme.data;

  async function setConsultation(id: string, open: boolean) {
    setBusyId(id);
    try {
      await setEntryConsultation(id, open);
      entries.setData((xs) => xs?.map((e) => (e.id === id ? { ...e, type: open ? "trouble" : "memo", is_public: open } : e)));
      if (open) {
        toast.success("相談に出しました", { description: "テーマの公開ページに表示され、外部から相談を受け付けます。" });
      } else {
        toast("相談を取り下げました", {
          description: "非公開のメモに戻しました。",
          action: { label: "元に戻す", onClick: () => void setConsultation(id, true) },
        });
      }
    } finally {
      setBusyId(null);
    }
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
          <Button asChild size="sm" variant="outline">
            <Link to={`/labs/${t.lab.slug}/themes/${t.id}`}>
              <ExternalLink />
              公開ページを見る
            </Link>
          </Button>
        </div>
      </div>

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
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
          <History className="h-4 w-4 text-muted-foreground" />
          記録
        </h2>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          記録はすべて研究室内だけで見えるメモです。「相談に出す」を押した記録だけが公開され、外部の研究者から相談・アドバイスを受けられます。
        </p>
        {entries.loading && !entries.data ? (
          <LoadingState />
        ) : entries.data!.length === 0 ? (
          <EmptyState title="まだ記録がありません">実験の合間に、まずは一行メモから始めてみましょう。</EmptyState>
        ) : (
          <>
            <EntryTypeFilter value={filter} onChange={setFilter} counts={counts} />
            <div className="mt-4">
              {filtered.length === 0 ? (
                <EmptyState icon={<MessageCircleQuestion />} title="相談中の記録はありません">
                  困っている記録の「相談に出す」を押すと、ここに表示されます。
                </EmptyState>
              ) : (
                <EntryTimeline
                  entries={filtered}
                  renderActions={(e) =>
                    e.type === "trouble" ? (
                      <>
                        {e.consultCount > 0 && (
                          <Button asChild variant="ghost" size="sm" className="text-trouble hover:text-trouble">
                            <Link to="/app/consults">
                              <Inbox />
                              相談 {e.consultCount}件
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-muted-foreground"
                          disabled={busyId === e.id}
                          onClick={() => setConsultation(e.id, false)}
                        >
                          {busyId === e.id ? <Loader2 className="animate-spin" /> : <Undo2 />}
                          相談を取り下げる
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto border-trouble/40 text-trouble hover:bg-trouble-soft hover:text-trouble"
                        onClick={() => setConfirming(e)}
                      >
                        <MessageCircleQuestion />
                        相談に出す
                      </Button>
                    )
                  }
                />
              )}
            </div>
          </>
        )}
      </section>

      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>この記録を相談に出しますか？</DialogTitle>
            <DialogDescription>
              テーマの公開ページに表示され、同じ分野の研究者から相談・アドバイスを受け付けます。いつでも取り下げられます。
            </DialogDescription>
          </DialogHeader>
          {confirming && (
            <div className="rounded-md border bg-secondary/50 p-3 text-sm">
              <p className="line-clamp-4 whitespace-pre-wrap">{confirming.body}</p>
              {confirming.attachments.some((a) => a.kind === "image") && <p className="mt-2 text-xs text-muted-foreground">添付の写真も公開されます。</p>}
            </div>
          )}
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>・外部には学年（{member!.grade}）だけが表示され、名前は出ません</li>
            <li>・届いた相談は「相談」タブで確認できます</li>
          </ul>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              キャンセル
            </Button>
            <Button
              className="bg-trouble text-white hover:bg-trouble/90"
              onClick={() => {
                const id = confirming!.id;
                setConfirming(null);
                void setConsultation(id, true);
              }}
            >
              <MessageCircleQuestion />
              相談に出す
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
