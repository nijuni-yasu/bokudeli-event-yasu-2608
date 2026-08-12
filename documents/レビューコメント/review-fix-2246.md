# ブランチ fix/2246 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | `validateForm()` の戻り値未判定で形式エラー時も確認ダイアログへ進む<br>Issue #2246 受け入れ「バリデーション通過後」のゲート不足 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | Step 4 モーダルが `step1_validation_modal_title` を流用<br>共通キー化または step4 用キー追加を推奨 |
| [x] | RC-3 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | RC-1 対応で v-form を先に return し未入力時モーダルが出ない<br>集約バリデーションを先に実行し form ゲートは確認ダイアログ直前へ |
| [x] | RC-4 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | S | `reserve_validation_intro` から下書き保存済み文言を削除し submitReservation 失敗時に §8.1 不整合<br>保存前後で intro キーを出し分け（ユーザー判断で intro 出し分けは見送り） |
| [x] | RC-5 | 3766744567 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | `okVariant=text` 時に `okColor` を無視<br>常に `okColor` を bind |
| [x] | RC-6 | 3766744594 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | Step 1「進む」で v-form の valid 未参照<br>モーダル後に `formResult.valid` ゲート追加 |
| [x] | RC-7 | 3766744513 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | Step 4「進む」で v-form の valid 未参照<br>モーダル後に `formResult.valid` ゲート追加 |
| [x] | RC-8 | 3766748398 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | 削除済みカバー URL を hasCoverImage が true と判定<br>RC-7 と同じ v-form ゲートで解消 |
| [x] | RC-9 | 3766748407 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | バリデーションモーダルの OK がハードコード<br>既存 `$t('ok')` に置換 |
| [x] | RC-10 | 3766748382 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 📏 規約 | 🔧 微修正 | S | `bill_email` の検証器が EventDetailCard と不一致<br>モーダルのみ形式エラーになる |
| [x] | RC-11 | 3766748393 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | 集約側のみ trim して v-form と判定不一致<br>未加工値で形式チェック |
| [x] | RC-12 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | `ok-text="$t('ok')"` が文字列リテラルになる<br>`:ok-text` に v-bind 修正 |
| [x] | RC-13 | 3766914550 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | 空白のみ連絡先に MISSING+INVALID 二重表示<br>形式チェック前に trim で非空判定 |
| [x] | RC-14 | 5267584519 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 📑 仕様書 | 🔧 微修正 | S | カバー読込失敗時 v-form のみ NG でモーダル無表示<br>form invalid 時に汎用モーダル追加 |
| [x] | RC-15 | 5267762217 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | Step 5 で form invalid 時サイレント return<br>予約申請モーダルで汎用メッセージ表示 |
| [x] | RC-16 | 5267762217 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Step 4（@core）と Step 5（contactFormat）の email 正規表現不一致<br>`useValidators().emailValidator`（contactFormat）へ一本化 |
| [x] | RC-17 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | Step 1 だけ form invalid 時サイレント return が残存<br>共通キー `event_edit.form_fields_invalid` で 3 ステップ統一 |

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
## 評価セッション（2026-08-12 22:20・review-comments-evaluate）

- **評価日時**: 2026-08-12 22:20 JST
- **評価者**: Cursor Agent（review-comments-evaluate）
- **ブランチ名**: fix/2246
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2247
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（GitHub id: 5267237900 レビュー依頼定型文、Copilot/Codex トップレベルレビュー概要）
- **手順 4a 自動修正**: RC-5〜9, RC-11（🚨 3件 / 🟡 4件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-5 | 3766744567 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | `okVariant=text` 時に `okColor` を無視<br>常に `okColor` を bind |
| [x] | RC-6 | 3766744594 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | Step 1「進む」で v-form の valid 未参照<br>モーダル後に `formResult.valid` ゲート追加 |
| [x] | RC-7 | 3766744513 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | Step 4「進む」で v-form の valid 未参照<br>モーダル後に `formResult.valid` ゲート追加 |
| [x] | RC-8 | 3766748398 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | 削除済みカバー URL を hasCoverImage が true と判定<br>RC-7 と同じ v-form ゲートで解消 |
| [x] | RC-9 | 3766748407 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | バリデーションモーダルの OK がハードコード<br>既存 `$t('ok')` に置換 |
| [x] | RC-10 | 3766748382 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 📏 規約 | 🔧 微修正 | S | `bill_email` の検証器が EventDetailCard と不一致<br>モーダルのみ形式エラーになる |
| [x] | RC-11 | 3766748393 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | 集約側のみ trim して v-form と判定不一致<br>未加工値で形式チェック |

---

**識別子**: RC-5（GitHub id: 3766744567）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/ConfirmDialog.vue:82`

**該当コード（レビュー時点の diff）**:

```diff
-          color="primary"
+          :color="props.okVariant === 'text' ? undefined : props.okColor"
+          :variant="props.okVariant"
```

**レビュワーのコメント（原文）**:

[imo] `okVariant="text"` のときに `okColor` が常に無視されており、呼び出し側が「text + 任意の色」を指定できません（`okColor` prop を追加した意図と不整合になりえます）。variant による見た目調整に寄せて、color は常に `okColor` を渡す方が扱いやすいです。

**コメント要約**:

1行目: text variant 時に okColor prop が無視される。

2行目: `:color="props.okColor"` に統一してよい。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: prop 追加意図と実装が不一致。1行修正で解消。

---

**識別子**: RC-6（GitHub id: 3766744594）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/EventEdit.vue:855`

**該当コード（レビュー時点の diff）**:

```diff
+    await step1FormRef.value?.validate?.()
+    ...
+    stepper.value++
```

**レビュワーのコメント（原文）**:

[must] Step 1/4 の「進む」で `v-form.validate()` の戻り値（valid）を参照していないため、`collectEventBasicInfoValidationMessages` 側で拾えないバリデーションがある場合にフォーム不正でも次のステップへ進めてしまいます。モーダル表示（messages がある場合）を優先した上で、最終的に `valid === false` の場合は stepper を進めないようにしてください。

**コメント要約**:

1行目: Step 1 で validate 戻り値未使用のため v-form 独自ルールをすり抜けうる。

2行目: モーダル優先のうえ `formResult.valid !== true` で stepper 停止。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: Step 5 と同様、集約チェックと v-form の二段構えが必要。妥当。

---

**識別子**: RC-7（GitHub id: 3766744513）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/EventEdit.vue:889`

**該当コード（レビュー時点の diff）**:

```diff
+    await step4FormRef.value?.validate?.()
+    ...
+    stepper.value++
```

**レビュワーのコメント（原文）**:

[must] Step 4/4 の「進む」で `v-form.validate()` の結果を無視して `stepper` を進めているため、`collectEventDetailValidationMessages` と v-form ルールに差分が出た場合（例: ImageInput の URL ロード失敗等）でも次ステップへ進めてしまいます。モーダル表示を優先した上で、最後に `valid === false` の場合は遷移を止めてください。

**コメント要約**:

1行目: Step 4 でも validate 戻り値未使用。

2行目: ImageInput 失敗等は v-form のみ捕捉。formResult ゲートで停止。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-6 と同根。Step 5 予約申請フローと整合。

---

**識別子**: RC-8（GitHub id: 3766748398）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/EventEdit.vue:819`

**該当コード（レビュー時点の diff）**:

```diff
+const resolveHasEventCoverImage = (): boolean => {
+  if (coverImage.value != null) {
+    return true
+  }
+  const communityCover = communityStore.coverImageUrl
+  if (communityCover != null && communityCover !== '') {
+    return true
```

**レビュワーのコメント（原文）**:

**実在するカバー画像だけを有効と判定する** — イベントまたはコミュニティのカバー画像が Storage から削除されている場合でも、各 store の `coverImageUrl` は ID から URL を無条件に生成するため、ここで画像ありと判定されます。`ImageInput` は画像読み込み失敗後に `iconImageUrl` を `null` にして v-form を無効化しますが、`handleStep4Next` は `validate()` の結果を確認せず、この判定だけを使うので、カバー未入力のモーダルを出さず Step 5 へ進めてしまいます。フォームの `valid` もゲートに使うか、実際に読み込み可能な画像の状態を共有してください。

**コメント要約**:

1行目: resolveHasEventCoverImage が URL 存在のみ見て ImageInput 失敗を見逃す。

2行目: RC-7 の v-form valid ゲートで ImageInput 失敗時に stepper 停止可能。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘は妥当。hasCoverImage 単体修正より v-form ゲートが Step 5 と一貫。

---

**識別子**: RC-9（GitHub id: 3766748407）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/EventEdit.vue:1204`

**該当コード（レビュー時点の diff）**:

```diff
+    ok-text="OK"
```

**レビュワーのコメント（原文）**:

**新しいダイアログの OK 文言を ja.ts に移す** — 今回追加された Step 1/4 の確認ダイアログで `OK` を直接埋め込んでおり、UI 文字列を `ja.ts` にのみ追加するプロジェクト規約から外れています。同じ変更内で追加したタイトルやエラーメッセージと同様に共通の日本語 locale キーを定義して参照してください。

**コメント要約**:

1行目: バリデーションモーダルの ok-text がハードコード。

2行目: 既存ルートキー `$t('ok')` で参照。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: AGENTS.md i18n 規約どおり。新規キー不要で `$t('ok')` 利用。

---

**識別子**: RC-10（GitHub id: 3766748382）

**レビュワー**: Codex

**指摘箇所**: `base/src/utils/eventEditValidationMessages.ts:129`

**該当コード（レビュー時点の diff）**:

```diff
+    } else if (emailValidator(event.bill_email) !== true) {
+      messages.push(t('event_edit.step4_validation.bill_email_invalid'))
```

**レビュワーのコメント（原文）**:

**Step 4 と同じメール検証器を使用する** — PF の請求書払いで `bill_email` に `"foo"@example.com` などを入力すると、`EventDetailCard.vue` の `@core` 版 `emailValidator` は有効と判定する一方、ここへ渡される `useValidators()` 版は無効と判定します。そのためフィールド上はエラーがないのに「進む」で形式エラーモーダルが表示され、先へ進めません。フォームとメッセージ収集処理で同じ共通バリデータを使用してください。

**コメント要約**:

1行目: EventDetailCard は @core emailValidator、モーダル収集は useValidators（common 経由）で不一致。

2行目: 同一 validator を渡すか core 版に揃える。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘は妥当。`collectEventDetailValidationMessages` に `@core/utils/validators` の `emailValidator` を渡し EventDetailCard と一致させた（shokujii-code-review セッション 2026-08-12 22:22）。

---

**識別子**: RC-11（GitHub id: 3766748393）

**レビュワー**: Codex

**指摘箇所**: `common/src/utils/validateReservationRequest.ts:190`

**該当コード（レビュー時点の diff）**:

```diff
+  const email = event.organizer_email?.trim() ?? ''
+  if (email !== '' && !isValidEmail(email)) {
```

**レビュワーのコメント（原文）**:

**主催者連絡先をフォームと同じ未加工値で検証する** — `organizer_email` に `user@example.com ` のような末尾空白がある場合、店舗連絡フォームは未加工値を検証して `valid: false` を返しますが、集約側はここで `trim()` した値を有効と判定します。その結果 `handleReserveButtonClick` は理由モーダルを開かず、最後の `formResult` 判定で黙って終了するため、この変更の目的である形式エラーのモーダル表示が行われません。電話番号も同様なので、両経路で同じ値を検証するか、検証前にモデル自体を共通の方法で正規化してください。

**コメント要約**:

1行目: 集約側 trim により v-form より寛い判定。

2行目: trim 削除で ORGANIZER_*_INVALID を v-form と一致。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: #2246 のモーダル表示意図に反する実害。未加工値で検証が正しい。

---

## 評価セッション（2026-08-12 22:22・shokujii-code-review）

- **評価日時**: 2026-08-12 22:22 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: fix/2246
- **PR**: #2247
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **手順 4a 自動修正**: RC-12（🚨 1件）、RC-10 手動修正（evaluate 残）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-12 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | `ok-text="$t('ok')"` が文字列リテラルになる<br>`:ok-text` に v-bind 修正 |

---

**識別子**: RC-12（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventEdit.vue:1211`

**該当コード（レビュー時点の diff）**:

```diff
-    ok-text="OK"
+    ok-text="$t('ok')"
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: RC-9 対応で `ok-text="$t('ok')"` と記述されているが v-bind なしのため prop 値が文字列 `"$t('ok')"` のまま渡り、ボタンラベルが i18n されない → `:ok-text="$t('ok')"` に修正する。

**コメント要約**:

1行目: `ok-text` prop に v-bind がなく `$t('ok')` が評価されない。

2行目: 他コンポーネント同様 `:ok-text="$t('ok')"` に修正。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: Vue の prop バインディング規約違反。RC-9 実装の取りこぼし。同一セッションで `:ok-text` に修正済み。あわせて RC-10（`coreEmailValidator` 注入）も対応済み。

---

## 評価セッション（2026-08-12 22:37・review-comments-evaluate）

- **評価日時**: 2026-08-12 22:37 JST
- **評価者**: Cursor Agent（review-comments-evaluate）
- **ブランチ名**: fix/2246
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2247
- **Outdated 除外件数**: 4（GitHub id: 3766744513, 3766744594, 3766748393, 3766748407）
- **レビュー非該当スキップ件数**: 4（5267237900・5267510949 レビュー依頼定型文、5267378643 Codex 接続案内、5267377144 Copilot トップレベル要約＝RC-5/6/7 と同一指摘）
- **新規 RC なし**（RC-5〜12 評価済み・対応済み。未 Outdated の 3766744567 / 3766748382 / 3766748398 もコード上は解消済み）
- **補足**: reflect 後の AI レビュー監視（`REVIEW_REQUEST_SINCE=2026-08-12T13:32:37Z`）は評価時点で進行中。新規インラインが追加されたら再 evaluate

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| — | — | — | — | — | — | — | — | — | **新規 RC なし** |

---

## 評価セッション（2026-08-12 22:43・review-comments-evaluate・auto）

- **評価日時**: 2026-08-12 22:43 JST
- **評価者**: Cursor Agent（review-comments-evaluate・auto）
- **ブランチ名**: fix/2246
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2247
- **REVIEW_REQUEST_SINCE**: 2026-08-12T13:32:37Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（5267510949 レビュー依頼定型文、5267586202 Codex 接続案内）
- **手順 4a 自動修正**: RC-13, RC-14（🚨 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-13 | 3766914550 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | 空白のみ連絡先に MISSING+INVALID 二重表示<br>形式チェック前に trim で非空判定 |
| [x] | RC-14 | 5267584519 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 📑 仕様書 | 🔧 微修正 | S | カバー読込失敗時 v-form のみ NG でモーダル無表示<br>form invalid 時に汎用モーダル追加 |

---

**識別子**: RC-13（GitHub id: 3766914550）

**レビュワー**: Codex

**指摘箇所**: `common/src/utils/validateReservationRequest.ts:191`

**該当コード（レビュー時点の diff）**:

```diff
+  const email = event.organizer_email ?? ''
+  if (email !== '' && !isValidEmail(email)) {
+    reasons.add('ORGANIZER_EMAIL_INVALID')
```

**レビュワーのコメント（原文）**:

**空白のみの必須連絡先に形式エラーを重ねない** — `organizer_email` が空白のみの場合、`ReservationRequiredSchema` は `trim().min(1)` により `ORGANIZER_EMAIL_MISSING` を追加しますが、この条件は未加工値を非空とみなして `ORGANIZER_EMAIL_INVALID` も追加するため、モーダルに「未入力」と「形式不正」が同時表示されます。`organizer_phone_personal` でも同様なので、形式チェックは `trim()` 後が非空の場合だけ実行しつつ、末尾空白を形式不正にできるよう検証自体には未加工値を渡してください。

**コメント要約**:

1行目: 空白のみの organizer_email で MISSING と INVALID が二重に出る。

2行目: `trim() !== ''` を形式チェックのゲートにし、検証値は未加工のまま。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。RC-11 で trim 削除した副作用。形式チェック前のみ trim して非空判定すれば v-form と両立。

---

**識別子**: RC-14（GitHub id: 5267584519）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/EventEdit.vue:808`

**該当コード（レビュー時点の diff）**:

```diff
+const resolveHasEventCoverImage = (): boolean => {
+  if (coverImage.value != null) {
+    return true
+  }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `base/src/components/EventEdit.vue:808` 付近の `resolveHasEventCoverImage()` が `useEventStore(eventId).coverImageUrl` の文字列有無だけでカバー画像ありと判定しています。`base/src/components/ImageInput.vue` は画像 URL の読込失敗時に `iconImageUrl = null` として v-form を invalid にするため、実ファイルが存在しない/読めないケースでは Step 4 で進めない一方、今回追加したモーダルには `event_cover_missing` が出ません。結果として「進めない理由をモーダルで表示する」というこの PR の目的を満たせなくなります。

**コメント要約**:

1行目: カバー URL あり・読込失敗時、集約モーダルに理由が出ない。

2行目: form invalid 時もモーダルで理由表示が必要（#2246）。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 📑 仕様書

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: #2246 の「進めない理由をモーダル表示」に反する。集約 messages が空かつ form invalid 時に汎用 Step 4 モーダルを表示するよう修正。

---

## 評価セッション（2026-08-12 22:58・review-comments-evaluate）

- **評価日時**: 2026-08-12 22:58 JST
- **ブランチ名**: fix/2246
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2247
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 7（レビュー依頼 3、Codex 接続案内 3、Codex 問題なし 1）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-15 | 5267762217 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | Step 5 で form invalid 時サイレント return<br>予約申請モーダルで汎用メッセージ表示 |
| [x] | RC-16 | 5267762217 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Step 4（@core）と Step 5（contactFormat）の email 正規表現不一致<br>`useValidators().emailValidator`（contactFormat）へ一本化 |

---

**識別子**: RC-15（GitHub id: 5267762217）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/EventEdit.vue:928`

**該当コード（レビュー時点の diff）**:

```diff
     if (!result.ok) {
       showReserveValidationFailure(result.reasonCodes)
       return
     }
     if (formResult?.valid !== true) {
       return  // ← サイレントリターン：理由が表示されない
     }
     openReserveConfirm()
```

**レビュワーのコメント（原文）**:

**[must] `base/src/components/EventEdit.vue` L928–930: Step 5 で `formResult?.valid !== true` 時にユーザーへのフィードバックがない**

```ts
if (formResult?.valid !== true) {
  return  // ← サイレントリターン：理由が表示されない
}
```

Step 1/4 では `formResult?.valid !== true` 時にモーダルを表示していますが、Step 5 の `handleReserveButtonClick` だけは何もせず終了しています。`validateCurrentReservationRequest` では拾えない v-form エラー（例：ImageInput のロード失敗）が発生した場合に、ユーザーが「なぜ申請ボタンが効かないのか」分からなくなります。Step 4 と同様に汎用エラーメッセージをモーダルで表示することを推奨します。

**コメント要約**:

1行目: Step 5 予約申請で v-form invalid 時にサイレント return し理由が表示されない。

2行目: #2246 の意図に反する。Step 4 と同様に汎用モーダル表示が必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-14（Step 4）と同型の欠落。集約バリデーション通過後の v-form ゲートで理由をモーダル表示すべき。`reserveValidationDialog` に汎用メッセージを追加して解消。

---

**識別子**: RC-16（GitHub id: 5267762217）

**レビュワー**: Copilot

**指摘箇所**: `base/src/utils/eventEditValidationMessages.ts` / `common/src/utils/validateReservationRequest.ts`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

**[imo] `base/src/utils/eventEditValidationMessages.ts` と `common/src/utils/validateReservationRequest.ts` でメールバリデーションの正規表現が異なる**

- Step 4 モーダル（`collectEventDetailValidationMessages`）には `@core/utils/validators` の `emailValidator` を渡している（EventEdit.vue L878）
  - パターン: `` /^(([^<>()\\[\\]\\\\.,;:\\s@\"]+...)...$ `` （quoted string・IPリテラルを許容）
- Step 5 モーダル（`validateReservationRequest` → `validateOrganizerFormats`）は `contactFormat.ts` の `isValidEmail` を使用
  - パターン: `/^[\\w!#$%&'*+/=?`{|}~^-]+(\\.[\\w...])*@([A-Za-z0-9-]+\\.)+[A-Za-z]{2,}$/`

同一メールアドレスに対して Step 4 では「有効」、Step 5 では「無効」（またはその逆）と判定される可能性があります。`contactFormat.ts` のコメントには「base/src/composable/validators.ts と同一の正規表現」とありますが、`@core` の `emailValidator` は別パターンです。Step 4 のモーダル用にも `coreEmailValidator` でなく `contactFormat.ts` の `isValidEmail` に統一するか、明示的に差異を文書化することを検討してください。

**コメント要約**:

1行目: Step 4 モーダル（@core emailValidator）と Step 5 集約（contactFormat isValidEmail）で正規表現が異なる。

2行目: 同一文字列への判定が食い違う可能性。RC-10 で @core 統一済みの Step 4 との整合方針要検討。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘は妥当。ただし調査の結果、各 Step 内では v-form と集約モーダルの検証器は一致しており（Step 4 は双方 `@core`、Step 5 は双方 `contactFormat`）、RC-10 / RC-11 の対応は維持されていた。残る差異は `bill_email` だけが `@core` を使うフィールド間の非一貫性。加えて `@core` の `emailValidator` は英語メッセージを返すため、`EventDetailCard.vue` の請求先メールで英語エラーが表示される i18n 規約違反も併存していた。

`base/src/composable/validators.ts` の `emailValidator` が `contactFormat.isValidEmail` を呼ぶ実装であることから、ユーザー判断のうえ **`useValidators().emailValidator` へ一本化**（案 A）を採用。`EventDetailCard.vue` の `@core` import を除去して `useValidators()` から取得し、`EventEdit.vue` の Step 4 モーダル注入も同じ validator に変更した。`base/materio/` は変更していない（`@core` の `emailValidator` はプロジェクト内で未使用になった）。副次的に請求先メールのエラー文言が `validator.email`（日本語）になる。`collectEventDetailValidationMessages` は validator を注入で受け取る設計のため、`eventEditValidationMessages.ts` とそのテストは変更不要。

---

## 評価セッション（2026-08-12 23:06・shokujii-code-review）

- **評価日時**: 2026-08-12 23:06 JST
- **ブランチ名**: fix/2246
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2247
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-17 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | Step 1 だけ form invalid 時サイレント return が残存<br>共通キー `event_edit.form_fields_invalid` で 3 ステップ統一 |

---

**識別子**: RC-17（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventEdit.vue:854`

**該当コード（レビュー時点の diff）**:

```diff
     if (messages.length > 0) {
       step1ValidationDialog.messages = messages
       step1ValidationDialog.visible = true
       return
     }
     if (formResult?.valid !== true) {
       return
     }
     stepper.value++
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `handleStep1Next` の `formResult?.valid !== true` ガードが理由を表示せず return している。RC-14 で Step 4、RC-15 で Step 5 の同型サイレント return を解消したが、Step 1 だけ残っていた。集約 `collectEventBasicInfoValidationMessages` で拾えない v-form エラー（会場 URL の形式等、ルール差分が生じた場合）が起きると、ユーザーは「進む」が効かない理由を確認できず、Issue #2246 の「進めない理由をモーダルで表示する」という目的を満たせない。→ Step 4 と同様に汎用メッセージを `step1ValidationDialog` に表示する。あわせて、同一文言が `step4_validation.form_fields_invalid` と `manage.event.reserve_validation_form_fields_invalid` に重複しており Step 1 追加で三重化するため、共通キー `event_edit.form_fields_invalid` へ統合する。

**コメント要約**:

1行目: Step 1 の v-form ゲートだけ理由未表示のサイレント return が残っていた。

2行目: RC-14 / RC-15 と同型。汎用メッセージ表示と、三重化する文言の共通キー統合で対応。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: Issue #2246 の受け入れ条件そのものに関わる欠落で、Step 1/4/5 の挙動を揃える必要がある。修正時に `event_edit.form_fields_invalid` を新設し、RC-14 で追加した `event_edit.step4_validation.form_fields_invalid` と RC-15 で追加した `manage.event.reserve_validation_form_fields_invalid` を廃止して 3 ステップとも同キーを参照するようにした。両キーとも本 PR 内で追加したもののため、他機能への影響はない。

---
