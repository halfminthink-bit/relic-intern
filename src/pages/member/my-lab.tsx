import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ExternalLink, FlaskConical, KeyRound, Loader2, Plus, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { countLabMembers, formatJoinCode, getJoinCode, regenerateJoinCode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/hooks/use-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CopyButton } from "@/components/copy-button";
import { TagList } from "@/components/tags";

/** 自分の研究室。代表者は参加コードの共有・再発行ができる */
export default function MyLabPage() {
  const { member } = useAuth();
  const [params] = useSearchParams();
  const lab = member!.lab;
  const isAdmin = member!.role === "admin";
  const code = useAsync(() => (isAdmin ? getJoinCode(lab.id) : Promise.resolve(null)), [lab.id, isAdmin]);
  const memberCount = useAsync(() => countLabMembers(lab.id), [lab.id]);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const justCreated = params.get("created") === "1";

  const joinUrl = code.data ? `${window.location.origin}/join/${code.data.code}` : "";

  async function regenerate() {
    setRegenerating(true);
    const next = await regenerateJoinCode(lab.id);
    code.setData({ lab_id: lab.id, code: next });
    setRegenerating(false);
    setConfirmRegen(false);
    toast.success("参加コードを作り直しました", { description: "以前のコードは使えなくなりました。" });
  }

  return (
    <div className="container max-w-2xl space-y-6 py-5 sm:py-8">
      {justCreated && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-accent/60 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-semibold">研究室を作成しました</p>
            <p className="mt-0.5 text-muted-foreground">下の参加コード（またはリンク）をメンバーに共有してください。続けて、あなたのテーマも作りましょう。</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-accent text-accent-foreground">
          <FlaskConical className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{lab.university}</p>
          <h1 className="text-xl font-bold">{lab.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            メンバー {memberCount.data ?? "–"}人・あなたは{isAdmin ? "代表者" : "メンバー"}（{member!.grade}）
          </p>
        </div>
      </div>
      {lab.description && <p className="text-sm leading-relaxed text-foreground/85">{lab.description}</p>}
      <TagList tags={lab.tags} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            参加コード
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAdmin ? (
            <p className="text-sm text-muted-foreground">参加コードは研究室の代表者が管理しています。新しいメンバーを招きたいときは代表者に聞いてください。</p>
          ) : code.loading || !code.data ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md border bg-secondary/60 px-4 py-2 font-mono text-2xl font-medium tracking-[0.2em]">{formatJoinCode(code.data.code)}</span>
                <CopyButton text={formatJoinCode(code.data.code)} label="コードをコピー" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">参加用リンク（開くとコードが入力済みになります）</p>
                <div className="flex gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md border bg-secondary/40 px-3 py-1.5 text-xs leading-6">{joinUrl}</code>
                  <CopyButton text={joinUrl} label="リンクをコピー" className="shrink-0" />
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                コードを知っている人は誰でも参加できます。研究室の外に漏れたときは作り直してください。
              </p>
              <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => setConfirmRegen(true)}>
                <RefreshCw />
                コードを作り直す
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/app/themes/new">
            <Plus />
            テーマを作る
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/labs/${lab.slug}`}>
            <ExternalLink />
            公開ページを見る
          </Link>
        </Button>
      </div>

      <Dialog open={confirmRegen} onOpenChange={setConfirmRegen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>参加コードを作り直しますか？</DialogTitle>
            <DialogDescription>今のコードとリンクは使えなくなります。すでに参加しているメンバーには影響しません。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmRegen(false)}>
              キャンセル
            </Button>
            <Button onClick={regenerate} disabled={regenerating}>
              {regenerating && <Loader2 className="animate-spin" />}
              作り直す
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
