---
name: lint-and-format
description: 全パッケージで lint と format チェックを実行する。「チェックして」「lintして」「formatチェックして」と依頼された時に使用する。
---

# lint・format チェック

## 手順

1. 以下のコマンドで common をビルドする（インクリメンタルビルドのため変更がなければ高速）

```
npm -w common run build
```

2. 以下のコマンドで lint を全パッケージ実行する

```
npm -w common run lint; npm -w base run lint; npm -w user run lint; npm -w admin run lint; npm -w functions/default run lint
```

3. 以下のコマンドで format チェックを全パッケージ実行する

```
npm -w common run format:check; npm -w base run format:check; npm -w user run format:check; npm -w admin run format:check; npm -w functions/default run format:check
```

4. 結果を報告する
   - エラーがなければ「問題なし」と報告する
   - lint エラーがあれば該当箇所を表示して手動対応を促す
   - format エラーがあれば format:all を実行するか確認を取る

5. format:all を実行する場合は以下を実行する

```
npm -w common run format; npm -w base run format; npm -w user run format; npm -w admin run format; npm -w functions/default run format
```

---

## 制約

- lint エラーは自動修正しない。内容を報告して手動対応を促す
- format:all はユーザーの確認を取ってから実行する
