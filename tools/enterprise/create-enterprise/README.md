# createEnterprise 運用 CLI

運営（support）が `createEnterprise` Callable を実行し、テスト企業と初代 admin を作成する。

- API 仕様: [04_詳細_オンボーディング.md](../../../documents/08_エンタープライズ/10_仕様/04_詳細_オンボーディング.md) §3
- 手順・確認項目: [07_デプロイ・運用.md §11](../../../documents/08_エンタープライズ/10_仕様/07_デプロイ・運用.md#11-テスト企業の作成-createenterprise)

## 前提

| 項目 | 内容 |
| :-- | :-- |
| Functions | `createEnterprise` がデプロイ済み |
| 資格情報 | Firebase Admin SDK 用 service account JSON（例: `bokudeli-event-batch/credentials/`） |
| 実行者 UID | Firestore `configs/global.support_user_ids` に含まれる UID |

## 準備

1. `payload.example.json` を `payload.local.json` にコピーし、環境に合わせて編集する（**コミットしない**）
2. 環境変数を設定する

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/adminsdk.json
export FIREBASE_PROJECT_ID=bokudeli-event-yasu-2510
export FIREBASE_API_KEY=...    # enterprise/.env.* の VITE_API_KEY
export SUPPORT_UID=...         # support_user_ids のいずれか
# 任意: export FIREBASE_FUNCTIONS_REGION=asia-northeast1
```

## 実行

`firebase-admin` は `functions/default` の依存を使う。

```bash
cd functions/default

node ../../tools/enterprise/create-enterprise/create-enterprise.mjs \
  --payload ../../tools/enterprise/create-enterprise/payload.local.json
```

ドライラン（Callable は呼ばない）:

```bash
node ../../tools/enterprise/create-enterprise/create-enterprise.mjs \
  --payload ../../tools/enterprise/create-enterprise/payload.local.json \
  --dry-run
```

## 認証方式

本 CLI は **Admin SDK で support ユーザー向け custom token を発行 → Callable 実行**する。

手動で行う場合は [07 §11.3](../../../documents/08_エンタープライズ/10_仕様/07_デプロイ・運用.md#113-実行方法client-sdk) の Client SDK + support ログインでも可。

## 成功後

[07 §11.4](../../../documents/08_エンタープライズ/10_仕様/07_デプロイ・運用.md#114-成功確認) のチェックリストに従う。サブドメイン URL を使う場合は [08_カスタムドメイン.md §6.1b](../../../documents/08_エンタープライズ/10_仕様/08_カスタムドメイン.md#61b-console-個別-fqdn-フォールバックsandbox-実績) の DNS / Hosting / Auth authorized domains 追加も必要。
