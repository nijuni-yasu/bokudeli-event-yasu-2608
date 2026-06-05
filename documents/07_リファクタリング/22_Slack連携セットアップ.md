# Slack 連携セットアップ

## 1. 概要

shokujii の Slack 連携は `functions/default` の `slackbot` 関数（`@slack/bolt`）が担う。

| 機能 | 説明 |
|------|------|
| **OAuth インストール** | チャンネルに Incoming Webhook を登録（Firestore `slackbots`） |
| **スラッシュコマンド** | コミュニティと Slack チャンネルを紐づけ（`communities/{id}/bots`） |
| **通知** | `orderNotification` / `eventNotification` が Webhook URL へ POST |

### 原則: 1 Firebase プロジェクト = 1 Slack App

sandbox を複数運用する場合、次を **同じ Firebase プロジェクト**に揃えること。

- Slack App（Request URL / OAuth Redirect）
- GCP Secret Manager（`SLACK_*`）
- 管理画面のデプロイ先（`*.firebaseapp.com`）
- `VITE_SLACK_BOT_FUNCTION_URL`（インストール URL）

別プロジェクトの `slackbot` を向けると、コマンドは届くが Firestore にコミュニティが無く **「入力された値があっていません」** になる。

## 2. 設定の全体像

| 設定場所 | 項目 | 備考 |
|----------|------|------|
| **Slack App** ([api.slack.com](https://api.slack.com/apps)) | OAuth Redirect、Slash Commands、Scopes | 下記 §3 |
| **GCP Secret Manager** | `SLACK_SIGNING_SECRET` 等 4 件 | プロジェクト単位。[21_bot_legacy移行.md](./21_bot_legacy移行.md) 5.8 参照 |
| **GitHub Variables** `FUNCTIONS_ENV` | `SLACK_COMMAND_NAME` | Secret Manager ではない。functions デプロイ時に `.env` へ出力 |
| **GitHub Variables** `USER_ENV` 等 | `VITE_SLACK_BOT_FUNCTION_URL` | 管理画面のインストール URL 用 |

## 3. Slack App の設定（api.slack.com）

### 3.1 slackbot の URL を確認

Firebase Console → **Build → Functions** → `slackbot` → トリガー URL を確認する。

Gen2（Cloud Run）では次の形式になる。

```
https://slackbot-xxxxxxxxxx-an.a.run.app
```

以降 `{SLACKBOT_BASE}` と表記する。

> **注意**: 再デプロイでホスト名が変わることがある。Slack App の URL と GitHub の `VITE_SLACK_BOT_FUNCTION_URL` を、現行の `slackbot` URL に揃える。

legacy 形式（参考）:

```
https://asia-northeast1-{PROJECT_ID}.cloudfunctions.net/slackbot
```

いずれの場合も、Bolt が受け付けるパス（§3.2〜3.3）は同じである。

### 3.2 OAuth & Permissions

| 項目 | 値 |
|------|-----|
| **Redirect URLs** | `{SLACKBOT_BASE}/slack/oauth_redirect` |
| **Bot Token Scopes** | `chat:write`, `commands`, `incoming-webhook` |

コード上の scopes と一致させる（`functions/default/src/slackbot.ts`）。

### 3.3 Slash Commands

| 項目 | 値 |
|------|-----|
| **Command** | `/{SLACK_COMMAND_NAME}`（例: `/shokujii`, `/shokujii_test2510`） |
| **Request URL** | **`{SLACKBOT_BASE}/slack/events`** |

> **重要**: `@slack/bolt` の ExpressReceiver は、スラッシュコマンド・イベント・インタラクションを **`/slack/events` の単一エンドポイント**で受ける。`/slack/commands` というルートは **存在しない**。Request URL を `/slack/commands` にすると **404** となり、Slack 側では **「アプリが応答しなかった」** と表示される。

ExpressReceiver が登録する主なルート:

| ルート | 用途 |
|--------|------|
| `POST /slack/events` | スラッシュコマンド・イベント等（**Slash Commands の Request URL はここ**） |
| `GET /slack/install` | インストール開始 |
| `GET /slack/oauth_redirect` | OAuth コールバック |

### 3.4 SLACK_COMMAND_NAME との一致

バックエンドは `SLACK_COMMAND_NAME` で登録した **1 コマンドのみ**受け付ける（未設定時は `shokujii`）。

```
Slack App のコマンド名
  = FUNCTIONS_ENV の SLACK_COMMAND_NAME
  = ユーザーが Slack で打つ /xxx
```

変更後は **Deploy functions** が必要。Secret Manager に書いても読まれない（`defineString` のため）。

## 4. GCP Secret Manager（対象 Firebase プロジェクト）

| Secret 名 | 取得元 | Slack 管理画面での設定 |
|-----------|--------|------------------------|
| `SLACK_SIGNING_SECRET` | Slack App → **Basic Information** → Signing Secret | 表示値をコピー |
| `SLACK_CLIENT_ID` | **OAuth & Permissions** → Client ID | 表示値をコピー |
| `SLACK_CLIENT_SECRET` | **OAuth & Permissions** → Client Secret | 表示値をコピー |
| `SLACK_STATE_SECRET` | **自分で生成**（32 文字以上のランダム文字列） | **設定不要**（Slack に項目はない） |

`SLACK_STATE_SECRET` の例（生成）:

```bash
openssl rand -base64 32
```

登録後 `slackbot` をデプロイする。詳細は [21_bot_legacy移行.md](./21_bot_legacy移行.md) 5.8 Runbook および [firebaseプロジェクト新規作成.md](../firebaseプロジェクト/firebaseプロジェクト新規作成.md) を参照。

## 5. GitHub Variables（sandbox 例）

### FUNCTIONS_ENV

デプロイ時に `functions/default/.env` へ出力される（[deploy_functions.yml](../../.github/workflows/deploy_functions.yml)）。

```
EVENT_HOST=<project>.firebaseapp.com
PARTNER_HOST=<project>-admin.firebaseapp.com
SLACK_COMMAND_NAME=shokujii_test2510   # 任意。未設定時 shokujii
```

### USER_ENV（管理画面）

```
VITE_SLACK_BOT_FUNCTION_URL=https://slackbot-xxxxxxxxxx-an.a.run.app
```

管理画面のインストール URL は `{VITE_SLACK_BOT_FUNCTION_URL}/slack/install` として表示される（`base/src/firebase.ts` → `user/.../slackSetting.vue`）。

## 6. 利用者向け手順（管理画面）

1. **Step 1**: コミュニティ管理 → **Slack設定**タブのインストール URL から OAuth を実行し、通知したいチャンネルを選択する。
2. **Step 3**: 表示された `add` コマンドをコピーし、**Step 1 でインストールした同じチャンネル**で実行する。
3. 成功時: **「コミュニティ ○○ を登録しました！」**

### add コマンドの形式

```
/{SLACK_COMMAND_NAME} add {community_account}-{community_id}
```

例:

```
/shokujii_test2510 add 260524-1xRpOdQliDkR0tbpkz9z
```

ハイフン区切りの左が `community_account`、右が Firestore ドキュメント ID（`community_id`）である。管理画面 Slack設定タブのコピー用文字列と一致させる。

> **既知の制限**: 管理画面のコピー用コマンドは `/shokujii` 固定（`user/src/components/manage/community/slackSetting.vue`）。sandbox で `SLACK_COMMAND_NAME` を変えた場合は、プレフィックスを手動で置き換える。

## 7. Firestore に作成されるデータ

### OAuth 完了時（インストール）

| パス | 内容 |
|------|------|
| `slackbots/{teamId}` | `oauth_data`（OAuth installation の JSON） |
| `slackbots/{teamId}/channels/{channelId}` | Incoming Webhook の `url`, `channel`, `channel_id` 等 |

`teamId` は Slack ワークスペース ID、`channelId` はインストールしたチャンネル ID。

### add 成功時

| パス | 内容 |
|------|------|
| `communities/{communityId}/bots/{botKey}` | コミュニティと Slack チャンネルの紐づけ（`botKey` 例: `slack-{teamId}-{channelId}`） |

## 8. トラブルシューティング

| 症状 | 主な原因 | 確認 |
|------|----------|------|
| **入力された値があっていません** | 別プロジェクトの Firestore を参照 / ID 不一致 | Request URL のプロジェクト = 管理画面のプロジェクト。Firestore で `community_account` を検索し doc ID を照合 |
| **アプリが応答しなかった** | Request URL が `/slack/commands`、コマンド名不一致、関数未デプロイ | ログで `POST .../slack/events` が 200 か。`SLACK_COMMAND_NAME` と Slash Command 名 |
| **このチャンネルにはボットが登録されていません** | OAuth 未完了 or 別チャンネルで add | `slackbots/.../channels/...` の存在、インストールチャンネル = 実行チャンネル |
| OAuth は成功、コマンドだけ失敗 | コマンド名 or Request URL パス | §3.3 |

### ログの見方（Cloud Run / Functions）

| ログ | 意味 |
|------|------|
| `POST .../slack/events` → **200** | スラッシュコマンド処理成功 |
| `POST .../slack/commands` → **404** | Request URL パス誤り（`/slack/events` に直す） |
| `POST .../slack/events` → **404** | コマンド名不一致（`SLACK_COMMAND_NAME` と Slack App のコマンド名） |

### プロジェクト一致の確認

| 確認元 | 例 |
|--------|-----|
| 管理画面 URL | `https://{PROJECT_ID}.firebaseapp.com` |
| Slack Request URL の slackbot | Firebase Console → Functions → `slackbot` の URL と同一ホストか |
| `VITE_SLACK_BOT_FUNCTION_URL` | GitHub `USER_ENV` |

Cloud Run URL（`slackbot-xxxxx-an.a.run.app`）からは PROJECT_ID は読み取れない。Firebase Console で `slackbot` のトリガー URL を照合する。

## 9. 新規 sandbox セットアップチェックリスト

```
□ 対象 Firebase プロジェクトを決める
□ そのプロジェクト用の Slack App を作成（または既存 App を流用しない）

【Slack App】
□ OAuth Redirect: {SLACKBOT_BASE}/slack/oauth_redirect
□ Bot Token Scopes: chat:write, commands, incoming-webhook
□ Slash Command: /{SLACK_COMMAND_NAME}
□ Slash Command Request URL: {SLACKBOT_BASE}/slack/events

【GCP Secret Manager（同じプロジェクト）】
□ SLACK_SIGNING_SECRET（新 App の値）
□ SLACK_CLIENT_ID
□ SLACK_CLIENT_SECRET
□ SLACK_STATE_SECRET（ランダム生成）

【GitHub Variables（同じリポ sandbox）】
□ FUNCTIONS_ENV に SLACK_COMMAND_NAME=...
□ USER_ENV に VITE_SLACK_BOT_FUNCTION_URL={SLACKBOT_BASE}

【デプロイ】
□ Deploy functions（SLACK_COMMAND_NAME 反映）
□ Deploy user（インストール URL 反映）

【疎通】
□ 管理画面から OAuth インストール → slackbots ドキュメント作成
□ /{SLACK_COMMAND_NAME} add ... → 「コミュニティ ○○ を登録しました！」
```

## 10. 関連ドキュメント

- [21_bot_legacy移行.md](./21_bot_legacy移行.md) — Secret Runbook、移行背景、`slackbot` 実装方針
- [firebaseプロジェクト新規作成.md](../firebaseプロジェクト/firebaseプロジェクト新規作成.md) — 新規プロジェクト時の Secret 一覧
- [15_EventMemberOrder_SlackBot.md](./15_EventMemberOrder_SlackBot.md) — 注文通知の Firestore パス
- `functions/default/src/slackbot.ts` — 実装
- `functions/default/src/stores/slackBot.ts` — Firestore store
