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

`init.sh` 完了後、`terraform.tfvars` に次を手動追加する場合がある（[terraform/README.md](../../terraform/README.md) 参照）。

- **`auth_authorized_domains_extra`**: 本番のように Firebase Auth にカスタムドメイン（例: `shokujii.jp`）がある場合のみ。テスト・sandbox は省略可。
- **`storage_cors_origins_extra`**: Auth に無い origin（Preview Channel URL 等）のみ。カスタムドメインは `auth_authorized_domains_extra` から CORS にも自動反映される（[terraform/README.md](../../terraform/README.md) の「Storage CORS」参照）。

### 6. Terraform を適用する

```bash
# 差分確認（dry-run）
terraform plan

# 適用
terraform apply
```

`terraform apply` により、Storage Security Rules（#772 `storage.rules`）の `firestore.get()` に必要な **Firebase Rules Firestore Service Agent**（`roles/firebaserules.firestoreServiceAgent`）が Firebasestorage サービスアカウントへ付与されます。Console の「サービス間のルールのプロビジョニング → 権限を付与」と同等です。**`storage.rules` を初デプロイする前に apply 済みであること**を推奨します（[terraform/README.md](../../terraform/README.md) の「Storage ルールと IAM の順序」参照）。

あわせて **デフォルト Storage バケットの CORS**（チャット画像の `uploadBytes` / `getBlob` 用）も apply で設定されます。`firebase deploy --only storage` では CORS は付与されません。

初回 apply で `google_storage_bucket.default` が **409 Already Exists** になった場合、または CORS が未反映の場合は、[terraform/README.md](../../terraform/README.md) の「新規 sandbox で初回 apply 後に default bucket import が必要な場合」に従い import → 再 apply してください。

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
| `PARTNER_ENV`    | `partner/.env` の内容              |
| `USER_ENV`       | `user/.env` の内容                 |
| `MANAGER_ENV`    | `manager/.env` の内容              |
| `FUNCTIONS_ENV`  | `functions/default/.env` の内容    |


`PARTNER_ENV` / `USER_ENV` に **`VITE_STRIPE_PUBLISHABLE_KEY` を含める必要はありません**（不要です）。現行コードでは参照していません。理由と将来の扱いは [Stripe 環境構築手順](../07_リファクタリング/03_stripe決済の環境構築手順.md) のセクション 4 を参照してください。

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

#### CI デプロイ認証（`.github/workflows/deploy_*.yml`）

Firebase への GitHub Actions デプロイは、各 `deploy_*.yml` の job 内で **`google-github-actions/auth@v2`** を呼び出し、`secrets.GCLOUD_SERVICE_KEY` を `credentials_json` として渡します。これにより `GOOGLE_APPLICATION_CREDENTIALS` が job 全体に export され、共通 composite action [`.github/actions/deploy/action.yml`](../../.github/actions/deploy/action.yml) は **Firebase CLI のインストールと `firebase deploy` のみ**を担当します（composite action の input 経由で JSON 鍵を渡す方式は使いません）。

`deploy_firestore.yml` / `deploy_storage.yml` では、デプロイ前に **`actions/setup-node@v6`**（[`./.node-version`](../../.node-version) = Node 24）を必ず実行してください。hosting / functions 系 workflow はもともと `setup-node` がありますが、firestore / storage だけ欠けると runner デフォルトの Node 24 上で firebase-tools の OAuth トークン取得が失敗することがあります（`Failed to authenticate`）。`Generate .firebaserc`（`vars.FIREBASERC`）も user / partner と同様に生成します。

関連: Issue [#2117](https://github.com/nijuniinc/bokudeli-event-new/issues/2117)


[Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager) を開きます。  
[terraform/functions.tf](../../terraform/functions.tf) の `local.function_secret_ids` によりシークレットの**キー（12 件）は Terraform が作成済み**のため、**値（version）のみ手動で登録**します。


| シークレット名 | 説明 |
| ------------- | ---- |
| `SENDGRID_API_KEY` | SendGrid API キー |
| `PDF_SERVICES_CLIENT_ID` | Adobe PDF Services クライアントID |
| `PDF_SERVICES_CLIENT_SECRET` | Adobe PDF Services クライアントシークレット |
| `STRIPE_API_KEY` | Stripe API キー |
| `STRIPE_WEBHOOK_ENDPOINT_SECRET` | Stripe Webhook エンドポイントシークレット |
| `TWITTER_CONSUMER_KEY` | Twitter（X）コンシューマーキー（レガシー。現行 default 未使用） |
| `TWITTER_CONSUMER_SECRET` | Twitter（X）コンシューマーシークレット（同上） |
| `SLACK_SIGNING_SECRET` | Slack アプリ Signing Secret |
| `SLACK_CLIENT_ID` | Slack アプリ クライアントID |
| `SLACK_CLIENT_SECRET` | Slack アプリ クライアントシークレット |
| `SLACK_STATE_SECRET` | Slack OAuth state 用シークレット |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE チャネルアクセストークン |

> Secret Manager の値は Cloud Functions の `defineSecret` で直接参照されます。GitHub Actions の Secrets とは別管理です。  
> 既存 Terraform 管理プロジェクトで `for_each` 統合後に初回 apply する場合は、[terraform/README.md](../../terraform/README.md) の state 移行手順を先に実施してください。

#### 既存プロジェクト（本番 / テスト）— 新規作成手順との違い

`bokudeli-event-dev`（本番）や `bokudeli-event-test`（development）のように **すでに Firebase を運用している**プロジェクトは、本ドキュメントの手順 5〜6（`init.sh` → そのまま `apply`）だけでは不十分な場合がある。

| 項目 | 新規 sandbox | 既存本番・テスト |
| ---- | ------------ | ---------------- |
| import | 不要 | **必要**（バケット・Secret・Auth・Hosting 等） |
| `auth_authorized_domains_extra` | 通常不要 | 本番は **必須**（`shokujii.jp` 等） |
| apply タイミング | セットアップ時 | 本番は **リリース時**（bot 移行と合わせる） |

手順の正本: [terraform/README.md](../../terraform/README.md) の「既存プロジェクトの初回セットアップ」。移行 Runbook: [21_bot_legacy移行.md](../07_リファクタリング/21_bot_legacy移行.md) **5.13**。本番 plan 記録: [terraform/plan-dev-review.md](../../terraform/plan-dev-review.md)

Terraform を使わない場合は、不足キーを Secret Manager に手動作成し、`firebase-deploy` SA に各シークレットの `Secret Manager 管理者` を付与する。

Slack/LINE の値の取得元は [21_bot_legacy移行.md](../07_リファクタリング/21_bot_legacy移行.md) 5.8 Runbook を参照してください。

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

- 各 `deploy_*.yml` は deploy 直前に `google-github-actions/auth@v2` で `GCLOUD_SERVICE_KEY` を読み込む（詳細は手順 7「CI デプロイ認証」）
- `deploy_firestore` / `deploy_storage` は `setup-node`（`.node-version`）が必須
- ワークフロー定義: [`.github/workflows/`](../../.github/workflows/) の `deploy_*.yml`

```bash
# 例: sandbox リポジトリで firestore のみ手動デプロイ
gh workflow run deploy_firestore.yml --repo YOUR_ORG/YOUR_REPO --ref YOUR_BRANCH -f environment=development
```


### 11. Stripe Webhook の設定

個人 Firebase プロジェクトでは、Stripe 側は **Test mode**（`sk_test_...` / `pk_test_...`）で揃えるのが一般的です。Webhook も同じ Test mode で登録します。

詳細・トラブルシュート・ログ確認は [Stripe 環境構築手順](../07_リファクタリング/03_stripe決済の環境構築手順.md) を参照してください。

#### 前提

- **手順 8**（GCP Secret Manager）で Terraform 作成済みのシークレットに値を入れられる状態であること
- **手順 10**（デプロイ）で **Functions（`stripeWebhook` 含む）がデプロイ済み**であること（Webhook URL はデプロイ後に確定する）

#### 手順

1. **Stripe API キー（Test mode）**  
   [Stripe Dashboard](https://dashboard.stripe.com/) → **Developers** → **API keys** で Test mode を選択し、Secret key（`sk_test_...`）をコピーする。  
   GCP Secret Manager の `STRIPE_API_KEY` に登録する（手順 8）。Webhook 用 Signing secret とは別物なので混同しない。

2. **`stripeWebhook` の URL を確認する**  
   次のいずれかで実際の URL を取得する。
   - Firebase Console → **Functions** → `stripeWebhook` のトリガー / URL
   - GCP Console → **Cloud Run**（関数名に `stripewebhook` が含まれるサービス）の URL
   - GitHub Actions のデプロイログで `Function URL (stripeWebhook(...)):` を検索  

   URL の形式例（プロジェクトにより Cloud Functions 形式または Cloud Run 形式）:
   - `https://asia-northeast1-{GCPプロジェクトID}.cloudfunctions.net/stripeWebhook`

3. **Stripe で Webhook エンドポイントを追加する**  
   Dashboard → **Developers** → **Webhooks** → **+ Add endpoint**  
   - **Endpoint URL**: 手順 2 で取得した URL  
   - **イベント**: **`checkout.session.completed`** にチェック（必須）。`checkout.session.expired` はアプリ側で処理しないため通常は登録不要。PayPay 遅延決済を扱う場合は `documents/01_マネタイズと決済/06_PayPay決済_遅延決済.md` の 3.5 に従い `checkout.session.async_payment_succeeded` / `checkout.session.async_payment_failed` を追加する  
   - **Add endpoint** で保存

4. **Signing secret を Secret Manager に登録する**  
   作成したエンドポイントを開き、**Signing secret** を **Reveal** して `whsec_...` をコピーする。  
   GCP Secret Manager の `STRIPE_WEBHOOK_ENDPOINT_SECRET` に **新バージョンとして**登録する（手順 8）。

5. **Functions の再デプロイ（必要な場合）**  
   `STRIPE_WEBHOOK_ENDPOINT_SECRET` を初めて入れた直後や値を差し替えた直後は、シークレットを参照する `stripeWebhook` が新しい値を読むまで **Functions を再デプロイ**する。

#### 確認の目安

- Stripe Dashboard → Webhooks → 対象エンドポイント → **Events** で配信が **200** になっている
- Cloud Logging で `jsonPayload.module="stripeWebhook"` など、`Order completed via webhook` が出る（テスト決済時）

#### 注意

- Test mode と Live mode では **API キー・Webhook・Signing secret は別**です。Firebase プロジェクトに合わせてモードを統一する。
- Stripe 用のシークレットを **GitHub Actions の Secrets に登録する必要はありません**（不要です）。`defineSecret` で GCP Secret Manager を参照します。
- フロント用の **`VITE_STRIPE_PUBLISHABLE_KEY` の設定も不要です**（手順 7 の `USER_ENV` / `PARTNER_ENV` に含めなくてよい）。詳細は [Stripe 環境構築手順](../07_リファクタリング/03_stripe決済の環境構築手順.md) セクション 4。

### 12. データ移行
以下ドキュメントを参考に、プロジェクトのデータを移行する
documents/firebaseプロジェクト/firestoreデータ移行手順_手動.md
documents/firebaseプロジェクト/storageデータ移行手順_手動.md

### 13. Partnerアカウントの作成・店舗とメニューデータ作成

- console.firebase で飲食店アカウントを登録する
- ログインしてアカウント作成する

