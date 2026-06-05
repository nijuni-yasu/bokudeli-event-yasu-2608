# 食事でつながる「shokujii」

## ディレクトリ構成

以下のディレクトリに関してはモノレポ構成で、トップレベルの設定ファイル群で制御されています。

- **`/common`**  
  全てのワークスペース横断で使用されることを想定した TypeScript ファイル群。Database schema や ユーティリティ関数を定義。
- **`/base`**  
  共有 UI コンポーネントを定義 (Vue3 + Vuetify3 + Materio)
- **`/user`**  
  ユーザー向けメインアプリケーション (Vue3 + Vuetify3)
- **`/partner`**  
  店舗（パートナー）向けアプリケーション (Vue3 + Vuetify3)
- **`/curry`**  
  神田カレーグランプリ向けアプリケーション (Vue3 + Vuetify3)
- **`/functions/default`**  
  Google Cloud Run functions v2 上で動作するサーバーサイドアプリケーション（Slack / LINE bot 連携を含む）

以下のディレクトリは過去実装を今後新規構成に変更して行く予定のものです。
基本的に新規更新は行わず、上記新規構成に従うように変更していくものとします。

- **`manager`**  
  運営向け管理画面（Vue 2 + Vuetify 2）

### Materio

このプロジェクトでは UI テンプレートとして [Materio](https://store.vuetifyjs.com/products/materio-vuetify-vuejs-admin-template) を使用しています。
しかし、こちらはモノレポ構成との相性が悪いため、直接シンボリックリンクを張る方法で問題を回避しています。
具体的には以下2つのディレクトリを各 UI アプリケーションから参照しています。
これらのディレクトリに含まれるファイルは原則として修正しないでください。

- [base/materio/@core](./base/materio/@core)
- [base/materio/@layouts](./base/materio/@layouts/)

### base

本来、 [base](./base) は独立したワークスペースとしてビルドされるべきですが、以下の問題があるため、上位ワークスペースから参照して、そちらでビルドするようになっています。
依存関係が逆転しているため、問題が起きやすいので注意してください。

- auto-imports (Materio 由来)
- `router/utils.ts`

**TODO**  
正しく構造化すれば分離することは理論上可能なので、将来的にはこれを修正していく

## Development

開発環境に関しては、基本的に各ディレクトリ以下の `README.md` を参照してください。
以下では **モノレポ構成** のプロジェクトにおいて全体で適用されるルールについて説明します。（旧仕様のものに関しては各ディレクトリの `README.md` を参照してください。）

### 依存関係のインストール

トップレベルで一度だけ依存関係をインストールしてください。各ディレクトリでインストールする必要はありません。

```sh
npm install
```

### npm script

npm script の実行方法は以下の 2 通りがあります。状況に応じて使い分けてください。

- 各ディレクトリに移動してから実行
  ```sh
  cd user
  npm run lint
  ```
- workspace を指定して実行
  ```sh
  npm -w user run lint
  ```

### Formatter & Lint

これらが通らないとデプロイできない仕様になっています。
こまめに確認するようにしてください。

```sh
npm run format:check
npm run lint
```

### Datetime

JavaScript 標準の `Date` オブジェクトは、タイムゾーンを考慮しない値を扱うため、日付の比較や計算には注意が必要です。
そのため、日付・時刻を表すデータは原則として Epoch Time（ミリ秒）を使用するものとします。

日付の文字列変換・比較・計算等には `luxon` を使用してください。
基本的には [common/src/utils/datetime.ts](./common/src/utils/datetime.ts) にユーティリティ関数として実装したものを使用してください。

**注意**：
現在、`Date` オブジェクトの独自変換や `$d` 等、日付に関する実装が混在しています。これらは原則として参考とせず、`luxon` を使用してください。

## Deploy

原則として firebase への Deploy は [GitHub Actions](../../actions) でのみ実行されることとし、ローカルでの実行は禁止とします。

特別な事情等で、手動で Deploy が必要な場合は、プロジェクト名を直接指定する形でデプロイするか、 `.firebaserc` を作成してください。
以下 [firebase](#firebase) を参照のこと。

## firebase command

firebase コマンドを使う場合は以下のように都度プロジェクト名を明示的に使用することを推奨します。
基本的にローカルでの firebase コマンドの使用は避けるようにしてください。（エミュレータを除く）

```sh
firebase --project bokudeli-event-test emulators:start --only functions
```

個人用の開発環境等のために `.firebaserc` を作成して使用することは可能ですが、 git の管理下に入れないよう注意してください。
