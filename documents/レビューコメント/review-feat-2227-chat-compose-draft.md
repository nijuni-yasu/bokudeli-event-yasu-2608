# ブランチ feat/2227-chat-compose-draft レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | V2-8 補足にアカウント切替時は下書き破棄を明記<br>現実装（currentUserId watch）と整合させる |
| [x] | RC-2 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | upsertDraft が既存添付を無条件 revoke し同一 previewUrl が無効化<br>ルーム往復で添付プレビューが壊れる。残す URL のみ revoke する |

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
