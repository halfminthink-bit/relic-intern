import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Mail, MailCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { resetMockData } from "@/lib/api";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const { member, signInWithMagicLink, signInAsDemo } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/app/themes";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  if (member) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    await signInWithMagicLink(email);
    setStatus("sent");
  }

  async function demo() {
    await signInAsDemo();
    navigate(from, { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ruled px-4 py-10">
      <Logo className="mb-6" />
      <Card className="w-full max-w-sm">
        {status === "sent" ? (
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <MailCheck className="h-10 w-10 text-primary" />
            <CardTitle>メールを確認してください</CardTitle>
            <CardDescription>
              <span className="font-medium text-foreground">{email}</span> にログイン用のリンクを送りました。
              リンクを開くとログインが完了します。
            </CardDescription>
            <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
              別のアドレスで送り直す
            </Button>
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground">これはUIのみのデモです。下のボタンでログイン後の画面を確認できます。</p>
            <Button className="w-full" onClick={demo}>
              デモメンバーとしてログイン
            </Button>
          </CardContent>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">メンバーログイン</CardTitle>
              <CardDescription>パスワードは不要です。メールに届くリンクからログインします。</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="email">大学のメールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.ac.jp"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={status === "sending"} className="h-10">
                  {status === "sending" ? <Loader2 className="animate-spin" /> : <Mail />}
                  ログインリンクを送信
                </Button>
              </form>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <Separator className="flex-1" />
                デモ
                <Separator className="flex-1" />
              </div>
              <Button variant="outline" className="w-full" onClick={demo}>
                デモメンバー（M2）としてログイン
              </Button>
              <button
                type="button"
                onClick={async () => {
                  await resetMockData();
                  toast.success("デモデータを初期状態に戻しました");
                }}
                className="mx-auto mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                デモデータをリセット
              </button>
            </CardContent>
          </>
        )}
      </Card>
      <Link to="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground hover:underline">
        ← ログインせずに研究を探す
      </Link>
    </div>
  );
}
