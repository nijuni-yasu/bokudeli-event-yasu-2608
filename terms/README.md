# terms（法務文書サイト）

shokujii の法務文書を VitePress で静的公開するワークスペース。

仕様: [documents/11\_法務文書/terms\_仕様.md](../documents/11_法務文書/terms_仕様.md)

## 開発

```bash
npm -w terms run dev
npm -w terms run build
npm -w terms run preview
```

## 初回デプロイ（人手作業）

`development` マージ前に環境ごとに実施（仕様 §5.5）:

1. `terraform apply` で `<PROJECT_ID>-terms` Hosting サイト作成
2. `firebase target:apply hosting terms <PROJECT_ID>-terms`
3. GitHub Environment の `FIREBASERC` に `hosting.terms` を追記
4. Firebase Console でカスタムドメイン追加 + DNS 設定
5. `Deploy terms` workflow を `workflow_dispatch` で実行し URL 確認
