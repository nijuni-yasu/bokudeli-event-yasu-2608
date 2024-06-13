# shokujii slackbot

## Slack 側の設定

https://api.slack.com/apps にアクセスし、対象のアプリを選択する。

firebase functions の URL を確認し、`Slash Commands` と`OAuth & Permissions`の URL を変更する。

- Slack Commands
  - `/shokujii` の中の `Request URL` を変更する
- OAuth & Permissions
  - `Redirect URLs` のURL

## インストール URL

`https://[functions のURL]/slack/install`

## 使い方

スラッシュコマンドでコミュニティの追加・削除を行う

- コミュニティの追加
  - `/shokujii add [コミュニティアカウント]`
- コミュニティの削除
  - `/shokujii remove [コミュニティアカウント]`
