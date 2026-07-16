---
name: lint-and-format
description: PR verify（pr-verify.yml）と同じ build・lint・format・型・vitest のローカルチェック。format 失敗時はローカル自動修正。「チェックして」「lintして」「formatチェックして」「verifyして」と依頼された時に使用する。
---

# lint・format・型・test チェック（PR verify 相当）

`.github/workflows/pr-verify.yml` の `verify` ジョブと**同じチェック内容・同じ順序・同じ対象**をローカルで実行する。
各パッケージの結果を個別に確認するため、同一ステップ内も 1 つずつ順番に実行する。

## PR verify との関係

| 観点 | 内容 |
|:-----|:-----|
| **チェック内容** | verify:functions-deploy / build / lint / format:check / build:types / vitest の項目・順序・対象パッケージは PR verify と一致 |
| **format ローカル自動修正** | `format:check` 失敗時のみ `format` を実行し再チェック。PR verify は check のみ（リモートは修正不可） |
| **合格状態** | スキル成功時 = PR verify が通る状態（format は自動修正後に check が緑） |
| **含まないもの** | `npm ci`、Ubuntu 実行環境、実装ターン完了時のセルフレビュー（Stop 検証は [`.agents/hooks/stop-gate-check.sh`](../../hooks/stop-gate-check.sh) が担当） |

## いつ実行するか

| タイミング | 必須 |
|:-----------|:-----|
| [`/git-create-pull-request`](../git-create-pull-request/SKILL.md) push 前（単体実行時） | ✅ |
| [`/git-reflect-after-commit`](../git-reflect-after-commit/SKILL.md) push 前 | ✅ |
| 実装ターン完了報告前 | ❌（[`/shokujii-code-review`](../shokujii-code-review/SKILL.md) のみ） |
| Stop hook | ❌ |

format 自動修正でワーキングツリーに変更が残る。push 前（`git-reflect-after-commit` 等）では追加コミット / amend をユーザーに確認する。

## 手順

### 0. Functions deploy list 整合性

`index.ts` の export と `.github/workflows/deploy_functions.yml` の `--only` リストが一致することを確認する。

```
npm run verify:functions-deploy
```

### 1. ビルド（common）

common の型解決を先に行う。

```
npm -w common run build
```

### 2. lint

```
npm -w common run lint
npm -w base run lint
npm -w user run lint
npm -w partner run lint
npm -w enterprise run lint
npm -w functions/default run lint
```

### 3. format:check

```
npm -w common run format:check
npm -w base run format:check
npm -w user run format:check
npm -w partner run format:check
npm -w enterprise run format:check
npm -w functions/default run format:check
```

format エラーがあれば、確認を取らずに手順 3a へ進む。

#### 3a. format 自動修正（format エラー時のみ・確認不要）

```
npm -w common run format
npm -w base run format
npm -w user run format
npm -w partner run format
npm -w enterprise run format
npm -w functions/default run format
```

修正後、再度 format:check を 1 パッケージずつ実行し、すべて成功することを確認する。

### 4. 型チェック（build:types）

```
npm -w base run build:types
npm -w user run build:types
npm -w partner run build:types
npm -w enterprise run build:types
```

### 5. ビルド（functions）

functions の型チェック（`tsc -b`）を実行する。

```
npm -w functions/default run build
```

### 6. test（vitest）

```
npm -w common run test
npm -w base run test
npm -w user run test
npm -w partner run test
npm -w enterprise run test
npm -w functions/default run test
```

### 7. 結果を報告する

以下の形式で各ステップの結果を表示する。

```
0. verify:functions-deploy
- functions deploy list: ✅ 成功 / ❌ 失敗

1. build（common）
- common: ✅ 成功 / ❌ 失敗

2. lint
- common: ✅ 成功 / ❌ 失敗
- base: ✅ 成功 / ❌ 失敗
- user: ✅ 成功 / ❌ 失敗
- partner: ✅ 成功 / ❌ 失敗
- enterprise: ✅ 成功 / ❌ 失敗
- functions/default: ✅ 成功 / ❌ 失敗

3. format:check
- common: ✅ 成功 / ❌ 失敗
- base: ✅ 成功 / ❌ 失敗
- user: ✅ 成功 / ❌ 失敗
- partner: ✅ 成功 / ❌ 失敗
- enterprise: ✅ 成功 / ❌ 失敗
- functions/default: ✅ 成功 / ❌ 失敗

4. build:types
- base: ✅ 成功 / ❌ 失敗
- user: ✅ 成功 / ❌ 失敗
- partner: ✅ 成功 / ❌ 失敗
- enterprise: ✅ 成功 / ❌ 失敗

5. build（functions）
- functions/default: ✅ 成功 / ❌ 失敗

6. test
- common: ✅ 成功 / ❌ 失敗
- base: ✅ 成功 / ❌ 失敗
- user: ✅ 成功 / ❌ 失敗
- partner: ✅ 成功 / ❌ 失敗
- enterprise: ✅ 成功 / ❌ 失敗
- functions/default: ✅ 成功 / ❌ 失敗
```

- エラーがあれば該当箇所を表示する
- lint・型・test エラーは手動対応を促す（自動修正しない）
- format エラーは確認を取らず自動で format を実行する（手順 3a）

---

## 制約

- **実行順**: verify:functions-deploy → build common → lint → format:check → build:types → build functions → vitest
- **PR verify 相当**: 上記チェックは `pr-verify.yml` の verify ジョブと一致（ローカル再現用）
- **format ローカル自動修正**: PR verify にはないローカル拡張。成功時は format:check が緑 = CI と同じ合格状態
- **Stop hook では実行しない**: lint 検証は push / PR / reflect 前に本スキルで行う
- lint・build:types・test エラーは自動修正しない。内容を報告して手動対応を促す
