# ブランチ feat/2227-chat-compose-draft レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | V2-8 補足にアカウント切替時は下書き破棄を明記<br>現実装（currentUserId watch）と整合させる |
| [x] | RC-2 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | upsertDraft が既存添付を無条件 revoke し同一 previewUrl が無効化<br>ルーム往復で添付プレビューが壊れる。残す URL のみ revoke する |
| [x] | RC-3 | 3689537597 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | ChatApp 未マウント中の UID 変更で他ユーザー下書きが残る<br>store に ownerUserId と syncOwnerUserId を追加 |
| [x] | RC-4 | 3689537606 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 送信 await 中のルーム切替で B の compose が消える<br>送信元 roomId のみ draft 削除・表示 clear |

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
