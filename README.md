# LabTrail（仮）— 実験研究のためのGitHub

実験系研究室のための、研究の経過を残して研究室の外とつながるプラットフォームのUIプロトタイプです。
「研究室（Organization）→ 研究テーマ（Repository）→ 記録（Commit）」の階層で、実験の合間にメモを残し、
困ったときだけ「相談に出す」と、同じ分野の他大学の研究者から相談を受けられます。

> 現在はバックエンド未接続で、モックデータ（すべて架空のサンプル）で動作します。
> 投稿や設定の変更はブラウザの localStorage に保存されます（ログイン画面の「デモデータをリセット」で初期化）。

## 起動

```bash
npm install
npm run dev
```

ログイン画面のデモボタンで、2通りの入り方を試せます。

- **既存メンバーとして試す** … ナノカーボン材料研究室の代表者（M2）。記録・相談がすでに入った状態
- **新規ユーザーとして試す** … 研究室の作成（代表者）や、参加コードでの参加から始める
  （モックの参加コード例：`NANO-2403` = 北杜大学 二次元材料研究室）

## 公開範囲（Vercel）

現在、デプロイ先は `middleware.ts`（Vercel Routing Middleware）で**サイト全体にパスワードをかけて非公開**にしています。

- Vercel の Settings → Environment Variables に `SITE_BASIC_AUTH` を「ID:パスワード」の形（例: `labtrail:長めのパスワード`）で追加し、再デプロイすると、その組み合わせで入れる
- `SITE_BASIC_AUTH` が未設定のあいだは誰も入れない
- 公開に戻すときは `middleware.ts` を削除する

## 使い方の流れ

1. **代表者が研究室を作る**（名前・大学・紹介・分野タグ・学年）→ 参加コードとリンクが発行される
2. **メンバーは参加コード（リンク）で参加**し、自分のテーマを作る（タグは研究室から引き継ぎ）
3. **ふだんはメモを書くだけ**（本文・写真1枚・保存）。テーマは前回のものが自動で選ばれる
4. **困ったら、記録一覧から「相談に出す」** → 公開され、外部から相談が届く。「相談を取り下げる」で非公開に戻る

## 技術スタック

| 用途 | 採用 | 理由 |
| --- | --- | --- |
| ビルド | **Vite 5 + React 18 + TypeScript** | Bolt の標準テンプレートと同じ構成。SPA なので Supabase と直接つなげやすい |
| スタイル | **Tailwind CSS 3** | shadcn/ui との相性が最も安定している v3 系 |
| UI部品 | **shadcn/ui**（Radix UI ベース） | `src/components/ui/` にコードとして同梱。`components.json` もあるので `npx shadcn add` で追加可能 |
| ルーティング | React Router 6 | |
| アイコン／トースト | lucide-react／sonner | shadcn/ui 標準 |
| ホスティング | Vercel | `vercel.json` で SPA のルーティングを設定済み。`main` へのマージで自動デプロイ。`middleware.ts` でサイト全体を Basic 認証で非公開にしている |
| バックエンド（予定） | Supabase（Auth: マジックリンク / Postgres / Storage） | `supabase/schema.sql` にテーブル・RLS・RPC のたたき台 |

## サイトマップ

```
外部向け（ログイン不要）
├── /                               探す：キーワード＋材料タグ（手法・区分は「絞り込み」の中）
│                                   「相談を待っている困りごと」と、研究室ごとのテーマ一覧
├── /labs/:slug                     研究室ページ：紹介・タグ・テーマ一覧・メンバー構成（学年のみ）
└── /labs/:slug/themes/:themeId     テーマページ：概要・相談中の記録・「相談する」フォーム

/login                              ログイン（メールのマジックリンク、UIのみ）＋デモログイン

ログイン済み・研究室に未所属
├── /welcome                        研究室を作る（代表者）／参加コードで参加する を選ぶ
├── /welcome/create-lab             研究室の作成 → 参加コード発行
└── /join, /join/:code              参加コードで参加（リンクから来るとコード入力済み）

メンバー向け（スマホ優先、スマホでは下部タブ）
├── /app/new                        記録する：本文・写真1枚・保存のみ（テーマは前回のものを自動選択）
├── /app/themes                     マイテーマ：草（記録の継続）・担当テーマ一覧
├── /app/themes/new                 テーマを作る（タグは研究室から引き継ぎ）
├── /app/themes/:themeId            テーマ詳細：草・記録一覧（相談に出す／相談を取り下げる）
├── /app/lab                        研究室：参加コードの共有・再発行（代表者のみ）
└── /app/consults                   相談一覧：自分のテーマに届いた相談（メールで返信）
```

## 仕様のポイント

- **公開の考え方**
  - 研究室とテーマの「存在」（名前・概要・タグ・担当の学年）は常に公開
  - 記録は既定で全部非公開のメモ。「相談に出す」を押したものだけ公開（`type = trouble` / `is_public = true`）
  - 外部には学年だけを表示。`members` テーブル自体に氏名を持たせていない
- **研究室と参加コード**
  - 研究室を作った人が代表者（`role = admin`）。参加コードは大文字英数字8桁（紛らわしい 0/O/1/I は使わない）
  - コードは外部に漏れないよう `lab_join_codes` という別テーブルに置き、代表者だけが読める
- **画像**
  - 1記録1枚まで。アップロード前にブラウザで長辺1200px・WebP（品質0.7）に圧縮（WebP 非対応ブラウザは JPEG）
  - canvas で描き直すため、撮影位置などの EXIF は残らない
  - 一覧は長辺400pxのサムネイル（タップで拡大）、遅延読み込み

## ディレクトリ構成

```
src/
├── types/db.ts          Supabase テーブルに対応する型（labs / members / themes / entries / consult_requests / lab_join_codes）
├── lib/api.ts           データアクセス層（画面はここだけを呼ぶ。Supabase 版のクエリ例をコメントで記載）
├── lib/auth.tsx         認証（モック）。signInWithOtp / onAuthStateChange に差し替える
├── lib/image.ts         画像圧縮（WebP・EXIF除去）
├── lib/constants.ts     タグ・記録の種類・画像設定
├── data/mock.ts         モックデータ（研究室10件、テーマ16件、記録、参加コード）
├── components/ui/       shadcn/ui コンポーネント
├── components/          タイムライン・草グラフ・相談フォーム・タグ選択など
└── pages/               画面（pages/member/ がログイン後、pages/onboarding/ が研究室の作成・参加）
supabase/schema.sql      テーブル定義・RLS・研究室の作成／参加の RPC のたたき台
```

## Supabase への差し替え手順（予定）

1. `supabase/schema.sql` を SQL Editor で実行し、Storage に `attachments` バケットを作成
2. `npm i @supabase/supabase-js`、`.env.example` を `.env` にコピーして URL / anon key を設定（Vercel の環境変数にも同じものを設定）
3. `src/lib/api.ts` の各関数の中身を supabase-js の呼び出しに置き換える（関数のシグネチャと戻り値の型はそのまま）。
   研究室の作成・参加は `create_lab` / `lookup_lab_by_code` / `join_lab` の RPC を呼ぶ
4. `src/lib/auth.tsx` を `supabase.auth.signInWithOtp` / `onAuthStateChange` に置き換える
