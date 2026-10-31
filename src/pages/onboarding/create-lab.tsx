import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Grade } from "@/types/db";
import { createLab } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagPicker } from "@/components/tag-picker";
import { GradeSelect } from "./grade-select";
import { setNextPath } from "./onboarding-layout";

export default function CreateLabPage() {
  const { session, refresh } = useAuth();
  const [form, setForm] = useState({ name: "", university: "", description: "" });
  const [tags, setTags] = useState<string[]>([]);
  const [grade, setGrade] = useState<Grade | "">("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!grade) return;
    setSaving(true);
    try {
      await createLab({ ...form, tags }, { userId: session!.userId, grade });
      setNextPath("/app/lab?created=1");
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <Link to="/welcome" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          戻る
        </Link>
        <h1 className="text-xl font-bold">研究室を作る</h1>
        <p className="mt-1 text-sm text-muted-foreground">作成したあなたが研究室の代表者になります。研究室の名前・概要・タグは外部に公開されます。</p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
        <div className="grid gap-1.5">
          <Label htmlFor="lab-name">研究室名</Label>
          <Input id="lab-name" required placeholder="例：ナノカーボン材料研究室" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lab-univ">大学・学部</Label>
          <Input id="lab-univ" required placeholder="例：〇〇大学 工学部" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lab-desc">研究室の紹介</Label>
          <Textarea
            id="lab-desc"
            rows={3}
            placeholder="どんな材料・手法を扱っているか、1〜2文で"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border bg-card p-4 sm:p-5">
        <p className="text-sm font-medium">分野のタグ</p>
        <p className="text-xs text-muted-foreground">ここで一度付ければ、テーマを作るときに引き継がれます。外部からの検索に使われます。</p>
        <TagPicker value={tags} onChange={setTags} />
      </div>

      <div className="rounded-lg border bg-card p-4 sm:p-5">
        <GradeSelect value={grade} onChange={setGrade} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={saving || !grade}>
        {saving && <Loader2 className="animate-spin" />}
        研究室を作成して参加コードを発行
      </Button>
    </form>
  );
}
