# Stripe 環境構築手順

新規環境（development / production）で Stripe 決済を有効にする際の手順。

## 前提

- Stripe アカウントが作成済みであること
- [Stripe Dashboard](https://dashboard.stripe.com/) にアクセスできること

## 1. Stripe API キーの取得

### 画面操作手順

1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン
2. 個人検証では **Test mode** で API キーを扱えば十分なことが多く、Stripe の Sandbox 機能を**別途作成する必要はありません**（利用する場合は Dashboard の案内に従う）
3. 左上の **「Developers」** をクリック
4. 左メニューから **「API keys」** をクリック
5. 右上の **「Test mode」** / **「Live mode」** トグルで環境を切り替え
6. **Standard keys** セクションで:
  - **Publishable key**（`pk_test_...` / `pk_live_...`）: 表示されている値をコピー（現行アプリではフロントの環境変数に**入れる必要はありません**。セクション 4 参照）
  - **Secret key**（`sk_test_...` / `sk_live_...`）: **「Reveal test key」** または **「Reveal live key」** をクリックして表示し、コピー
7. **注意**: Live mode の Secret key は一度しか表示されないため、必ず安全な場所に保存する


| 環境  | Secret key    | Publishable key |
| --- | ------------- | --------------- |
| テスト | `sk_test_...` | `pk_test_...`   |
| 本番  | `sk_live_...` | `pk_live_...`   |


## 2. GCP Secret Manager の設定（Functions 用）

default Functions は `defineSecret` で以下を参照する。GCP Secret Manager に登録する。


| シークレット名                          | 値                             | 用途                                                    |
| -------------------------------- | ----------------------------- | ----------------------------------------------------- |
| `STRIPE_API_KEY`                 | Secret key（`sk_...`）          | Checkout Session 作成・返金・Webhook 署名検証時の Stripe インスタンス生成 |
| `STRIPE_WEBHOOK_ENDPOINT_SECRET` | Webhook 署名シークレット（`whsec_...`） | Webhook 署名検証                                          |


**Terraform で管理する場合**（`terraform/functions.tf` に追加）:

```hcl
resource "google_secret_manager_secret" "STRIPE_API_KEY" {
  secret_id = "STRIPE_API_KEY"
  replication { auto {} }
  depends_on = [google_project_service.default]
}

resource "google_secret_manager_secret" "STRIPE_WEBHOOK_ENDPOINT_SECRET" {
  secret_id = "STRIPE_WEBHOOK_ENDPOINT_SECRET"
  replication { auto {} }
  depends_on = [google_project_service.default]
}
```

Terraform はシークレットの**リソース作成**のみ行い、**値の設定**は手動または別の方法で行う。

### 画面操作手順（GCP Console）

#### Secret Manager を開く

1. [Google Cloud Console](https://console.cloud.google.com/) にログイン
2. プロジェクトを選択（development / production）
3. 左上のハンバーガーメニュー → **「セキュリティ」** → **「Secret Manager」**
4. または検索バーで「Secret Manager」を検索

#### シークレットの作成（Terraform 未使用の場合）

1. **「+ シークレットを作成」** をクリック
2. **名前**: `STRIPE_API_KEY` を入力
3. **シークレットの値**: Stripe の Secret key（`sk_...`）を貼り付け
4. **「作成」** をクリック
5. 同様に **「+ シークレットを作成」** で `STRIPE_WEBHOOK_ENDPOINT_SECRET` を作成（値は後で Webhook 作成時に設定）

#### シークレットの値の登録・更新

1. 一覧から対象シークレット（例: `STRIPE_API_KEY`）をクリック
2. **「新バージョンを追加」** をクリック
3. **シークレットの値** に値を貼り付け
4. **「追加」** をクリック

## 3. Webhook エンドポイントの作成（Stripe Dashboard）

### 新規作成 vs 既存の URL 変更

**新規エンドポイントの作成を推奨**する。既存の legacy 用エンドポイントの URL を変更するより、新規作成の方がロールバックが容易。問題時は新規を無効化し、既存エンドポイントをそのまま使える。

### Webhook URL の確認方法

URL 形式は環境により異なる（Cloud Functions 形式 / Cloud Run 形式）。どちらも有効。実際の URL は以下で確認する。

- **Firebase Console**: Functions → stripeWebhook → トリガー/URL
- **GCP Console**: Cloud Run → stripewebhook → URL
- **デプロイログ**: GitHub Actions のログ内で `Function URL (stripeWebhook(...)):` を検索

### 画面操作手順

#### Webhook 画面を開く

1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン
2. 左上の **「Developers」** をクリック
3. 左メニューから **「Webhooks」** をクリック
4. 右上で **Test mode** / **Live mode** を選択

#### エンドポイントを追加

1. **「+ Add endpoint」** をクリック
2. **Endpoint URL** に実際の URL を入力（上記「Webhook URL の確認方法」で取得）
  - Cloud Functions 形式の例: `https://asia-northeast1-{projectId}.cloudfunctions.net/stripeWebhook`
  - Cloud Run 形式の例: `https://stripewebhook-{hash}-an.a.run.app`
3. **「Select events to listen to」** をクリック
4. 検索ボックスに `checkout.session.completed` と入力
5. **「checkout.session.completed」** にチェックを入れる（必須）
6. 任意: セッション期限切れの開発を進める場合は `checkout.session.expired` も追加可
7. **「Add endpoint」** をクリック

#### Signing secret を取得

1. 作成したエンドポイントをクリック
2. **「Signing secret」** セクションを開く
3. **「Reveal」** をクリックして `whsec_...` を表示
4. 値をコピーし、GCP Secret Manager の `STRIPE_WEBHOOK_ENDPOINT_SECRET` に登録

**注意**: Webhook は Functions デプロイ後に作成する。先にエンドポイントを作成する場合は、デプロイ後に URL を更新する。

### 旧 Webhook エンドポイントの無効化（legacy 移行完了時）

新規 Webhook エンドポイントを作成する運用では、legacy 用エンドポイントが Stripe に残ったままになる。Phase 6 で legacy 関数を削除する前に、**旧 URL へ送り続けないようにする対応が必要**です。無効化しないと、Stripe が旧 URL へイベントを送り続け、恒常的な配信失敗とリトライが発生する。

**実施タイミング**: default への切り替えが確定した後、Phase 6（Legacy 関数の削除）のコード変更・デプロイの前

**画面操作手順**:

1. [Stripe Dashboard](https://dashboard.stripe.com/) → **Developers** → **Webhooks**
2. Test mode / Live mode を切り替え、それぞれで legacy 用エンドポイント（default の URL を登録していない方）を特定
3. 対象エンドポイントをクリック
4. **「…」** メニューから **「Disable」** で**無効化する**（これで旧 URL への配信は止まる）。**エンドポイントの削除は必須ではありません**（整理したい場合のみ Delete してよい）
5. 無効化で足ります。削除は運用上の整理として任意です

## 4. フロントエンド環境変数 `VITE_STRIPE_PUBLISHABLE_KEY`

**設定は不要です。** 現行コードでは `user` / `admin` いずれも参照しておらず、GH-1346 で `createStripeCheckoutSession`（Firebase Functions）に移行した以降、フロントに Publishable key を置く必要はありません。`USER_ENV` / `ADMIN_ENV` に含めなくても決済フローは動作します。

将来 Stripe Elements 等をフロントに組み込む場合に限り、その時点で `pk_` を環境変数に追加すれば十分です。

### 参考（将来フロントで `pk_` が必要になった場合）

1. プロジェクトルートで `user/.env.development` 等を開く
2. 次の行を追加する:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxx"
   ```
3. 本番用の場合は `user/.env.sandbox` や本番用 `.env` にも同様に設定
4. **注意**: `pk_` で始まる Publishable key のみ使用。Secret key（`sk_`）はフロントの環境変数に**置かない**こと

## 5. GitHub Secrets / Variables（CI デプロイ用）

`deploy_functions.yml` では default Functions 用の Stripe シークレットは `.env` に書き出していない（`defineSecret` で GCP Secret Manager から取得）。  
そのため、Stripe 用の値を **GitHub Secrets に追加する必要はありません**（不要です）。GCP Secret Manager にだけ登録すればよい。

## 6. 推奨作業順序

1. Stripe API キー取得（セクション 1）
2. GCP Secret Manager に `STRIPE_API_KEY` を登録（セクション 2）
3. Functions をデプロイ（`stripeWebhook` がデプロイされる）
4. Stripe Webhook エンドポイントを**新規作成**（セクション 3）
5. GCP Secret Manager に `STRIPE_WEBHOOK_ENDPOINT_SECRET` を登録（セクション 2）
6. フロントの `VITE_STRIPE_PUBLISHABLE_KEY` は**設定不要**（セクション 4）

## 7. 確認チェックリスト

- GCP Secret Manager に `STRIPE_API_KEY` が登録されている
- GCP Secret Manager に `STRIPE_WEBHOOK_ENDPOINT_SECRET` が登録されている
- Stripe Dashboard に Webhook エンドポイントが登録されている（`checkout.session.completed`）
- Webhook の Signing secret が `STRIPE_WEBHOOK_ENDPOINT_SECRET` と一致している
- Firebase Console で `stripeWebhook`, `stripeRefunds`, `createStripeCheckoutSession` がデプロイされている
- フロントの `VITE_STRIPE_PUBLISHABLE_KEY` は**未設定のままでよい**（設定不要）

## 8. 動作確認方法（ログで移行完了を検証する）

決済が正常に動作していることを、GCP Cloud Logging と Stripe Dashboard で確認する。

### GCP Cloud Logging での確認

1. [Google Cloud Console](https://console.cloud.google.com/) にログイン
2. プロジェクトを選択
3. 左メニュー → **「ログ」**（Logging）を開く
4. クエリビルダーで以下を入力

#### ログの開き方とクエリ例


| シナリオ             | クエリ                                  | 期待されるログメッセージ                                  |
| ---------------- | ------------------------------------ | --------------------------------------------- |
| Stripe 決済の注文確定   | `jsonPayload.module="stripeWebhook"` | `Order completed via webhook`                 |
| 主催者払い・当日払いの注文確定  | `jsonPayload.module="orders"`        | `Order status updated`（`newStatus: ordered`）  |
| Stripe 返金        | `jsonPayload.module="stripeRefunds"` | `Refund completed`                            |
| 主催者払い・当日払いのキャンセル | `jsonPayload.module="orders"`        | `Order status updated`（`newStatus: canceled`） |


#### メッセージで絞り込む場合

```
jsonPayload.message="Order completed via webhook"
```

```
jsonPayload.message="Refund completed"
```

```
jsonPayload.message="Order status updated"
```

時間範囲を「過去 1 時間」「過去 24 時間」などに絞ると見つけやすい。

### Stripe Dashboard での確認

1. [Stripe Dashboard](https://dashboard.stripe.com/) → **Developers** → **Webhooks**
2. 使用しているエンドポイント（default の URL）をクリック
3. **「Events」** タブで配信履歴を確認
4. `checkout.session.completed` が **Delivered** かつ **200** になっていること

### 動作確認チェックリスト


| 確認項目            | 方法                                                                    |
| --------------- | --------------------------------------------------------------------- |
| Stripe 決済で注文確定  | Cloud Logging で `Order completed via webhook` が出力されている                |
| 主催者払いで注文確定      | Cloud Logging で `Order status updated`（`newStatus: ordered`）が出力されている  |
| Stripe 決済のキャンセル | Cloud Logging で `Refund completed` が出力されている                           |
| 主催者払いのキャンセル     | Cloud Logging で `Order status updated`（`newStatus: canceled`）が出力されている |
| Webhook の配信     | Stripe Dashboard の Webhooks → Events で 200 が返っている                     |


### エラー時の確認

以下のログが出た場合は設定や実装を確認する。


| ログメッセージ                                 | 想定原因                                                         |
| --------------------------------------- | ------------------------------------------------------------ |
| `Webhook signature verification failed` | `STRIPE_WEBHOOK_ENDPOINT_SECRET` の値が Signing secret と一致していない |
| `Order not found`                       | Webhook の metadata が不正、または order が存在しない                      |
| `Invalid status transition`             | 不正なステータス遷移のリクエスト                                             |


