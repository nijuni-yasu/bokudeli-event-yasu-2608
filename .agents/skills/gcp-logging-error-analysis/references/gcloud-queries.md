# gcloud logging read クエリ集

**エージェントは Console からの JSON ダウンロードに頼らず、必ず gcloud を実行する。**

正本ラッパ: `scripts/fetch_logs.py`（JST 期間・UTC 期間・freshness 対応）

## 推奨: fetch_logs.py

```bash
PROJECT_ID="bokudeli-event-dev"
OUT="/tmp/gcp-errors-${PROJECT_ID}.json"

# JST 期間（ユーザーが「7/2 15時〜16時」と言った場合）
python3 .agents/skills/gcp-logging-error-analysis/scripts/fetch_logs.py \
  --project="$PROJECT_ID" \
  --jst-from "2026-07-02 15:00" \
  --jst-to "2026-07-02 16:00" \
  -o "$OUT" \
  --parse

# 直近1時間
python3 .agents/skills/gcp-logging-error-analysis/scripts/fetch_logs.py \
  --project="$PROJECT_ID" \
  --freshness="1h" \
  -o "$OUT" \
  --parse
```

`--jst-to` は **exclusive**（16:00 ちょうどは含まない）。

## 生 gcloud（fetch_logs 相当の filter）

### 絶対期間（JST 15:00〜16:00 = UTC 06:00〜07:00）

```bash
gcloud logging read \
  'severity="ERROR" AND timestamp>="2026-07-02T06:00:00Z" AND timestamp<"2026-07-02T07:00:00Z"' \
  --project=bokudeli-event-dev \
  --limit=200 \
  --format=json
```

### 相対期間

```bash
gcloud logging read 'severity="ERROR"' \
  --project=bokudeli-event-dev \
  --freshness=1h \
  --limit=200 \
  --format=json
```

**注意**: `--freshness` と `timestamp>=` を同時に使う場合の挙動に依存しない。**指定期間があるときは timestamp フィルタを優先**（fetch_logs.py がそうする）。

## よく使うフィルタ

```bash
# 特定 Cloud Run / Functions（service_name は小文字）
'severity="ERROR" AND resource.labels.service_name="getdashboardmemberdata"'

# HTTP 500
'severity="ERROR" AND httpRequest.status=500'

# reportClientError
'severity="ERROR" AND jsonPayload.module="clientError"'

# Slack 通知
'severity="ERROR" AND resource.labels.service_name="slackordernotification"'

# 監査・スケジューラ
'severity="ERROR" AND (logName=~"cloudaudit" OR logName=~"cloudscheduler")'
```

### Monitoring アラート `shokujii functions error` 相当（clientError ノイズ除外）

正本: [`documents/09_運営向け機能/02_Monitoringアラート_shokujii_functions_error.md`](../../../../documents/09_運営向け機能/02_Monitoringアラート_shokujii_functions_error.md)

```bash
# 1 行 filter（fetch_logs.py --filter 用）
'severity>=ERROR AND NOT (logName=~"cloudaudit.googleapis.com" OR logName=~"cloudscheduler.googleapis.com") AND NOT (jsonPayload.module="clientError" AND (jsonPayload.error_message=~"Failed to fetch dynamically imported module" OR jsonPayload.error_message=~"Failed to register a ServiceWorker" OR jsonPayload.error_message=~"Connection failed." OR jsonPayload.error_message="Rejected" OR jsonPayload.error_message="rejected" OR jsonPayload.error_message=~"Load failed" OR jsonPayload.error_message=~"ServiceWorker" OR jsonPayload.error_message=~"serviceworker"))'
```

ZodError は通常 `error_message` がノイズパターンに一致しないため Monitoring から除外されない。

Monitoring 相当 filter を fetch する例:

```bash
python3 .agents/skills/gcp-logging-error-analysis/scripts/fetch_logs.py \
  --project=bokudeli-event-dev --freshness=24h \
  --filter='severity>=ERROR AND NOT (logName=~"cloudaudit.googleapis.com" OR logName=~"cloudscheduler.googleapis.com") AND NOT (jsonPayload.module="clientError" AND (jsonPayload.error_message=~"Failed to fetch dynamically imported module" OR jsonPayload.error_message=~"Failed to register a ServiceWorker" OR jsonPayload.error_message=~"Connection failed." OR jsonPayload.error_message="Rejected" OR jsonPayload.error_message="rejected" OR jsonPayload.error_message=~"Load failed" OR jsonPayload.error_message=~"ServiceWorker" OR jsonPayload.error_message=~"serviceworker"))' \
  -o /tmp/monitoring-equivalent.json --parse
```

### clientError のみを調査する場合（Monitoring filter とは別）

```bash
python3 .agents/skills/gcp-logging-error-analysis/scripts/fetch_logs.py \
  --project=bokudeli-event-dev --freshness=1h \
  --filter='severity="ERROR" AND jsonPayload.module="clientError"' \
  -o /tmp/client-errors.json --parse
```

## trace 追跡

```bash
TRACE="projects/bokudeli-event-dev/traces/XXXX"
gcloud logging read "trace=\"$TRACE\"" \
  --project=bokudeli-event-dev \
  --format=json
```

通常は `parse_logs.py` の `trace_links` で足りる。

## Console URL から gcloud へ

URL から project / query / duration を読んだら **同条件で gcloud を実行**。JSON export は使わない。

| URL 要素 | gcloud への反映 |
|----------|----------------|
| `project=` | `--project` |
| `query=` | filter に追加 |
| `duration=PT5M` | `--freshness=5m`（絶対時刻が無い場合） |
| 時刻範囲 UI | `--jst-from` / `--jst-to` または UTC timestamp |

## 件数・limit

- 初回 `--limit=200`。0 件または打ち切り疑いなら 500
- 本番 clientError 多発時は filter で分割取得
- レポートに **生件数** と **グループ数** を両方記載

## 失敗時

| 症状 | 対処 |
|------|------|
| 403 | IAM / プロジェクト確認 |
| 0 件 | 期間・JST/UTC・project 再確認。実行済み gcloud コマンドをレポートに残す |
| gcloud 未インストール | インストール案内。JSON export は最終手段 |
| command not found | `which gcloud` を確認 |

## JSON 添付が来た場合

ユーザーが **既に export 済み JSON を解析専用で渡した** と明示したときのみ gcloud を省略可。それ以外は **live gcloud を優先**。
