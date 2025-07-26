# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリで作業する際の開発者向けガイドです。
実装に必要な技術情報と開発フローに焦点を当てています。

## 関連ドキュメント

- **詳細仕様**: `documents/1_仕様概要/1.1_仕様概要.md` - プロジェクトの包括的な仕様書
- **機能追加仕様**: `documents/2_機能追加/` - 新機能の仕様書

## プロジェクト概要

Shokujii（食事でつながる）は、食事関連のコミュニティイベント管理プラットフォームです。Firebase ベースのモノレポ構造で、複数のフロントエンドアプリケーションと Firebase Functions で構成されています。

**詳細な仕様については `documents/1_仕様概要/1.1_仕様概要.md` を参照してください。**

## 開発コマンド

### フロントエンドアプリケーション

```bash
# モダンアプリ（user, admin, curry）- Vue 3 + Vite + Vuetify 3
yarn dev                    # 開発モード
yarn dev-development       # 開発環境
yarn dev-production        # 本番環境
yarn build-development     # 開発環境用ビルド
yarn build-production      # 本番環境用ビルド
yarn lint                  # ESLint チェック
yarn format                # Prettier フォーマット

# Manager アプリ（レガシー）- Vue 2 + Vue CLI + Vuetify 2
yarn dev-development       # 開発モード
yarn build-development     # 開発環境用ビルド
yarn build-production      # 本番環境用ビルド
```

### Firebase Functions

```bash
# Default functions（モダンTypeScript）
cd functions/default
yarn lint                  # ESLint
yarn build                 # TypeScript コンパイル
yarn build:watch          # ウォッチモードコンパイル
yarn serve                 # Firebase エミュレーター
yarn test                  # Vitest テスト
yarn deploy                # 関数デプロイ

# Legacy functions（非推奨JavaScript - 移行中）
cd functions/legacy
# JavaScript 直接実行、ビルドプロセスなし
```

## アーキテクチャ

### モノレポ構造

- **`/user/`** - メインユーザー向けアプリケーション（Vue 3 + Vite + Vuetify 3）
- **`/admin/`** - 飲食店向け管理画面（Vue 3 + Vite + Vuetify 3）
- **`/manager/`** - 運営向け管理画面（Vue 2 + Vue CLI + Vuetify 2）- レガシー
- **`/curry/`** - 特殊用途アプリケーション（Vue 3 + Vite + Vuetify 3）
- **`/base/`** - Materio テンプレートを使用した共有UIコンポーネント
- **`/common/`** - 共有Firebase スキーマとユーティリティ

### Firebase Functions アーキテクチャ

- **`/functions/default/`** - モダンTypeScript Functions v2（Node 20）
- **`/functions/legacy/`** - 非推奨JavaScript Functions v1（2025年8月EOL）
- **`/functions/shokujii-slackbot/`** - Slack 連携ボット
- **`/functions/shokujii-linebot/`** - LINE 連携ボット

### Functions/Default 構造

- **ES modules** with dynamic imports in `index.ts`
- **サービス**: メール（SendGrid）、OGP、コミュニティ/イベント管理
- **Stores**: データアクセス層（`/stores/`）
- **Utils**: 共有ユーティリティ（`/utils/`、`/commonUtils/`）
- **Schemas**: 型定義（`/schemas/`）

## 移行戦略

### Functions v1 → v2 移行

- 新しい関数は全て `/functions/default/` に作成
- レガシー関数は必要に応じて移行
- インポートパターン: ES modules用に `.js` 拡張子付きの相対インポートを使用
- セキュリティ: process.env の代わりに `defineSecret()` を使用してGoogle Cloud Secret Manager を利用

### Functions 移行時のコードパターン

1. JavaScript を適切な型付きTypeScript に変換
2. 新しい構造のインポートを使用（`./utils/sendgrid.js`、`./stores/event.js`）
3. モダンFirebase v2 パターンを使用（`getFirestore()`、`Timestamp.fromMillis()`）
4. レガシーヘルパー関数を新しいstore ベースのデータアクセスに置き換え
5. SendGrid で `dynamic_template_data` の代わりに `dynamicTemplateData` を使用

## Firebase 設定

### ホスティングターゲット

- `user` - メインユーザーアプリケーション
- `admin` - 飲食店向け管理画面
- `manager` - 運営者向け管理画面
- `curry` - 特殊用途アプリケーション

### 環境管理

- 開発環境と本番環境
- GitHub Actions for CI/CD
- 環境固有のビルドとデプロイ

## 開発ガイドライン

### Node バージョン

- ランタイム: Node 20（`mise.toml` で指定）
- 全アプリケーションで `.node-version` ファイルにより統一

### コード品質

- ESLint + TypeScript でリント
- Prettier でフォーマット
- 厳格なTypeScript 設定

### 共有コンポーネント

- `/base/` ディレクトリ経由で共有
- Materio テンプレートのカスタマイズ（最小限の変更を推奨）
- シンボリックリンクによるコンポーネント共有（暫定ソリューション）

## 外部サービス連携

- **SendGrid** - メールサービス
- **Stripe** - 決済処理
- **Adobe PDF Services** - ドキュメント生成
- **Slack/LINE** - ボット連携
