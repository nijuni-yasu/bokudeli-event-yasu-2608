# Shokujii GCP 環境マッピング

正本: [`documents/firebaseプロジェクト/firebaseプロジェクト新規作成.md`](../../../../documents/firebaseプロジェクト/firebaseプロジェクト新規作成.md)

## 用途 ↔ GCP Project ID

| 呼び方 | GCP Project ID | Git ブランチ（参考） |
|--------|----------------|---------------------|
| 本番 / production | `bokudeli-event-dev` | `production` |
| development / テスト | `bokudeli-event-test` | `development` |
| 個人 sandbox | `bokudeli-event-yasu-2510` | 作業ブランチ任意 |
| 個人 sandbox | `bokudeli-event-yasu-2603` | 作業ブランチ任意 |
| 個人 sandbox | `bokudeli-event-yasu-2604` | 作業ブランチ任意 |
| 個人 sandbox | `bokudeli-event-yasu-2605` | 作業ブランチ任意 |
| 個人 sandbox | `bokudeli-event-yasu-2606` | 作業ブランチ任意 |
| 個人 sandbox | `bokudeli-event-yasu-2607` | 作業ブランチ任意 |
| 個人 sandbox | `bokudeli-event-yasu-2608` | 作業ブランチ任意 |

## 混同しやすい点

- **Git ブランチ名 `development` ≠ GCP `bokudeli-event-dev`**
  - `development` ブランチの Firebase プロジェクトは **`bokudeli-event-test`**
  - **`bokudeli-event-dev` は本番** GCP プロジェクト ID
- Hosting URL 例: 本番 `shokujii.jp`、development `bokudeli-event-test.web.app`

## 環境解決の優先順

1. ユーザーが project ID を明示（例: `bokudeli-event-yasu-2510`）
2. キーワード: `本番` / `production` → `bokudeli-event-dev`、`development` / `テスト` → `bokudeli-event-test`
3. sandbox remote 名（例: `sandbox2510`）→ `git remote get-url sandbox2510` から repo 名を取得し project ID を推定
4. 添付 JSON / Console URL の `resource.labels.project_id` または URL の `project=` パラメータ
5. 未確定時はユーザーに確認（推測で gcloud を実行しない）

## sandbox remote → project ID（例）

| git remote | GitHub repo（例） | GCP Project ID |
|------------|-------------------|----------------|
| `sandbox2510` | `nijuni-yasu/bokudeli-event-yasu-2510` | `bokudeli-event-yasu-2510` |
| `sandbox2603` | `nijuni-yasu/bokudeli-event-yasu-2603-2` | `bokudeli-event-yasu-2603`（要 remote URL 確認） |
| `sandbox2604` | `nijuni-yasu/bokudeli-event-yasu-2604` | `bokudeli-event-yasu-2604` |
| `sandbox2605` | `nijuni-yasu/bokudeli-event-yasu-2605` | `bokudeli-event-yasu-2605` |
| `sandbox2606` | `nijuni-yasu/bokudeli-event-yasu-2606` | `bokudeli-event-yasu-2606` |
| `sandbox2607` | `nijuni-yasu/bokudeli-event-yasu-2607` | `bokudeli-event-yasu-2607` |
| `sandbox2608` | `nijuni-yasu/bokudeli-event-yasu-2608` | `bokudeli-event-yasu-2608` |

リモート URL の repo 名と GCP project ID が一致しない場合がある。`git remote get-url` の結果を優先する。

## リージョン

Firebase Functions / Cloud Run は **`asia-northeast1`** が既定。gcloud フィルタや Console URL で location が分かる場合は記録する。
