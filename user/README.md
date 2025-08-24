# user

Shokujii の一般ユーザー向けメインアプリケーションです。

## Project Setup

1. 依存関係のインストール  
   **トップレベルディレクトリ**で以下を実行してください。

   ```sh
   npm install
   ```

1. `.env.development` や `.env.production` を適切に準備  
   [GitHub Actions Variables](https://github.com/nijuniinc/bokudeli-event-new/settings/variables/actions) にアクセスできる場合はここから適切な設定を取得し `.env.***` として保存してください。（トップレベルディレクトリではなく、各 workspace に）
   アクセス権がない場合は管理者に問い合わせてください。

## Development

このアプリケーションは common と base という共有ライブラリに依存しています。[common/README.md](../common/README.md) と [base/README.md](../base/README.md) を読んで各ライブラリの依存関係をよく理解した上で開発に臨んでください。

特に base は歴史的経緯により依存関係の逆転が起こりやすい仕様になっています。開発時に新たな依存逆転を持ち込まないよう十分に注意してください。

## Debug

common を修正した際には、 common のビルドが必要です。

```sh
npm -w common run build
```

以下のコマンドで vite serever を起動します。起動ログにサーバーのアドレスが表示されるので、ブラウザでアクセスすることでデバッグが可能です。

`-m development` で指定可能なのは `.env.***` の `***` にあたる環境名です。

```sh
npm run dev -- -m development
```

## Debug with the Emulator

firestore, functions, storage への接続を実際のインスタンスではなくエミュレーターに変更するには以下のように環境変数を設定します。（port は環境によって変更のこと）

```
export VITE_FIRESTORE_EMULATOR_HOST='localhost:8080'
export VITE_FIREBASE_STORAGE_EMULATOR_HOST='localhost:9199'
export VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST='localhost:5001'
export VITE_FIREBASE_AUTH_EMULATOR_HOST='localhost:9099'
```

以下は firestore に接続する例。

1. [Firebase Emulator](https://firebase.google.com/docs/emulator-suite) を適切にスタートさせておく

   ```
   firebase emulators:start --only firestore --import=../snapshot
   ```

1. 環境変数を設定した後にデバッグサーバーを起動
   ```
   export VITE_FIRESTORE_EMULATOR_HOST='localhost:8080'
   npm run dev -- -m development
   ```

## Deployment check

リリース前に formatter, lint, build が通ることを確認してください

```sh
npm run format:check
npm run lint
npm run build -- -m development
```
