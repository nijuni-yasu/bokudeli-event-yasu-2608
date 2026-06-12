## Initialize

`terraform.tfstate` を Google Cloud Storage に保存するため、 `terraform init` に適切なオプションが必要です。
初期セットアップと `terraform.tfvars` を適切に作成するため、[init.sh](init.sh) を用意してあるので、そちらを利用してください。
なお、`init.sh` を使用するためには、[gcloud CLI](https://cloud.google.com/sdk/gcloud) と [GitHub CLI](https://cli.github.com) がインストールされていて、それぞれログイン済みであることが必要です。

なお、Google Cloud Project を変更する場合は `.terraform` を削除の上、再度 `init.sh` を実行してください。

## init.shの実行手順
1. Githubのリポジトリを新規作成してください。
2. firebaseプロジェクトを新規作成してください。
3. firebaseプロジェクトはBlazeプランに課金してください。
4. 事前にTerraformをインストールしてください。
```
brew install terraform
terraform --version
```
5. Github CLIにログインしてください。
```
gh auth login
```
6. gcloudに事前にログインしてください。
```
gcloud auth login
```
7. 実行
```
cd terraform
chmod +x init.sh
./init.sh
```

## terraform.tfvars の環境固有設定

`init.sh` は `project` と `github_repo` のみ書き出します。Firebase Auth の **Authorized domains** で本番カスタムドメイン等が必要な場合は、手動で `auth_authorized_domains_extra` を追加してください（[firebase.tf](firebase.tf)）。

全プロジェクト共通で常に含まれるドメイン: `localhost`, `{project}.web.app`, `{project}.firebaseapp.com`

本番 `bokudeli-event-dev` の例:

```hcl
auth_authorized_domains_extra = [
  "bokudeli-event-dev-launch.web.app",
  "launch.shokujii.jp",
  "shokujii.jp",
  "bokudeli-event-dev--newevent-mtew8woa.web.app",
]
```

テスト・sandbox では未設定（空リスト）で問題ありません。既存プロジェクトで Console に独自ドメインがある場合、**apply 前に** [Firebase Console](https://console.firebase.google.com/) → Authentication → Settings → Authorized domains、または Identity Platform API で一覧を確認し、不足分を `auth_authorized_domains_extra` に含めること（含めないと apply で削除される可能性があります）。

## 既存プロジェクトの初回セットアップ（本番・テスト）

`bokudeli-event-dev`（本番）や `bokudeli-event-test`（development）のように **すでに Firebase を運用しているプロジェクト**へ初めて Terraform を適用する手順です。新規プロジェクト（`init.sh` 直後の sandbox）とは異なり、**既存リソースの import** が必要です。

### 適用タイミング

| 環境 | 推奨タイミング |
| ---- | -------------- |
| **development**（`bokudeli-event-test`） | bot 移行のテストデプロイ前後（Secret キー・IAM が必要なため） |
| **本番**（`bokudeli-event-dev`） | **本番リリース手順の一部**として実施。Functions デプロイ（Slack/LINE 含む）より**前**に `apply` し、その後 Secret **値**を登録してからデプロイする |

`terraform apply` 単体ではアプリのダウンタイムはほぼありませんが、Secret 値登録と Functions デプロイはリリースウィンドウでまとめて行う想定です。

本番の plan レビュー記録: [plan-dev-review.md](plan-dev-review.md)

### 手順概要

1. `terraform.tfvars` を用意（`project`, `github_repo`, 必要なら `auth_authorized_domains_extra`）
2. state バケット作成 → `terraform init` → 下記 **import**
3. `terraform plan`（**Destroy 0**、Auth でドメイン削除が無いことを確認）
4. `terraform apply`
5. Secret **値**を手動登録 → Functions デプロイ

`init.sh` を使う場合も、本番では GitHub `production` Variables の更新タイミングはリリース計画に合わせてよい。最小 init（state バケット + `terraform init` のみ）でも可。

### import 一覧（GCP は変更しない）

`PROJECT` を対象の GCP プロジェクト ID に置換する。存在するリソースのみ実行する。

```bash
cd terraform
gcloud config set project PROJECT
gcloud auth application-default set-quota-project PROJECT

# state バケット（init 後）
terraform import google_storage_bucket.terraform_state PROJECT-terraform

# ストレージ・基盤（既存運用プロジェクト）
terraform import google_storage_bucket.firestore_backups PROJECT-firestore-backups
terraform import google_storage_bucket.invoice PROJECT-invoice
terraform import google_app_engine_application.default PROJECT
terraform import google_firestore_database.default "projects/PROJECT/databases/(default)"
terraform import google_firebase_storage_bucket.default "projects/PROJECT/buckets/PROJECT.appspot.com"

# Secret（functions.tf の 12 キー。GCP に存在するもののみ import）
PROJECT=PROJECT
for name in SENDGRID_API_KEY PDF_SERVICES_CLIENT_ID PDF_SERVICES_CLIENT_SECRET \
  STRIPE_API_KEY STRIPE_WEBHOOK_ENDPOINT_SECRET TWITTER_CONSUMER_KEY TWITTER_CONSUMER_SECRET \
  SLACK_SIGNING_SECRET SLACK_CLIENT_ID SLACK_CLIENT_SECRET SLACK_STATE_SECRET \
  LINE_CHANNEL_ACCESS_TOKEN; do
  if gcloud secrets describe "$name" --project="$PROJECT" >/dev/null 2>&1; then
    terraform import "google_secret_manager_secret.functions[\"$name\"]" "projects/$PROJECT/secrets/$name"
  fi
done

# Firebase Auth（カスタムドメインを tfvars に書いたうえで）
terraform import google_identity_platform_config.auth projects/PROJECT/config

# Firebase プロジェクト・Hosting・Web App（既存の場合。apply 前に推奨）
terraform import google_firebase_project.default projects/PROJECT
terraform import google_firebase_hosting_site.user "projects/PROJECT/sites/PROJECT"
terraform import google_firebase_hosting_site.admin "projects/PROJECT/sites/PROJECT-admin"
terraform import google_firebase_hosting_site.enterprise "projects/PROJECT/sites/PROJECT-enterprise"
# Web App: Console → プロジェクトの設定 → アプリ から App ID を確認
# terraform import google_firebase_web_app.default "projects/PROJECT/webApps/APP_ID"

# Storage クロスサービス Rules IAM（#772 storage.rules。Console「権限を付与」と同等）
# 手動付与済みの場合のみ import。未付与なら apply で Add される
NUM=$(gcloud projects describe PROJECT --format='value(projectNumber)')
terraform import google_project_iam_member.firebasestorage_firestore_cross_service_rules \
  "PROJECT roles/firebaserules.firestoreServiceAgent serviceAccount:service-${NUM}@gcp-sa-firebasestorage.iam.gserviceaccount.com"
```

import は **Terraform state のみ**更新する。本番サービスは停止しない。

### plan で確認すること

| チェック | 合格基準 |
| -------- | -------- |
| Destroy | **0** |
| `authorized_domains` | 本番カスタムドメイン（例: `shokujii.jp`）が **削除（`-`）されない** |
| 新規 Secret | **5 件**の Add のみ（`SLACK_*` 4 + `LINE_CHANNEL_ACCESS_TOKEN` 1。既存 7 件が Add なら import 漏れ） |
| Hosting / Web App | create のままなら import 漏れ（409 リスク）。user / admin / **enterprise**（`PROJECT-enterprise`）を確認 |
| `firestore_backups` | `storage_class` 差分なし（[firestore_backup.tf](firestore_backup.tf) は `ARCHIVE` 固定。本番手動作成バケットと一致） |
| `firebasestorage_firestore_cross_service_rules` | 未付与 env では **Add 1**。Console 手動付与済みなら **import 後 no-op**（[service_account.tf](service_account.tf)） |

### Storage ルール（`storage.rules`）と IAM の順序

#772 以降の `storage.rules` は `firestore.get()` を使う。**`terraform apply` で Storage クロスサービス IAM を付与してから** `Deploy storage`（または `firebase deploy --only storage`）すること。新規 sandbox では Console の「問題を修正」は不要（Terraform が [Firebase Rules Firestore Service Agent](https://firebase.google.com/docs/rules/manage-deploy#manage_permissions_for_cross-service) を付与する）。

既存プロジェクトで Console から手動付与済みの場合は import 一覧の `firebasestorage_firestore_cross_service_rules` を実行してから plan する。

### 環境別の進捗（参考）

| プロジェクト | Terraform state | apply |
| ------------ | --------------- | ----- |
| `bokudeli-event-test` | あり | 実施済み（bot 移行テスト用） |
| `bokudeli-event-dev` | あり（plan まで） | **本番リリース時に実施予定** |

## Apply

Initialize 後は `apply` を適用

```
# Dry run
terraform plan
# Apply
terraform apply
```

`terraform apply` では次も作成されます（[firestore_backup.tf](firestore_backup.tf) / [service_account.tf](service_account.tf) / [firebase.tf](firebase.tf)）。

| リソース | 内容 |
| -------- | ---- |
| GCS バケット | `gs://<PROJECT_ID>-firestore-backups`（`backupFirestore` の export 先。`storage_class = ARCHIVE`） |
| バケット IAM | Firestore サービスエージェントに `roles/storage.admin` |
| プロジェクト IAM | Compute / App Engine デフォルト SA に `roles/datastore.importExportAdmin` |
| プロジェクト IAM | Firebasestorage SA に `roles/firebaserules.firestoreServiceAgent`（Storage Rules の `firestore.get()` 用） |
| Firebase Hosting サイト | `<PROJECT_ID>`（user）、`<PROJECT_ID>-admin`（partner）、`<PROJECT_ID>-enterprise`（enterprise）。初回 apply 時のみ。既存 site は [import](#import-一覧gcp-は変更しない) |

バケットのロケーションは Firestore と同じ `asia-northeast1`（`var.region`）です。

### 既存プロジェクトでバケットが手動作成済みの場合

`bokudeli-event-test` など、既に `gs://<PROJECT_ID>-firestore-backups` があると `Error 409` で apply が失敗します。state に取り込んでから再 apply してください。

```bash
terraform import google_storage_bucket.firestore_backups YOUR_PROJECT_ID-firestore-backups
terraform apply
```

IAM リソース（Firestore SA・compute / appspot の `roles/datastore.importExportAdmin`、Firebasestorage の `roles/firebaserules.firestoreServiceAgent`）は未設定なら apply で追加されます。`roles/firebaserules.firestoreServiceAgent` を Console で手動付与済みの場合は import 一覧を参照。

### 動作確認（backupFirestore）

1. Cloud Scheduler で `backupFirestore` を「今すぐ実行」
2. ログに `Firestore export started` が出ること
3. バケットにタイムスタンプ付き export フォルダが作成されること

詳細は [07_21_bot_legacy移行_実機テスト.md](../documents/テスト/07_21_bot_legacy移行_実機テスト.md) の BKP-01 を参照。

その後、各種変数は手動で登録する必要があります。

- [GitHub Actions](../../../../settings/secrets/actions) 用環境変数を登録
- [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager) に適切な変数を設定  
  シークレットの**キー**は [functions.tf](functions.tf) の `local.function_secret_ids` で Terraform が一括定義します。**値（version）は手動で登録**する必要があります。

### Secret Manager で Terraform が作成するキー（12 件）

| シークレット名 | 用途 |
| ------------- | ---- |
| `SENDGRID_API_KEY` | SendGrid |
| `PDF_SERVICES_CLIENT_ID` / `PDF_SERVICES_CLIENT_SECRET` | Adobe PDF |
| `STRIPE_API_KEY` / `STRIPE_WEBHOOK_ENDPOINT_SECRET` | Stripe |
| `TWITTER_CONSUMER_KEY` / `TWITTER_CONSUMER_SECRET` | レガシー（現行 default 未使用） |
| `SLACK_SIGNING_SECRET` / `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` / `SLACK_STATE_SECRET` | Slack bot（#2060） |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE bot（#2060） |

ランタイム用 `secretAccessor` は Terraform では付与しません。`firebase deploy` が Function の `secrets: [...]` に応じて runtime SA へバインドします。CI 用 `firebase-deploy` SA には各シークレット単位で `roles/secretmanager.admin` を付与します（デプロイ時の `setIamPolicy` 用）。

## 既存 Terraform 管理プロジェクトへの適用（state 移行）

`functions.tf` を個別リソースから `for_each` に統合した後、**既に `terraform apply` 済みのプロジェクト**では、初回 `apply` の前に state 移行が必要です。未実施だと Terraform が既存 Secret を削除して再作成しようとします。

`terraform/` で backend を init したうえで、以下を実行してください。

### Secret リソース（7 件）

```bash
terraform state mv 'google_secret_manager_secret.SENDGRID_API_KEY' 'google_secret_manager_secret.functions["SENDGRID_API_KEY"]'
terraform state mv 'google_secret_manager_secret.PDF_SERVICES_CLIENT_ID' 'google_secret_manager_secret.functions["PDF_SERVICES_CLIENT_ID"]'
terraform state mv 'google_secret_manager_secret.PDF_SERVICES_CLIENT_SECRET' 'google_secret_manager_secret.functions["PDF_SERVICES_CLIENT_SECRET"]'
terraform state mv 'google_secret_manager_secret.STRIPE_API_KEY' 'google_secret_manager_secret.functions["STRIPE_API_KEY"]'
terraform state mv 'google_secret_manager_secret.STRIPE_WEBHOOK_ENDPOINT_SECRET' 'google_secret_manager_secret.functions["STRIPE_WEBHOOK_ENDPOINT_SECRET"]'
terraform state mv 'google_secret_manager_secret.TWITTER_CONSUMER_KEY' 'google_secret_manager_secret.functions["TWITTER_CONSUMER_KEY"]'
terraform state mv 'google_secret_manager_secret.TWITTER_CONSUMER_SECRET' 'google_secret_manager_secret.functions["TWITTER_CONSUMER_SECRET"]'
```

### IAM リソース（7 件）

```bash
terraform state mv 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["sendgrid"]' 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["SENDGRID_API_KEY"]'
terraform state mv 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["pdf_services_client_id"]' 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["PDF_SERVICES_CLIENT_ID"]'
terraform state mv 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["pdf_services_client_secret"]' 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["PDF_SERVICES_CLIENT_SECRET"]'
terraform state mv 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["stripe_api_key"]' 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["STRIPE_API_KEY"]'
terraform state mv 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["stripe_webhook"]' 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["STRIPE_WEBHOOK_ENDPOINT_SECRET"]'
terraform state mv 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["twitter_consumer_key"]' 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["TWITTER_CONSUMER_KEY"]'
terraform state mv 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["twitter_consumer_secret"]' 'google_secret_manager_secret_iam_member.firebase_deploy_secret_admin["TWITTER_CONSUMER_SECRET"]'
```

### 移行後の plan / apply

```bash
terraform plan   # 期待: Add 5（Slack/LINE の Secret + IAM）、Destroy 0
terraform apply
```

その後、新規 5 件の Secret に値（version）を手動登録します（[21_bot_legacy移行.md](../documents/07_リファクタリング/21_bot_legacy移行.md) 5.8 Runbook 参照）。

```bash
# 例（値はリポジトリにコミットしない）
echo -n 'YOUR_VALUE' | gcloud secrets versions add SLACK_SIGNING_SECRET --data-file=- --project=YOUR_PROJECT_ID
```

**新規プロジェクト**（init.sh 後の初回 apply）では state 移行は不要です。`terraform apply` で 12 キーが一括作成されます。

### apply 時に Secret が既存（409 Already exists）の場合

GCP に手動作成済みで Terraform state に無い Secret があると、`Error 409: Secret already exists` で apply が失敗します。次で state に取り込んでから再 apply してください。

```bash
PROJECT=YOUR_PROJECT_ID
for name in SENDGRID_API_KEY PDF_SERVICES_CLIENT_ID PDF_SERVICES_CLIENT_SECRET \
  STRIPE_API_KEY STRIPE_WEBHOOK_ENDPOINT_SECRET TWITTER_CONSUMER_KEY TWITTER_CONSUMER_SECRET \
  SLACK_SIGNING_SECRET SLACK_CLIENT_ID SLACK_CLIENT_SECRET SLACK_STATE_SECRET LINE_CHANNEL_ACCESS_TOKEN; do
  if gcloud secrets describe "$name" --project="$PROJECT" >/dev/null 2>&1; then
    terraform import "google_secret_manager_secret.functions[\"$name\"]" "projects/$PROJECT/secrets/$name" || true
  fi
done
terraform apply
```

## Terraform 未管理プロジェクト（本番 / テスト）

state バケット（`<project>-terraform`）が無い、または一度も `terraform apply` していないプロジェクトでは、コード変更だけでは Secret キーは作成されません。

1. **Terraform で初回セットアップ**（推奨）  
   - **新規プロジェクト**: [firebaseプロジェクト新規作成.md](../documents/firebaseプロジェクト/firebaseプロジェクト新規作成.md) 手順 5〜6（`init.sh` → `apply`）。state 移行・import は不要。  
   - **既存プロジェクト**（`bokudeli-event-dev` / `bokudeli-event-test` 等）: 上記 **[既存プロジェクトの初回セットアップ](#既存プロジェクトの初回セットアップ本番テスト)** に従う。import → plan → apply。本番 apply はリリース時。

2. **GCP コンソールで手動作成**（Terraform を使わない場合）  
   [Secret Manager](https://console.cloud.google.com/security/secret-manager) で不足キー（特に新規 5 件: `SLACK_*` 4 + `LINE_CHANNEL_ACCESS_TOKEN` 1）を作成し、`firebase-deploy@<project>.iam.gserviceaccount.com` に各シークレットの `Secret Manager 管理者`（`roles/secretmanager.admin`）を付与する。

## 補足

`terraform apply` を実行すると以下のようなエラーが出ることがあります。

```
Error: Error creating Instance: googleapi: Error 403: Your application is authenticating by using local Application Default Credentials. The firebasedatabase.googleapis.com API requires a quota project, which is not set by default. To learn how to set your quota project, see https://cloud.google.com/docs/authentication/adc-troubleshooting/user-creds
```

これは quota project が設定されていないのが問題なので、以下のどちらかの方法で quota project を設定してください

1. `GOOGLE_CLOUD_QUOTA_PROJECT` 環境変数に quota project id を設定する
1. `gcloud auth application-default set-quota-project PROJECT_ID`
