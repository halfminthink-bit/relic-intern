# LabTrail（仮）— 実験研究のためのGitHub

実験系研究室のための、研究の経過を残して研究室の外とつながるプラットフォームのUIプロトタイプです。
「研究室（Organization）→ 研究テーマ（Repository）→ 記録（Commit / Issue）」の階層で、
進捗・困りごと・達成・メモを写真やデータと一緒に時系列で残せます。

> 現在はバックエンド未接続で、モックデータ（すべて架空のサンプル）で動作します。
> 投稿・公開設定の変更などはブラウザの localStorage に保存されます（ログイン画面の「デモデータをリセット」で初期化）。

## 起動

```bash
npm install
npm run dev
```

ログイン画面の「デモメンバー（M2）としてログイン」で、メンバー向け画面を確認できます。

## 技術スタック

| 用途 | 採用 | 理由 |
| --- | --- | --- |
| ビルド | **Vite 5 + React 18 + TypeScript** | Bolt の標準テンプレートと同じ構成。SPA なので Supabase と直接つなげやすい |
| スタイル | **Tailwind CSS 3** | shadcn/ui との相性が最も安定している v3 系 |
| UI部品 | **shadcn/ui**（Radix UI ベース） | `src/components/ui/` にコードとして同梱。`components.json` もあるので `npx shadcn add` で追加可能 |
| ルーティング | React Router 6 | |
| アイコン | lucide-react | shadcn/ui 標準 |
| トースト | sonner | shadcn/ui 推奨 |
| バックエンド（予定） | Supabase（Auth: マジックリンク / Postgres / Storage） | `supabase/schema.sql` にテーブルとRLSのたたき台 |

## サイトマップ

```
外部向け（ログイン不要）
├── /                               探す：材料×手法×区分タグとキーワードで研究室・テーマを横断検索
│                                   （「相談を待っている困りごと」も表示）
├── /labs/:slug                     研究室ページ：概要・タグ・研究テーマ一覧・メンバー構成（学年のみ）
└── /labs/:slug/themes/:themeId     テーマページ：概要（README相当）・公開記録のタイムライン（種類で絞り込み）
                                    ・「相談する」フォーム（テーマ全体／記録ごと）

/login                              ログイン（メールのマジックリンク、UIのみ）＋デモログイン

メンバー向け（ログイン後・スマホ優先、スマホでは下部タブ）
├── /app/new                        クイック投稿：テーマ → 種類 → 本文 → 写真・ファイル・リンク → 公開トグル → 送信
├── /app/themes                     マイテーマ：草（記録の継続）・担当テーマ一覧・研究室の公開設定
├── /app/themes/:themeId            テーマ詳細：公開範囲の切り替え・テーマ別の草・記録ごとの公開/非公開切り替え
└── /app/consults                   相談一覧：自分のテーマに届いた相談（メールで返信）
```

## 仕様のポイント

- 記録の種類：進捗（青）／困りごと（橙）／達成（緑）／メモ（紫）。色とアイコンで区別
- 記録の公開の初期値：困りごと・達成は公開、進捗・メモは非公開（種類を切り替えると自動で変わる。手動で変えた後は維持）
- 公開範囲：研究室（公開／非公開）× テーマ（非公開／概要のみ公開／記録も公開）× 記録（公開／非公開）。
  外部に見えるのは3つすべてが公開側のときだけ（`src/lib/api.ts` の `isEntryVisible`）
- 外部表示は担当者の学年のみ。`members` テーブル自体に氏名を持たせていない
- 画像はアップロード前にブラウザで長辺1600px（サムネイルは400px）のJPEGに圧縮（`src/lib/image.ts`）
- 大きな生データは外部リンクで添付（ファイルは5MBまで）

## ディレクトリ構成

```
src/
├── types/db.ts          Supabase テーブルに対応する型（labs / members / themes / entries / consult_requests）
├── lib/api.ts           データアクセス層（画面はここだけを呼ぶ。Supabase 版のクエリ例をコメントで記載）
├── lib/auth.tsx         認証（モック）。signInWithOtp / onAuthStateChange に差し替える
├── lib/image.ts         画像圧縮
├── lib/constants.ts     タグ・記録の種類・公開範囲の定義
├── data/mock.ts         モックデータ（研究室11件うち1件は非公開、テーマ17件、記録）
├── components/ui/       shadcn/ui コンポーネント
├── components/          タイムライン・草グラフ・相談フォームなど
└── pages/               画面（pages/member/ がログイン後）
supabase/schema.sql      テーブル定義と RLS のたたき台
```

## Supabase への差し替え手順（予定）

1. `supabase/schema.sql` を SQL Editor で実行し、Storage に `attachments` バケットを作成
2. `npm i @supabase/supabase-js`、`.env.example` を `.env` にコピーして URL / anon key を設定
3. `src/lib/api.ts` の各関数の中身を supabase-js の呼び出しに置き換える（関数のシグネチャと戻り値の型はそのまま）
4. `src/lib/auth.tsx` を `supabase.auth.signInWithOtp` / `onAuthStateChange` に置き換える
