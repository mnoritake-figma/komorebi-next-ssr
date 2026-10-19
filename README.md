# komorebi — Next.js版

Nuxt版と比較するための独立したNext.jsアプリです。Next.js App Router / React / TypeScriptを使用します。

## 構成

```text
ブラウザ（React画面）
  → /api/*（Next.js Route Handlers）
    → サーバー処理（src/server）
      → Supabase（PostgreSQL / 匿名認証 / RLS）
```

- `src/components/social-app.tsx`: フロントエンドの画面と操作
- `src/lib/api.ts`: ブラウザからAPIを呼ぶ処理。Supabase SDKはインポートしません
- `src/app/api/`: HTTPの入口（投稿、いいね、匿名セッション）
- `src/server/`: Supabase接続・所有者判定・入力検証・データ操作。`server-only`でブラウザへの混入を防止
- `src/types/social.ts`: フロント・バック共通のレスポンス型

フロントとバックエンドを責務・コード・HTTP通信で分離しています。起動・デプロイは1つのNext.jsサーバーです。独立した2つのサーバーとして動かす構成ではありません。

## 起動

Node.js 22以上、pnpmを使用します。このフォルダー内で実行してください。

```sh
pnpm install
# 初回のみ（.env.local が存在しない場合）
cp .env.example .env.local
pnpm dev
```

http://127.0.0.1:3002 でNext.js版を開きます。Nuxt版は別リポジトリで管理するアプリです（ローカルでは3001番ポートを使用）。

`.env.local` はGit管理外です。クローンした環境では次のサーバー専用環境変数を設定します。

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

`NEXT_PUBLIC_` は使いません。service_roleキーも不要です。

## Supabaseと匿名投稿

Nuxt版と同じテーブル・RLSを利用するため、追加のSQLは不要です。新しいプロジェクトの場合のみこのリポジトリ内の `supabase/schema.sql` を実行し、Allow anonymous sign-insを有効にしてください。

閲覧時はセッションを新規作成しません。最初の投稿・いいね操作時にAPIが匿名セッションを作成し、HttpOnly / SameSite=LaxのCookieへ保存します。本番ではSecure属性も付与します。各APIでSupabaseにユーザーを検証させ、期限切れトークンの更新もRoute Handler内で処理します。

- 投稿のuser_idはブラウザから受け取らず、検証済みセッションから決定
- 自分の投稿だけ削除可能（サーバー条件とSupabase RLSの両方で制限）
- 書き込みAPIは同一Originのみ許可
- Cookieを含むAPI応答はprivate, no-store
- 本文280文字、表示名40文字の制限をAPI側でも確認

Nuxt版とはセッション保存方式が違うため、投稿データは共有されても「自分の投稿」の判定は別になります。Cookie削除や別ブラウザでは以前の匿名投稿を削除できなくなります。

## API

| メソッド | URL | 内容 |
|---|---|---|
| GET | `/api/posts` | 最新100投稿と現在のuserId |
| POST | `/api/session` | 匿名セッションの作成・既存セッションの再利用 |
| POST | `/api/posts` | `{ "author": "表示名", "content": "本文" }` を投稿 |
| DELETE | `/api/posts/:id` | 自分の投稿を削除 |
| PUT | `/api/posts/:id/like` | いいね（繰り返しても1件） |
| DELETE | `/api/posts/:id/like` | いいね解除 |

## 検証・ビルド

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

Next.js標準のTurbopackでビルドします。APIがあるので静的ファイルだけでは動きません。Node.jsまたはNext.js対応ホスティングで動かします。現段階ではローカル確認用で、外部公開はしていません。

テストは入力境界（絵文字を含む）、所有者フィールドの無視、UUID、Origin検証を対象にしています。

## SSRの範囲
`src/app/page.tsx` はServer Componentです。`force-dynamic` と `no-store` によりアクセスごとにSupabaseから最新投稿を取得し、本文入りのHTMLをサーバーで生成します。公開の投稿一覧をSSRし、ブラウザ起動後にAPIで自分の投稿・いいね状態を反映します。投稿・いいね・検索などの操作はReact Client Componentで実行します。投稿の日時表示はSSRとブラウザで一致するようAsia/Tokyoに固定しています。
