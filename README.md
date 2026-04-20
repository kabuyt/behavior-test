# 行動選択テスト Web版 / Test lựa chọn hành động

特定技能求人に応募してきた候補者向けの行動選択テスト。
日越併記で出題し、結果はSupabaseに保存。管理画面で集計・個別分析・PDFレポート出力ができます。

## 構成

```
behavior-test/
├── index.html          候補者用（会社名・氏名入力→10分6問テスト→送信）
├── admin.html          管理画面（一覧/集計/個別詳細/CSV/印刷）
├── app.js              候補者ロジック
├── admin.js            管理者ロジック
├── questions.js        6問のデータ＋スコア＋行動分析
├── config.js           Supabase接続情報＋管理画面パスワード
├── styles.css          共通CSS
└── supabase-schema.sql テーブル・トリガー・RLS定義
```

## セットアップ手順

### 1. Supabaseにテーブル作成
Supabaseダッシュボード（https://ajmdpkwqyeyzemeoojwd.supabase.co）の
SQL Editor で `supabase-schema.sql` の内容を貼り付けて実行。

作成されるもの：
- `behavior_test_results` テーブル
- 自動採点トリガー（insertと同時に total_score と grade が計算される）
- RLSポリシー（anonでinsertとselectが可能）
- `v_behavior_question_stats` 集計ビュー

### 2. GitHubにpush → Pages公開

```bash
cd C:\Users\kabuyamat\Desktop\behavior-test
git init
git add .
git commit -m "行動選択テスト Web版"
# GitHubで空リポジトリ作成後
git branch -M main
git remote add origin https://github.com/kabuyt/behavior-test.git
git push -u origin main
```

Settings → Pages → Source: `main / root` で公開。
1〜2分で https://kabuyt.github.io/behavior-test/ が有効に。

### 3. 管理画面パスワード変更
`config.js` の `ADMIN_PASSWORD` を変更。（anon keyは公開前提なので、管理画面のクライアント側ゲートはあくまで簡易保護）

## 使い方

### 候補者
`https://kabuyt.github.io/behavior-test/` にアクセス
→ 会社名・氏名（候補者番号は任意）を入力
→ 10分カウントダウン付きで6問回答
→ 送信

### 管理者
`https://kabuyt.github.io/behavior-test/admin.html` にアクセス
→ パスワード入力
→ 3タブ：一覧 / 集計 / 個別詳細

- **一覧**: A〜D評価のサマリー、全受験者の一行表示、CSV出力
- **集計**: 6問それぞれの選択肢分布をバーチャートで表示
- **個別詳細**: 選んだ一人の回答と、各選択肢の行動分析コメント付きレポート（印刷/PDF保存可）

## スコアリング（内部採点）

候補者には得点を表示しません。管理者のみ閲覧できます。

| 得点 | 意味 |
|-----|------|
| 3点 | 【最良】報連相・時間管理・対人姿勢が日本の職場で推奨される選択 |
| 2点 | 次善策 |
| 1点 | 受動的・やや不十分 |
| 0点 | 【要注意】規律・倫理観に懸念 |

合計0〜18点。評価ランク：
- **A (15-18点)**: 強く推薦
- **B (11-14点)**: 推薦
- **C (7-10点)**: 要確認（面談で具体事例を追加確認推奨）
- **D (0-6点)**: 採用は慎重に

各選択肢ごとの行動分析は `questions.js` に記載。

## 注意事項
- anon keyは公開されるため、重要情報はこのテーブルに入れないこと
- 管理画面のパスワードはクライアント側のみの軽いゲート。本格運用時はSupabase AuthやEdge Functionsで認証を追加すること
- 候補者が複数回受験した場合はすべて別レコードとして保存される（同じ氏名でも重複チェックはしていない）
