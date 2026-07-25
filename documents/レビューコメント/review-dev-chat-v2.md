# ブランチ dev/chat-v2 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 🔧 微修正 | S | イベントページのチャットボタン文言<br>仕様 E-4 を短ラベル「グループチャット」に更新 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `useNavigateToEventChat` に catch がなく例外時 unhandled rejection<br>トースト表示 + `false` 返却を推奨 |
| [x] | RC-3 | 3637688126 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | 過去読み込み済みメッセージの reaction_summary が即時反映されない<br>楽観更新または再取得が必要 |
| [x] | RC-4 | 3637688080 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | converter 付き ref へ plain object を setDoc<br>初回リアクションが常に失敗 |
| [x] | RC-5 | 3637688107 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 👤 UX | 🔧 微修正 | S | Web Share を canShare 全環境で優先<br>仕様 D-1/D-2 と不一致。iOS のみ share |
| [x] | RC-6 | 3637688098 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | 存在しない messageId へ reactions create 可能<br>orphan reaction 防止の exists 追加 |
| [x] | RC-7 | 3637688090 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | 同時リアクションで summary が古い値で上書き<br>Transaction 化 |
| [x] | RC-8 | 3637688102 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Rules テストが new Date() で permission-denied<br>serverTimestamp() に修正 |
| [ ] | RC-9 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | M | syncChatMessageReactionSummary の store 単体テストなし<br>Transaction ロジックは trigger テストでモックのみ |
| [x] | RC-10 | 3637908004 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | updateDoc は converter を通らず emoji 変更が Rules 違反<br>setDoc merge に変更 |
| [x] | RC-11 | 3637908006 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ, 📑 仕様書 | 🔧 微修正 | S | system/削除済み message へ reaction 可能<br>chatMessageAllowsReaction を Rules に追加 |
| [x] | RC-12 | 3637908010 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | ChatLog scoped CSS が子 ChatMessageReactions に届かず hover 非表示<br>:deep() に修正 |
| [x] | RC-13 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 一括 DL 中に他メッセージの DL ボタンが無反応<br>isDownloadBlocked で disabled 化 |
| [x] | RC-14 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `reaction_summary_label` / `reaction_detail_loading` が未使用<br>削除するか UI で参照する |
| [x] | RC-15 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 詳細ダイアログ読込中にタイトルが「リアクション 0」<br>件数確定までプレースホルダ表示を検討 |
| [ ] | RC-16 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | `mergeMessages` が onSnapshot 再配信で楽観 summary を古い値で上書きしうる<br>楽観中 ID のマージ保護を検討 |
| [x] | RC-17 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `toggleReactionWithOptimistic` の `currentSummary` が `Record<string, number>`<br>`ChatReactionSummary` に揃える |
| [x] | RC-18 | 3638711191 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | ChatReactionDetailDialog が getDoc を直接実行<br>user store 経由に寄せる |
| [x] | RC-19 | 3638711196 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 無効 emoji テストが new Date()<br>serverTimestamp() に修正 |
| [x] | RC-20 | 3638711199 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | iPadOS デスクトップ UA が iOS 判定外<br>maxTouchPoints で判定追加 |
| [x] | RC-21 | 3638711204 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | キャッシュ未初期化時 getDoc が楽観更新をブロック<br>patch 前に await している |
| [ ] | RC-22 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | リアクション pill が `#fff` 固定<br>ダークテーマでコントラスト崩れ。Vuetify surface 変数へ |
| [ ] | RC-23 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `chatMessageExists` が Rules 内で未参照<br>デッドコード削除 |
| [ ] | RC-24 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `ChatMessage` / `ChatMessageItem` の summary が `Record<string, number>`<br>`ChatReactionSummary` に揃える |
| [x] | RC-25 | 3649681321 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | キャッシュ miss 時の getDoc 失敗で楽観更新が巻き戻されない<br>try/catch で rollback |
| [x] | RC-26 | 3649681323 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | iOS 複数添付 DL が2枚目以降 share 失敗<br>`downloadBlobs` で1回の share に統合 |
| [x] | RC-27 | 3650025984 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 書き込み成功後 getDoc 失敗で楽観 UI を巻き戻していた<br>toggle と確認 getDoc を分離 |
| [x] | RC-28 | 3650025987 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | iOS share 不能時に anchor 成功扱い<br>`unavailable` 結果と案内 toast |
| [x] | RC-29 | 3650025988 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | cache miss 時に誤った楽観 patch を先適用<br>getDoc 後に patch するよう変更 |
| [x] | RC-30 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | ライトボックス遅延 fetch が閉じ直し後のセッションに反映されうる<br>generation で stale 反映を破棄 |
| [x] | RC-31 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 楽観更新失敗時に呼出時 summary へ無条件ロールバック<br>他ユーザー更新を消す。期待値一致時のみ戻す |

---

## 評価セッション（2026-07-23 19:02・shokujii-code-review）

- **評価日時**: 2026-07-23 19:02 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/chat-v2
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 🔧 微修正 | S | イベントページのチャットボタン文言<br>仕様 E-4 を短ラベル「グループチャット」に更新 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `useNavigateToEventChat` に catch がなく例外時 unhandled rejection<br>トースト表示 + `false` 返却を推奨 |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventDetailsCard.vue:346`

**該当コード（レビュー時点の diff）**:

```diff
+                  {{ $t('event_details.open_group_chat') }}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📑仕様追加/S]: 仕様書 V2-3 要件 E-4 では既存 `chat.open_chat`（「グループチャットをひらく」）の再利用が明記されているが、実装は新規キー `event_details.open_group_chat`（「グループチャット」）を使用している → `$t('chat.open_chat')` に統一するか、仕様書側を更新して意図的な短縮文言であることを明記する

**コメント要約**: イベントページのチャットボタン文言が v2 仕様 E-4 と不一致。
`chat.open_chat` への統一、または仕様書の更新が必要。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: イベント詳細の参加者セクション横 pill ボタンはスペース都合で短ラベル「グループチャット」（`event_details.open_group_chat`）を採用。仕様書 V2-3 要件 E-4 を更新し、注文完了ダイアログ（`chat.open_chat`）との使い分けを明記した。

---

**識別子**: RC-2（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/composable/useNavigateToEventChat.ts:31`

**該当コード（レビュー時点の diff）**:

```diff
+    try {
+      const roomId = await waitForEventChatMembership(userId, params.communityId, params.eventId)
+      if (roomId == null) {
+        notification.show(t('chat.error.preparing'), 'warning')
+        return false
+      }
+      await router.push(options.getChatPath(roomId))
+      return true
+    } finally {
+      isNavigatingToChat.value = false
+    }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `useNavigateToEventChat` の `navigateToEventChat` は `try/finally` のみで、`waitForEventChatMembership` や `router.push` が例外を投げた場合に unhandled rejection になる → `catch` で `notification.show`（汎用エラーまたは既存 `chat.error.*`）後に `false` を返す

**コメント要約**: composable の非同期ナビゲーションに catch がなく、ネットワーク障害等で unhandled rejection になりうる。
catch + トースト + false 返却を推奨。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「イベントハンドラ・ライフサイクルフックから呼ぶ非同期処理に try/catch があるか」に該当。`finally` で loading フラグはリセットされるが、呼び出し元の `void navigateToEventChat(...)` では例外が握りつぶされずコンソールエラーになる。

---

## 評価セッション（2026-07-23 20:31・review-comments-evaluate）

- **評価日時**: 2026-07-23 20:31 JST
- **評価者**: Cursor Agent（review-comments-evaluate / auto）
- **ブランチ名**: dev/chat-v2
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2221
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（レビュー依頼定型コメント id: 5057694912）
- **手順 4a 自動修正**: RC-4〜RC-8（🚨 2件 / 🟡 3件）。RC-3 は R-8 楽観更新で別途対応済み

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-3 | 3637688126 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | 過去読み込み済みメッセージの reaction_summary が即時反映されない<br>楽観更新または再取得が必要 |
| [x] | RC-4 | 3637688080 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | converter 付き ref へ plain object を setDoc<br>初回リアクションが常に失敗 |
| [x] | RC-5 | 3637688107 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 👤 UX | 🔧 微修正 | S | Web Share を canShare 全環境で優先<br>仕様 D-1/D-2 と不一致。iOS のみ share |
| [x] | RC-6 | 3637688098 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | 存在しない messageId へ reactions create 可能<br>orphan reaction 防止の exists 追加 |
| [x] | RC-7 | 3637688090 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | 同時リアクションで summary が古い値で上書き<br>Transaction 化 |
| [x] | RC-8 | 3637688102 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Rules テストが new Date() で permission-denied<br>serverTimestamp() に修正 |

---

**識別子**: RC-3（GitHub id: 3637688126）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/chat/ChatMessageReactions.vue:74`

**該当コード（レビュー時点の diff）**: （diff_hunk 省略・末尾抜粋）

```diff
+    await toggleReaction(props.roomId, props.message.id, props.currentUserId, emoji)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  過去読み込み済みメッセージのリアクションを即時反映してください**

最新ページ外の古いメッセージにリアクションした場合、`toggleReaction` 後の親 `message.reaction_summary` 更新は `created_at desc limit` のライブ購読範囲に入らないため、このコンポーネントには更新が届かず、押したリアクション数がルームを開き直すまで変わりません。過去メッセージにも反応できる UI にするなら、書き込み後に該当メッセージを再取得するかローカルの `reactionSummary` を楽観更新してください。

**コメント要約**: ページング外の古いメッセージでは Trigger 更新が UI に届かず、リアクション数が即時反映されない。
楽観更新またはメッセージ再取得が必要。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 指摘は妥当。`toggleReactionWithOptimistic` + `patchMessageReactionSummary` + `applyOptimisticReactionSummary` でピッカー操作直後にローカルサマリを更新。失敗時ロールバック。仕様 R-8 として `04_チャット機能_v2.md` に追記。

---

**識別子**: RC-4（GitHub id: 3637688080）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/stores/chatReaction.ts:69`

**該当コード（レビュー時点の diff）**: （レビュー時点）

```diff
+    await setDoc(ref, {
+      emoji,
+      created_at: serverTimestamp(),
+      updated_at: serverTimestamp(),
+    })
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  converter 付き ref へプレーン object を渡さないでください**

リアクション未作成のユーザーが初めて絵文字を押す場合、この `ref` は `chatReactionConverter` 付きなので Firestore SDK が `toFirestore` を呼びますが、渡しているのは `ChatReaction` インスタンスではなくプレーン object です。そのため converter 内の `reaction.toFirestore()` が実行時に失敗し、初回リアクション追加が常に `chat.reaction_failed` になります。serverTimestamp を使う場合は converter を外した raw ref で書くか、converter が受け取れる store API に分けてください。

Useful? React with 👍 / 👎.

**コメント要約**: withConverter 付き ref へ ChatReaction インスタンスでない plain object を渡し `toFirestore` が失敗、初回リアクション追加が常に失敗する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 妥当。`ChatReactionWrite` + converter で `serverTimestamp()` を書き込むパターンに修正済み（`chat.ts` の ChatMessageWrite と同型）。

---

**識別子**: RC-5（GitHub id: 3637688107）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/utils/downloadBlob.ts:50`

**該当コード（レビュー時点の diff）**: （レビュー時点）

```diff
+    const shared = await shareViaWebShare(blob, safeName)
+    if (shared) {
+      return 'shared'
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Web Share を iOS のフォールバックに限定してください**

追加された仕様では Desktop / Android は `<a download>`、iOS Safari のみ Web Share API のフォールバックとしていますが、この分岐は `navigator.canShare({ files })` が true の環境すべてで共有シートを優先します。Android Chrome や一部デスクトップで「画像をダウンロード」を押しても保存ではなく共有 UI になり、要件 D-1/D-2 のダウンロード導線とずれるため、iOS 判定時だけ share を使い、それ以外は anchor download を先に実行してください。

Useful? React with 👍 / 👎.

**コメント要約**: `canShare` が true の Android 等でも共有 UI になり、仕様 D-1/D-2（Desktop/Android は anchor download）と不一致。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 妥当。`isIosDevice()` 判定時のみ Web Share を試行するよう修正。Vitest に Android ケースを追加。

---

**識別子**: RC-6（GitHub id: 3637688098）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `firestore.rules:313`

**該当コード（レビュー時点の diff）**: （レビュー時点）

```diff
+                    allow create: if isChatRoomWritable(roomId)
+                                  && request.auth.uid == userId
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  存在しないメッセージへのリアクション作成を拒否してください**

この create 条件はルームメンバーかどうかと emoji/timestamp だけを見ており、親の `messages/{messageId}` が存在することを確認していません。認証済みメンバーなら任意の `messageId` に `reactions/{uid}` を作れてしまい、トリガーは message not found で return するため orphan reaction が残ります。`exists(/chat_rooms/$(roomId)/messages/$(messageId))` などで親メッセージの存在を条件に含めてください。

AGENTS.md reference: [AGENTS.md:L201-L205](https://github.com/nijuniinc/bokudeli-event-new/blob/85acee1837fee9116ba6c85866bf12ff74b6eb90/AGENTS.md#L201-L205)

Useful? React with 👍 / 👎.

**コメント要約**: 親 message 存在チェックがなく orphan reaction が残りうる。`exists(...messages/$(messageId))` を create/update/delete に追加すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 妥当。`chatMessageExists` ヘルパーを追加し reactions の write 条件に付与。Rules テストも追加。

---

**識別子**: RC-7（GitHub id: 3637688090）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `functions/default/src/onChatReactionWritten.ts:25`

**該当コード（レビュー時点の diff）**: （レビュー時点）

```diff
+  await ref.update({ reaction_summary: summary })
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  リアクション集計更新をトランザクション化してください**

同じメッセージに複数ユーザーがほぼ同時にリアクションすると、片方のトリガーが古い `listChatReactions` 結果を読んだ後に、もう片方が最新の summary を書き、最後に古い summary がこの update で上書きされる可能性があります。`listChatReactions` と `reaction_summary` 更新を transaction 内の store 関数にまとめ、競合時に再試行される形にしてください。

AGENTS.md reference: [AGENTS.md:L186-L190](https://github.com/nijuniinc/bokudeli-event-new/blob/85acee1837fee9116ba6c85866bf12ff74b6eb90/AGENTS.md#L186-L190)

Useful? React with 👍 / 👎.

**コメント要約**: 同時リアクションで read-then-write 競合により古い summary が上書きされうる。Transaction 化が必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 妥当。`syncChatMessageReactionSummary` を store に追加し Transaction 内で reactions 読み取り + message 更新。

---

**識別子**: RC-8（GitHub id: 3637688102）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `tests/firestore-rules/src/chatReactions.test.ts:129`

**該当コード（レビュー時点の diff）**: （レビュー時点）

```diff
+        created_at: new Date(),
+        updated_at: new Date(),
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  request.time 前提の Rules テストで serverTimestamp を使ってください**

この成功ケースは Rules 側で `created_at == request.time` かつ `updated_at == request.time` を要求しているのに、クライアント値として `new Date()` を送っています。`request.time` はサーバー評価時刻なので、正しい実装でも permission-denied になり、追加した Firestore Rules テストが失敗します。成功ケースの timestamp は `serverTimestamp()` sentinel に置き換えてください。

Useful? React with 👍 / 👎.

**コメント要約**: Rules が `created_at == request.time` を要求するがテストが `new Date()` を使用し CI が失敗する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 妥当。成功ケースの create/update で `serverTimestamp()` を使用。

---

## 評価セッション（2026-07-23 20:35・shokujii-code-review）

- **評価日時**: 2026-07-23 20:35 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/chat-v2
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2221
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **レビュー対象**: ステージ済み差分（Codex RC-4〜8 対応 + review doc）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-9 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | M | syncChatMessageReactionSummary の store 単体テストなし<br>Transaction ロジックは trigger テストでモックのみ |

---

**識別子**: RC-9（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/stores/chatReaction.ts:37`

**該当コード（レビュー時点の diff）**:

```diff
+/** reactions サブコレクションを読み取り message.reaction_summary を Transaction で更新する */
+export const syncChatMessageReactionSummary = async (roomId: string, messageId: string): Promise<void> => {
+  const db = getFirestore()
+  await db.runTransaction(async (transaction) => {
+    const messageRef = getChatMessageRef(roomId, messageId)
+    const messageSnap = await transaction.get(messageRef)
+    if (!messageSnap.exists) {
+      return
+    }
+
+    const reactionsSnap = await transaction.get(reactionsQuery(roomId, messageId))
+    const reactions = reactionsSnap.docs.map((docSnapshot) => docSnapshot.data())
+    const summary = normalizeReactionSummary(buildReactionSummary(reactions))
+
+    if (summary == null) {
+      transaction.update(messageRef, { reaction_summary: FieldValue.delete() })
+      return
+    }
+    transaction.update(messageRef, { reaction_summary: summary })
+  })
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/M]: `syncChatMessageReactionSummary` は Transaction 内で message 存在確認・reactions 読み取り・summary 更新を行うが、store 単体の Vitest が無く `onChatReactionWritten.test.ts` は store をモックしているのみ → `runTransaction` をモックし、message 不在 no-op / summary 集計 / FieldValue.delete の各分岐を store テストで検証する

**コメント要約**: Transaction 化した store 関数に単体テストがなく、回帰検知が trigger テストのモック呼び出し確認のみに留まる。
`functions/default/src/stores/chatReaction.test.ts` 等で Transaction 分岐のテスト追加を推奨。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: チェックリスト「Transaction・レースコンディションを含む store 関数を新規追加・変更した場合、優先してテストを追加」に該当。マージ blocker ではないが、RC-7 対応の核心ロジックのためテスト追加が望ましい。

---

## 評価セッション（2026-07-23 21:12・review-comments-evaluate / auto）

- **評価日時**: 2026-07-23 21:12 JST
- **評価者**: Cursor Agent（review-comments-evaluate / auto）
- **ブランチ名**: dev/chat-v2
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2221
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0
- **手順 4a 自動修正**: RC-10〜RC-12（🚨 1件 / 🟡 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-10 | 3637908004 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | updateDoc は converter を通らず emoji 変更が Rules 違反<br>setDoc merge に変更 |
| [x] | RC-11 | 3637908006 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ, 📑 仕様書 | 🔧 微修正 | S | system/削除済み message へ reaction 可能<br>chatMessageAllowsReaction を Rules に追加 |
| [x] | RC-12 | 3637908010 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | ChatLog scoped CSS が子 ChatMessageReactions に届かず hover 非表示<br>:deep() に修正 |

---

**識別子**: RC-10（GitHub id: 3637908004）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/stores/chatReaction.ts:93`

**該当コード（レビュー時点の diff）**:

```diff
+  await updateDoc(ref, createReactionForUpdate(userId, emoji))
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  updateDoc で converter 前提の更新を避けてください**

既存リアクションを別 emoji に変更するケースでこの分岐に入ると、Web SDK の `updateDoc` は `setDoc` と違って `chatReactionConverter.toFirestore()` を通さないため、`serverTimestamp()` へ変換されず `ChatReaction` インスタンス（`id`/`writeMode`/数値の `updated_at` 付き）がそのまま update データとして扱われます。その結果、クライアント側で plain object 検証に落ちるか、少なくとも Rules の `updated_at == request.time` / `keys().hasOnly(...)` に弾かれ、初回追加後のリアクション変更が常に失敗します。

**コメント要約**: `updateDoc` は withConverter 付き ref でも converter を通さず、emoji 変更時に Rules 違反またはクライアント検証失敗になる。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 妥当。`setDoc(ref, createReactionForUpdate(...), { merge: true })` に変更し converter 経由で `serverTimestamp()` を書き込む。

---

**識別子**: RC-11（GitHub id: 3637908006）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `firestore.rules:314`

**該当コード（レビュー時点の diff）**:

```diff
+                    allow create: if isChatRoomWritable(roomId)
+                                  && chatMessageExists(roomId, messageId)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  system/削除済みメッセージへの reaction 書き込みを拒否してください**

この `chatMessageExists` だけの条件だと、ルーム member が SDK などから直接 `reactions/{userId}` を書けば、仕様書の R-1 が対象外にしている system message や `deleted_at` 済み message にも create/update/delete できます。UI 側は `message_type === 'user'` かつ未削除に絞っていますが、Rules が同じ条件を検証しないため、不可視の reaction サブドキュメントと `reaction_summary` が作成されてデータ整合性が崩れます。

**コメント要約**: `chatMessageExists` のみでは system / 削除済み message に reaction 書き込み可能。仕様 R-1 と UI 条件を Rules でも検証すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ, 📑 仕様書

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 妥当。`chatMessageAllowsReaction`（`message_type == 'user'` かつ `deleted_at` なし）を追加し reactions の create/update/delete 条件に適用。Rules テストに system / deleted 拒否ケースを追加。

---

**識別子**: RC-12（GitHub id: 3637908010）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/chat/ChatLog.vue:647`

**該当コード（レビュー時点の diff）**:

```diff
+  .chat-group {
+    .chat-message-action-btn {
+      opacity: 0;
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-lightgrey?style=flat)</sub></sub>  scoped CSS を子コンポーネントへ届かせてください**

`ChatMessageReactions` へボタンを切り出した後もこの hover ルールは `ChatLog.vue` の scoped CSS のままなので、生成される selector は子コンポーネント内部の `.chat-message-action-btn` に一致しません。そのため PC でもリアクション/取り消しボタンが常時表示され、仕様の hover / focus-within 時だけ表示する挙動にならないため、`:deep(.chat-message-action-btn)` などで子要素まで届く selector にしてください。

**コメント要約**: scoped CSS が子 `ChatMessageReactions` 内の `.chat-message-action-btn` に届かず、PC でもアクションボタンが常時表示される。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 妥当。`.chat-group` 内の hover / focus-within ルールを `:deep(.chat-message-action-btn)` に変更。

---

## 評価セッション（2026-07-23 21:15・shokujii-code-review）

- **評価日時**: 2026-07-23 21:15 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/chat-v2
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2221
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **レビュー対象**: チャット画像一括ダウンロード（staged diff）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-13 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 一括 DL 中に他メッセージの DL ボタンが無反応<br>isDownloadBlocked で disabled 化 |

---

**識別子**: RC-13（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/chat/ChatLog.vue:218`

**該当コード（レビュー時点の diff）**:

```typescript
if (attachments.length === 0 || downloadingMessageId.value != null) {
  return
}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [👤 UX/🔧微修正/S]: `downloadingMessageId` がセットされている間、他メッセージの DL ボタンもクリック可能だが `onDownloadAllAttachments` 内で early return するため無反応になる → `isDownloadBlocked` prop を追加し、DL 中は他メッセージのボタンを `disabled` にする

**コメント要約**: 一括 DL 実行中、他メッセージの DL ボタンが disabled にならずクリックしても何も起きない。視覚的に disabled 化すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `ChatMessageReactions` に `isDownloadBlocked` を追加。`ChatLog` から `downloadingMessageId != null && downloadingMessageId !== entry.message.id` を渡して DL ボタンを disabled 化。

---

## 評価セッション（2026-07-23 22:30・shokujii-code-review）

- **評価日時**: 2026-07-23 22:30 JST
- **ブランチ名**: dev/chat-v2
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2221
- **対象**: ステージング済み差分（V2-7 楽観更新・統合 pill・詳細ダイアログ）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0
- **手順 3a/3b 自動修正**: なし（🚨 0 件。🟡 は M または 👤 UX ラベル含むため対象外）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-14 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `reaction_summary_label` / `reaction_detail_loading` が未使用<br>削除するか UI で参照する |
| [x] | RC-15 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 詳細ダイアログ読込中にタイトルが「リアクション 0」<br>件数確定までプレースホルダ表示を検討 |
| [ ] | RC-16 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | `mergeMessages` が onSnapshot 再配信で楽観 summary を古い値で上書きしうる<br>楽観中 ID のマージ保護を検討 |
| [x] | RC-17 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `toggleReactionWithOptimistic` の `currentSummary` が `Record<string, number>`<br>`ChatReactionSummary` に揃える |

### RC-14（GitHub id: なし・エージェントレビュー）

**指摘箇所**: `base/src/locales/messages/ja.ts:1064`

**該当コード**:

```diff
+    reaction_summary_label: 'リアクション {label}',
+    reaction_detail_loading: '読み込み中…',
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📏 規約/🔧微修正/S]: `ja.ts` に追加した `reaction_summary_label` と `reaction_detail_loading` がステージング差分内のどのコンポーネントからも参照されていない → 未使用キーを削除するか、`ChatReactionDetailDialog` のローディング UI / pill の aria-label で使う

**コメント要約**: i18n キー追加のみで参照箇所がなく dead code になっている。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `ChatMessageReactions` の pill `aria-label` で `reaction_summary_label`、`ChatReactionDetailDialog` のローディング UI で `reaction_detail_loading` を参照。

---

### RC-15（GitHub id: なし・エージェントレビュー）

**指摘箇所**: `base/src/components/chat/ChatReactionDetailDialog.vue:40`

**該当コード**:

```typescript
const dialogTitle = computed(() => t('chat.reaction_detail_title', { count: reactionCount.value }))
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [👤 UX/🔧微修正/S]: 詳細ダイアログ open 直後は `rows` が空のためタイトルが「リアクション 0」と一瞬表示される → `isLoading` 中は件数なし文言、または `reaction_detail_loading` をタイトル/本文に使う

**コメント要約**: ローディング中のダイアログタイトルが誤った件数 0 を示す。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `isLoading` 中は `reaction_detail_title_plain`（「リアクション」）を表示。fetch 完了後のみ `reaction_detail_title` で件数付きタイトルに切り替え。

---

### RC-16（GitHub id: なし・エージェントレビュー）

**指摘箇所**: `base/src/stores/chat.ts:245`

**該当コード**:

```typescript
export const mergeMessages = (existing: ChatMessageItem[], incoming: ChatMessageItem[]): ChatMessageItem[] => {
  const map = new Map<string, ChatMessageItem>()
  for (const message of existing) {
    map.set(message.id, message)
  }
  for (const message of incoming) {
    map.set(message.id, message) // incoming が常に優先
  }
  ...
}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [👤 UX/📐リファクタ/M]: `patchMessageReactionSummary` で楽観更新した直後、別メッセージの追加等で messages `onSnapshot` が再配信されると、Trigger 反映前の古い `reaction_summary` で上書きされうる → 楽観更新中 messageId の summary を merge 時に保護する、または Trigger 反映まで pending フラグを持つ

**コメント要約**: 楽観更新と snapshot merge の競合でサマリ表示が一瞬戻る可能性がある。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: Trigger は通常数百 ms 以内だが、混雑チャットでは flicker の原因になりうる。RC-3 対応の続きとして別コミットでもよい。

---

### RC-17（GitHub id: なし・エージェントレビュー）

**指摘箇所**: `base/src/stores/chatReaction.ts:113`

**該当コード**:

```typescript
  currentSummary: Record<string, number> | undefined,
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📏 規約/🔧微修正/S]: `toggleReactionWithOptimistic` の `currentSummary` が `Record<string, number>` になっており、`ChatReactionSummary` と不一致 → import して型を揃える

**コメント要約**: 共通スキーマ型があるのに緩い Record 型を使っている。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `toggleReactionWithOptimistic` の `currentSummary` を `ChatReactionSummary | undefined` に変更。

---

## 評価セッション（2026-07-23 23:35・review-comments-evaluate・auto）

- **評価日時**: 2026-07-23 23:35 JST
- **ブランチ名**: dev/chat-v2
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2221
- **REVIEW_REQUEST_SINCE**: 2026-07-23T13:50:56Z
- **partial**: false
- **新規 RC**: 4 件（RC-18〜21）
- **手順 4a 自動修正**: RC-19 / RC-20（🟡 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-18 | 3638711191 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | ChatReactionDetailDialog が getDoc を直接実行<br>user store 経由に寄せる |
| [x] | RC-19 | 3638711196 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 無効 emoji テストが new Date()<br>serverTimestamp() に修正 |
| [x] | RC-20 | 3638711199 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | iPadOS デスクトップ UA が iOS 判定外<br>maxTouchPoints で判定追加 |
| [x] | RC-21 | 3638711204 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | キャッシュ未初期化時 getDoc が楽観更新をブロック<br>patch 前に await している |

### RC-18（GitHub id: 3638711191）

**評価**: 🟡 修正提案 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内 | **ラベル**: 📏 規約 | **種別**: 📐 リファクタ | **工数**: M

**判断理由**: `user.ts` に `getUserById` を追加し、`ChatReactionDetailDialog` から store 経由でユーザー取得するよう変更。

### RC-19（GitHub id: 3638711196）

**評価**: 🟡 修正提案 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内 | **ラベル**: 📏 規約 | **種別**: 🔧 微修正 | **工数**: S

**判断理由**: RC-8 と同種。rejects invalid emoji テストを serverTimestamp() に変更。

### RC-20（GitHub id: 3638711199）

**評価**: 🟡 修正提案 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内 | **ラベル**: 📏 規約 | **種別**: 🔧 微修正 | **工数**: S

**判断理由**: MacIntel + maxTouchPoints > 1 で iPadOS デスクトップ UA を iOS 扱いに。Vitest 追加。

### RC-21（GitHub id: 3638711204）

**評価**: 🟡 修正提案 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内 | **ラベル**: 👤 UX | **種別**: 📐 リファクタ | **工数**: M

**判断理由**: 楽観 patch を getDoc 前に適用。キャッシュ未初期化時は patch 後に getDoc で previousEmoji を解決し、差分があれば summary を再補正してから toggleReaction する。

---

## 評価セッション（2026-07-24 16:49・shokujii-code-review）

- **評価日時**: 2026-07-24 16:49 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/chat-v2
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2221
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **レビュー範囲**: `origin/development...HEAD` + 未コミット差分（`ChatLog.vue` / `ChatMessageReactions.vue` の Messenger 風 side/reaction-row リファクタ）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-9 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | M | syncChatMessageReactionSummary の store 単体テストなし<br>Transaction ロジックは trigger テストでモックのみ |
| [ ] | RC-16 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | `mergeMessages` が onSnapshot 再配信で楽観 summary を古い値で上書きしうる<br>楽観中 ID のマージ保護を検討 |
| [ ] | RC-22 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | リアクション pill が `#fff` 固定<br>ダークテーマでコントラスト崩れ。Vuetify surface 変数へ |
| [ ] | RC-23 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `chatMessageExists` が Rules 内で未参照<br>デッドコード削除 |
| [ ] | RC-24 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `ChatMessage` / `ChatMessageItem` の summary が `Record<string, number>`<br>`ChatReactionSummary` に揃える |

---

**識別子**: RC-22（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/chat/ChatMessageReactions.vue:277`

**該当コード（レビュー時点の diff）**:

```diff
+.chat-reaction-chip--combined.v-btn {
+  --v-btn-background: #fff;
+  background: #fff;
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [👤 UX/🔧微修正/S]: リアクション summary pill の背景が `#fff` 固定で、Vuetify テーマ（ダークモード）と連動しない → `rgb(var(--v-theme-surface))` 等のテーマ変数に置き換える

**コメント要約**: リアクション pill の白背景固定がダークテーマで視認性を損なう。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「テーマカラーを直接指定していないか」に該当。機能上の blocker ではないが、Materio / Vuetify 利用方針に沿って surface 系 CSS 変数へ寄せるのが望ましい。

---

**識別子**: RC-23（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.rules:99`

**該当コード（レビュー時点の diff）**:

```diff
+        function chatMessageExists(roomId, messageId) {
+            return exists(/databases/$(database)/documents/chat_rooms/$(roomId)/messages/$(messageId));
+        }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📏 規約/🔧微修正/S]: `chatMessageExists` が定義されているが reactions Rules から参照されていない（`chatMessageAllowsReaction` の `get()` で存在しない message は拒否される） → 未使用ヘルパーを削除する

**コメント要約**: Rules にデッドコードが残っている。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-6 対応時に追加されたが、最終実装は `chatMessageAllowsReaction` の `get()` でカバー。保守性のため削除を推奨。

---

**識別子**: RC-24（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/ChatMessage.ts:131`, `base/src/components/chat/types.ts:29`

**該当コード（レビュー時点の diff）**:

```diff
+  reaction_summary?: Record<string, number>
```

```diff
+  reactionSummary?: Record<string, number>
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📏 規約/🔧微修正/S]: Zod スキーマと `toggleReactionWithOptimistic` は `ChatReactionSummary` を使っているが、`ChatMessage` クラスと `ChatMessageItem` が `Record<string, number>` のまま → RC-17 と同様に `ChatReactionSummary` 型へ統一する

**コメント要約**: 共通型があるのに UI / モデル層だけ緩い Record 型を使っている。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 型の一貫性向上。実行時挙動への影響は小さい。

---

## 評価セッション（2026-07-25 16:04・review-comments-evaluate）

- **評価日時**: 2026-07-25 16:04 JST
- **評価者**: Cursor Agent（review-comments-evaluate auto）
- **ブランチ名**: dev/chat-v2
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2221
- **REVIEW_REQUEST_SINCE**: 2026-07-25T06:43:43Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼コメント id:5077359738、Codex サマリ review id:4778717688）
- **重複 RC スキップ**: GitHub id 3649681322 は RC-16 と同一指摘のため RC 採番せず

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-25 | 3649681321 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | キャッシュ miss 時の getDoc 失敗で楽観更新が巻き戻されない<br>try/catch で rollback |
| [x] | RC-26 | 3649681323 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | iOS 複数添付 DL が2枚目以降 share 失敗<br>`downloadBlobs` で1回の share に統合 |

---

**識別子**: RC-25（GitHub id: 3649681321）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `base/src/stores/chatReaction.ts:140`

**該当コード（レビュー時点の diff）**:

```diff
+  if (cacheMiss) {
+    const ref = getChatReactionRef(roomId, messageId, userId)
+    const snapshot = await getDoc(ref)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  キャッシュ取得失敗時にも楽観更新を巻き戻す**

初回操作やリアクション削除後のようにキャッシュがない状態で、この `getDoc` がオフラインや一時的な通信障害により失敗すると、直前の楽観更新だけが適用されたまま例外が返ります。この await は後続の `try/catch` の外にあるためロールバックされず、特にライブ購読範囲外の過去メッセージでは、実際には書き込まれていないリアクションがルームを開き直すまで表示され続けます。

**コメント要約**: cacheMiss 時の getDoc が try/catch 外のため、通信失敗時に楽観 UI が残る。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-21 で楽観先行は解消済みだが、getDoc 失敗時の rollback が未実装だった。cacheMiss ブロックを try/catch で囲み、失敗時に summary / myReaction を復元する。

---

**識別子**: RC-26（GitHub id: 3649681323）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `base/src/components/chat/ChatLog.vue:233`

**該当コード（レビュー時点の diff）**:

```diff
+    for (const attachment of attachments) {
+      const blob = await getChatAttachmentBlob(attachment.storage_path)
+      const result = await downloadBlob(blob, attachment.file_name)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  iOSでは複数画像を一度の共有処理にまとめる**

iOS で添付が複数ある場合、Web Share API が必要とする transient user activation は最初の `navigator.share` で消費されるため、共有画面から戻った後の2枚目以降は新しいユーザー操作なしに `downloadBlob` を呼ぶことになります。その結果、後続の share は拒否され、iOS では信頼できないため回避したはずの `<a download>` にフォールバックして「画像をすべてダウンロード」を完遂できません。全 File を1回の share に渡すか、各画像を明示的なユーザー操作で保存させる必要があります。

**コメント要約**: iOS で複数添付をループ share すると2枚目以降が失敗する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `downloadBlobs` を追加し、iOS では全 File を1回の `navigator.share` に渡す。非 iOS / share 不可時は従来どおり anchor 連続 DL。

---

## 評価セッション（2026-07-25 19:38・review-comments-evaluate）

- **評価日時**: 2026-07-25 19:38 JST
- **評価者**: Cursor Agent（review-comments-evaluate auto）
- **ブランチ名**: dev/chat-v2
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2221
- **REVIEW_REQUEST_SINCE**: 2026-07-25T10:16:29Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼コメント id:5078119177、Codex サマリ review id:4779106296）
- **重複 RC スキップ**: GitHub id 3650025983 は RC-16 と同一指摘のため RC 採番せず

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-27 | 3650025984 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 書き込み成功後 getDoc 失敗で楽観 UI を巻き戻していた<br>toggle と確認 getDoc を分離 |
| [x] | RC-28 | 3650025987 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | iOS share 不能時に anchor 成功扱い<br>`unavailable` 結果と案内 toast |
| [x] | RC-29 | 3650025988 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | cache miss 時に誤った楽観 patch を先適用<br>getDoc 後に patch するよう変更 |

---

## 評価セッション（2026-07-25 20:00・shokujii-code-review）

- **評価日時**: 2026-07-25 20:00 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/chat-v2
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2221
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3a 自動修正**: RC-30・RC-31（🚨 2件）
- **既知未着手（本セッションで再採番せず）**: RC-9 / RC-16 / RC-22 / RC-23 / RC-24

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-30 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | ライトボックス遅延 fetch が閉じ直し後のセッションに反映されうる<br>generation で stale 反映を破棄 |
| [x] | RC-31 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 楽観更新失敗時に呼出時 summary へ無条件ロールバック<br>他ユーザー更新を消す。期待値一致時のみ戻す |

---

**識別子**: RC-30（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/chat/ChatLog.vue:113`

**該当コード（レビュー時点の diff）**:

```diff
 const fetchPendingLightboxSlides = async (
   pending: { slideIndex: number; storagePath: string; fileName: string }[],
 ): Promise<void> => {
   await Promise.all(
     pending.map(async ({ slideIndex, storagePath, fileName }) => {
       try {
         const blob = await getChatAttachmentBlob(storagePath)
         const url = URL.createObjectURL(blob)
         if (!lightboxVisible.value) {
           URL.revokeObjectURL(url)
           return
         }
         lightboxOwnedObjectUrls.value.push(url)
         onAttachmentLoaded({ storagePath, url })
         const slide = lightboxImgs.value[slideIndex]
         if (slide != null) {
           lightboxImgs.value[slideIndex] = { src: url, title: fileName }
         }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: ライトボックスを閉じた後すぐ別画像を開くと、先行する `fetchPendingLightboxSlides` が新しい表示セッションにも `lightboxImgs` を書き換えます。さらに同じ添付画像がその間にサムネイル側で読み込まれると、`onAttachmentLoaded` がその URL を revoke して表示を壊します。→ ライトボックス表示ごとの generation を導入し、開始時点と同じセッションの場合だけ反映する。競合時は新規 URL を revoke する。

**コメント要約**: ライトボックス遅延 fetch が閉じ直し後のセッションに反映されうる

generation で stale 反映を破棄

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `lightboxVisible` だけでは閉じ→すぐ開き直しで true のまま残り、旧 fetch が新セッションのスライドを上書きしうる。`lightboxFetchGeneration` を開閉で進め、fetch 完了時に世代不一致なら URL を破棄するよう修正済み。

---

**識別子**: RC-31（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/chatReaction.ts:147`

**該当コード（レビュー時点の diff）**:

```diff
   try {
     await toggleReaction(roomId, messageId, userId, emoji)
   } catch (error) {
     chatStore.patchMessageReactionSummary(messageId, currentSummary)
     chatStore.setMyReactionForMessage(messageId, previousEmoji)
     throw error
   }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: 書き込み失敗時、呼び出し開始時の `currentSummary` へ無条件に戻すため、待機中に到着した他ユーザーのサマリ更新を消します。例えば別ユーザーの反応が listener で反映された後に自分の書き込みが拒否されると、その反応もローカルから消え、次の反応まで復元されません。→ 楽観更新後の期待サマリと最新ストア値が一致する場合のみ呼出時の値へ戻し、不一致なら他経路の更新を優先する。

**コメント要約**: 楽観更新失敗時に呼出時 summary へ無条件ロールバック

他ユーザー更新を消す。期待値一致時のみ戻す

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 失敗ロールバックが listener 経由の最新集計を巻き戻す実害がある。`isSameReactionSummary` で期待楽観値と一致するときだけ `currentSummary` に戻すよう修正済み。`myReaction` は常に previous へ復元。

