# 新規個人プロジェクト作成

参考：terraform/README.md

## 現状の環境


| 用途    | プロジェクトID                 |
| ----- | ------------------------ |
| 本番環境  | bokudeli-event-dev       |
| テスト環境 | bokudeli-event-test      |
| 個人環境  | bokudeli-event-yasu-2510 |
| 個人環境  | bokudeli-event-yasu-2603 |
| 個人環境  | bokudeli-event-yasu-2604 |
| 個人環境  | bokudeli-event-yasu-2605 |


---

## 前提条件

以下のツールが事前にインストール・ログイン済みである必要があります。

- **Terraform**（`brew install terraform` でインストール）
- **gcloud CLI**（[インストール手順](https://cloud.google.com/sdk/gcloud)）
- **GitHub CLI**（[インストール手順](https://cli.github.com)）

---

## 手順

### 1. GitHub リポジトリを新規作成する

GitHub 上でリポジトリを作成します。  
このリポジトリ名は後の手順で使用します（例：`your-org/your-repo`）。

### 2. Firebase プロジェクトを新規作成する

[Firebase コンソール](https://console.firebase.google.com/) にアクセスし、新しいプロジェクトを作成します。  
**プロジェクトID（GCP Project ID）** をメモしておいてください（例：`bokudeli-event-yasu-xxxx`）。

### 3. Firebase プロジェクトを Blaze プランに変更する

Firebase コンソール左下の「アップグレード」から **Blaze（従量課金）プラン** に変更します。  
Terraform で必要な一部の機能（Cloud Functions 等）は Blaze プランでないと利用できません。

### 4. 必要な CLI をインストール・ログインする

**Terraform のインストール**

```bash
brew install terraform
terraform --version
```

**GitHub CLI のログイン**

```bash
gh auth login
```

**gcloud のログイン**

```bash
gcloud auth login
```

### 5. Terraform の初期セットアップを実行する（init.sh）

`init.sh` を実行すると以下が自動で行われます：

- Terraform のバックエンド用 GCS バケットの作成
- `terraform init` の実行
- GitHub リポジトリへの環境変数（`PROJECT_ID`、`PROJECT_NUMBER`）の登録
- `terraform.tfvars` ファイルの生成

```bash
cd terraform
chmod +x init.sh
./init.sh
```

実行中に以下の入力を求められます：


| 入力項目           | 例                                      |
| -------------- | -------------------------------------- |
| GCP プロジェクトID   | `bokudeli-event-yasu-xxxx`             |
| GitHub リポジトリ   | `nijuni-yasu/bokudeli-event-yasu-xxxx` |
| GitHub 環境名（任意） | 個人環境の場合は空欄でOK                          |


#### GitHub 環境名（Environment）について

GitHub Actions には「環境（Environment）」という機能があり、`development`・`production` のようにデプロイ先ごとに Variables や Secrets を分けて管理できます。

`init.sh` に渡す環境名は、`PROJECT_ID` と `PROJECT_NUMBER` をどの環境に紐付けて登録するかを指定します。


| 入力            | 動作                                 |
| ------------- | ---------------------------------- |
| 空欄（Enter）     | リポジトリ全体の Variables として登録（環境に依存しない） |
| `development` | `development` 環境の Variables として登録  |
| `production`  | `production` 環境の Variables として登録   |


個人環境（`bokudeli-event-yasu-xxxx` 等）は sandbox 用途でプロジェクトが1つだけのため、**空欄で問題ありません**。  
環境名を指定するのは、同じリポジトリで `development` と `production` の Firebase プロジェクトを切り替える本番・開発構成の場合です。

### 6. Terraform を適用する

```bash
# 差分確認（dry-run）
terraform plan

# 適用
terraform apply
```

> **エラーが出た場合（quota project 未設定）**  
> 以下のエラーが出た場合は、quota project を設定してください。
>
> ```
> Error 403: Your application is authenticating by using local Application Default Credentials. ...
> ```
>
> ```bash
> gcloud auth application-default set-quota-project YOUR_PROJECT_ID
> ```

### 7. GitHub Actions の環境変数を設定する

リポジトリの Settings > Secrets and variables > Actions を開き、`development` / `production` の各環境ごとに以下を登録します。

#### Variables（平文・機密でない値）


| 変数名              | 説明                              |
| ---------------- | ------------------------------- |
| `PROJECT_ID`     | GCP プロジェクトID（`init.sh` で自動登録済み） |
| `PROJECT_NUMBER` | GCP プロジェクト番号（`init.sh` で自動登録済み） |
| `FIREBASERC`     | `.firebaserc` ファイルの中身（JSON形式）   |
| `ADMIN_ENV`      | `admin/.env` の内容                |
| `USER_ENV`       | `user/.env` の内容                 |
| `MANAGER_ENV`    | `manager/.env` の内容              |
| `FUNCTIONS_ENV`  | `functions/default/.env` の内容    |


#### Secrets（機密情報）


| シークレット名                      | 説明                              |
| ---------------------------- | ------------------------------- |
| `GCLOUD_SERVICE_KEY`         | GCP サービスアカウントキー（JSON）           |
| `SENDGRID_API_KEY`           | SendGrid API キー                 |
| `PDF_SERVICES_CLIENT_ID`     | Adobe PDF Services クライアントID     |
| `PDF_SERVICES_CLIENT_SECRET` | Adobe PDF Services クライアントシークレット |
| `SLACK_CLIENT_ID`            | Slack アプリ クライアントID              |
| `SLACK_CLIENT_SECRET`        | Slack アプリ クライアントシークレット          |
| `SLACK_SIGNING_SECRET`       | Slack アプリ Signing Secret        |
| `SLACK_STATE_SECRET`         | Slack アプリ State Secret          |
| `LINE_CHANNEL_ACCESS_TOKEN`  | LINE チャネルアクセストークン               |


#### `GCLOUD_SERVICE_KEY` の取得

`terraform apply` によりサービスアカウント **`firebase-deploy@<GCPプロジェクトID>.iam.gserviceaccount.com`** が作成されます。JSON キーは Terraform では発行しないため、次のいずれかで取得し、GitHub の Secret に登録します。

**方法A: GCP コンソール**

IAM と管理 → サービスアカウント → **`firebase-deploy`** → **キー** → **鍵を追加** → **JSON** を作成・ダウンロードし、ファイルの中身を `GCLOUD_SERVICE_KEY` に貼り付けます。

**方法B: gcloud CLI**

```bash
gcloud iam service-accounts keys create firebase-deploy-key.json \
  --iam-account="firebase-deploy@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --project=YOUR_PROJECT_ID
```

生成された `firebase-deploy-key.json` の内容を、そのまま `GCLOUD_SERVICE_KEY` に登録します。キーファイルは **リポジトリにコミットしない**でください。


### 8. GCP Secret Manager で値を設定する

[Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager) を開きます。  
Terraform でシークレットの**キー**は作成済みのため、**値（value）のみ手動で登録**します。


| シークレット名                          | 説明                              |
| -------------------------------- | ------------------------------- |
| `SENDGRID_API_KEY`               | SendGrid API キー                 |
| `PDF_SERVICES_CLIENT_ID`         | Adobe PDF Services クライアントID     |
| `PDF_SERVICES_CLIENT_SECRET`     | Adobe PDF Services クライアントシークレット |
| `STRIPE_API_KEY`                 | Stripe API キー                   |
| `STRIPE_WEBHOOK_ENDPOINT_SECRET` | Stripe Webhook エンドポイントシークレット    |
| `TWITTER_CONSUMER_KEY`           | Twitter（X）コンシューマーキー             |
| `TWITTER_CONSUMER_SECRET`        | Twitter（X）コンシューマーシークレット         |


> Secret Manager の値は Cloud Functions の `defineSecret` で直接参照されます。GitHub Actions の Secrets とは別管理です。

### 9. ローカルリポジトリに remote を追加する

個人環境のリポジトリを git remote として追加しておくと、`git push` でデプロイできるようになります。

```bash
git remote add sandbox2604 git@github.com:nijuni-yasu/bokudeli-event-yasu-2604.git
```

追加後に確認：

```bash
git remote -v
```

#### 現在の remote 一覧（参考）


| remote名       | リポジトリ                                    |
| ------------- | ---------------------------------------- |
| `origin`      | `nijuniinc/bokudeli-event-new`（本番）       |
| `sandbox2510` | `nijuni-yasu/bokudeli-event-yasu-2510`   |
| `sandbox2603` | `nijuni-yasu/bokudeli-event-yasu-2603-2` |
| `sandbox2604` | `nijuni-yasu/bokudeli-event-yasu-2604`   |


### 10. デプロイを実行する

GitHub Actions のワークフローを使ってデプロイします。  
（詳細は各リポジトリのワークフロー定義を参照）