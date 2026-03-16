# メール送信パターン

functions/default における SendGrid を使ったメール送信のルール。

## 基本方針

- **1件送信**: try/catch で十分。Promise.allSettled や失敗集計ログは不要
- **一括送信**: Promise.allSettled を使い、失敗しても他の送信を継続。失敗件数を logger.warn で記録する

## 1件送信

```typescript
try {
  await sgMail.send({
    to,
    from: DEFAULT_FROM,
    templateId: LETTER_ID,
    dynamicTemplateData,
  })
} catch (error) {
  logger.error('SendGrid send error', { to, error })
  throw error
}
```

sendgrid.ts の send 関数は内部で try/catch してログを出し、再 throw する。呼び出し側でも必要に応じて catch する。

## 一括送信

```typescript
const results = await Promise.allSettled(
  emails.map(async (to) => {
    return sgMail.send({
      to,
      from: DEFAULT_FROM,
      templateId: ORDER_COMPLETION_FOR_ORGANIZER_TEMPLATE_ID,
      dynamicTemplateData,
    })
  }),
)

const failedCount = results.filter((r) => r.status === 'rejected').length
if (failedCount > 0) {
  logger.warn('Failed to send mail', {
    successCount: results.filter((r) => r.status === 'fulfilled').length,
    failedCount,
    totalEmails: emails.length,
  })
}
```

### なぜ Promise.allSettled か

Promise.all は1件でも失敗すると全体が中断する。一括送信では、1件の失敗で他の送信まで止まらないようにするため、Promise.allSettled を使う。

### エラー集計の例

エラーメッセージごとの件数を集計するパターン（letter.ts）:

```typescript
function getErrorSummary(results: PromiseSettledResult<unknown>[]): Record<string, number> {
  const summary: Record<string, number> = {}
  results.forEach((result) => {
    if (result.status === 'rejected') {
      const errorMessage = result.reason?.message || String(result.reason)
      summary[errorMessage] = (summary[errorMessage] || 0) + 1
    }
  })
  return summary
}
```

## sendgrid.ts の send 関数

utils/sendgrid.ts の send は単一または配列を受け付ける。配列の場合は SendGrid API の一括送信を使う。独自の一括送信（複数件を並列で送る）の場合は、上記の Promise.allSettled パターンを使う。

## 参考ファイル

- `functions/default/src/utils/sendgrid.ts` - send 関数の定義
- `functions/default/src/letter.ts` - 1件送信（sendTestLetter）と一括送信の例
- `functions/default/src/orderCompletionMail.ts` - Promise.allSettled の使用例
- `functions/default/src/inCartNotification.ts` - 一括送信パターン
