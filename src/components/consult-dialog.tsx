import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { Entry, Theme } from "@/types/db";
import { createConsultRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EntryTypeBadge } from "@/components/entry-type";

const empty = { from_name: "", from_affiliation: "", from_email: "", message: "" };

/** 「相談する」フォーム。entry を渡すとその記録についての相談になる */
export function ConsultDialog({
  open,
  onOpenChange,
  theme,
  entry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
  entry?: Entry | null;
}) {
  const [form, setForm] = useState(empty);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) setSent(false);
  }, [open]);

  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await createConsultRequest({ theme_id: theme.id, entry_id: entry?.id ?? null, ...form });
      setSent(true);
      setForm(empty);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden />
            <DialogTitle>相談を送信しました</DialogTitle>
            <DialogDescription>
              テーマの担当者に届きました。返信はご入力のメールアドレス宛てに届きます。
            </DialogDescription>
            <Button variant="outline" className="mt-2" onClick={() => onOpenChange(false)}>
              閉じる
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>相談する</DialogTitle>
              <DialogDescription>
                「{theme.title}」の担当者にメッセージを送ります。メールアドレスは担当者にのみ共有されます。
              </DialogDescription>
            </DialogHeader>

            {entry && (
              <div className="rounded-md border bg-secondary/50 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <EntryTypeBadge type={entry.type} />
                  この記録についての相談
                </div>
                <p className="line-clamp-3 text-foreground/80">{entry.body}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="cr-name">お名前</Label>
                <Input id="cr-name" required value={form.from_name} onChange={set("from_name")} autoComplete="name" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cr-aff">所属・学年</Label>
                <Input id="cr-aff" required placeholder="例：〇〇大学 △△研究室 M1" value={form.from_affiliation} onChange={set("from_affiliation")} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cr-email">メールアドレス</Label>
              <Input id="cr-email" type="email" required value={form.from_email} onChange={set("from_email")} autoComplete="email" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cr-msg">メッセージ</Label>
              <Textarea
                id="cr-msg"
                required
                rows={5}
                placeholder="似た経験・試した条件・参考文献など、気軽に書いてください。"
                value={form.message}
                onChange={set("message")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? <Loader2 className="animate-spin" /> : <Send />}
                送信する
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
