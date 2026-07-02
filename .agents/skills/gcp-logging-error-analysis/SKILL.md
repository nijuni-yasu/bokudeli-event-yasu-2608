---
name: gcp-logging-error-analysis
description: Shokujii の GCP Cloud Logging ERROR を gcloud logging read で直接取得して解析する。人間が Console から JSON をダウンロードさせない。本番 bokudeli-event-dev / development bokudeli-event-test / sandbox bokudeli-event-yasu-*、JST 期間指定、severity=ERROR、Functions 500、Firestore index 不足、reportClientError、Slack 失敗の調査で必ず使う。「ログ読んで」「エラー解析して」「7/2 15時のエラー」でも起動。添付 JSON がある場合のみ gcloud を省略可。
compatibility: gcloud CLI（logging.read 権限）、Python 3（fetch_logs.py / parse_logs.py）
---

# GCP Logging エラー解析（Shokujii）

## 目的

指定 GCP プロジェクトの Cloud Logging から **ERROR を gcloud で直接取得**し、Shokujii 向け triage のうえ日本語レポートを出す。

**このスキルの価値は「人間が Console から JSON をダウンロードしなくてよい」こと。** 依頼を受けたら **まず gcloud を実行**する。fixture や添付 JSON は gcloud 不可時・eval 時の例外。

**解析・報告のみ**。deploy / index 作成 / 本番データ変更はユーザー明示依頼まで実行しない。

## 前提

- **gcloud CLI** インストール済み、`gcloud auth login` 済み
- 対象 project への `logging.logEntries.list` 権限
- 環境マッピング: [references/environments.md](references/environments.md)

gcloud 実行前に `gcloud auth list` でアカウントを確認。403 時は IAM をユーザーに案内。

## 環境解決

| キーワード | GCP Project ID |
|-----------|----------------|
| 本番 / production | `bokudeli-event-dev` |
| development / テスト | `bokudeli-event-test` |
| sandbox2510 / yasu-2510 | `bokudeli-event-yasu-2510` |
| sandbox2603 等 | `git remote get-url <remote>` から推定 |

**注意**: Git `development` ≠ GCP `bokudeli-event-dev`（本番）。

project 未確定時はユーザーに確認してから gcloud を実行する。

## ワークフロー（必須順）

### 1. gcloud で取得する（デフォルト・最優先）

ユーザーが環境と期間を指定したら **必ず Shell で gcloud を実行**する。リポジトリ内 fixture だけで解析して完了報告してはならない。

**推奨: `fetch_logs.py`（JST 期間対応）**

```bash
PROJECT_ID="bokudeli-event-dev"
OUT="/tmp/gcp-errors-${PROJECT_ID}-$(date +%Y%m%d%H%M%S).json"

# JST で期間指定（例: 7/2 15:00〜16:00）
python3 .agents/skills/gcp-logging-error-analysis/scripts/fetch_logs.py \
  --project="$PROJECT_ID" \
  --jst-from "2026-07-02 15:00" \
  --jst-to "2026-07-02 16:00" \
  -o "$OUT" \
  --parse
```

**相対期間（直近1時間など）**

```bash
python3 .agents/skills/gcp-logging-error-analysis/scripts/fetch_logs.py \
  --project="$PROJECT_ID" \
  --freshness="1h" \
  -o "$OUT" \
  --parse
```

**UTC で明示**

```bash
python3 .agents/skills/gcp-logging-error-analysis/scripts/fetch_logs.py \
  --project="$PROJECT_ID" \
  --from-utc "2026-07-02T06:00:00Z" \
  --to-utc "2026-07-02T07:00:00Z" \
  -o "$OUT"
```

取得件数 0 件のとき:

1. 期間を広げる / JST と UTC の取り違えを再確認
2. `--limit` を 500 に増やす
3. フィルタを緩める（[references/gcloud-queries.md](references/gcloud-queries.md)）
4. それでも 0 件なら「該当期間に ERROR なし」とレポート（gcloud 実行済みであることを明記）

詳細クエリ: [references/gcloud-queries.md](references/gcloud-queries.md)

### 2. 構造化（必須）

`fetch_logs.py --parse` を使わなかった場合:

```bash
python3 .agents/skills/gcp-logging-error-analysis/scripts/parse_logs.py "$OUT" --format md
```

### 3. triage とコード追跡

[references/error-patterns.md](references/error-patterns.md) に従う。P0 / P1 のみコード追跡。

### 4. 日本語レポート

下記テンプレに従う。**データソース: gcloud 直接取得** を環境セクションに書く。

## 入力ソースの優先順位

| 優先 | 入力 | 手順 |
|------|------|------|
| 1（通常） | 口頭・Console URL・期間指定 | **gcloud / fetch_logs.py** → parse → レポート |
| 2 | ユーザーが「この JSON だけ見て」と明示 | 添付 JSON → parse（gcloud 省略可） |
| 3 | gcloud 失敗（未インストール・403） | 失敗理由を報告。Console export を **最終手段**として案内 |

Console URL から `project` / `query` / 期間を読み取ったら、**同条件で gcloud を再実行**する（URL のスクリーンショット解析だけで終わらない）。

## JST 期間の扱い

- ユーザーが JST で言った期間は **`--jst-from` / `--jst-to`** を使う（手計算で UTC に変換しない）
- レポートの「期間」は **ユーザー指定の JST** と **実際にクエリした UTC** の両方を記載
- `--jst-to` は **終了時刻 exclusive**（15:00〜16:00 なら `--jst-from "… 15:00" --jst-to "… 16:00"`）

## triage

| tier | 扱い |
|------|------|
| **P0** | 決済・注文確定など全社影響 |
| **P1** | Rules / index / Webhook / データ異常 |
| **noise** | reportClientError の SW / chunk / Rejected 等 |
| **infra** | audit / scheduler NOT_FOUND |

**reportClientError**: レポート先頭で `client_error_summary` のノイズ / 要対応内訳を必ず書く。

## コード追跡（P0 / P1）

| 種別 | 参照 |
|------|------|
| Function | `functions/default/src/` |
| Firestore index | `firestore.indexes.json` |
| Rules | `firestore.rules`, `storage.rules` |

`trace_links` で HTTP 500 と stderr が同根なら 1 件にまとめて説明。

## 委譲

| 状況 | スキル |
|------|--------|
| Firestore | `/shokujii-firestore` |
| Functions | `/shokujii-functions-implementation` |
| Rules | `/firebase-firestore-standard` |
| sandbox deploy | `/github-actions-deploy` |

## 報告フォーマット（必須）

```markdown
# GCP エラー解析レポート

## 環境
- Project: ...
- 期間: ... JST（クエリ UTC: ...）
- 取得方法: gcloud logging read（filter: ...）
- 取得件数: N ERROR（ユニークグループ: M）

## エグゼクティブサマリー
（ノイズ X / 要対応 Y を必ず含める）

## reportClientError 内訳（該当時）

## エラー一覧（根本原因ごと）

## 再現・確認手順（使用した gcloud / fetch_logs コマンド）

## 未解決・要ユーザー確認
```

## セキュリティ

- レポートで user_id / Storage パス / IP は部分マスク
- 本番ログ **読み取り OK**、**書き込み禁止**

## 禁止事項

- **fixture や古い export だけで解析して gcloud を実行しないこと**
- ERROR 件数だけを障害と報告すること
- project ID を推測して gcloud すること
- 本番 deploy / データ変更を勝手にすること

## 参考

- [references/environments.md](references/environments.md)
- [references/gcloud-queries.md](references/gcloud-queries.md)
- [references/error-patterns.md](references/error-patterns.md)
- `scripts/fetch_logs.py` — gcloud ラッパ（JST 期間）
- `scripts/parse_logs.py` — triage
- `evals/fixtures/` — skill-creator 用のみ。本番解析の代替データ源にしない
