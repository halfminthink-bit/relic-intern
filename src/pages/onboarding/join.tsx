import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Grade, Lab } from "@/types/db";
import { findLabByJoinCode, formatJoinCode, joinLab, normalizeJoinCode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagList } from "@/components/tags";
import { GradeSelect } from "./grade-select";
import { setNextPath } from "./onboarding-layout";

/** 参加コードで研究室に参加する。/join/:code のリンクから来た場合はコードが入力済みになる */
export default function JoinLabPage() {
  const { code: codeParam = "" } = useParams();
  const { session, refresh } = useAuth();
  const [code, setCode] = useState(codeParam ? formatJoinCode(normalizeJoinCode(codeParam)) : "");
  const [lab, setLab] = useState<Lab | null>(null);
  const [checking, setChecking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [grade, setGrade] = useState<Grade | "">("");
  const [joining, setJoining] = useState(false);

  async function lookup(value = code) {
    setChecking(true);
    setNotFound(false);
    const found = await findLabByJoinCode(value);
    setLab(found);
    setNotFound(!found);
    setChecking(false);
  }

  // リンクから来たときは自動で確認
  useEffect(() => {
    if (codeParam) void lookup(codeParam);
  }, [codeParam]);

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    if (!grade) return;
    setJoining(true);
    try {
      await joinLab(code, { userId: session!.userId, grade });
      setNextPath("/app/themes/new?joined=1");
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setJoining(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/welcome" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          戻る
        </Link>
        <h1 className="text-xl font-bold">参加コードで研究室に参加する</h1>
        <p className="mt-1 text-sm text-muted-foreground">研究室の代表者から受け取ったコードを入力してください。</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup();
        }}
        className="space-y-2 rounded-lg border bg-card p-4 sm:p-5"
      >
        <Label htmlFor="join-code">参加コード</Label>
        <div className="flex gap-2">
          <Input
            id="join-code"
            required
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="ABCD-2345"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setLab(null);
              setNotFound(false);
            }}
            className="font-mono text-lg tracking-widest"
          />
          <Button type="submit" variant="outline" disabled={checking || normalizeJoinCode(code).length < 8}>
            {checking && <Loader2 className="animate-spin" />}
            確認
          </Button>
        </div>
        {notFound && <p className="text-sm text-destructive">このコードの研究室が見つかりません。コードを確認してください。</p>}
      </form>

      {lab && (
        <form onSubmit={onJoin} className="space-y-5 rounded-lg border border-primary/40 bg-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <FlaskConical className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{lab.university}</p>
              <p className="font-semibold">{lab.name}</p>
              <TagList tags={lab.tags} className="mt-2" />
            </div>
          </div>
          <GradeSelect value={grade} onChange={setGrade} />
          <Button type="submit" size="lg" className="w-full" disabled={joining || !grade}>
            {joining && <Loader2 className="animate-spin" />}
            この研究室に参加する
          </Button>
        </form>
      )}
    </div>
  );
}
