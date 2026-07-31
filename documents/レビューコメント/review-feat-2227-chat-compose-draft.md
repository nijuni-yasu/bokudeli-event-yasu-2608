# ブランチ feat/2227-chat-compose-draft レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | V2-8 補足にアカウント切替時は下書き破棄を明記<br>現実装（currentUserId watch）と整合させる |
| [x] | RC-2 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | upsertDraft が既存添付を無条件 revoke し同一 previewUrl が無効化<br>ルーム往復で添付プレビューが壊れる。残す URL のみ revoke する |
| [x] | RC-3 | 3689537597 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | ChatApp 未マウント中の UID 変更で他ユーザー下書きが残る<br>store に ownerUserId と syncOwnerUserId を追加 |
| [x] | RC-4 | 3689537606 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 送信 await 中のルーム切替で B の compose が消える<br>送信元 roomId のみ draft 削除・表示 clear |
| [x] | RC-5 | 3689651021 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 遅延送信完了が同一ルームの新下書きまで removeDraft する<br>updatedAt 一致時のみ削除 |
| [x] | RC-6 | 5141570613 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | restoreComposeForRoom の msg/images クリアが非対称<br>常に両方クリアしてから復元 |
| [x] | RC-7 | 5141570613 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Date.now() を LRU 用に使用（Copilot 規約指摘）<br>表示・TZ 非依存の内部メタのみ |
| [x] | RC-8 | 5141570613 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | currentUserId watch に flush 未指定<br>activeRoomId と同様 sync で意図を明確化 |
| [x] | RC-9 | 3689782415 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 送信中の persist が updatedAt だけ進め送信済み下書きが残る<br>同一内容 upsert は updatedAt を更新しない |
| [x] | RC-10 | 5141907053 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | 送信成功時 draft revoke 後に clearSelectedImages で二重 revoke<br>clearLocalComposeWithoutRevoke に変更 |
| [x] | RC-11 | 5141907053 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Date.now() 規約指摘（RC-7 と同根）<br>LRU 内部メタのみ |
| [x] | RC-12 | 5141907053 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | S | syncOwnerUserId の revoke 重複<br>clearAllDrafts に委譲 |
| [x] | RC-13 | 3690025793 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 送信中に同一ルームで入力更新→成功時に無条件 clear で本文消失<br>textarea 無効化＋送信時 compose 一致時のみ clear |
| [x] | RC-14 | 3690025797 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | LRU が updatedAt のみで getDraft が access 更新しない<br>accessedAt 分離・getDraft で更新 |
| [x] | RC-15 | 3690025802 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 送信中の画面離脱で下書き復元→再送可能<br>inFlightSend・送信中 persist スキップ |
| [x] | RC-16 | 5142251246 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | DateTime.now 統一の imo（Copilot）<br>LRU 内部メタは RC-7/11 と同根 |

---

## 評価セッション（2026-07-31 18:29・shokujii-code-review）

- **評価日時**: 2026-07-31 18:29 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: feat/2227-chat-compose-draft
- **PR**: 未作成（Issue [#2227](https://github.com/nijuniinc/bokudeli-event-new/issues/2227)）
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | V2-8 補足にアカウント切替時は下書き破棄を明記<br>現実装（currentUserId watch）と整合させる |
| [x] | RC-2 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | upsertDraft が既存添付を無条件 revoke し同一 previewUrl が無効化<br>ルーム往復で添付プレビューが壊れる。残す URL のみ revoke する |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/chat/ChatApp.vue:395`

**該当コード（レビュー時点の diff）**:

```diff
+watch(
+  () => currentUserId.value,
+  (userId) => {
+    if (lastComposeUserId.value === userId) {
+      return
+    }
+    composeDraftStore.clearAllDrafts()
+    clearSelectedImages()
+    msg.value = ''
+    lastComposeUserId.value = userId
+  },
+)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 現ルームの入力変更はルーム切替まで store に反映されない（設計どおり）。一方 `currentUserId` 変更時は persist せず `clearAllDrafts` するため、アカウント切替時は保持しない。V2-8 仕様書補足に「同一ブラウザでログインアカウントが変わった場合は下書きを破棄する」旨を一行追記すると、将来の誤解が減る。

**コメント要約**: 入力はルーム切替・Unmount 時のみ store へ保存する設計は妥当。<br>アカウント切替時の破棄は `04_チャット機能_v2.md` V2-8 補足への明記を推奨。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 実装はプライバシー・混在防止として妥当。仕様書は Pinia セッション保持のみ記載で、アカウント切替時の挙動が読み取りにくい。ドキュメント追記のみで足りる。

---

**識別子**: RC-2（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/chatComposeDraft.ts:82`

**該当コード（レビュー時点の diff）**:

```diff
+  const upsertDraft = (roomId: string, draft: ChatComposeDraft): void => {
+    if (isChatComposeDraftEmpty(draft)) {
+      removeDraftEntry(roomId)
+      return
+    }
+
+    const existing = draftsByRoomId.value.get(roomId)
+    if (existing != null) {
+      revokeDraftAttachments(existing)
+    } else {
+      evictOldestDraftIfNeeded(roomId)
+    }
+
+    const next = new Map(draftsByRoomId.value)
+    next.set(roomId, {
+      body: draft.body,
+      attachments: draft.attachments.map((attachment) => ({
+        id: attachment.id,
+        file: attachment.file,
+        previewUrl: attachment.previewUrl,
+      })),
+      updatedAt: Date.now(),
+    })
+    draftsByRoomId.value = next
+  }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `upsertDraft` が既存下書きの添付を無条件 `revokeDraftAttachments` する。ルーム A で下書き復元 → 再度 A から離れると、store 上の existing と UI から persist する attachment が同一 `previewUrl` を共有するため revoke 後に同 URL を再保存し、再訪時プレビューが壊れる。incoming draft に含まれない `previewUrl`（または `id`）だけ revoke するよう修正する。修正後は store テストで「同一 previewUrl で再 upsert しても revoke されない」ケースを追加推奨。

**コメント要約**: 同一ルームの再 persist で blob URL を自己 revoke するバグ。<br>`ChatApp` のルーム往復（`persistComposeForRoom`）で添付プレビューが表示不能になる。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 再現手順が明確で UX 上の実害。store 内の revoke 条件を絞れば解消できる。マージ前対応が必要。

---

## 評価セッション（2026-07-31 18:50・review-comments-evaluate）

- **評価日時**: 2026-07-31 18:50 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: feat/2227-chat-compose-draft
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2228
- **REVIEW_REQUEST_SINCE**: 2026-07-31T09:39:42Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（Copilot Pull request overview サマリのみ、Codex Review 接続案内ボイラープレート）
- **partial**: false
- **手順 4a 自動修正**: RC-3・RC-4（🚨 2 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-3 | 3689537597 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | ChatApp 未マウント中の UID 変更で他ユーザー下書きが残る<br>store に ownerUserId と syncOwnerUserId を追加 |
| [x] | RC-4 | 3689537606 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 送信 await 中のルーム切替で B の compose が消える<br>送信元 roomId のみ draft 削除・表示 clear |

---

**識別子**: RC-3（GitHub id: 3689537597）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/chat/ChatApp.vue:50`

**該当コード（レビュー時点の diff）**:

```diff
@@ -43,8 +44,10 @@ const notification = useNotification()
 const vuetifyDisplays = useDisplay()
 const { isLeftSidebarOpen } = useResponsiveLeftSidebar(vuetifyDisplays.smAndDown)
 const store = useChatStore()
+const composeDraftStore = useChatComposeDraftStore()
 const currentUserStore = useCurrentUserStore()
 const currentUserId = computed(() => currentUserStore.firebaseUser?.uid ?? '')
+const lastComposeUserId = ref(currentUserId.value)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  下書きをユーザー単位に分離してください**

ユーザー A が下書きを残してチャット画面を離れ、その後別画面でログアウトしてユーザー B が同じタブでログインした場合、`ChatApp` が存在しない間の UID 変更は watch できません。再マウント時には `lastComposeUserId` が最初から B の UID で初期化されるため、Pinia に残った A の下書きが消去されず、B も参加する同一ルームを開くと A の本文・添付が復元されます。store に所有 UID を保持してマウント時にも照合するか、UID ごとに下書きを名前空間化してください。

Useful? React with 👍 / 👎.

**コメント要約**: チャット画面外でのログアウト／ログインで前ユーザーの Pinia 下書きが残り得る（プライバシー）。<br>`syncOwnerUserId` で store 所有者 UID を保持し、マウント時・UID 変更時に照合して破棄する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 再現シナリオが明確で、同一端末・同一タブでのユーザー混在リスク。V2-8 のアカウント切替破棄意図と整合。store 側 owner 管理が最小修正。

---

**識別子**: RC-4（GitHub id: 3689537606）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/chat/ChatApp.vue:414`

**該当コード（レビュー時点の diff）**:

```diff
+watch(
+  () => store.activeRoomId,
+  (toRoomId, fromRoomId) => {
+    if (fromRoomId != null && fromRoomId !== toRoomId) {
+      persistComposeForRoom(fromRoomId)
+    }
+    restoreComposeForRoom(toRoomId)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  送信完了時は送信元ルームの入力だけを消してください**

ルーム A の送信処理が `await store.sendMessage` 中にサイドバーからルーム B へ移動すると、この同期 watch が B の下書きを共有の `msg` / `selectedImages` に復元します。その後 A の送信が成功すると `sendMessage` は現在のルームを確認せずそれらをクリアするため、B の本文が消え、添付の blob URL も revoke されます（次の切替や Unmount では空の内容で B の保存済み下書きも削除されます）。送信開始時の compose をルームに紐づけ、完了後は `activeRoomId === roomId` の場合だけ表示中入力を消すなど、遅延した完了が別ルームの入力を変更しないようにしてください。

Useful? React with 👍 / 👎.

**コメント要約**: 非同期送信完了時に activeRoomId 未確認で共有 compose を clear し、別ルームの下書きを破壊する。<br>送信開始時の `sentRoomId` で payload 固定し、成功時は当該 room の draft 削除と、表示中ルーム一致時のみ UI clear。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: ルーム切替と await の競合で再現可能なデータ消失。送信元ルームにスコープを限定すれば解消。

---

## 評価セッション（2026-07-31 19:16・review-comments-evaluate）

- **評価日時**: 2026-07-31 19:16 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: feat/2227-chat-compose-draft
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2228
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 5（レビュー依頼定型文 5141508546、Codex 接続案内 5141571594、Copilot overview 4827341950、Codex Review ボイラープレート 4827354827・4827520018）
- **重複除外**: GitHub id 3689537597・3689537606（既存 RC-3/RC-4）
- **手順 4a 自動修正**: RC-5・RC-6・RC-8

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-5 | 3689651021 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 遅延送信完了が同一ルームの新下書きまで removeDraft する<br>updatedAt 一致時のみ削除 |
| [x] | RC-6 | 5141570613 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | restoreComposeForRoom の msg/images クリアが非対称<br>常に両方クリアしてから復元 |
| [x] | RC-7 | 5141570613 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Date.now() を LRU 用に使用（Copilot 規約指摘）<br>表示・TZ 非依存の内部メタのみ |
| [x] | RC-8 | 5141570613 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | currentUserId watch に flush 未指定<br>activeRoomId と同様 sync で意図を明確化 |

---

**識別子**: RC-5（GitHub id: 3689651021）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/chat/ChatApp.vue:334`

**該当コード（レビュー時点の diff）**:

```diff
@@ -275,14 +323,20 @@ const sendMessage = async () => {
   if (!canSendMessage.value) return
 
   isSending.value = true
+  const sentRoomId = roomId
+  const sentBody = msg.value
+  const sentImageFiles = selectedImages.value.map((image) => image.file)
   try {
-    await store.sendMessage(roomId, userId, {
-      body: msg.value,
-      imageFiles: selectedImages.value.map((image) => image.file),
+    await store.sendMessage(sentRoomId, userId, {
+      body: sentBody,
+      imageFiles: sentImageFiles,
     })
-    msg.value = ''
-    clearSelectedImages()
-    scrollToBottomInChatLog()
+    composeDraftStore.removeDraft(sentRoomId)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  送信後に新しい同一ルーム下書きを削除しないでください**

画像アップロードなどでルーム A の送信が pending の間に A→B→A と切り替え、A の本文・添付を更新して再び B へ移ると、2 回目の離脱で新しい A の下書きが保存されますが、古い送信の完了時にこの無条件の `removeDraft(sentRoomId)` がその新しい版まで削除し、添付の blob URL も revoke します。RC-4 対応後にも残る新しい根拠は、`activeRoomId` の確認が表示中入力の clear だけを保護し、送信開始後に作られた同一ルームの下書きを識別していない点です。送信開始時の下書きリビジョンを保持し、一致する場合だけ削除してください。

AGENTS.md reference: [AGENTS.md:L241-L244](https://github.com/nijuniinc/bokudeli-event-new/blob/bab518abd443f802263c47c909852dbd137a2ea2/AGENTS.md#L241-L244)

Useful? React with 👍 / 👎.

**コメント要約**: RC-4 修正後も、遅延した送信成功が store 上の**新しい**同一ルーム下書きを無条件削除する。<br>送信開始時の `updatedAt` を控え、一致時のみ `removeDraftIfUpdatedAt` する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 再現シナリオは妥当。P2 だが同一ルーム下書き消失は RC-4 と同系統。リビジョン照合が最小修正。

---

**識別子**: RC-6（GitHub id: 5141570613・Copilot トップレベル内指摘 1）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/chat/ChatApp.vue:122`

**該当コード（レビュー時点の diff）**:

```diff
+const restoreComposeForRoom = (roomId: string | null): void => {
+  if (selectedImages.value.length > 0) {
+    clearSelectedImages()
+  } else {
+    msg.value = ''
+  }
```

**レビュワーのコメント（原文）**:

**🟡 修正提案: `restoreComposeForRoom` のクリア処理が非対称**

`selectedImages.value.length > 0` の分岐では `msg.value` がクリアされません。現在のコールパスでは `persistComposeForRoom` → `clearLocalComposeWithoutRevoke` で事前にクリアされるため実動作上は問題ないですが、`restoreComposeForRoom` 単独で見ると「画像がある場合、下書きがない新しいルームへ切り替えると `msg.value` が残る」という fragile な構造です。

より堅牢にするため、両者を独立してクリアする形を推奨します。

**コメント要約**: restore 前のローカル compose クリアが msg と images で排他的。<br>常に両方クリアしてから下書き復元する方が安全。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 現行コールパスでは顕在化しにくいが、将来の呼び出し変更に弱い。Copilot 提案どおり独立クリアが一意。

---

**識別子**: RC-7（GitHub id: 5141570613・Copilot トップレベル内指摘 2）

**レビュワー**: Copilot

**指摘箇所**: `base/src/stores/chatComposeDraft.ts:106`

**該当コード（レビュー時点の diff）**:

```diff
+      updatedAt: Date.now(),
```

**レビュワーのコメント（原文）**:

**🟡 修正提案: `Date.now()` の使用**

チェックリスト「`Date` オブジェクトを直接使っていないか（`luxon` を使う）」に該当します。LRU 順序の比較のみに使うため表示・タイムゾーン依存は生じませんが、`luxon` の `DateTime.now().toMillis()` で統一する方がプロジェクト規約に沿います。

**コメント要約**: LRU 用 epoch に `Date.now()` を使用。<br>luxon 統一を Copilot が提案。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: チェックリストの Date/luxon 指摘は主に表示・日時正規化向け。ここは Pinia 内 LRU 比較専用の number で `Date` オブジェクトは使っていない。base stores に luxon 先例もなく、依存追加のメリットが小さい。

---

**識別子**: RC-8（GitHub id: 5141570613・Copilot トップレベル内指摘 3）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/chat/ChatApp.vue:400`

**該当コード（レビュー時点の diff）**:

```diff
+watch(
+  () => currentUserId.value,
+  (userId) => {
+    composeDraftStore.syncOwnerUserId(userId)
+    clearSelectedImages()
+    msg.value = ''
+  },
+)
```

**レビュワーのコメント（原文）**:

**🟡 修正提案: `currentUserId` watch の `flush` 設定**

`store.activeRoomId` の watch は `flush: 'sync'` で即時実行されます。アカウント切替と同時に `activeRoomId` が変化するケースでは、`activeRoomId` watch（sync）が `currentUserId` watch（pre）より先に実行され、`persistComposeForRoom` で古いユーザーの下書きが一時保存されてから `clearAllDrafts` で削除されます。機能的には問題ないですが、意図としてはアカウント変更検知を先に処理したい場合は `flush: 'sync'` を合わせる方が設計の意図が明確です。

**コメント要約**: UID watch が default pre のため activeRoomId sync より後に走り得る。<br>`flush: 'sync'` でアカウント切替処理の順序意図を明確化。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 機能上は clear で整合するが、watch 順序の読みやすさ向上。S 工数で `flush: 'sync'` 追加は妥当。

---

## 評価セッション（2026-07-31 19:34・review-comments-evaluate auto）

- **評価日時**: 2026-07-31 19:34 JST
- **PR**: #2228（wake `since` 2026-07-31T10:25:15Z）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文 5141876198、Codex 接続案内 5141908043）
- **partial**: false
- **手順 4a 自動修正**: RC-9（🚨）・RC-10・RC-12

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-9 | 3689782415 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 送信中 persist で updatedAt のみ更新され送信済み下書きが残る<br>同一内容 upsert は no-op |
| [x] | RC-10 | 5141907053 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | 成功時 clearSelectedImages の二重 revoke<br>clearLocalComposeWithoutRevoke |
| [x] | RC-11 | 5141907053 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Date.now（RC-7 同根） |
| [x] | RC-12 | 5141907053 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | S | syncOwnerUserId → clearAllDrafts |

---

**識別子**: RC-9（GitHub id: 3689782415）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/chat/ChatApp.vue:343`

**該当コード（レビュー時点の diff）**: Codex コメント `diff_hunk`（sendMessage + removeDraftIfUpdatedAt）参照。

**レビュワーのコメント（原文）**: P1「送信済み compose をルーム切替時に残さないでください」— 送信中の `persistComposeForRoom` が同一内容でも `updatedAt` を更新し、`removeDraftIfUpdatedAt` がスキップされ送信済み下書きが復元・再送され得る。

**コメント要約**: RC-5 の updatedAt 照合と persist の組み合わせで送信済みが残る。<br>内容同一の upsert ではリビジョンを進めない。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 再現妥当。内容比較で upsert を no-op にすれば RC-5 の「新下書き保護」と両立。

---

**識別子**: RC-10（GitHub id: 5141907053・Copilot 内指摘 1）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/chat/ChatApp.vue:344`

**該当コード（レビュー時点の diff）**: （インライン指摘なし・トップレベル）

**レビュワーのコメント（原文）**: 送信成功時 `removeDraftIfUpdatedAt` で revoke 後、`clearSelectedImages` が同一 previewUrl を再 revoke（MDN 上 no-op だが所有権の整理として `clearLocalComposeWithoutRevoke` 推奨）。

**コメント要約**: 成功パスの UI クリア方法の整理。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 実害は小さいが方針一意。draft が blob 所有後は revoke なしクリアが妥当。

---

**識別子**: RC-11（GitHub id: 5141907053・Copilot 内指摘 2）

**レビュワー**: Copilot

**指摘箇所**: `base/src/stores/chatComposeDraft.ts:107`

**レビュワーのコメント（原文）**: Date.now / luxon（前回指摘継続）。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-7 と同根。LRU 内部 number のみ。

---

**識別子**: RC-12（GitHub id: 5141907053・Copilot 内指摘 3）

**レビュワー**: Copilot

**指摘箇所**: `base/src/stores/chatComposeDraft.ts:155`

**レビュワーのコメント（原文）**: `syncOwnerUserId` の revoke+Map クリアを `clearAllDrafts()` に委譲可能。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: 重複削除。直後に `ownerUserId` を新 UID に設定。

---

## 評価セッション（2026-07-31 20:19・review-comments-evaluate）

- **評価日時**: 2026-07-31 20:19 JST
- **ブランチ名**: feat/2227-chat-compose-draft
- **PR**: [#2228](https://github.com/nijuniinc/bokudeli-event-new/pull/2228)
- **REVIEW_REQUEST_SINCE**: 2026-07-31T11:08:11Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼 5142206484、Codex connect 5142252535）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-13 | 3690025793 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 送信中の同一ルーム入力が成功時に消える<br>textarea 無効化・compose 一致時のみ clear |
| [x] | RC-14 | 3690025797 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | LRU とリビジョン updatedAt の混同<br>accessedAt 分離・getDraft で touch |
| [x] | RC-15 | 3690025802 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 再マウントで送信中 compose 復元→再送<br>inFlightSend・送信中 persist スキップ |
| [x] | RC-16 | 5142251246 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | luxon 統一 imo<br>RC-7/11 と同根 |

---

**識別子**: RC-13（GitHub id: 3690025793・Codex）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/chat/ChatApp.vue`（送信成功時 clear）

**該当コード（レビュー時点の diff）**: `(diff_hunk 未取得)`

**レビュワーのコメント（原文）**:

送信中に更新された同一ルームの入力を消さないでください — 画像アップロード pending 中も VTextarea は isSending で無効化されていないため、送信成功時ルーム ID 一致だけで無条件クリアし新入力が失われる。送信開始 compose と一致する場合だけクリアするか送信中入力を無効化。

**コメント要約**: 送信中のローカル編集が成功ハンドラで消える。<br>無効化または条件付き clear が必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `VTextarea` を `isSending` で無効化。成功時は `isSameDraftContent` で送信開始時点と一致するときのみ `clearLocalComposeWithoutRevoke`。

---

**識別子**: RC-14（GitHub id: 3690025797・Codex）

**レビュワー**: Codex

**指摘箇所**: `base/src/stores/chatComposeDraft.ts`（LRU / getDraft）

**該当コード（レビュー時点の diff）**: `(diff_hunk 未取得)`

**レビュワーのコメント（原文）**:

下書きの利用時刻をリビジョンと分けて更新してください — getDraft で利用時刻が更新されず同一内容 persist が no-op のため、直前ルームの下書きが即 eviction される。updatedAt とは別に最終アクセス時刻を持ち復元時に更新。

**コメント要約**: eviction が編集リビジョン時刻ベースで LRU として誤動作。<br>accessedAt を分離。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `StoredDraft.accessedAt` を追加。eviction は `accessedAt` 最小。`getDraft` 参照時に `accessedAt` を更新。

---

**識別子**: RC-15（GitHub id: 3690025802・Codex）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/chat/ChatApp.vue`（下書き復元）

**該当コード（レビュー時点の diff）**: `(diff_hunk 未取得)`

**レビュワーのコメント（原文）**:

再マウント時に送信中の compose を再送させないでください — 送信中に画面離脱すると下書きとして復元され新インスタンスでは isSending が false。pending compose を通常下書きとして復元・送信可能にしない。

**コメント要約**: 送信中 unmount で同一メッセージ再送リスク。<br>store で in-flight を共有するか復元禁止。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `beginInFlightSend` / `endInFlightSend` と `getDraft` の in-flight 非返却。`persistComposeForRoom` は送信中 active ルームをスキップ。

---

**識別子**: RC-16（GitHub id: 5142251246・Copilot）

**レビュワー**: Copilot

**指摘箇所**: `base/src/stores/chatComposeDraft.ts`

**該当コード（レビュー時点の diff）**: `（インライン指摘なし）`

**レビュワーのコメント（原文）**:

shokujii-code-review チェックリストに沿って確認。重大な不具合（🚨 必須修正）はありません。[imo] `updatedAt: Date.now()` は luxon `DateTime.now().toMillis()` 統一を検討。

**コメント要約**: 重大指摘なし。Date.now imo のみ。<br>RC-7/11 と同根。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: LRU / accessedAt 内部メタ。表示・TZ 非依存。

---
