# 計算・空間認識テスト

PDF `計算・空間認識テスト.pdf` をベースに、`behavior-test` 風の受験画面と管理画面にした静的Webアプリです。

## ファイル

- `index.html`: 受験画面
- `admin.html`: 管理画面
- `questions.js`: 問題定義と採点ロジック
- `config.js`: Supabase 接続先と管理画面パスワード
- `schema.sql`: Supabase に作るテーブル

## 使い方

1. Supabase の SQL Editor で `schema.sql` を実行します。
2. このフォルダをそのまま静的ホスティングに置きます。
3. 受験画面は `index.html`、管理画面は `admin.html` を開きます。

## 管理画面

- パスワード: `grop2026`
- 受験一覧、得点、所要時間、各問題の正誤を確認できます。
- CSV 出力にも対応しています。

## メモ

- `config.js` は `behavior-test` と同じ Supabase 接続先を入れています。
- 図形問題の画像は PDF から切り出して `assets/` に配置しています。
