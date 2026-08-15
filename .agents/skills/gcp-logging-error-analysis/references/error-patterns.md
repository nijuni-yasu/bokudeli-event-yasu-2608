# Shokujii ERROR パターンと triage

`scripts/parse_logs.py` の分類ロジックと同期。変更時は両方を更新する。

## 重要度（severity_tier）

| tier | 意味 | 例 |
|------|------|-----|
| **P0** | 全ユーザーまたは決済・注文確定に直結 | **未実装**（将来: `stripeWebhook` / `createStripeCheckoutSession` 等）。現状は P1 扱い |
| **P1** | 要調査・運用対応 | Firestore index 不足、Storage Rules、Slack 404、ZodError、backfill データ異常 |
| **noise** | クライアント側ノイズ | ServiceWorker 失敗、chunk load、単体 Rejected、Connection failed |
| **infra** | デプロイ・スケジューラ・監査 | Function NOT_FOUND（audit）、Scheduler topic NOT_FOUND |

## ログ形式別の読み方

| フィールド | 内容 |
|-----------|------|
| `textPayload` | Functions stderr。stack trace、`Unhandled error`、Firestore index URL |
| `jsonPayload` | `createModuleLogger` 出力。`module`, `message`, `error_message`, `fingerprint`, `status` 等 |
| `httpRequest` | Cloud Run requests ログ。`status`, `requestUrl`, `referer` |
| `protoPayload` | Cloud Audit。`status.message`, `methodName` |
| `errorGroups.id` | Error Reporting グループ（同一根本原因の目安） |
| `trace` | requests と stderr の紐付けキー |

## シグネチャ → triage → 次アクション

| シグネチャ | tier | グルーピングキー | 次アクション |
|-----------|------|-----------------|-------------|
| `requires an index` / `FAILED_PRECONDITION` + index URL | P1 | errorGroups.id または index URL | `firestore.indexes.json` を Grep → `/shokujii-firestore` |
| `httpRequest.status=500` + 上記 trace | P1 | trace | 同一 trace の stderr を読む |
| `jsonPayload.module=clientError` + SW / chunk / 単体 Rejected / Connection failed / 単体 Failed to fetch | noise | fingerprint | 件数のみ報告。サーバー障害と混同しない。**`error_type=ZodError` は常に P1**（message がノイズ部分一致でも） |
| `jsonPayload.module=clientError` + storage/unauthorized | P1 | fingerprint | `storage.rules` + 管理画面権限 |
| `jsonPayload.module=clientError` + ZodError / invalid_enum | P1 | fingerprint + route | 該当 event データ or UI |
| `jsonPayload.module=clientError` + Missing or insufficient permissions | P1 | fingerprint | `firestore.rules` |
| `Slack webhook request failed` + status 404 | P1 | errorGroups.id | コミュニティ bot Webhook 設定確認 |
| `Failed to send Slack message to some bots` | P1 | 直前 webhook エラーとペア | 同上 |
| `Failed to backfill user profile counts` + userId が `http` 始まり | P1 | userId 値 | `users` ドキュメントの `user_id` 異常値 |
| `resource.labels.service_name=stripewebhook` / `createstripecheckoutsession` + ERROR | P1（P0 相当としてレポート強調） | service_name + errorGroups.id | `functions/default/src/stripeWebhook.ts` / `stripe.ts` |
| `logName` に `cloudaudit` + `was not found` | infra | status.message | 初回 deploy / 削除済み Function。単発なら低優先 |
| `logName` に `cloudscheduler` + NOT_FOUND | infra | jobName | スケジュール / Pub/Sub topic 未デプロイ |

## reportClientError の注意

- 表向き `jsonPayload.message` はすべて `Client application error`（Functions 側 logger の都合）
- **必ず `error_message` または `fingerprint` でグルーピング**
- `functions/default/src/clientErrorReport.ts` はフロントからのエラーを記録するだけ

## データ取得

- **本番解析**: 必ず `scripts/fetch_logs.py` または `gcloud logging read` で live 取得
- `evals/fixtures/` は skill-creator 用。ユーザー依頼の解析で fixture をデータ源にしない

## Monitoring アラート（本番）

Log-based Alert `shokujii functions error` は **clientError ノイズのみ除外**し、ZodError 等の要対応 ERROR は通知する。

| 正本 | 内容 |
|------|------|
| [`documents/09_運営向け機能/02_Monitoringアラート_shokujii_functions_error.md`](../../../../documents/09_運営向け機能/02_Monitoringアラート_shokujii_functions_error.md) | GCP filter 正本・変更手順 |
| [`functions/default/src/utils/clientErrorNoise.ts`](../../../../functions/default/src/utils/clientErrorNoise.ts) | server 側 WARN 格下げ（`CLIENT_*_PATTERNS` は本ファイルと `parse_logs.py` を同期） |

## 検証済み fixture パターン（eval 用）

### sandbox（`evals/fixtures/sandbox-dashboard-index.json`）

- 根本原因: `member_orders` composite index（`enterprise_id`, `status`）不足
- 影響: `getdashboardmonthlydata`, `getdashboardmemberdata`
- HTTP 500 + stderr の `Unhandled error` が trace で対応

### 本番（`evals/fixtures/prod-mixed-errors.json`）

- 57 件の `reportClientError`: 大半は noise（SW/chunk）、少数 P1（Storage, ZodError）
- 16 件の `slackOrderNotification`: webhook 404
- 4 件の `backfillUserProfileCounts`: userId に Storage URL
- 3 件 infra: scheduler / audit NOT_FOUND

## コード追跡（P1 / P0 のみ）

| 種別 | 参照 |
|------|------|
| Callable / Trigger | `functions/default/src/` を Function 名で Grep |
| Firestore index | `firestore.indexes.json` |
| Firestore Rules | `firestore.rules` |
| Storage Rules | `storage.rules` |
| 仕様 | `documents/` |
