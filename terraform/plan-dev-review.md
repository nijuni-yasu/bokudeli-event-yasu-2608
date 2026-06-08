# 本番 bokudeli-event-dev Terraform plan レビュー

実施日: 2026-06-08  
対象: GCP `bokudeli-event-dev`（本番）  
実施範囲: Authorized domains 監査 → 最小 init → state import → `terraform plan` → Firebase 残り import → 再 plan  
**`terraform apply` は未実施**（リリース日に実施予定）

関連ファイル（いずれも **ローカルのみ**。リポジトリにはコミットしない）:

- plan 出力（初回）: `terraform/plan-dev.log`（ルート `*.log` で gitignore）
- plan 出力（Firebase import 後）: `terraform/plan-dev-after-import.log`（同上）
- plan バイナリ: `terraform/tfplan-dev`（`terraform/.gitignore` の `tfplan-*` で除外）

**リリース日**: 上記は 2026-06-08 時点の作業者ローカル保存物。本番 apply 前に **必ず再 plan** すること（`set -o pipefail` 付き。手順は §5）。`plan` 失敗時に古い `tfplan-dev` を apply しない。

---

## 1. Authorized domains

### 1-1. 本番の現状（Identity Platform API）

| ドメイン |
| -------- |
| `localhost` |
| `bokudeli-event-dev.firebaseapp.com` |
| `bokudeli-event-dev.web.app` |
| `bokudeli-event-dev-launch.web.app` |
| `launch.shokujii.jp` |
| `shokujii.jp` |
| `bokudeli-event-dev--newevent-mtew8woa.web.app` |

### 1-2. Terraform 定義（[firebase.tf](firebase.tf) + [main.tf](main.tf) `auth_authorized_domains_extra`）

共通 3 件 + `terraform.tfvars` の extra 4 件:

| ドメイン |
| -------- |
| `localhost` |
| `bokudeli-event-dev.web.app` |
| `bokudeli-event-dev.firebaseapp.com` |
| `bokudeli-event-dev-launch.web.app` |
| `launch.shokujii.jp` |
| `shokujii.jp` |
| `bokudeli-event-dev--newevent-mtew8woa.web.app` |

### 1-3. 差分（初回 plan 時のみ。コード対応後は解消）

初回 plan 時は Terraform 定義に無く本番に存在したドメイン 4 件があった。`auth_authorized_domains_extra` 追記後は Terraform 定義と一致。

### 1-4. 判定

**Auth ブロッカー — 解消済み（2026-06-08）**

- `auth_authorized_domains_extra` 変数化 + 本番 tfvars に 4 ドメイン設定
- `google_identity_platform_config.auth` import 済み
- 再 plan で `authorized_domains` **削除差分なし**（`shokujii.jp` 維持）

---

## 2. plan サマリ

初回（Auth 変数化・import 前）:

```
Plan: 63 to add, 2 to change, 0 to destroy.
```

再 plan（`auth_authorized_domains_extra` 対応 + `google_identity_platform_config.auth` import 後）:

```
Plan: 62 to add, 3 to change, 0 to destroy.
```

再 plan（Firebase project / Hosting / Web App import 後・`storage_class = ARCHIVE` 反映後）:

```
Plan: 58 to add, 3 to change, 0 to destroy.
```

`authorized_domains` は **削除なし**（並び替えのみ）。`shokujii.jp` / `launch.shokujii.jp` 等は維持。

| 項目 | 結果（import 後 plan） |
| ---- | ---- |
| Destroy | **0**（合格） |
| 新規 Secret | **5 件 Add**（`SLACK_*` 4 + `LINE_CHANNEL_ACCESS_TOKEN` 1。期待どおり） |
| 既存 Secret | **7 件** import 済み。Add なし（合格） |
| Hosting / Web App / Firebase project | **create なし**（import 済み。合格） |
| `firestore_backups` `storage_class` | **差分なし**（`ARCHIVE` 固定。合格） |
| `firebase-deploy` SA / WIF | Add（新規。本番に未存在） |

---

## 3. 高リスク差分

### 3-1. Auth — 解消済み

- 初回: `create` かつ 3 ドメインのみ → ブロッカーだった
- 対応後: `update in-place`、ドメイン削除なし（並び替え + `sign_in` の軽微な差分のみ）

### 3-2. Firestore バックアップバケット — 解消済み（2026-06-08）

- リソース: `google_storage_bucket.firestore_backups`
- 初回 plan 時: `storage_class` **ARCHIVE → STANDARD**（Terraform 未指定のデフォルト差分）
- 本番現状: Console 確認で **Archive**（日次 export フォルダ運用中）
- **方針決定**: **ARCHIVE 維持**（長期保管・保管コスト優先）
- **対応**: [firestore_backup.tf](firestore_backup.tf) に `storage_class = "ARCHIVE"` を追加済み。import 後 plan で `storage_class` 差分なしを確認済み

### 3-3. Firebase Hosting / Web App — 解消済み（2026-06-08）

本番に既存 Hosting サイトあり:

- `bokudeli-event-dev`（user）
- `bokudeli-event-dev-admin`（admin）
- その他（Terraform 管理外）: `launch`, `manager`, `kanda-curry`

**対応済み**: `google_firebase_project.default` / Hosting user・admin / Web App を import。plan 上の **create は解消**。

**apply 時の軽微な change（要認識）**:

- `google_firebase_hosting_site.user`: `app_id` が `null` へ update in-place（Terraform 定義に `app_id` 未指定のため。Hosting サイト自体は維持）
- `google_identity_platform_config.auth`: ドメイン並び替え + `sign_in` ブロックの軽微な差分（削除なし）
- `google_storage_bucket.terraform_state`: `versioning` 有効化

### 3-4. 低リスク・想定内の Add

- `google_project_service.*`（API 有効化。既存プロジェクトでは実質 no-op 相当）
- IAM 各種（`importExportAdmin`, `storage.admin`, `firebase-deploy` 権限等）
- 新規 Secret 5 件（Slack 4 + LINE 1）+ 既存 7 件含む計 12 件への `firebase-deploy` 用 `secretmanager.admin` IAM

---

## 4. import 実施一覧

### 実施済み（state のみ更新、GCP 無変更）

| リソース | ID |
| -------- | -- |
| `google_storage_bucket.terraform_state` | `bokudeli-event-dev-terraform` |
| `google_storage_bucket.firestore_backups` | `bokudeli-event-dev-firestore-backups` |
| `google_storage_bucket.invoice` | `bokudeli-event-dev-invoice` |
| `google_app_engine_application.default` | `bokudeli-event-dev` |
| `google_firestore_database.default` | `projects/bokudeli-event-dev/databases/(default)` |
| `google_firebase_storage_bucket.default` | `projects/bokudeli-event-dev/buckets/bokudeli-event-dev.appspot.com` |
| `google_secret_manager_secret.functions[...]` | 既存 7 Secret |
| `google_identity_platform_config.auth` | `projects/bokudeli-event-dev/config` |
| `google_firebase_project.default` | `projects/bokudeli-event-dev` |
| `google_firebase_hosting_site.user` | `projects/bokudeli-event-dev/sites/bokudeli-event-dev` |
| `google_firebase_hosting_site.admin` | `projects/bokudeli-event-dev/sites/bokudeli-event-dev-admin` |
| `google_firebase_web_app.default` | `projects/bokudeli-event-dev/webApps/1:602744855875:web:b9713923c7f8fa4deaa3f6` |

---

## 5. apply Go/No-Go

| 判定 | **Go（apply 待ち）** — import・再 plan 完了。リリース日に **再 plan 後** `terraform apply tfplan-dev` 可 |
| ---- | ----------------------------------------------------------------------------------------- |

### 解消済み

1. **Auth `authorized_domains`**: `auth_authorized_domains_extra` 変数化 + 本番 tfvars に 4 ドメイン設定済み
2. **`google_identity_platform_config.auth` import** 済み。再 plan でドメイン削除差分なし
3. **`firestore_backups` `storage_class`**: 本番は Archive。Terraform を `ARCHIVE` に合わせ済み（§3-2）
4. **Firebase project / Hosting / Web App import** 済み。409 リスク解消（§3-3）

### 残ブロッカー

なし（apply 前の import・plan レビューは完了）

### リリース日の残タスク

1. **再 plan → 合格確認 → apply**（`plan` 成功時のみ `apply`。`tee` 単体の終了コードに頼らない）

   ```bash
   cd terraform
   set -o pipefail
   terraform plan -out=tfplan-dev 2>&1 | tee plan-release.log
   # 上記が終了コード 0 のときのみ続行（pipefail により plan 失敗時は非 0）
   # 本ドキュメント §2 の合格基準を再確認
   terraform apply tfplan-dev
   ```

2. Secret 値 5 件を本番用に手動登録（[21_bot_legacy移行.md](../documents/07_リファクタリング/21_bot_legacy移行.md) 5.13）
3. Functions デプロイ・疎通確認（Slack/LINE / backupFirestore BKP-01）

手順の正本: [README.md](README.md) の「既存プロジェクトの初回セットアップ」

---

## 6. 実施ログ

### init（2026-06-08）

- state バケット `gs://bokudeli-event-dev-terraform` を新規作成
- `terraform.tfvars` を本番用に切替（`github_repo = nijuniinc/bokudeli-event-new`）
- GitHub `production` Variables は**未更新**（計画どおり）

### Firebase 残り import + 再 plan（2026-06-08）

```bash
terraform import google_firebase_project.default projects/bokudeli-event-dev
terraform import google_firebase_hosting_site.user "projects/bokudeli-event-dev/sites/bokudeli-event-dev"
terraform import google_firebase_hosting_site.admin "projects/bokudeli-event-dev/sites/bokudeli-event-dev-admin"
terraform import google_firebase_web_app.default "projects/bokudeli-event-dev/webApps/1:602744855875:web:b9713923c7f8fa4deaa3f6"
terraform plan -out=tfplan-dev  # → 58 add, 3 change, 0 destroy
```

- 全 import 成功。GCP 実リソース変更なし
- README plan 合格基準 5 項目すべて合格
