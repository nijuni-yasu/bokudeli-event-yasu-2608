---
name: git-split-commit
description: 変更差分を論理単位で分割コミット案を検討する。各コミットのメッセージは git-commit-message のフォーマットに従う。「分割コミットして」「分割コミットを検討して」「コミットを分けて」と依頼された時に使用する。[common][doc][ai]については、必ず独立したコミットとする。
---

# 分割コミット

変更差分について、分割コミットを検討する。コミットメッセージは git-commit-message スキルに従って検討する。分割コミットのみ依頼されても git-commit-message が呼び出されないため、本スキル内でコミットメッセージ生成を含む。[common][doc][ai]については、必ず独立したコミットとする。

対象の変更には、ステージング済みの変更のみの場合、ステージングされていない変更のみの場合、両方がある場合がある。

## 手順

1. 変更差分とブランチ名を取得する

```
git status
git diff
git diff --cached
git branch --show-current
```

ステージング済み・未ステージの両方を取得する。ブランチ名から Issue 番号を特定する。

2. 分割案を検討する
   - 責務ごとに論理単位で分割する
   - 以下の変更はそれぞれ独立した単独コミットにする。コミット順序を守る

   **コミット順序**
   1. [doc] documents/ 内の更新のみ。最初のコミットとする
   2. [ai] .cursor / .agents / .github / CLAUDE.md / AGENTS.md 等の AI 関連設定・指示ファイル
   3. [common] スキーマ変更（Zod スキーマ・型定義等）
   4. その他（user / admin / base / functions）

   **[doc] の範囲**
   - documents/ ディレクトリ内の更新のみに限る
   - AGENTS.md / CLAUDE.md / .cursor / .agents / .github 等は [doc] ではなく [ai] を使う

   **[ai] の範囲**
   - .cursor ディレクトリ（ルール、コマンド等）
   - .agents ディレクトリ（スキル等）
   - .github ディレクトリ（ワークフロー、copilot-instructions 等）
   - CLAUDE.md / AGENTS.md 等のルート直下の AI 向け指示ファイル

   **[common] の扱い**
   - common のスキーマ変更は必ず単独コミットにする
   - Zod スキーマ、型定義、common/src/ 以下の変更が該当する
   - common のスキーマ変更が他パッケージに影響する場合、common を先にコミットする

3. 各コミットのメッセージを生成する
   - git-commit-message スキルのフォーマットに従う（**タグを付けない場合**も git-commit-message の「タグを付けない場合」を参照）
   - タイトル: 原則 `[タグ] #イシュー番号 変更内容`。Firestore ルールやインデックスのみなどタグが不要なときは `#イシュー番号 変更内容` のみでもよい
   - 本文: 目的・背景、ファイルごとの箇条書き、技術的補足
   - バッククォート・丸括弧・ダブルクォートは使用しない
   - 詳細に複数行で記述する

4. 分割案とコミットメッセージを出力する

※ このスキルは分割案とコミットメッセージの検討・出力までとする。実際のコミット実行は別途 AI に依頼する

## コミットメッセージフォーマット

### タイトル

```
[タグ] #イシュー番号 変更内容を端的に表す日本語タイトル
```

タグは変更したディレクトリに対応するものを選ぶ。複数可。
使用可能なタグ: [user] [admin] [base] [common] [functions] [doc] [ai]

git-commit-message スキルの「タグを付けない場合」と同様、Firestore のインデックスやルールのみなどではタグを付けない。

### 本文

- 変更の目的・背景を1〜2文で説明する
- 追加・変更・削除したファイルごとに内容を箇条書きで記述する
- 技術的な判断や注意点があれば補足する
- 日本語で記述する。タイトルは1行に収める。本文は変更の規模に応じて詳細度を調整する

詳細に記述する場合、以下も含めてよい：

- 影響範囲（どの画面・機能・API に影響するか）
- 破壊的変更やマイグレーションの有無
- 関連 Issue / PR
- レビューで確認してほしい観点

## 出力形式

### コミット1: [doc] #XXXX ドキュメント更新の説明

（本文）

対象ファイル: documents/...

### コミット2: [ai] #XXXX AI 向け設定の説明

（本文）

対象ファイル: .cursor/ または .agents/ または .github/ または AGENTS.md 等

### コミット3: [common] #XXXX スキーマ変更の説明

（本文）

対象ファイル: common/src/...

### コミット4: [user] #XXXX 機能追加の説明

（本文）

対象ファイル: user/src/...

## 出力例

```
### コミット1: [doc] #1800 イベント仕様書を更新

有料チケット機能の仕様を追記した。

変更詳細:
- documents/01_マネタイズと決済/04_有料チケット.md
  - 購入フローの説明を追加

対象ファイル: documents/01_マネタイズと決済/04_有料チケット.md

### コミット2: [ai] #1800 分割コミットスキルに doc と ai タグを追加

スキルと Git ルールの一貫性のため、[doc] [ai] タグの扱いを追加した。

変更詳細:
- .agents/skills/git-split-commit/SKILL.md
  - コミット順序とタグの範囲を追記
- AGENTS.md
  - 使用可能なタグに [ai] を追加

対象ファイル: .agents/skills/git-split-commit/SKILL.md, AGENTS.md

### コミット3: [common] #1800 Event スキーマに status フィールドを追加

イベントの公開状態を管理するため、Event スキーマに status フィールドを追加した。

変更詳細:
- common/src/schemas/Event.ts
  - status フィールドを追加。draft または published
  - zod スキーマを更新

対象ファイル: common/src/schemas/Event.ts

### コミット4: [user] #1800 イベント詳細画面に公開状態を表示

Event の status に応じて表示を切り替えるようにした。

変更詳細:
- user/src/pages/EventDetail.vue
  - status が draft の場合は下書き表示を追加

対象ファイル: user/src/pages/EventDetail.vue
```

## 制約

- [doc] は documents/ 内の更新のみ。最初のコミットとする
- [ai] は .cursor / .agents / .github / CLAUDE.md / AGENTS.md 等の変更に使う
- [common] のスキーマ変更は必ず単独コミット
- コミットメッセージは git-commit-message スキルに準拠する。タグ省略可のケースも含む
- バッククォート・丸括弧・ダブルクォートは使用しない
