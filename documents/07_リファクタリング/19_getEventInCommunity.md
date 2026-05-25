# getEvent を getEventInCommunity へ差し替え

## 目的

`functions/default/src/stores/event.ts` の `getEvent` は `collectionGroup('events')` + `where('event_id', '==', eventId)` で横断検索している。`communityId` と `eventId` の両方が分かっている呼び出しでは、直接パス参照の `getEventInCommunity` に統一し、読み取りコストの削減と誤参照リスクの低減を図る。

## 関連 Issue

| Issue | 内容 | 扱い |
|-------|------|------|
| [#1903](https://github.com/nijuniinc/bokudeli-event-new/issues/1903) | `getEventInCommunity` への差し替え | **本ドキュメントの主 Issue** |
| [#1719](https://github.com/nijuniinc/bokudeli-event-new/issues/1719) | `getEvent` に optional `communityId` を追加 | **採用しない**（`getEventInCommunity` が既に存在するため。#1903 完了後にクローズ） |

## 背景

### 問題点

1. **パフォーマンス**: collectionGroup クエリは doc 直接参照より読み取りコストが高い
2. **安全性**: `event_id` のみではコミュニティが特定されず、データ不整合時に `limit(1)` で別コミュニティのイベントを拾う理論上のリスクがある
3. **一貫性**: 同ファイルの `saveEvent` は `communities/{communityId}/events/{eventId}` を直接参照している

### 方針

- **`communityId` が取得できる箇所は `getEventInCommunity(communityId, eventId, transaction?)` に統一する**
- **`getEvent` のシグネチャ拡張（#1719 案）は行わない** — 役割を `getEvent` / `getEventInCommunity` の2関数で分離する
- **全コミュニティ横断が必要なクエリ**（`getAllAcceptingOrderEvents` 等）は collectionGroup のまま触らない

### 現状（2026-05 時点）

**`getEventInCommunity` 利用済み（Phase 1〜2 完了）**

- `popularEventMail.ts`, `recalcEventMembers.ts`, `copyCommunityCoverToEvent.ts`（もともと利用）
- Phase 1: `memberOrders.ts`, `cancelOrders.ts`, `stripe.ts`, `stripeWebhook.ts`, `inCartNotification.ts`, `orderCompletionMail.ts`, `eventMenusSelection.ts`, `eventMenusSnapshot.ts`, `eventCancellation.ts`
- Phase 2: `letter.ts`

**`getEvent` 残存（Tier C・6 ファイル・7 箇所）**

| ファイル | 呼び出し数 | `communityId` の有無 |
|----------|------------|----------------------|
| `eventCopy.ts` | 1 | **なし**（`srcEventId` のみ） |
| `eventCopyRepeat.ts` | 1 | **なし** |
| `eventReceipt.ts` | 1 | **なし**（`eventId` のみ） |
| `eventBillInvoice.ts` | 1 | **なし**（URL パスに `eventId` のみ） |
| `namesPrint.ts` | 1 | **なし**（URL パスに `eventId` のみ） |
| `ogpRequest.ts` | 1 | **なし**（URL に `communityAccount` のみ） |

## 依存関係

```
Phase 1: Callable / Webhook / Scheduled（Tier A）
    ↓
Phase 2: letter.ts ヘルパー修正（Tier B）
    ↓
Phase 3: ドキュメント整理 + getEvent 残存方針の明文化
    ↓
Phase 4（任意）: eventId のみ API の改善（Tier C）
```

Phase 1 と Phase 2 は担当を分けて並行作業可能。Phase 3 は Phase 1〜2 完了後。

---

## Phase 1: Callable / Webhook / Scheduled（Tier A）

**目的**: 高頻度パス（注文・決済・メニュー更新・通知）から collectionGroup 依存を除去する。

**PR**: 1 PR 推奨

### タスク

- [x] `memberOrders.ts`（3 箇所）
  - [x] `addToCart` / `confirmOrder` トランザクション内: `getEventInCommunity(community_id, event_id, transaction)`
  - [x] `confirmOrder` サイドエフェクト: `getEventInCommunity(community_id, event_id)`
  - [x] `eventData.community_id !== community_id` チェックを null チェックのみに整理

- [x] `cancelOrders.ts`（1 箇所）
  - [x] `getEventInCommunity(community_id, event_id)` に差し替え

- [x] `stripe.ts`（1 箇所）
  - [x] `getEventInCommunity(community_id, event_id)` に差し替え

- [x] `stripeWebhook.ts`（1 箇所）
  - [x] サイドエフェクト前: `getEventInCommunity(communityId, eventId)` に差し替え

- [x] `inCartNotification.ts`（1 箇所）
  - [x] `getEventInCommunity(order.community_id, order.event_id)` に差し替え

- [x] `orderCompletionMail.ts`（1 箇所）
  - [x] `sendNewEventNotificationToMembers` 内: `getEventInCommunity(communityId, eventId, transaction)` に差し替え

- [x] `eventMenusSelection.ts`（1 箇所）
  - [x] トランザクション内: `getEventInCommunity(communityId, eventId, transaction)` に差し替え

- [x] `eventMenusSnapshot.ts`（2 箇所）
  - [x] `savePartnerMenusToEventMenus` 内（トランザクション外・内）: `getEventInCommunity(communityId, eventId)` / `getEventInCommunity(communityId, eventId, transaction)` に差し替え

- [x] `eventCancellation.ts`（1 箇所）
  - [x] トランザクション内: `getEventInCommunity(communityId, eventId, transaction)` に差し替え

- [x] import の整理
  - [x] 上記ファイルで `getEvent` import を `getEventInCommunity` に変更（未使用 import 削除）

### 検証

- [x] `npm -w functions/default run lint`
- [ ] `npm -w functions/default run build`（Stripe API バージョン型エラーで失敗。本変更とは無関係の既存問題）
- [ ] 手動確認: カート追加・注文確定・Stripe Checkout・イベントキャンセル・メニュー更新

---

## Phase 2: letter.ts（Tier B）

**目的**: レター配信まわりの `getEvent` 依存を除去する。

**PR**: 1 PR 推奨（Phase 1 と独立して並行可能）

### タスク

- [x] ヘルパー関数のシグネチャ変更
  - [x] `getParticipantIds(communityId, eventId)` — 第1引数に `communityId` を追加
  - [x] `getEventMemberIds(communityId, eventId)` — 同上。`getMemberIds(communityId, eventId)` を直接呼ぶ形に簡略化

- [x] 呼び出し元の修正
  - [x] `getUserIdsByLetterType` から上記ヘルパーへ `communityId` を渡す
  - [x] `sendIndividualLetter` の `getEventMemberIds` 呼び出しに `communityId` を渡す

- [x] スコープ内に `communityId` がある箇所の差し替え（3 箇所）
  - [x] `sendLetter` 内: `getEventInCommunity(communityId, letter.event_id)`
  - [x] `generateDynamicTemplateData` 内: `getEventInCommunity(communityId, letter.event_id)`
  - [x] `sendIndividualLetter` 内: `getEventInCommunity(communityId, letter.event_id)`

- [x] import の整理
  - [x] `getEvent` import を `getEventInCommunity` に変更

### 検証

- [x] `npm -w functions/default run lint`
- [ ] `npm -w functions/default run build`（Stripe API バージョン型エラーで失敗。本変更とは無関係の既存問題）
- [ ] 手動確認: テストレター送信・個別レター・スケジュールレター

---

## Phase 3: ドキュメント整理 + `getEvent` 残存方針

**目的**: 移行後の store 利用ルールを明文化し、残存する `getEvent` の用途を限定する。

**PR**: Phase 1〜2 と同 PR でも可。ドキュメントのみなら独立 PR でも可。

### タスク

- [x] `functions/default/src/stores/event.ts`
  - [x] `getEvent` に JSDoc を追加: 「`eventId` のみ分かる場合専用。`communityId` が分かれば `getEventInCommunity` を使うこと」
  - [x] `getEventInCommunity` の JSDoc を必要に応じて補足

- [x] `documents/実装メモ/functionsにおける store の使い方.md`
  - [x] `getEvent` / `getEventInCommunity` の使い分けを追記
  - [x] コード例を `getEventInCommunity` 優先に更新

- [x] `.agents/skills/shokujii-firestore/references/functions-stores.md`
  - [x] 同上

- [x] `.agents/skills/shokujii-code-review/shokujii-code-review.md`
  - [x] Firestore チェックリストに getEvent 使い分け項目を追加
  - [x] よくある間違いパターンに NG/OK 例を追加

- [ ] Issue 整理（**PR マージ後に手動**）
  - [ ] #1903 をクローズ
  - [ ] #1719 を #1903 に統合してクローズ

### 検証

- [x] `npm -w functions/default run lint`
- [x] `/lint-and-format` 相当のチェック（event.ts 変更あり）

---

## Phase 4（任意）: eventId のみ API（Tier C）

**目的**: リクエストや URL に `communityId` が含まれないエンドポイントの改善。フロント変更を伴うため **別 Issue / 別 PR** として扱ってよい。

### 現状と選択肢

| ファイル | 現状 | 選択肢 |
|----------|------|--------|
| `eventCopy.ts` / `eventCopyRepeat.ts` | `srcEventId` のみ | A) `getEvent` 残存 B) `EventCopyRequest` に `srcCommunityId` 追加 |
| `eventReceipt.ts` | `eventId` のみ | A) `getEvent` 残存 B) `EventReceiptRequest` に `communityId` 追加 |
| `eventBillInvoice.ts` | URL `/eventBillInvoice/{eventId}` | A) `getEvent` 残存 B) URL に `communityId` を含める |
| `namesPrint.ts` | URL `/namesprint/{eventId}` | A) `getEvent` 残存 B) URL に `communityId` を含める |
| `ogpRequest.ts` | URL `/c/{communityAccount}/e/{eventId}` | A) `getEvent` 残存 B) `getCommunityByAccount` → `getEventInCommunity`（フロント変更なし） |

**推奨**: Phase 1〜3 完了時点では Tier C は **`getEvent` 残存（選択肢 A）** とする。改善する場合は `ogpRequest.ts` のみ Phase 4 として独立着手しやすい。

### タスク（着手する場合）

- [ ] `ogpRequest.ts`: `getCommunityByAccount(paths[2])` で `communityId` を取得し `getEventInCommunity` を使用
- [ ] `eventCopy.ts` / `eventCopyRepeat.ts`: `common/src/apis/eventCopy.ts` に `srcCommunityId` を追加し、フロントから渡す
- [ ] `eventReceipt.ts`: `EventReceiptRequest` に `communityId` を追加
- [ ] `eventBillInvoice.ts` / `namesPrint.ts`: URL 設計変更 + フロント（`base` / `user` / `admin`）修正

---

## 差し替え時の注意

### `community_id` 整合チェック

`getEvent` 利用時は取得後に `eventData.community_id !== community_id` を検証している箇所がある。`getEventInCommunity` に差し替えた場合、パス上にドキュメントがなければ `undefined` となるため、**存在チェック（null / undefined）のみで十分**なことが多い。データ不整合検知用に `community_id` 不一致チェックを残す場合は `logger.warn` 程度にとどめる。

### Transaction

`getEventInCommunity` は第3引数で `Transaction` を受け取れる。トランザクション内 read はそのまま置き換え可能。

### collectionGroup を触らない関数

以下は「全コミュニティ横断検索」が目的のため、本リファクタの対象外:

- `getAllAcceptingOrderEvents`
- `getAcceptingOrderEventsBeforeDeadline`
- `getAcceptingOrderEventsByTime`
- `getAcceptingOrderEventsByEndTime`
- `getApplyingReservationEvents`

---

## 完了条件

- [x] Tier A（16 箇所）を `getEventInCommunity` に統一
- [x] Tier B（`letter.ts` 5 箇所）を `getEventInCommunity` に統一
- [x] Tier C の方針を決定し、残存する場合は `getEvent` の JSDoc で用途を明記
- [x] store 利用ドキュメント・スキル参照を更新
- [x] `npm -w functions/default run lint` 通過
- [ ] `npm -w functions/default run build` 通過（Stripe API バージョン型エラーで失敗。本変更とは無関係の既存問題）
- [ ] #1903 クローズ、#1719 統合クローズ（PR マージ後に手動）

---

## 変更例

```typescript
// Before
const eventData = await getEvent(event_id, transaction)
if (eventData == null || eventData.community_id !== community_id) {
  throw new HttpsError('not-found', 'イベントが見つかりません')
}

// After
const eventData = await getEventInCommunity(community_id, event_id, transaction)
if (eventData == null) {
  throw new HttpsError('not-found', 'イベントが見つかりません')
}
```

```typescript
// stores/event.ts — getEvent 残存時の JSDoc（Phase 3）
/**
 * eventId のみが分かる場合に collectionGroup で横断検索して取得する。
 * communityId が分かる場合は getEventInCommunity を使うこと。
 */
export const getEvent = async (eventId: string, transaction?: Transaction): Promise<ShokujiiEvent | undefined> => {
  // ...
}
```
