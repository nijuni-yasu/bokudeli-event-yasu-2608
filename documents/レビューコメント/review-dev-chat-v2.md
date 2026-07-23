# ブランチ dev/chat-v2 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 🔧 微修正 | S | イベントページのチャットボタン文言<br>仕様 E-4 を短ラベル「グループチャット」に更新 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `useNavigateToEventChat` に catch がなく例外時 unhandled rejection<br>トースト表示 + `false` 返却を推奨 |
| [ ] | RC-3 | 3637688126 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | 過去読み込み済みメッセージの reaction_summary が即時反映されない<br>楽観更新または再取得が必要 |
| [x] | RC-4 | 3637688080 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | converter 付き ref へ plain object を setDoc<br>初回リアクションが常に失敗 |
| [x] | RC-5 | 3637688107 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 👤 UX | 🔧 微修正 | S | Web Share を canShare 全環境で優先<br>仕様 D-1/D-2 と不一致。iOS のみ share |
| [x] | RC-6 | 3637688098 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | 存在しない messageId へ reactions create 可能<br>orphan reaction 防止の exists 追加 |
| [x] | RC-7 | 3637688090 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | 同時リアクションで summary が古い値で上書き<br>Transaction 化 |
| [x] | RC-8 | 3637688102 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Rules テストが new Date() で permission-denied<br>serverTimestamp() に修正 |
| [ ] | RC-9 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | M | syncChatMessageReactionSummary の store 単体テストなし<br>Transaction ロジックは trigger テストでモックのみ |

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
- **手順 4a 自動修正**: RC-4〜RC-8（🚨 2件 / 🟡 3件）。RC-3 は M のため未着手

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-3 | 3637688126 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📐 リファクタ | M | 過去読み込み済みメッセージの reaction_summary が即時反映されない<br>楽観更新または再取得が必要 |
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

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 指摘は妥当。ChatLog のページング購読設計と連動するため、本 evaluate セッションでは自動修正対象外（M・UX ラベル）。

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
