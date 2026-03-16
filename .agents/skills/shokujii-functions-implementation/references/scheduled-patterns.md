# Scheduled Function のパターン

functions/default における onSchedule の実装パターン。

## 基本構造

onSchedule の第1引数に schedule、timeZone、region、secrets、timeoutSeconds、memory 等を指定する。

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler'

export const pollingTask = onSchedule(
  {
    schedule: '*/1 * * * *',
    region: 'asia-northeast1',
    timeoutSeconds: 540,
    memory: '1GiB',
    secrets: ['SENDGRID_API_KEY', 'PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
  },
  async (context) => {
    // context.scheduleTime で実行時刻を取得
    const now = DateTime.fromISO(context.scheduleTime).toMillis()
    // ...
  },
)
```

## schedule 式

cron 形式で指定する。

| 例 | 意味 |
|----|------|
| `*/1 * * * *` | 1分ごと |
| `15 10 * * 2` | 火曜日の 10:15 |
| `15 10 * * 1` | 月曜日の 10:15 |

## timeZone

日本時間で実行する場合は timeZone を指定する。

```typescript
export const eventInformation = onSchedule(
  {
    schedule: '15 10 * * 2',
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
    secrets: ['SENDGRID_API_KEY'],
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async () => {
    return sendEventInformationMail()
  },
)
```

## secrets オプション

SendGrid や PDF 生成等の API を使う場合は secrets を指定する。onCall と同様。

## 日付・時刻の扱い

Scheduled Function 内で日付を扱う場合は luxon を使う。new Date() や Date.now() は実行環境によって値が変わるため避ける。

```typescript
import { DateTime } from 'luxon'

const now = DateTime.fromISO(context.scheduleTime).toMillis()
```

## 参考ファイル

- `functions/default/src/pollingTask.ts` - 1分ごとの実行、複数シークレット、timeoutSeconds、memory の指定例
