# 行動選択テスト Web版 / Test lựa chọn hành động

特定技能求人に応募してきた候補者向けの行動選択テスト。
日越併記で出題し、結果はSupabaseに保存。候補者専用URLから受験した結果は、GROPの事前テスト管理サイトへ自動で紐づきます。行動選択結果は参考資料で、総合順位には使用しません。

## 構成

```
behavior-test/
├── index.html          候補者用（会社名・氏名入力→10分6問テスト→送信）
├── admin.html          特定技能試験用の結果管理画面
├── app.js              候補者ロジック
├── admin.js            管理者ロジック
├── questions.js        6問のデータ＋スコア＋行動分析
├── config.js           Supabase接続情報
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
- 初期RLSポリシー
- `v_behavior_question_stats` 集計ビュー

事前テスト管理との統合時は、`nihongo-test-1-4ka/interview-manager/add-test-settings-behavior.sql` を続けて実行します。これにより、結果の閲覧・削除は認証済み管理者に限定されます。

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

## 使い方

### 候補者
事前テスト管理サイトが発行する候補者専用URLにアクセス
→ 表示された候補者番号と氏名を確認
→ 10分カウントダウン付きで6問回答
→ 送信

### 管理者
特定技能試験として単独で受験した結果は、`https://kabuyt.github.io/behavior-test/admin.html` で確認します。GROP管理者のログインID・パスワードを使用し、一覧・集計・個別詳細・CSV・PDFを利用できます。

事前テスト管理サイトの候補者専用URLから受験した結果は、事前テスト管理サイト側で確認します。PDF報告書には順位対象外の参考資料として掲載されます。

## スコアリング（内部採点）

候補者には得点を表示しません。事前テスト管理サイトでも点数・段階評価・順位には使用しません。

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
- 結果の閲覧は事前テスト管理サイトのSupabase Authと送り出し機関別権限で保護
- 候補者が複数回受験した場合はすべて別レコードとして保存される（同じ氏名でも重複チェックはしていない）
