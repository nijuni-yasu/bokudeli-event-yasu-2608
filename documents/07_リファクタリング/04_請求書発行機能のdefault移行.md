# 請求書発行機能の default 移行

## 概要

`functions/legacy/src/eventBillInvoice.js` を `functions/default` に TypeScript で移行する。
あわせてポーリングからの請求書メール送信を `pollingTask.ts` に統合する。

`onRequest` は維持する（`onCall` にはしない）。
金額計算は `common/src/utils/invoice.ts` を使用する。

### `onRequest` を維持する理由

メールに請求書ダウンロードリンクを送信しており、経理担当者などコミュニティ管理者や shokujii のユーザーではない人もダウンロードする可能性がある。`invoiceId` 付きアクセスは認証不要で PDF を返却する必要があるため、`onCall`（Firebase 認証が必須）には変更できない。

`base/src/utils/pdf.ts` の TODO（[Issue #1642](https://github.com/nijuniinc/bokudeli-event-new/issues/1642)）についても、上記の認証不要アクセス要件があるため `onCall` 化は見送りとする。

## 現状の構成

### エクスポートされる関数

| 関数名 | 種別 | 用途 |
|--------|------|------|
| `eventBillInvoice` | `onRequest` (v2) | HTTPエンドポイント。請求書PDFの取得・生成 |
| `getEventBillInvoice` | 内部関数 | Cloud Storage から既存PDFを取得 |
| `createEventBillInvoice` | エクスポート | 請求書PDF生成。HTTP / ポーリングの両方から呼ばれる |

### 呼び出し元

| 呼び出し元 | 関数 | 用途 |
|------------|------|------|
| `functions/legacy/src/sendgrid-mail.js` | `createEventBillInvoice` | ポーリングでイベント終了後に請求書生成→メール送信 |
| `functions/legacy/src/index.js` | `eventBillInvoice` | HTTPエンドポイントとしてエクスポート |
| `base/src/utils/pdf.ts` | HTTP呼び出し | フロントエンドから `fetch` で直接呼び出し |
| `user/src/pages/manage/event/[eventId]/invoice.vue` | `getEventBillInvoicePdf` 経由 | 管理画面での請求書表示 |

### 現状の処理フロー

#### HTTPエンドポイント (`eventBillInvoice`)

1. パスから `eventId` を取得
2. `invoiceId` クエリパラメータあり → 認証不要で Cloud Storage から既存PDF返却
3. `invoiceId` なし:
   - `Authorization: JWT {token}` で認証
   - `collectionGroup('events')` でイベント取得
   - `event_payment === 'community_bill'` かつイベント開始日時が過去であることを確認
   - コミュニティのマネージャー権限チェック（`community.managers` 配列で判定）
   - `createEventBillInvoice` でPDF生成・返却

#### PDF生成 (`createEventBillInvoice`)

1. 既存の請求書IDがあればそのPDFを返却（冪等性の確保）
2. イベントの注文（`status === 'ordered'`）を集計し、メニューごとに名前・単価・数量・合計を計算
3. `event_start_datetime` が 2025-11-01 JST 以降なら「請求手数料（10%）」を追加
4. テンプレート選択（手数料有無で分岐: `eventBillInvoice.docx` / `eventBillInvoice2.docx`）
5. テンプレートデータ構築（税計算含む）
6. Adobe PDF Services でPDF生成
7. Cloud Storage (`{PROJECT_ID}-invoice/{eventId}/{invoiceId}`) に保存
8. `invoiceId` を返却

#### ポーリング（`sendgrid-mail.js` の `sendInvoiceMailToOrganizers`）

1. 1分ごとに `event_end_datetime` が直近1分以内 かつ `accepting_order` かつ未削除のイベントを取得
2. `event_payment === 'community_bill'` でフィルタ
3. `createEventBillInvoice` で請求書PDF生成（`writableStream` なし → Storage保存のみ）
4. SendGrid テンプレート (`d-48e3179255834b8bb895cd995b1aac28`) でメール送信
   - 宛先: `event.bill_email`
   - CC: `event.organizer_email`（宛先と異なる場合）
   - BCC: サポートメール

## 移行方針

### `onRequest` の維持

`onRequest` のまま TypeScript 化する。`onCall` にはしない。

理由:
- `invoiceId` 付きアクセスは認証不要で PDF バイナリを返却する必要がある（メール記載のダウンロードリンクから、shokujii ユーザーではない経理担当者等もアクセスする）
- `onCall` は Firebase 認証が必須のため、この要件を満たせない

フロントエンド側の `base/src/utils/pdf.ts` は `fetch` ベースのまま TypeScript 化のみ行う。

### ポーリングの統合

`functions/legacy/src/sendgrid-mail.js` の `sendInvoiceMailToOrganizers` を `functions/default` に移行し、`pollingTask.ts` から呼び出す。

請求書メール送信のロジックは `eventBillInvoiceMail.ts` として独立したファイルに実装し、`createEventBillInvoice` は `eventBillInvoice.ts` からインポートする。

## 実装フェーズ

実装は2フェーズに分割する。Phase 1 だけで独立してデプロイ・動作確認が可能。

### Phase 1: HTTP エンドポイントの移行

フロントエンドから呼ばれる `eventBillInvoice`（`onRequest`）を default に移行する。ポーリングは legacy のまま維持する。

#### 作成

| 対象 | 内容 |
|------|------|
| `functions/default/src/eventBillInvoice.ts` | `onRequest` 関数本体 + `createEventBillInvoice` のエクスポート |
| `functions/default/templates/eventBillInvoice.docx` | テンプレート（legacy からコピー） |
| `functions/default/templates/eventBillInvoice2.docx` | テンプレート（legacy からコピー） |

#### 修正

| ファイル | 修正内容 |
|----------|----------|
| `functions/default/package.json` | `@google-cloud/storage` を依存に追加 |
| `functions/default/src/index.ts` | `eventBillInvoice` のインポート・エクスポート追加 |
| `functions/legacy/src/index.js` | `export { eventBillInvoice }` の行を削除 |

#### 変更不要

| ファイル | 理由 |
|----------|------|
| `base/src/utils/pdf.ts` | エンドポイント URL はプロジェクトIDと関数名 `eventBillInvoice` から動的に生成されるため、default 側で同じ関数名を使えば URL は変わらない |
| `user/src/pages/manage/event/[eventId]/invoice.vue` | `base/src/utils/pdf.ts` 経由の呼び出しのため変更不要 |
| `user/src/components/manage/community/invoice.vue` | `getEventBillInvoicePath` でページ遷移するだけのため変更不要 |

#### 削除しないもの

| 対象 | 理由 |
|------|------|
| `functions/legacy/src/eventBillInvoice.js` | legacy の `polling`（`sendgrid-mail.js`）が `createEventBillInvoice` を import しているため、Phase 2 完了まで残す |

#### Phase 1 完了時の状態

- HTTP エンドポイント → **default** が処理
- ポーリング（請求書メール送信） → **legacy** が処理（legacy の `polling` → legacy の `createEventBillInvoice`）
- 両方とも同じ Cloud Storage バケットを使うため、どちらが生成した PDF もアクセス可能。冪等性も維持される

#### Phase 1 のテスト観点

- [ ] フロントエンド（`invoice.vue`）から請求書PDFが表示できること
- [ ] `invoiceId` 付きURL（認証不要）で PDF がダウンロードできること
- [ ] 新規PDF生成 + Cloud Storage 保存が正しく動作すること
- [ ] マネージャー以外のアクセスが拒否されること

#### Phase 1 のデプロイ順序

legacy の `index.js` から `eventBillInvoice` を削除し、default の `index.ts` に追加するため、**default → legacy の順にデプロイする**（または同時にデプロイする）。逆順にすると、エンドポイントが一時的に消える。

---

### Phase 2: ポーリングの統合

`sendInvoiceMailToOrganizers` を default に移行し、legacy の依存を完全に解消する。

#### 作成

| 対象 | 内容 |
|------|------|
| `functions/default/src/eventBillInvoiceMail.ts` | `sendInvoiceMailToOrganizers` 関数（ポーリング用） |

#### 修正

| ファイル | 修正内容 |
|----------|----------|
| `functions/default/src/pollingTask.ts` | `sendInvoiceMailToOrganizers` の呼び出し追加、secrets に `PDF_SERVICES_CLIENT_ID`, `PDF_SERVICES_CLIENT_SECRET` 追加 |

#### 削除

| 対象 | 内容 |
|------|------|
| `functions/legacy/src/eventBillInvoice.js` | ファイルごと削除（依存が完全に解消されるため） |
| `functions/legacy/src/sendgrid-mail.js` の `sendInvoiceMailToOrganizers` | ポーリング部分を削除（`send_email` は別途移行） |

#### Phase 2 完了時の状態

- HTTP エンドポイント → **default** が処理（Phase 1 から変更なし）
- ポーリング（請求書メール送信） → **default** が処理
- legacy の `eventBillInvoice.js` は完全に削除済み

#### Phase 2 のテスト観点

- [ ] イベント終了後に請求書メールが送信されること
- [ ] メール内の請求書URLから PDF がダウンロードできること（Phase 1 の HTTP エンドポイント経由）
- [ ] メールの宛先（to / CC / BCC）が正しいこと

## 技術仕様

### バックエンド関数（`functions/default/src/eventBillInvoice.ts`）

legacy の処理を TypeScript 化し、`onRequest` のまま移行する。

`createEventBillInvoice` はエクスポートし、`eventBillInvoiceMail.ts`（ポーリング）からも呼び出せるようにする。

#### 認証・権限チェック

legacy と同じフローを維持する:

1. `invoiceId` クエリパラメータあり → 認証不要で既存 PDF を返却
2. `invoiceId` なし:
   - `Authorization: JWT {token}` から `getAuth().verifyIdToken()` で認証
   - `getEvent(eventId)` でイベント取得
   - `event.event_payment === 'community_bill'` を確認
   - `event.event_start_datetime < Date.now()` を確認（イベント開始済み）
   - `getCommunity(event.community_id)` でコミュニティ取得
   - `community.hasRole(uid, 'manager')` でマネージャー権限チェック

#### PDF生成の変更

legacy の `makePdf.js`（旧 Adobe SDK `@adobe/pdfservices-node-sdk`）→ default の `PdfGenerator`（新 Adobe SDK `@adobe/pdfservices-node-sdk` v4）に変更する。

- legacy: `makePdf` が WritableStream に直接書き込み。`combineStream` で Storage と HTTPレスポンスに同時パイプ
- default: `PdfGenerator.executeDocumentMergeForStream` で ReadableStream を取得

##### Storage 保存と HTTPレスポンス返却の同時パイプ

legacy では `combineStream`（`PassThrough` + `pipe`）で Storage と HTTPレスポンスに同時に書き込んでいる。default では `PdfGenerator` が ReadableStream を返すため、以下の方針で対応する:

- `stream.PassThrough` を2つ作成し、ReadableStream からの出力を両方にパイプ
- 一方を Cloud Storage の `createWriteStream` に、もう一方を HTTPレスポンス（または破棄）にパイプ
- legacy の `combineStream` と同等のユーティリティを `eventBillInvoice.ts` 内に実装する

#### Cloud Storage 操作

legacy と同じく `@google-cloud/storage` を使用する。default の `package.json` にはこの依存がないため追加が必要。

```typescript
import { Storage } from '@google-cloud/storage'

const INVOICE_BUCKET_NAME = `gs://${process.env.GCLOUD_PROJECT}-invoice`
```

#### invoiceId の生成

legacy では `generateRandomBase64UrlSafeString`（`crypto.randomBytes(32)` を Base64 URL-safe 化）で生成している。default では同等の関数を `eventBillInvoice.ts` 内に実装する。

```typescript
import crypto from 'crypto'

const generateRandomBase64UrlSafeString = (byteLength = 32): string =>
  crypto.randomBytes(byteLength).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
```

#### CORS 設定

legacy では `defineList('CORS')` で環境変数から CORS 設定を取得している。default でも同様に `defineList` を使用する。

```typescript
import { defineList } from 'firebase-functions/params'
const CORS = defineList('CORS')
```

CORS 環境変数が default のデプロイ環境に設定されていることを確認する。

#### 利用する既存リソース

| モジュール | 利用する関数・定数 |
|------------|-------------------|
| `common/src/utils/invoice.ts` | `CUTOFF_UNIX_TIME_2025_11_01_JST`, `calculateInvoiceFee` |
| `common/src/utils/converter.ts` | `convertNumberToYen` |
| `common/src/utils/datetime.ts` | `convertToDate`, `convertToDuration`, `convertDateToId`, `getLastDayOfNextMonth` |
| `functions/default/src/utils/PdfGenerator.ts` | `PdfGenerator` クラス |
| `functions/default/src/utils/urls.ts` | `getEventUrl`, `getManageEventInvoiceUrl` |
| `functions/default/src/stores/event.ts` | `getEvent`, `ShokujiiEvent` |
| `functions/default/src/stores/community.ts` | `getCommunity`, `ShokujiiCommunity` |

#### 金額計算

legacy の直接計算を `common/src/utils/invoice.ts` の関数で置き換える。

メニュー別集計ロジック（テンプレートの `items` 生成）は `invoice.ts` にはないため、`eventBillInvoice.ts` 内で実装する。

```typescript
// legacy
tax08Inclusive = Σ(menu.price × menu.count)
fee = Math.floor(tax08Inclusive * 0.1)

// default
const orders = await event.getOrders('ordered')
const baseAmount = calculateOrdersTotal(orders)
const fee = calculateInvoiceFee(baseAmount, event.event_start_datetime)
```

#### 税計算（変更なし）

```
tax8SubTotal = Math.floor(tax08Inclusive / 1.08)
tax8 = tax08Inclusive - tax8SubTotal
tax10SubTotal = Math.floor(tax10Inclusive / 1.1)
tax10 = tax10Inclusive - tax10SubTotal
```

#### テンプレートデータ（`jsonDataForMerge`）

テンプレートに渡す全フィールドの一覧。取得元も併記する。

| フィールド | 内容 | 取得元 |
|------------|------|--------|
| `number` | 請求書番号（`yyyyMMddHHmmss` 形式） | `convertDateToId(event.event_end_datetime)` |
| `date` | 発行日（`yyyy/MM/dd` 形式） | `convertToDate(event.event_end_datetime)` |
| `companyName` | 請求先会社名 | `event.organizer_company` |
| `companyPersonName` | 請求先担当者名 | `event.bill_fullname` |
| `companyPostalCode` | コミュニティ郵便番号 | `community.community_postalcode` |
| `companyAddress` | コミュニティ住所 | `community.community_address` |
| `companyPhoneNumber` | コミュニティ電話番号 | `community.community_phone` |
| `title` | 件名（イベント名の先頭18文字） | `event.event_name.substring(0, 18)` |
| `items` | 明細行（12行パディング、後述） | 注文集計結果 |
| `subTotal` | 税抜合計 | 計算値 |
| `tax` | 消費税合計 | 計算値 |
| `total` | 税込合計 | 計算値 |
| `tax10SubTotal` | 10%対象税抜金額 | 計算値 |
| `tax10` | 10%消費税額 | 計算値 |
| `tax8SubTotal` | 8%対象税抜金額 | 計算値 |
| `tax8` | 8%消費税額 | 計算値 |
| `deadline` | 支払期限（イベント終了月の翌月末） | `convertToDate(getLastDayOfNextMonth(event.event_end_datetime))` |
| `eventName` | イベント名（全文） | `event.event_name` |
| `eventDate` | イベント日時（期間表示） | `convertToDuration(event.event_start_datetime, event.event_end_datetime)` |
| `shopName` | 店舗名 | `event.shop_name` |
| `eventUrl` | イベントURL | `getEventUrl(event.community_account, event.id)` |

金額フィールド（`subTotal`, `tax`, `total`, `tax10SubTotal`, `tax10`, `tax8SubTotal`, `tax8`）はすべて `convertNumberToYen` で通貨表示に変換する。

##### `items` の構造

各明細行は以下のフィールドを持つ:

| フィールド | 内容 |
|------------|------|
| `name` | メニュー名（先頭21文字 + `(※)`）。請求手数料の場合は `請求手数料` |
| `count` | 数量 |
| `price` | 単価（`convertNumberToYen` で変換済み） |
| `totalPrice` | 合計（`convertNumberToYen` で変換済み） |

同一 `menu_id` の注文は数量と合計を合算する。12行に満たない場合は空文字列の行でパディングする。

### フロントエンド（`base/src/utils/pdf.ts`）

変更不要。エンドポイント URL はプロジェクトIDと関数名から動的に生成されるため、default 側で同じ `eventBillInvoice` という関数名を使えば URL は同一になる。

```typescript
// 現状のコード（変更なし）
export const getEventBillInvoicePdf = async (eventId: string, invoiceId?: string): Promise<Response> => {
  const token = await getAuth().currentUser!.getIdToken()
  const data = await fetch(
    `https://asia-northeast1-${import.meta.env.VITE_PROJECT_ID}.cloudfunctions.net/eventBillInvoice/${eventId}` +
      (invoiceId != null ? `?id=${invoiceId}` : ''),
    {
      method: 'GET',
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  )
  return data
}
```

### ポーリング統合

#### ファイル構成

`sendInvoiceMailToOrganizers` は `eventBillInvoiceMail.ts` に実装し、`pollingTask.ts` からインポートして `promiseFunctions` に追加する。

```typescript
// pollingTask.ts に追加
import { sendInvoiceMailToOrganizers } from './eventBillInvoiceMail.js'

const promiseFunctions = [
  // ...既存の関数群...
  sendInvoiceMailToOrganizers(start, end),
]
```

`eventBillInvoiceMail.ts` からは `eventBillInvoice.ts` の `createEventBillInvoice` をインポートする。

#### `sendInvoiceMailToOrganizers` の実装内容

1. `getAcceptingOrderEventsByEndTime(start, end)` でイベント取得（既存の stores 関数を利用）
2. `event.event_payment === 'community_bill'` でフィルタ
3. 各イベントに対して:
   - `getCommunity(event.community_id)` でコミュニティ取得
   - `createEventBillInvoice` を呼び出し（PDF生成・Storage保存）
   - SendGrid テンプレートでメール送信

#### メールの `dynamic_template_data`

| フィールド | 内容 | 取得元 |
|------------|------|--------|
| `company` | 請求先会社名 | `event.organizer_company` |
| `person` | 請求先担当者名 | `event.bill_fullname` |
| `event_name` | イベント名 | `event.event_name` |
| `event_invoice_url` | 請求書URL | `getManageEventInvoiceUrl(event.id, invoiceId)` |

#### メール送信先

| 種別 | 値 |
|------|-----|
| 宛先（to） | `event.bill_email` |
| CC | `event.organizer_email`（to と異なる場合のみ。同一なら空配列） |
| BCC | `SUPPORT_MAIL` |
| 送信元（from） | `DEFAULT_FROM` |
| テンプレートID | `d-48e3179255834b8bb895cd995b1aac28` |

#### pollingTask.ts の secrets 変更

`SENDGRID_API_KEY` は既に設定済み。PDF生成のため以下を追加する:

```typescript
secrets: ['SENDGRID_API_KEY', 'PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
```

### `index.ts` のエクスポート

`eventBillInvoice` を `index.ts` の動的 import + `Object.assign` パターンに追加する。

エクスポート名がそのまま Cloud Functions のエンドポイント名になるため、**legacy と同じ `eventBillInvoice` という名前を維持すること**。`base/src/utils/pdf.ts` の URL がこの名前をハードコードしている。

```typescript
export const {
  // ...既存のエクスポート...
  eventBillInvoice,
} = Object.assign({}, ...(await Promise.all([
  // ...既存の import...
  import('./eventBillInvoice.js'),
])))
```

## 注意事項

### `convertNumberToYen` の出力差異

- legacy: `'¥' + num.toString().replace(...)` → 例: `¥1,000`
- common: `num.toLocaleString('ja-JP', ...)` → 例: `￥1,000`

通貨記号が `¥`（半角）と `￥`（全角）で異なる可能性がある。テンプレート表示に影響がないか確認が必要。影響がある場合はテンプレートの更新も行う。

### `getLastDayOfNextMonth` の戻り値の差異

- legacy (`utils/datetime.js`): **Luxon DateTime オブジェクト**を返す → 呼び出し側で `.toMillis()` が必要
- common (`utils/datetime.ts`): **number（ミリ秒）** を直接返す → `.toMillis()` 不要

legacy のコード:
```javascript
deadline: convertToDate(getLastDayOfNextMonth(eventEndDatetime).toMillis())
```

default では以下のように書く:
```typescript
deadline: convertToDate(getLastDayOfNextMonth(event.event_end_datetime))
```

### Cloud Storage バケット

- バケット名: `{GCLOUD_PROJECT}-invoice`
- パス: `{eventId}/{invoiceId}`
- 冪等性: 同一イベントに対して2度目の呼び出しでは既存PDFを返す

### テンプレートの移動

`functions/legacy/template/eventBillInvoice.docx` と `eventBillInvoice2.docx` を `functions/default/templates/` にコピーする（legacy は `template/`、default は `templates/`（複数形）なので注意）。

### `onRequest` のタイムアウトと secrets

legacy と同様に `timeoutSeconds: 120` を設定する:

```typescript
export const eventBillInvoice = onRequest(
  {
    cors: CORS,
    timeoutSeconds: 120,
    secrets: ['PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
  },
  async (req, res) => { ... }
)
```

### `send_email` の扱い

`functions/legacy/src/sendgrid-mail.js` には `send_email`（`onCall`）も含まれるが、これは本タスクの対象外。`sendInvoiceMailToOrganizers` の移行のみ行い、`send_email` は別途移行する。

### Issue #1642 について

`base/src/utils/pdf.ts` に `onCall` 化の TODO コメントがあるが、認証不要アクセスの要件があるため `onCall` 化は見送りとする。Issue にその旨をコメントし、クローズまたはステータスを更新する。
