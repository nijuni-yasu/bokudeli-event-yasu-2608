## メール送信
Event Page が存在するホストを `EVENT_HOST` として環境変数に登録が必要です。

[SendGrid](https://mc.sendgrid.com/) を利用してメールを送る。
SengGrid より API_KEY を取得し、`bokudeli-stripe-webhook/.env.***` に `SENDGRID_API_KEY` として環境変数に登録が必要です。

```
EVENT_HOST=bokudeli-event-dev.web.app
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
