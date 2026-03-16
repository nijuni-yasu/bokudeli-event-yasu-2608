# ログ出力とシークレット管理

functions/default における createModuleLogger と defineSecret の使い方。

## createModuleLogger

firebase-functions の logger を直接使わず、createModuleLogger を使う。Cloud Logging で jsonPayload.module によるフィルタリングが可能になる。

### 使い方

```typescript
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('letter')

logger.info('sendLetter called')
logger.warn('Community not found', { communityId })
logger.error('SendGrid send error', { error: err.message })
```

### ルール

- console.log / console.error は禁止
- import { logger } from 'firebase-functions' は禁止
- ログメッセージに letter | 等の接頭辞をつけない（module フィールドが自動付与されるため）

### Logs Explorer でのフィルタ例

```
jsonPayload.module="letter"
```

## defineSecret と secrets オプション

GitHub secrets は使わない。Google Cloud Secret Manager から defineSecret で取得する。

### defineSecret の使い方

```typescript
import { defineSecret } from 'firebase-functions/params'

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')

// 使用時
sgMail.setApiKey(SENDGRID_API_KEY.value())
```

### secrets オプションの指定

onCall / onRequest / onSchedule の第1引数に、使用するシークレットを指定する。

```typescript
export const sendTestLetter = onCall(
  {
    secrets: ['SENDGRID_API_KEY'],
  },
  async (request) => {
    // ...
  },
)

export const createStripeCheckoutSession = onCall(
  {
    secrets: ['STRIPE_API_KEY'],
  },
  async (request) => {
    // ...
  },
)
```

### 使用シークレット一覧

| シークレット名 | 用途 | 使用例 |
|---------------|------|--------|
| SENDGRID_API_KEY | SendGrid メール送信 | letter.ts, orderCompletionMail.ts, user.ts |
| STRIPE_API_KEY | Stripe 決済 | stripe.ts, stripeRefunds.ts |
| STRIPE_WEBHOOK_ENDPOINT_SECRET | Stripe Webhook 検証 | stripeWebhook.ts |
| PDF_SERVICES_CLIENT_ID | Adobe PDF 生成 | eventBillInvoice.ts, eventReceipt.ts |
| PDF_SERVICES_CLIENT_SECRET | Adobe PDF 生成 | eventBillInvoice.ts, eventReceipt.ts |

複数シークレットを使う場合は配列で指定する。

```typescript
secrets: ['SENDGRID_API_KEY', 'PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
```

## 参考ファイル

- `functions/default/src/utils/logger.ts` - createModuleLogger の定義
- `functions/default/src/utils/sendgrid.ts` - defineSecret の使用例
- `functions/default/src/stripe.ts` - secrets オプションの指定例
- `functions/default/src/letter.ts` - createModuleLogger + secrets の組み合わせ
