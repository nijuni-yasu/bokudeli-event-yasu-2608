# enterprise

Shokujii エンタープライズ版の従業員・全社管理者向けアプリケーションです。`user` パッケージをコピーして独立管理します（パターンC）。

## Project Setup

1. 依存関係のインストール（リポジトリルート）

   ```sh
   npm install
   ```

2. `.env.development` / `.env.production` を `enterprise/` 配下に配置  
   GitHub Actions Variables の `ENTERPRISE_ENV` を参照するか、管理者に問い合わせてください。  
   項目一覧・CI 設定は [09*エンタープライズ*デプロイ手順](../documents/08_エンタープライズ/09_エンタープライズ_デプロイ手順.md) を参照。

## Development

```sh
npm -w enterprise run dev -- -m development
```

common を変更した場合は先にビルドしてください。

```sh
npm -w common run build
```

## Deployment check

```sh
npm -w enterprise run format:check
npm -w enterprise run lint
npm -w enterprise run build -- -m development
```

## Firebase Hosting

`firebase.json` に `enterprise` target を追加済みです。初回デプロイの手順（Hosting サイト ID = `<PROJECT_ID>-enterprise`、`ENTERPRISE_ENV` / `FIREBASERC` 設定、CI デプロイ）は [09*エンタープライズ*デプロイ手順](../documents/08_エンタープライズ/09_エンタープライズ_デプロイ手順.md) を参照。

```sh
firebase target:apply hosting enterprise <PROJECT_ID>-enterprise
```

## ドメイン解決

アプリ起動時に `getEnterpriseByDomain` Callable でホスト名から `enterprise_id` とブランディング情報を取得します（App Check は Phase 2-5）。
