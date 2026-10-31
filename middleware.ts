/**
 * Vercel Routing Middleware: サイト全体にパスワード（Basic認証）をかけて、外部から見られないようにする。
 *
 * - Vercel の環境変数 SITE_BASIC_AUTH に「ID:パスワード」（例: labtrail:xxxxxxxx）を設定すると、その組み合わせで入れる
 * - SITE_BASIC_AUTH が未設定のときは、誰も入れない（設定し忘れて公開されてしまうのを防ぐ）
 * - 公開に戻すときは、このファイルを削除する
 *
 * ローカルの `npm run dev` / `vite preview` では動かない（Vercel 上でのみ有効）。
 */
import { next } from "@vercel/functions";

export const config = {
  // すべてのパス（静的ファイルを含む）に適用
  matcher: "/:path*",
};

const REALM = "LabTrail (private)";

export default function middleware(request: Request) {
  const expected = process.env.SITE_BASIC_AUTH;
  const header = request.headers.get("authorization") ?? "";

  if (expected && header.startsWith("Basic ")) {
    let given = "";
    try {
      given = atob(header.slice("Basic ".length));
    } catch {
      /* 壊れたヘッダーは不一致として扱う */
    }
    if (safeEqual(given, expected)) return next();
  }

  return new Response("このサイトは現在非公開です。", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** 長さ・内容の比較で処理時間が変わらないようにした文字列比較 */
function safeEqual(a: string, b: string) {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
