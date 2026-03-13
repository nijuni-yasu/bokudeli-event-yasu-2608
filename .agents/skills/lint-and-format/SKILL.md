---
name: lint-and-format
description: 全パッケージで lint と format チェックを実行する。「チェックして」「lintして」「formatチェックして」と依頼された時に使用する。
---

# lint・format チェック

common でのビルドが完了したら lint を行う。lint が完了したら format:check を行う。各パッケージの結果を個別に確認するため、lint と format:check は1つずつ順番に実行する。

## 手順

1. common をビルドする（インクリメンタルビルドのため変更がなければ高速）。完了するまで待つ。

```
npm -w common run build
```

2. 全パッケージで lint を実行する（各パッケージの結果を個別に確認するため、1つずつ順番に実行する）

```
npm -w common run lint
npm -w base run lint
npm -w user run lint
npm -w admin run lint
npm -w functions/default run lint
```

3. 全パッケージで format チェックを実行する（各パッケージの結果を個別に確認するため、1つずつ順番に実行する）

```
npm -w common run format:check
npm -w base run format:check
npm -w user run format:check
npm -w admin run format:check
npm -w functions/default run format:check
```

4. 結果を報告する。以下の形式で各パッケージの結果を表示する

```
1. common ビルド: ✅ 成功 / ❌ 失敗

2. lint
- common: ✅ 成功 / ❌ 失敗
- base: ✅ 成功 / ❌ 失敗
- user: ✅ 成功 / ❌ 失敗
- admin: ✅ 成功 / ❌ 失敗
- functions/default: ✅ 成功 / ❌ 失敗

3. format:check
- common: ✅ 成功 / ❌ 失敗
- base: ✅ 成功 / ❌ 失敗
- user: ✅ 成功 / ❌ 失敗
- admin: ✅ 成功 / ❌ 失敗
- functions/default: ✅ 成功 / ❌ 失敗
```

- エラーがあれば該当箇所を表示する
- lint エラーは手動対応を促す
- format エラーがあれば、確認を取らずに自動で format を実行する（手順5へ）

5. format エラーがあった場合、以下を実行して自動修正する（確認不要）

```
npm -w common run format
npm -w base run format
npm -w user run format
npm -w admin run format
npm -w functions/default run format
```

6. format 実行後、再度 format:check で問題がないことを確認する

---

## 制約

- common ビルド完了 → lint → format:check の順で実行する
- lint エラーは自動修正しない。内容を報告して手動対応を促す
- format エラーは確認を取らず自動で format を実行する
