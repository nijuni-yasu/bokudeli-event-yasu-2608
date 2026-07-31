# ブランチ feature/2123-minimum-participants-auto-cancel レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 最小催行デフォルト値 `?? 3` / `?? 1` のマジックナンバー<br>common の `MINIMUM_PARTICIPANTS_DEFAULT_*` 定数を使用 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `isMinimumParticipantsEditingAllowed` の引数が生 `string`<br>`RawEventStatusType` に変更しタイポ・未定義値を型で防止 |
| [x] | RC-3 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Transaction 内で読む注文を Transaction 外でも読んでいる（`orderedPre`）<br>user_advance の stripe_id チェックを Transaction 内へ移動し外読みを削除 |
| [x] | RC-4 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 💾 データ | 🔧 微修正 | M | Transaction 内で複数ユーザーの usage revert が read→write→read となり実行時エラー<br>全メンバー read を先に行う bulk 関数（store）を追加して解消 |
| [x] | RC-5 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `applyOrderCanceledSideEffects` をユーザーごとに逐次 await<br>並列化すると同一イベントの `recalcEventMembers` が競合するため逐次が妥当 |
| [ ] | RC-6 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | S | 参加者向けテンプレ ID が店舗用と同一のプレースホルダ<br>SendGrid で参加者向けテンプレ作成後に差し替えないと文面が壊れる（リリース前必須） |
| [x] | RC-7 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | メール失敗の catch がログのみで握りつぶし理由コメントなし<br>意図（中止・返金確定済みのため呼び出し元を失敗させない）をコメントに明記 |
| [x] | RC-8 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | S | 参加者向け中止メールの宛先が常に空（cancel 後に `ordered` を再取得）<br>`canceledOrders` の user_id から宛先解決するよう変更 |
| [x] | RC-9 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 参加者メール一括送信に `Promise.all` + 個別 send を使用<br>`sendDynamicTemplateWithPersonalizations` のバッチ送信へ変更 |
| [x] | RC-10 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `event.minimum_participants!` の non-null assertion<br>ローカル変数への代入 + null ガードに変更 |

---

## 評価セッション（2026-07-31 20:45・shokujii-code-review）

- **評価日時**: 2026-07-31 20:45 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `feature/2123-minimum-participants-auto-cancel`
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 最小催行デフォルト値 `?? 3` / `?? 1` のマジックナンバー<br>common の `MINIMUM_PARTICIPANTS_DEFAULT_*` 定数を使用 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `isMinimumParticipantsEditingAllowed` の引数が生 `string`<br>`RawEventStatusType` に変更しタイポ・未定義値を型で防止 |
| [x] | RC-3 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Transaction 内で読む注文を Transaction 外でも読んでいる（`orderedPre`）<br>user_advance の stripe_id チェックを Transaction 内へ移動し外読みを削除 |
| [x] | RC-4 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 💾 データ | 🔧 微修正 | M | Transaction 内で複数ユーザーの usage revert が read→write→read となり実行時エラー<br>全メンバー read を先に行う bulk 関数（store）を追加して解消 |
| [x] | RC-5 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `applyOrderCanceledSideEffects` をユーザーごとに逐次 await<br>並列化すると同一イベントの `recalcEventMembers` が競合するため逐次が妥当 |
| [ ] | RC-6 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | S | 参加者向けテンプレ ID が店舗用と同一のプレースホルダ<br>SendGrid で参加者向けテンプレ作成後に差し替えないと文面が壊れる（リリース前必須） |
| [x] | RC-7 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | メール失敗の catch がログのみで握りつぶし理由コメントなし<br>意図（中止・返金確定済みのため呼び出し元を失敗させない）をコメントに明記 |
| [x] | RC-8 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | S | 参加者向け中止メールの宛先が常に空（cancel 後に `ordered` を再取得）<br>`canceledOrders` の user_id から宛先解決するよう変更 |
| [x] | RC-9 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 参加者メール一括送信に `Promise.all` + 個別 send を使用<br>`sendDynamicTemplateWithPersonalizations` のバッチ送信へ変更 |
| [x] | RC-10 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `event.minimum_participants!` の non-null assertion<br>ローカル変数への代入 + null ガードに変更 |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/eventcreate/EventDetailCard.vue:202`

**該当コード（レビュー時点の diff）**:

```diff
+const minimumParticipantsCount = computed({
+  get: () => event.value.minimum_participants?.count ?? 3,
...
+  get: () => event.value.minimum_participants?.judgment_days_before ?? 1,
...
+const minimumParticipantsBelowCount = computed(() => {
+  const count = event.value.minimum_participants?.count ?? 3
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: デフォルト値 `?? 3` / `?? 1` がマジックナンバーになっている。`common/src/schemas/Event.ts` に `MINIMUM_PARTICIPANTS_DEFAULT_COUNT` / `MINIMUM_PARTICIPANTS_DEFAULT_JUDGMENT_DAYS_BEFORE` が定義済み → 定数を import して使用する。

**コメント要約**: 最小催行デフォルト値 `?? 3` / `?? 1` のマジックナンバー。
common の `MINIMUM_PARTICIPANTS_DEFAULT_*` 定数を使用。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「マジックナンバー・インデックス固定をしていないか」。既存定数があり修正方針が一意のため手順 3b で自動修正（`MINIMUM_PARTICIPANTS_DEFAULT_COUNT` / `_JUDGMENT_DAYS_BEFORE` を使用）。

---

**識別子**: RC-2（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/utils/minimumParticipants.ts:86`

**該当コード（レビュー時点の diff）**:

```diff
+export function isMinimumParticipantsEditingAllowed(rawEventStatus: string): boolean {
+  return rawEventStatus === 'in_draft' || rawEventStatus === 'applying_reservation'
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 引数が生 `string` のため、タイポや未定義ステータスをコンパイル時に検出できない。`common/src/schemas/Event.ts` に `RawEventStatusType` が定義済み → 引数型を `RawEventStatusType` に変更する。

**コメント要約**: `isMinimumParticipantsEditingAllowed` の引数が生 `string`。
`RawEventStatusType` に変更しタイポ・未定義値を型で防止。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 型安全性の向上。既存の型 union があり修正方針が一意のため手順 3b で自動修正。

---

**識別子**: RC-3（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/cancelEventBulkCore.ts:99`

**該当コード（レビュー時点の diff）**:

```diff
+  const orderedPre = await getOrders(community_id, event_id, 'ordered')
...
+  if (eventPayment === 'user_advance' && orderedPre.length > 0 && orderedPre.every((o) => o.stripe_id == null)) {
+    throw new Error('先払い注文に決済情報（stripe_id）が紐づいていません')
+  }
+
+  const canceledOrders = await getFirestore().runTransaction(async (transaction) => {
...
+    const ordered = await getOrders(community_id, event_id, 'ordered', transaction)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: Transaction 内で読み込む注文（`ordered`）と同じものを Transaction 外でも `orderedPre` として読んでおり、チェックリスト「Transaction 内で読み込む場合、Transaction 外で同じドキュメントを読んでいないか」に抵触。user_advance の stripe_id チェックは `cancelOrders` と同様に Transaction 内の `ordered` で行えば外読みは不要 → チェックを Transaction 内へ移動し `orderedPre` を削除する。

**コメント要約**: Transaction 内で読む注文を Transaction 外でも読んでいる（`orderedPre`）。
user_advance の stripe_id チェックを Transaction 内へ移動し外読みを削除。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリストの Transaction 二重読み禁止に該当。既存 `cancelOrders` と同じパターン（Transaction 内チェック）に揃えるだけで修正方針が一意のため手順 3b で自動修正。

---

**識別子**: RC-4（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/cancelEventBulkCore.ts:124`

**該当コード（レビュー時点の diff）**:

```diff
+    if (eventPayment === 'enterprise_subsidy' && enterpriseId != null && eventMonth != null) {
+      for (const [userId, userOrders] of groupOrdersByUser(ordered)) {
+        await revertEnterpriseSubsidyUsageOnCancel({
+          enterpriseId,
+          userId,
+          eventMonth,
+          orders: userOrders,
+          transaction,
+        })
+      }
+    }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/M]: `revertEnterpriseSubsidyUsageOnCancel` は内部で `transaction.get` → `transaction.update` を行う（`adjustEnterpriseMemberMonthlyUsage`）。これをユーザーごとにループすると、2 人目以降の read が 1 人目の write の後になり、Firestore Admin SDK が「reads before writes」制約でエラーになる。enterprise_subsidy イベントの一括中止は参加者 2 人以上で必ず失敗する → 全メンバーの read を先に済ませてから write する bulk 関数を store に追加し、一括で減算する。

**コメント要約**: Transaction 内で複数ユーザーの usage revert が read→write→read となり実行時エラー。
全メンバー read を先に行う bulk 関数（store）を追加して解消。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: チェックリスト「Transaction 内で すべての read が write より前 に実行されているか」。enterprise_subsidy の一括中止が実行時に必ず失敗するバグ。`stores/enterprise.ts` に `adjustEnterpriseMemberMonthlyUsageBulk`、`utils/enterpriseSubsidyOrders.ts` に `revertEnterpriseSubsidyUsageOnCancelBulk` を追加し、`cancelEventBulkCore` から一括呼び出しに変更（手順 3a 自動修正）。既存単体版は bulk へ委譲し実装を一本化。

---

**識別子**: RC-5（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/cancelEventBulkCore.ts:160`

**該当コード（レビュー時点の diff）**:

```diff
+  const userIds = [...new Set(canceledOrders.map((o) => o.user_id))]
+  for (const userId of userIds) {
+    try {
+      await applyOrderCanceledSideEffects({ event: eventAfter, userId })
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: ユーザーごとの `applyOrderCanceledSideEffects` を逐次 await しており、チェックリスト「ループ内で Firestore の read/write を逐次 await していないか」に形式上は該当する → ただし内部で同一イベントに対する `recalcEventMembers`（read-then-write）を行うため、並列化すると自イベントの members 再集約が競合する。逐次実行が安全であり修正不要。

**コメント要約**: `applyOrderCanceledSideEffects` をユーザーごとに逐次 await。
並列化すると同一イベントの `recalcEventMembers` が競合するため逐次が妥当。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 並列化はレースコンディションを生むため逐次が正しい。件数もイベント参加者数上限程度で許容範囲。

---

**識別子**: RC-6（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventBulkCancellationMail.ts:27`

**該当コード（レビュー時点の diff）**:

```diff
+/** 参加者向け返金通知（SendGrid 上でテンプレ作成後に差し替え） */
+export const EVENT_BULK_CANCELLATION_PARTICIPANT_TEMPLATE_ID = 'd-9c498e754b91498b9ce0f2e83c219728'
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/S]: 参加者向け返金通知のテンプレ ID が店舗向け `EVENT_CANCELLATION_TEMPLATE_ID` と同一のプレースホルダのまま。店舗向けテンプレは `shop_name` / `admin_url` 等を前提とするため、参加者向けデータで送ると文面が壊れる → リリース前に SendGrid で参加者向けテンプレを作成し ID を差し替える（コード上のコメントどおり）。

**コメント要約**: 参加者向けテンプレ ID が店舗用と同一のプレースホルダ。
SendGrid で参加者向けテンプレ作成後に差し替えないと文面が壊れる（リリース前必須）。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: S

**判断理由**: SendGrid 側でのテンプレ作成という運用作業が必要でコードのみでは解消できないため自動修正対象外。リリース前の差し替えが必須である点を明記して未着手のまま残す。

---

**識別子**: RC-7（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventBulkCancellationMail.ts:65`

**該当コード（レビュー時点の diff）**:

```diff
+  } catch (error) {
+    logger.error('Failed to send cancellation mail to shop', {
+      eventId,
+      error: error instanceof Error ? error.message : String(error),
+    })
+  }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: catch した例外をログのみで握りつぶしているが理由コメントがない。チェックリストは「意図的に握りつぶす場合は理由をコメントに明記する」を要求 → 中止・返金は確定済みでメール失敗により呼び出し元（Scheduled / Callable）を失敗させない意図をコメントに明記する。

**コメント要約**: メール失敗の catch がログのみで握りつぶし理由コメントなし。
意図（中止・返金確定済みのため呼び出し元を失敗させない）をコメントに明記。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 握りつぶし自体は妥当（メール失敗で再実行すると中止処理全体が重複しうる）だが、規約によりコメント必須。店舗向け・参加者向け両方の catch にコメントを追記（手順 3b 自動修正）。

---

**識別子**: RC-8（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventBulkCancellationMail.ts:77`

**該当コード（レビュー時点の diff）**:

```diff
+  if (!hadOrderedParticipants) {
+    return
+  }
+
+  try {
+    const memberEmails = await getEventMemberEmails(event)
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `sendEventBulkCancellationMails` は `cancelEventBulkCore` の Transaction で全注文を `canceled` に更新した**後**に呼ばれるが、`getEventMemberEmails` は `event.getOrders('ordered')` でステータス `ordered` の注文を再取得するため、宛先が常に空になり参加者に中止・返金通知が一切届かない → 宛先は `canceledOrders` の user_id（呼び出し元から渡す）から `getUserPersonalInformation` で解決する。

**コメント要約**: 参加者向け中止メールの宛先が常に空（cancel 後に `ordered` を再取得）。
`canceledOrders` の user_id から宛先解決するよう変更。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 仕様書（08_イベントキャンセル_参加者あり_返金）は参加者への中止・返金通知を要求しており、宛先が常に空になるのは実害バグ。引数を `hadOrderedParticipants: boolean` → `participantUserIds: string[]` に変更し、user_id から宛先を解決するよう修正（手順 3a 自動修正）。

---

**識別子**: RC-9（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventBulkCancellationMail.ts:86`

**該当コード（レビュー時点の diff）**:

```diff
+    await Promise.all(
+      memberEmails.map(async (to) => {
+        await sgMail.send({
+          to,
+          from: DEFAULT_FROM,
+          templateId: EVENT_BULK_CANCELLATION_PARTICIPANT_TEMPLATE_ID,
+          dynamicTemplateData,
+        })
+      }),
+    )
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: メールの一括送信に `Promise.all` + 個別 `sgMail.send` を使用している。チェックリストは SendGrid personalizations の `sendDynamicTemplateWithPersonalizations`（`utils/sendgridBulk.ts`）によるバッチ送信を要求 → バッチ送信に変更する（バッチ単位の失敗・受付件数ログは util 内で記録される）。

**コメント要約**: 参加者メール一括送信に `Promise.all` + 個別 send を使用。
`sendDynamicTemplateWithPersonalizations` のバッチ送信へ変更。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「メールの一括送信に Promise.all を使っていないか」に明確に該当。既存 util があり修正方針が一意のため手順 3a で自動修正。呼び出し元 `pollingTask` は `SENDGRID_API_KEY` secret 指定済み。

---

**識別子**: RC-10（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/minimumParticipants.ts:73`

**該当コード（レビュー時点の diff）**:

```diff
+async function evaluateOneMinimumParticipantsEvent(event: ShokujiiEvent, stripe: Stripe): Promise<void> {
+  if (!isUnevaluatedMinimumParticipants(event)) {
+    return
+  }
+
+  const mp = event.minimum_participants!
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `event.minimum_participants!` の non-null assertion を使用している。プロジェクトは `as` 回避を型ガードで行う方針であり、non-null assertion も同様に避けるべき → `const mp = event.minimum_participants` を先に取り出し `mp == null || mp.judgment_evaluated_at != null` の早期 return で型を絞り込む。

**コメント要約**: `event.minimum_participants!` の non-null assertion。
ローカル変数への代入 + null ガードに変更。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 型ガードで自然に書き換え可能で修正方針が一意のため手順 3b で自動修正。挙動は同一（`enabled` は literal `true` のため null チェックで十分）。

---

## 評価セッション（2026-07-31 22:04 JST・review-comments-evaluate auto）

- **評価日時**: 2026-07-31 22:04 JST
- **評価者**: Cursor Agent（wait-ai-pr-review → review-comments-evaluate auto）
- **ブランチ名**: feature/2123-minimum-participants-auto-cancel
- **PR**: #2231
- **REVIEW_REQUEST_SINCE**: 2026-07-31T12:52:20Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文、Codex 接続案内のみ）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|
| [ ] | RC-11 | 3690582388 等 | 🚨 必須修正 | 未着手 | 📌 | 参加者 SendGrid テンプレ ID が店舗用のまま（RC-6 と同一論点） |
| [x] | RC-12 | 3690582434 | 🟡 修正提案 | ✅ 対応済み | 📌 | participantUserIds の重複で二重送信 → Set でユニーク化 |
| [x] | RC-13 | 3690582454 | 🟡 修正提案 | ✅ 対応済み | 📌 | 返金期限判定が DateTime.now → nowMillis 基準に変更 |
| [x] | RC-14 | 3690587615 | 🚨 必須修正 | ✅ 対応済み | 📌 | 先払いで stripe_id 一部欠落時も中止続行 → 1 件でも欠落でエラー |
| [x] | RC-15 | 3690587649 | 🟡 修正提案 | ✅ 対応済み | 📌 | 評価済みイベント保存で判断日過去エラー → judgment_evaluated_at 時は検証スキップ |
| [x] | RC-16 | Copilot RC-4 | 🟡 修正提案 | ✅ 対応済み | 📌 | JST 定数重複 → DEFAULT_TIME_ZONE 利用 |
| [ ] | RC-17 | 3690587603 | 🚨 必須修正 | 未着手 | 📌 | Firestore Rules で minimum_participants クライアント更新制約 |
| [ ] | RC-18 | 3690587609 | 🚨 必須修正 | 未着手 | 📌 | 人数判定と一括中止を同一 Transaction で確定 |
| [ ] | RC-19 | 3690587633 | 🚨 必須修正 | 未着手 | 📌 | 中止済みでも返金未完了を冪等再開する永続化 |
| [ ] | RC-20 | 3690587641 | 🟡 修正提案 | 未着手 | 📌 | 一括中止時の友人履歴削除が空 members でスキップ |
| [ ] | RC-21 | 3690582496 等 | 🟡 修正提案 | 未着手 | 📌 | キャッチアップクエリの評価済み除外（インデックス要検討） |
| [ ] | RC-22 | Copilot RC-2 | 👌 修正不要 | — | 📌 | applyOrderCanceledSideEffects 逐次は競合回避のため妥当（RC-5 と同趣旨） |

自動修正後はローカル未コミット。push 前にコミットまたは amend を検討してください。

---
