import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTheme } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagPicker } from "@/components/tag-picker";

/** テーマを作る。タグは研究室のものを引き継ぎ、必要なら足し引きする */
export default function NewThemePage() {
  const { member } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState<string[]>(member!.lab.tags);
  const [saving, setSaving] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const theme = await createTheme({ title: title.trim(), summary: summary.trim(), tags }, member!);
      localStorage.setItem("labtrail:last-theme", theme.id);
      toast.success("テーマを作りました", { description: "さっそく最初のメモを書いてみましょう。" });
      navigate(`/app/new?theme=${theme.id}`);
    } catch {
      toast.error("作成できませんでした。もう一度お試しください。");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="container max-w-xl space-y-6 py-5 sm:py-8">
      {params.get("joined") === "1" ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-accent/60 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-semibold">{member!.lab.name} に参加しました</p>
            <p className="mt-0.5 text-muted-foreground">まずはあなたの研究テーマを1つ作りましょう。</p>
          </div>
        </div>
      ) : (
        <Link to="/app/themes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          マイテーマ
        </Link>
      )}

      <div>
        <h1 className="text-xl font-bold">テーマを作る</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          テーマのタイトル・概要・タグと担当の学年（{member!.grade}）は外部に公開されます。記録は非公開のままです。
        </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
        <div className="grid gap-1.5">
          <Label htmlFor="theme-title">タイトル</Label>
          <Input id="theme-title" required placeholder="例：ゲルカラムによる単層CNTのカイラリティ分離" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="theme-summary">ひとこと説明</Label>
          <Textarea
            id="theme-summary"
            rows={3}
            placeholder="何を目指しているか、1〜2文で（あとから書き足せます）"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">タグ（研究室から引き継ぎ）</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setTagsOpen((o) => !o)} aria-expanded={tagsOpen}>
            {tagsOpen ? "閉じる" : "変更する"}
          </Button>
        </div>
        {tagsOpen ? (
          <TagPicker value={tags} onChange={setTags} />
        ) : (
          <p className="text-sm text-muted-foreground">{tags.length ? tags.join("・") : "タグなし"}</p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={saving || !title.trim()}>
        {saving && <Loader2 className="animate-spin" />}
        テーマを作って書き始める
      </Button>
    </form>
  );
}
