# onRequest Function のパターン

functions/default における onRequest（HTTP）の実装パターン。

## 基本構造

onRequest は req と res を受け取る。secrets オプションは onCall と同様に第1引数で指定する。

```typescript
import { onRequest } from 'firebase-functions/https'

export const stripeWebhook = onRequest(
  {
    secrets: ['STRIPE_API_KEY', 'STRIPE_WEBHOOK_ENDPOINT_SECRET'],
  },
  async (req, res) => {
    // res.status().send() でレスポンスを返す
    res.status(200).json({ received: true })
  },
)
```

## Webhook と rawBody

Stripe 等の Webhook では署名検証のため rawBody が必要。req.body はパース済みで署名検証に使えない。

```typescript
const sig = req.headers['stripe-signature']
if (sig == null) {
  res.status(400).send('Missing stripe-signature header')
  return
}
event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_ENDPOINT_SECRET.value())
```

## CORS

ブラウザから直接呼ぶ onRequest（例: PDF ダウンロード）では CORS の設定が必要な場合がある。eventBillInvoice.ts では CORS_ORIGINS を環境変数から読み、Origin ヘッダーを検証している。

## レスポンス

res.status().send() または res.status().json() でレスポンスを返す。return で処理を終了する。

## 参考ファイル

- `functions/default/src/stripeWebhook.ts` - Webhook 受信、rawBody による署名検証
- `functions/default/src/eventBillInvoice.ts` - PDF 生成、CORS 対応、JWT 認証
