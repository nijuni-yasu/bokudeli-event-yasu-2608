# ブランチ fix/2246 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | `validateForm()` の戻り値未判定で形式エラー時も確認ダイアログへ進む<br>Issue #2246 受け入れ「バリデーション通過後」のゲート不足 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | Step 4 モーダルが `step1_validation_modal_title` を流用<br>共通キー化または step4 用キー追加を推奨 |
| [x] | RC-3 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | RC-1 対応で v-form を先に return し未入力時モーダルが出ない<br>集約バリデーションを先に実行し form ゲートは確認ダイアログ直前へ |
| [x] | RC-4 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | S | `reserve_validation_intro` から下書き保存済み文言を削除し submitReservation 失敗時に §8.1 不整合<br>保存前後で intro キーを出し分け（ユーザー判断で intro 出し分けは見送り） |

---

## 評価セッション（2026-08-12 21:13・shokujii-code-review）

- **評価日時**: 2026-08-12 21:13 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: fix/2246
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | `validateForm()` の戻り値未判定で形式エラー時も確認ダイアログへ進む<br>Issue #2246 受け入れ「バリデーション通過後」のゲート不足 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | Step 4 モーダルが `step1_validation_modal_title` を流用<br>共通キー化または step4 用キー追加を推奨 |
| [x] | RC-3 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | RC-1 対応で v-form を先に return し未入力時モーダルが出ない<br>集約バリデーションを先に実行し form ゲートは確認ダイアログ直前へ |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventEdit.vue:908`

**該当コード（レビュー時点の diff）**:

```diff
   try {
     await shopNoticeRef.value?.validateForm?.()

     const result = validateCurrentReservationRequest(ev)
     if (result == null) {
       showAlertDialog($t('event_edit.shop_list_loading'))
       return
     }
     if (!result.ok) {
       showReserveValidationFailure(result.reasonCodes)
       return
     }
     openReserveConfirm()
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `handleReserveButtonClick` が `validateForm()` の `{ valid: boolean }` を確認せず、`validateReservationRequest` が通れば確認ダイアログへ進む。電話番号・メール形式不正など `ReservationRequiredSchema` が捕捉しないエラーは、Issue #2246 の「v-form でフィールド直下にエラー表示」と「バリデーション通過後に確認ダイアログ」の意図に反して申請確認まで到達しうる（旧 `shopNoticeFormValid` による disabled も削除済み）。→ `const formResult = await shopNoticeRef.value?.validateForm?.()` のあと `formResult?.valid !== true` なら return する。

**コメント要約**:

1行目: 予約申請クリック時に v-form の形式バリデーション結果を見ず確認ダイアログへ進める。

2行目: #2246 は未入力をモーダル化する一方、形式エラーは v-form で止める設計。`valid !== true` で早期 return が必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 受け入れ条件「バリデーション通過後は従来どおり確認ダイアログ」に反する。集約バリデーションは主催者必須の存在チェックのみで、phoneValidator / emailValidator の形式チェックは v-form 側の責務のまま。

---

**識別子**: RC-2（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventEdit.vue:1194`

**該当コード（レビュー時点の diff）**:

```diff
  <confirm-dialog
    v-model="step4ValidationDialog.visible"
    :title="$t('event_edit.step1_validation_modal_title')"
    role="alertdialog"
    ok-text="OK"
  >
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: Step 4 のバリデーションモーダルタイトルが `event_edit.step1_validation_modal_title` を参照している。文言は同一でも step 番号とキーが不一致で将来の文言分岐時に混乱しうる。→ `event_edit.validation_modal_title` 等の共通キー、または `step4_validation_modal_title` を追加して両 Step で使い分ける。

**コメント要約**:

1行目: Step 4 モーダルが Step 1 用 i18n キーをタイトルに使用している。

2行目: 表示文言は問題ないが保守性のためキー整理を推奨。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 機能障害ではないが、Step 1/4 両方にモーダルを追加した PR では i18n キー命名の一貫性が望ましい。

---

## 評価セッション（2026-08-12 21:22・shokujii-code-review）

- **評価日時**: 2026-08-12 21:22 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: fix/2246
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-3 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | RC-1 対応で v-form を先に return し未入力時モーダルが出ない<br>集約バリデーションを先に実行し form ゲートは確認ダイアログ直前へ |

---

**識別子**: RC-3（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventEdit.vue:913`

**該当コード（レビュー時点の diff）**:

```diff
   try {
     const formResult = await shopNoticeRef.value?.validateForm?.()
     if (formResult?.valid !== true) {
       return
     }

     const result = validateCurrentReservationRequest(ev)
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: RC-1 で `formResult?.valid !== true` を集約バリデーションより先に判定したため、未入力時は v-form の赤枠のみ表示され `reserveValidationDialog` が開かない（Issue #2246 受け入れ条件違反）。→ `validateForm()` でインライン表示したうえで `validateCurrentReservationRequest` を先に実行しモーダル表示。`formResult?.valid !== true` の return は `openReserveConfirm()` 直前（形式エラーのみ確認ダイアログを止める）。

**コメント要約**:

1行目: v-form ゲートを先に置いた RC-1 修正が、未入力時のモーダル表示を阻害していた。

2行目: 処理順を「v-form 表示 → 集約バリデーション＋モーダル → form ゲート → 確認ダイアログ」に変更して両立。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 実機確認で未入力時にモーダルが出ない不具合を再現。RC-1 の形式エラー防止と #2246 の未入力モーダル表示は処理順の調整で両立可能。

---

## 評価セッション（2026-08-12 22:01・shokujii-code-review）

- **評価日時**: 2026-08-12 22:01 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: fix/2246
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-4 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | S | `reserve_validation_intro` から下書き保存済み文言を削除し submitReservation 失敗時に §8.1 不整合<br>保存前後で intro キーを出し分け（ユーザー判断で intro 出し分けは見送り） |

---

**識別子**: RC-4（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/locales/messages/ja.ts:814`

**該当コード（レビュー時点の diff）**:

```diff
-      reserve_validation_intro: '以下の項目をご確認のうえ、再度お試しください。下書きの内容は保存されています。',
+      reserve_validation_intro: '以下の項目をご確認のうえ、再度お試しください。',
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/S]: `reserve_validation_intro` から「下書きの内容は保存されています。」を削除したが、`submitReservation` 失敗時（`updateEventDraft` 後）では仕様 §8.1 の「保存済みだが申請できなかった」旨が必要。`handleReserveButtonClick`（保存前）と `submitReservation`（保存後）で intro 文言を分ける。

**コメント要約**:

1行目: 同一 intro が保存前後の両経路で使われ、§8.1 の保存済み案内が submitReservation 失敗時に欠落していた。

2行目: ユーザー判断により intro 出し分けは見送り。短い intro 一本のままとする。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: S

**判断理由**: ユーザーが RC-4 対応を修正不要と判断。intro 出し分け実装を revert し、短い intro 一本のままとする。
