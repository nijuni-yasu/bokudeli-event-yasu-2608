---
name: git-commit-message
description: ステージングされている変更差分を読み込んでコミットメッセージを生成する。コミット前にメッセージを検討したい時、コミットメッセージを考えてほしいと依頼された時、または git-fixup / git-squash で新規コミット1件と分類された差分のメッセージ生成に使用する。
---

# コミットメッセージ生成

git-fixup / git-squash の手順 3 で「新規コミット（1つ）」と分類された差分のメッセージ生成にも使う。

本スキルはコミットメッセージの**生成まで**を担う。実際の `git commit` 実行は呼び出し元、または別途ユーザーの依頼を受けて行う。

## 手順

1. `git diff --cached --stat` でステージング差分のサマリーを取得する
2. `git diff --cached` で全差分を取得する
3. `git branch --show-current` でブランチ名を取得し Issue 番号を特定する
4. 下記フォーマットに従ってコミットメッセージを生成する

---

## フォーマット

### タイトル

```
[タグ] #イシュー番号 変更内容を端的に表す日本語タイトル
```

タグは変更したディレクトリ・領域に対応するものを選ぶ。複数可。
使用可能なタグ: `[user]` `[partner]` `[base]` `[common]` `[functions]` `[doc]` `[ci]` `[terraform]` `[firebase]` `[ai]`

- [doc]: documents/ ディレクトリ内の更新のみ
- [ci]: .github/workflows/（GitHub Actions の CI/CD）
- [terraform]: terraform/ ディレクトリ
- [firebase]: firebase.json、.firebaserc、firestore.rules、storage.rules、firestore.indexes.json
- [ai]: .cursor / .agents / .claude / CLAUDE.md / AGENTS.md / .github/copilot-instructions.md 等の AI エージェント向け指示・設定ファイル

### タグの判定（優先順位）

1. アプリ/パッケージのソース（user / partner / base / common / functions）に該当 → そのタグ（複数可）
2. 該当しないが ci / terraform / firebase / doc / ai に該当 → 対応タグ（複数可）
3. いずれにも該当しないモノレポ横断設定 → **接頭辞なし**

パッケージ配下の package.json（例: user/package.json）は [user] 等。ルート直下の package.json / package-lock.json のみ接頭辞なし。

### タグを付けない場合

次のような変更では接頭辞を付けない。無理に当てはめない。

- ルート直下の package.json / package-lock.json
- eslint.config.mjs / .prettierrc / tsconfig*.json 等、特定アプリパッケージに属さないリポジトリルートの設定
- 上記パッケージタグ・ci・terraform・firebase・doc・ai のいずれにも該当しない変更

このときのタイトル例：

```
#イシュー番号 変更内容を端的に表す日本語タイトル
```

イシュー番号を付けない方針やブランチから取れない場合は、`#番号` を省略してもよい。

AGENTS.md に無い新しい角括弧タグを増やさない。

### 本文

- 変更の目的・背景を1〜2文で説明する
- 追加・変更・削除したファイルごとに内容を箇条書きで記述する
- 技術的な判断や注意点があれば補足する

詳細に記述する場合、以下も含めてよい：

- 影響範囲（どの画面・機能・API に影響するか）
- 破壊的変更やマイグレーションの有無
- 関連 Issue / PR
- レビューで確認してほしい観点

---

## 制約

- バッククォート と 丸括弧 と ダブルクォート は使用しない
- 日本語で記述する
- タイトルは1行に収める
- 本文は変更の規模に応じて詳細度を調整する

---

## コミット完了後の提案

ユーザーが本スキルで検討したメッセージどおりにコミットを実行し、正常に完了して working tree が clean になったら、次をユーザーに提案する（勝手に実行しない）:

> コミットが完了しました。`/git-reflect-after-commit` で origin への PR 反映と sandbox デプロイをまとめて実行しますか？

- ユーザーが同意したら `git-reflect-after-commit` スキルを実行する
- 「PR だけ」「sandbox だけ」と言われたら実行範囲を絞る
- 未コミット変更が残っている・コミット失敗時・コミット依頼が無かった場合は提案しない

---

## 出力例

```
[doc] #1778 AIエージェント向け指示ファイルをリファクタリング

トークン効率の改善とAIツール間の一貫性確保を目的に、
AGENTS.md・CLAUDE.md・copilot-instructions.md を整理した。

変更詳細:

- AGENTS.md
  - 冗長な汎用ベストプラクティスを削除し95行に削減
  - プロジェクト固有のルールのみを残した

- CLAUDE.md
  - シンボリックリンクからスタブファイルに変更
  - AGENTS.md を唯一の実体とする構成に変更した
```

## 出力例（ci / firebase）

```
[ci] #1901 Firestore デプロイ前に firestore.indexes.json の重複検証ステップを追加

deploy_firestore ワークフローで Firebase へデプロイする直前に、indexes 配列の重複検査を挟む。

変更詳細:

- .github/workflows/deploy_firestore.yml
  - Checkout 直後に Node ワンライナーで JSON 重複を検証するステップを追加
```

```
[firebase] #1901 firestore.indexes.json の重複インデックスを削除

同一フィールド組み合わせのインデックス定義が重複していたため整理した。

変更詳細:

- firestore.indexes.json
  - events コレクションの重複エントリを削除
```

## 出力例（タグなし）

```
#2000 ルート依存を更新

npm audit fix 後に package-lock.json を再生成した。

変更詳細:

- package.json
  - ルート workspaces の devDependencies を更新
- package-lock.json
  - 依存ツリーを再生成
```
