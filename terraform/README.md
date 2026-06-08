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

## Apply

Initialize 後は `apply` を適用

```
# Dry run
terraform plan
# Apply
terraform apply
```

`terraform apply` では次も作成されます（[firestore_backup.tf](firestore_backup.tf) / [service_account.tf](service_account.tf)）。

| リソース | 内容 |
| -------- | ---- |
| GCS バケット | `gs://<PROJECT_ID>-firestore-backups`（`backupFirestore` の export 先） |
| バケット IAM | Firestore サービスエージェントに `roles/storage.admin` |
| プロジェクト IAM | Compute / App Engine デフォルト SA に `roles/datastore.importExportAdmin` |

バケットのロケーションは Firestore と同じ `asia-northeast1`（`var.region`）です。

### 既存プロジェクトでバケットが手動作成済みの場合

`bokudeli-event-test` など、既に `gs://<PROJECT_ID>-firestore-backups` があると `Error 409` で apply が失敗します。state に取り込んでから再 apply してください。

```bash
terraform import google_storage_bucket.firestore_backups YOUR_PROJECT_ID-firestore-backups
terraform apply
```

IAM リソース（Firestore SA・compute / appspot の `importExportAdmin`）は未設定なら apply で追加されます。

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

`bokudeli-event-dev` / `bokudeli-event-test` など、Terraform state バケット（`<project>-terraform`）が無い、または一度も `terraform apply` していないプロジェクトでは、本リポジトリのコード変更だけでは Secret キーは作成されません。次のいずれかで対応してください。

1. **Terraform で初回セットアップ**（推奨）  
   [firebaseプロジェクト新規作成.md](../documents/firebaseプロジェクト/firebaseプロジェクト新規作成.md) の手順 5〜6 に従い `init.sh` → `terraform apply` を実行する。state 移行は不要。

2. **GCP コンソールで手動作成**  
   [Secret Manager](https://console.cloud.google.com/security/secret-manager) で不足キー（特に Slack/LINE 5 件）を作成し、`firebase-deploy@<project>.iam.gserviceaccount.com` に各シークレットの `Secret Manager 管理者`（`roles/secretmanager.admin`）を付与する。

## 補足

`terraform apply` を実行すると以下のようなエラーが出ることがあります。

```
Error: Error creating Instance: googleapi: Error 403: Your application is authenticating by using local Application Default Credentials. The firebasedatabase.googleapis.com API requires a quota project, which is not set by default. To learn how to set your quota project, see https://cloud.google.com/docs/authentication/adc-troubleshooting/user-creds
```

これは quota project が設定されていないのが問題なので、以下のどちらかの方法で quota project を設定してください

1. `GOOGLE_CLOUD_QUOTA_PROJECT` 環境変数に quota project id を設定する
1. `gcloud auth application-default set-quota-project PROJECT_ID`
