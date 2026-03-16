# Callable Function のパターン

functions/default における onCall の実装パターン。

## 引数の型

Callable の request.data には、JSON シリアライズ可能なプリミティブなデータのみ渡す。クラスインスタンスやメソッドを持つオブジェクトを渡すと、クライアントから Function に渡る際に JSON シリアライズされ、機能が落ちる。

### NG 例

```typescript
// クライアント側
await updateEventMenus({ menus: menuObjects })  // BokudeliEventMenu[] をそのまま渡す
```

### OK 例

```typescript
// クライアント側
await updateEventMenus({
  eventId,
  communityId,
  selectedMenuIds: menuObjects.map((m) => m.menu_id),
})

// Function 側で store から取得
const menus = await getMenus(selectedMenuIds)
```

## バリデーション

common/src/apis の Zod スキーマで request.data をバリデーションする。

```typescript
import { sendTestLetterRequestSchema } from '@shokujii/common/apis/letter.js'

export const sendTestLetter = onCall(
  { secrets: ['SENDGRID_API_KEY'] },
  async (request) => {
    const uid = request.auth?.uid
    if (uid === undefined) {
      throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
    }
    const { communityId, letterId } = sendTestLetterRequestSchema.parse(request.data)
    // ...
  },
)
```

## secrets オプション

SendGrid・Stripe 等の API キーを使う場合は、onCall の第1引数に secrets を指定する。

```typescript
export const sendTestLetter = onCall(
  {
    secrets: ['SENDGRID_API_KEY'],
  },
  async (request) => { /* ... */ },
)

export const createStripeCheckoutSession = onCall<CreateStripeCheckoutSessionRequest>(
  {
    secrets: ['STRIPE_API_KEY'],
  },
  async (request) => { /* ... */ },
)
```

## 認証チェック

認証が必要な Function では、request.auth?.uid をチェックする。

```typescript
if (!request.auth?.uid) {
  throw new HttpsError('unauthenticated', 'Login required to use this feature.')
}
```

## HttpsError の使い分け

ビジネスロジック上のエラーでは、状況に応じて HttpsError のコードを使い分ける。

| コード | 用途 |
|--------|------|
| unauthenticated | 認証されていない |
| invalid-argument | 必須パラメータ不足、型不正、バリデーションエラー |
| not-found | リソースが存在しない（イベント、注文、ユーザー等） |
| permission-denied | 権限がない（他人のリソースを操作しようとした等） |
| failed-precondition | 状態が不正（注文期限過ぎ、定員超過、ステータス遷移不可等） |
| internal | その他の予期せぬエラー |

```typescript
throw new HttpsError('not-found', `Event ${eventId} not found`)
throw new HttpsError('permission-denied', 'User does not have permission to update this event')
throw new HttpsError('invalid-argument', 'eventId, communityId, and selectedMenuIds are required')
throw new HttpsError('failed-precondition', 'Cannot update menus after event is finished.')
```

## 参考ファイル

- `functions/default/src/letter.ts` - sendTestLetter（Zod バリデーション + secrets）
- `functions/default/src/stripe.ts` - createStripeCheckoutSession（型パラメータ + secrets）
- `functions/default/src/eventMenusSelection.ts` - updateEventMenus（ID リストを渡すパターン）
- `common/src/apis/letter.ts` - sendTestLetterRequestSchema の定義
