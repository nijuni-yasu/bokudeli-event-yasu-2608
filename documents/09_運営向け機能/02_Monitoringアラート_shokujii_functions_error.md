# Monitoring アラート: shokujii functions error

本番 GCP プロジェクト `bokudeli-event-dev` の Log-based Alert 正本。Issue: [#2166](https://github.com/nijuniinc/bokudeli-event-new/issues/2166)。

## 概要

| 項目 | 値 |
|------|-----|
| 表示名 | `shokujii functions error` |
| Policy ID | `6102542799444339153` |
| リソース | `projects/bokudeli-event-dev/alertPolicies/6102542799444339153` |
| 通知レート制限 | 1 時間に 1 回 |
| 自動クローズ | 7 日 |

## Log match filter（正本）

```
severity>=ERROR
NOT (logName=~"cloudaudit.googleapis.com" OR logName=~"cloudscheduler.googleapis.com")
NOT (
  jsonPayload.module="clientError"
  AND (
    jsonPayload.error_message=~"Failed to fetch dynamically imported module"
    OR jsonPayload.error_message=~"Failed to register a ServiceWorker"
    OR jsonPayload.error_message=~"Connection failed."
    OR jsonPayload.error_message="Rejected"
    OR jsonPayload.error_message="rejected"
    OR jsonPayload.error_message=~"Load failed"
    OR jsonPayload.error_message=~"ServiceWorker"
    OR jsonPayload.error_message=~"serviceworker"
  )
)
```

### 除外されるもの（ノイズ）

- clientError の chunk 読み込み失敗、ServiceWorker 失敗、単体 `Rejected` / `rejected`、`Connection failed.` 等
- Cloud Audit / Cloud Scheduler の infra ERROR

### 通知されるもの（要対応）

- **ZodError**（`error_type=ZodError`）— filter でも server 側でも ERROR 維持
- Storage / Rules 系 clientError（`storage/unauthorized` 等）
- サーバー Functions ERROR（Slack 404、`handleEventOgpRequest` HTTP 500 等）
- 未知の clientError（shareSns TypeError、partner 権限不一致等）

ノイズ判定ロジックのコード正本: [`functions/default/src/utils/clientErrorNoise.ts`](../../functions/default/src/utils/clientErrorNoise.ts)（[`parse_logs.py`](../../.agents/skills/gcp-logging-error-analysis/scripts/parse_logs.py) と同期）。

## 変更手順

1. 現ポリシーを export:

   ```bash
   gcloud monitoring policies describe \
     projects/bokudeli-event-dev/alertPolicies/6102542799444339153 \
     --project=bokudeli-event-dev --format=json > /tmp/alert-policy.json
   ```

2. `conditions[0].conditionMatchedLog.filter` を上記正本に差し替え

3. 適用:

   ```bash
   gcloud monitoring policies update \
     projects/bokudeli-event-dev/alertPolicies/6102542799444339153 \
     --project=bokudeli-event-dev \
     --policy-from-file=/tmp/alert-policy-updated.json
   ```

## 適用前検証

直近 24h で新旧 filter の件数を比較する（2026-07-06 時点: 40 → 24 件）。

```bash
# 旧 filter
python3 .agents/skills/gcp-logging-error-analysis/scripts/fetch_logs.py \
  --project=bokudeli-event-dev --freshness=24h -o /tmp/before.json --parse

# 新 filter（正本を --filter に1行で渡す）
python3 .agents/skills/gcp-logging-error-analysis/scripts/fetch_logs.py \
  --project=bokudeli-event-dev --freshness=24h \
  --filter='severity="ERROR" AND NOT (logName=~"cloudaudit.googleapis.com" OR logName=~"cloudscheduler.googleapis.com") AND NOT (jsonPayload.module="clientError" AND (jsonPayload.error_message=~"Failed to fetch dynamically imported module" OR jsonPayload.error_message=~"Failed to register a ServiceWorker" OR jsonPayload.error_message=~"Connection failed." OR jsonPayload.error_message="Rejected" OR jsonPayload.error_message="rejected" OR jsonPayload.error_message=~"Load failed" OR jsonPayload.error_message=~"ServiceWorker" OR jsonPayload.error_message=~"serviceworker"))' \
  -o /tmp/after.json --parse
```

**注意**: `gcloud logging read` では `REGEXP_MATCH` は使えない。`ServiceWorker` / `serviceworker` を個別に指定する。

## 関連

- [01_520エラー通知.md](./01_520エラー通知.md) — clientError レポート仕様
- [error-patterns.md](../../.agents/skills/gcp-logging-error-analysis/references/error-patterns.md) — triage パターン

## Functions デプロイ（`#2166` WARN 格下げ）

`reportClientError` の server 側変更を反映するには hybrid Functions デプロイが必要。

```bash
# 本番（bokudeli-event-dev）— CI 経由が正規（production ブランチ push → deploy_functions workflow）
# ローカル単体デプロイは FUNCTIONS 用 .env（EVENT_HOST 等）が必要
firebase deploy --only functions:reportClientError --project bokudeli-event-dev
```

2026-07-06: Monitoring filter は本番適用済み。Functions コードは PR マージ後の `deploy_functions` で反映する。
