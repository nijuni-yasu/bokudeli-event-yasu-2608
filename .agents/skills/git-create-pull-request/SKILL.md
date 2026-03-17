---
name: git-create-pull-request
description: ブランチの変更差分を読み込み、pull_request_template.md の構造に沿って PR 本文を生成する。PR 作成、プルリク作成、PR 本文の更新、マージ前の PR 整理、force push 後の PR 更新、squash 後の PR 更新、変更内容の PR への反映など、PR に関する作業全般で使用する。「PRつくって」「プルリクを作って」「PR本文を更新して」と依頼された時に使用する。
---

# PR 本文生成

## 前提

- gh CLI がインストール済みであること
- 基準ブランチは origin/development 一択。必ず development を使用する

## 適用場面

- **新規作成**: まだ PR が存在しない場合。生成した本文を gh pr create --base development で新規 PR 作成に使う
- **既存 PR の本文更新**: すでに PR があり、force push や squash などで内容が変わった場合。生成した本文で gh pr edit により既存 PR の本文を更新する

## 手順

1. gh pr view で現在のブランチに PR が紐づいているか確認する
   - PR あり → 既存 PR の本文更新を想定
   - PR なし → 新規作成を想定

2. 基準ブランチは development を使用する
3. `git diff development...HEAD --stat` で変更ファイル一覧を取得する
4. `git diff development...HEAD` で全差分を取得する
5. `git log development...HEAD --oneline` でコミット一覧を取得する

6. `git branch --show-current` でブランチ名を取得し Issue 番号を特定する
7. `.github/pull_request_template.md` の各セクションを差分をもとに埋める
8. 生成した PR 本文を出力する

9. 手順 1 の確認結果に応じて、実行方法を判断する
   - **新規作成**: PR が紐づいていない場合 → 本文を出力し、gh pr create 実行時は --base development を指定する。ユーザーに確認を取る
   - **既存 PR の本文更新**: PR が紐づいている場合 → 本文を出力し、gh pr edit で本文を更新する場合はユーザーに確認を取る。本文をファイルに保存した場合は gh pr edit --body-file を使用する

---

## 各セクションの埋め方

### タイトル

変更内容を端的に表す日本語タイトルを生成する。Issue 番号は含めない。
フォーマット: `[タグ] 変更内容を端的に表す日本語タイトル`
タグは変更したディレクトリに対応するものを選ぶ。複数可。
使用可能なタグ: `[user]` `[admin]` `[base]` `[common]` `[functions]` `[doc]` `[ai]`

### 概要

1〜2文でこのPRの目的と内容を説明する。

#### コミット一覧

`git log development...HEAD --oneline` で取得したコミットタイトルをそのまま全件列挙する。
要約や改変はせず、コミットタイトルの文字列をそのままコピーする。

#### 関連情報

関連 Issue はブランチ名から取得する。例: feat/1826-5min → #1826、fix/1234-typo → #1234。ハイフン以降は無視する。複数の場合は #1234 #1235 のように並べる。
区分は以下から選ぶ: バグ修正 / 機能追加 / リファクタリング / 運用改善 / ドキュメント

### 変更内容

変更されたファイルと差分の内容をもとに、何をしたかを箇条書きで記述する。

記述例:
- stripe.ts: 注文期限チェックと expires_at を追加
- pollingTask.ts: 注文締切メールの送信タイミングを5分遅延
- documents/: 仕様書を廃案・将来実装に分割

### 影響範囲

#### 対象パッケージ

変更が含まれるパッケージのみを箇条書きで列挙する。
`user` `admin` `base` `common` `functions` から該当するものだけを記載する。
`documents/` のみの変更の場合は対象パッケージに含めず、タイトルの [doc] タグで表現する。

#### Firebase / Backend

以下のいずれかが変更されている場合は「あり」と記述する。

- `common/src/schemas/` 以下のファイル → Firestore スキーマ変更
- `firestore.rules` / `storage.rules` → Security Rules 変更
- `functions/` 以下のファイル → Functions 変更

影響内容: 該当する場合、変更した Function 名や処理内容を簡潔に記載する。例: stripe.ts の createStripeCheckoutSession に注文期限チェックを追加。pollingTask の注文締切メール送信タイミングを5分遅延。

データマイグレーション（バッチ処理）: Firestore スキーマ変更がある場合のみ記載する。既存ドキュメントに新フィールドを追加する、既存データの形式を変更するなど、既存データの更新が必要な場合は「必要」と記述し、bokudeli-event-batch リポジトリでバッチ処理スクリプトを実装する旨を補足する。新規コレクション追加や optional フィールド追加のみで既存データの更新が不要な場合は「不要」と記述する。

### レビューしてほしい観点

設計上の判断・迷いどころ・特に確認してほしいファイル・リスクを差分から抽出して記述する。
推定できない場合は「要確認」と記述して手動補完を促す。

### 確認済み事項

確認が完了していると推定される項目のみを箇条書きで列挙する。
確認が必要なものは「要確認: 〇〇」の形式で記載する。
Firestore 変更時・Functions 変更時のチェック項目は該当する場合のみ記載する。

### closes

ブランチ名から取得した Issue 番号を記入する。
複数 Issue がある場合は、PR の変更内容から該当するものを判断し、closes # を複数行に分けて記述する。

---

## 制約

- 日本語で記述する
- 推定できない箇所は空欄または「要確認」と記述し、手動で補完を促す
- gh pr create および gh pr edit を実行する場合は、ユーザーに確認を取ってから実行する

## 運用上の推奨

- force push や squash でブランチ内容が変わった後は、既存 PR の本文を更新することを推奨する
