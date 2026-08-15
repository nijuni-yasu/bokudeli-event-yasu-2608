# ブランチ fix/2141 レビュー記録

### RC 一覧（サマリ）

**ブランチ全体の RC 通し表**（RC 追加のたびに末尾へ行追記。セッション内サマリ表と `[x]` / `[ ]` を一致させる）。

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `window.open()!` の非 null アサーションが別コンポーネントに残存<br>#2164 と同じ型の嘘。`?? undefined` 相当へ統一 |
| [x] | RC-2 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Prettier 未整形で `format:check` が落ちる<br>`<template v-else>` 追加時のインデント崩れ等 3 ファイル |
| [x] | RC-3 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `reportClientError` の `documentPath` が `communities/*/...` の擬似パス<br>実 ref の path を渡さないと調査時にドキュメントを特定できない |
| [x] | RC-4 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `useLetterStore` の `permissionDenied` export を削除<br>内部 unsubscribe 用 ref は維持。UI は letterListStore のみ |
| [x] | RC-5 | 3788927430, 3788932053 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | `opened.opener = null` で reverse tabnabbing 対策<br>`'noopener'` feature は fallback 破壊のため不使用 |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `_window?: Window` に対しテストが `null` を渡している<br>`base/tsconfig.json` が `*.test.ts` を除外しており型検査で検出されない |
| [x] | RC-7 | 3788927446, 3788932055 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 📋 仕様追加 | M | `letters.test.ts` で manager/support/拒否ケースを追加<br>isManager \|\| isSupport() の回帰検知 |
| [x] | RC-8 | 3788932061 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📋 仕様追加 | M | 404/410 本文パースで削除対象を限定<br>no_service / channel_is_archived / channel_not_found 等のみ remove。未知 404 は WARN のみ |
| [x] | RC-9 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | warn ログに `botId` と `botKey` で同一値を二重出力<br>読み手に別値と誤解させるため重複を削除 |
| [x] | RC-10 | 5301311591 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `letterList` の `handleLoadError` が re-throw し TaskExecutor で握りつぶされる<br>`reportClientError` を呼ぶよう修正 |
| [x] | RC-11 | 5301311591 | 👌 修正不要 | — | 📌 スコープ内 | — | 👀 確認のみ | — | partner 権限不一致時に setup が継続する点<br>`v-if` で非表示のため現状実害なし |
| [x] | RC-12 | 3788932059 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📋 仕様追加 | M | 単体 `Failed to fetch` のノイズ化を revert<br>#2174 調査完了まで ERROR 維持。store 購読耐性は残す |
| [x] | RC-13 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | RC-8/7 追修正後に Prettier 未整形が 3 ファイル残存<br>`slackMessage.ts` / `slackMessage.test.ts` / `letters.test.ts` |
| [x] | RC-14 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `letter.ts` の内部 `permissionDenied` ref が未参照の dead code<br>RC-4 で export 削除後も setter のみ残っていた |
| [x] | RC-15 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `letterList.handleLoadError` の `documentPath` が community_account 擬似パス<br>`_letterListRef?.path` を優先 |
| [x] | RC-16 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `subscribeEvent` の snapshot error で `rejectPendingLoadedEvent` を呼んでいない<br>購読が切れても `getLoadedEvent` が timeout まで待ち、原因が timeout Error にすり替わる |
| [x] | RC-17 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `letters.test.ts` に不要な `as never` キャストが 2 箇所<br>`RulesTestContext` で型が一致するためキャスト不要 |
| [x] | RC-18 | なし | 👌 修正不要 | — | 📤 スコープ外 | — | 👀 確認のみ | — | `community.ts` は snapshot error 時も `getLoadedCommunity` が timeout まで待つ<br>pending reject 機構自体が無く新設は M。本 PR で回帰は無いため対象外 |
| [x] | RC-19 | 5301752612 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Copilot: letterList re-throw → reportClientError は RC-10 と重複・既修正 |
| [x] | RC-20 | 5301752612 | 👌 修正不要 | — | 📌 スコープ内 | — | 👀 確認のみ | — | partner replace 後 return なしは RC-11 と同趣旨 |
| [x] | RC-21 | 3789150054 | 👌 修正不要 | — | 📌 スコープ内 | 💾 データ | 👀 確認のみ | — | `channel_is_archived` remove は RC-8 意図どおり |
| [x] | RC-22 | 3789150055 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `afterEach` + `vi.unstubAllGlobals()` 追加 |

---

## 評価セッション（2026-08-15 16:51・shokujii-code-review）

- **評価日時**: 2026-08-15 16:51 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `fix/2141`
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

**レビュー範囲**: `git diff origin/development...HEAD`（5 コミット / 23 ファイル）

- `[functions] #2141 Slack Webhook 404/410 時の自動 remove と部分成功許容`
- `[base][firebase] #2256 レタータブの Firestore 権限を support まで拡張`
- `[base][functions] #2174 Failed to fetch のノイズ化と store 購読エラー耐性`
- `[base] #2164 shareSnsButton: Facebook/LINE シェアで _window が null のとき TypeError を防ぐ`
- `[partner] #2165 注文詳細: 権限不一致時の throw をやめ ERROR ログ化を止血`

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `window.open()!` の非 null アサーションが別コンポーネントに残存<br>#2164 と同じ型の嘘。`?? undefined` 相当へ統一 |
| [x] | RC-2 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Prettier 未整形で `format:check` が落ちる<br>`<template v-else>` 追加時のインデント崩れ等 3 ファイル |
| [x] | RC-3 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `reportClientError` の `documentPath` が `communities/*/...` の擬似パス<br>実 ref の path を渡さないと調査時にドキュメントを特定できない |
| [x] | RC-4 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `useLetterStore` の `permissionDenied` export を削除<br>内部 unsubscribe 用 ref は維持。UI は letterListStore のみ |
| [x] | RC-5 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | `opened.opener = null` で reverse tabnabbing 対策<br>`'noopener'` feature は fallback 破壊のため不使用 |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `_window?: Window` に対しテストが `null` を渡している<br>`base/tsconfig.json` が `*.test.ts` を除外しており型検査で検出されない |
| [x] | RC-7 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 📋 仕様追加 | M | `letters.test.ts` で manager/support/拒否ケースを追加<br>isManager \|\| isSupport() の回帰検知 |
| [x] | RC-8 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📋 仕様追加 | M | 404/410 本文パースで削除対象を限定<br>webhook 失効・channel 不可のみ remove。未知 404 は WARN のみ |
| [x] | RC-9 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | warn ログに `botId` と `botKey` で同一値を二重出力<br>読み手に別値と誤解させるため重複を削除 |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/UserSuccessJoinEventDialog.vue:109`

**該当コード（レビュー時点の diff）**:

```diff
 const onShareSnsButtonClicked = async (event: BokudeliEvent) => {
   const partnerStore = usePartnerStore(event.partner_id)
-  const _window = !isMobileDevice() ? window.open('', '_blank', 'width=800,height=500')! : undefined
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `EventDetailsCard.vue` では `window.open()` の戻り値 null を扱うよう修正した一方、同じ `shareSnsButton` を呼ぶ `UserSuccessJoinEventDialog.vue` には `!` の非 null アサーションが残っている。twitter 経路は `_window != null` で分岐するため即クラッシュはしないが、型が実体（`Window | null`）と食い違ったままになる → 同 PR の方針に合わせて `!` を外す。

**コメント要約**: ポップアップブロック時に `window.open` が null を返すのに `!` で型を偽装している。#2164 の修正対象と同一パターンで、同 PR 内で揃えないと次の改修時に再発する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 本 PR が `_window` の null 安全化を目的としており、同一パターンの残存は PR の責務に含まれる。`shareSnsButton` の引数型を `Window | null` に広げた（RC-6）ことで `!` を外しても型エラーにならず、挙動も変わらない（twitter 経路は `!= null` 判定）。

---

**識別子**: RC-2（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/manage/community/CommunityLetter.vue:125`、`base/src/components/manage/event/EventLetter.vue:125`、`functions/default/src/utils/slackMessage.test.ts`

**該当コード（レビュー時点の diff）**:

```diff
+    <v-row v-if="letterListStore.permissionDenied">
+      <v-col cols="12">
+        <v-alert type="warning" variant="tonal">{{ $t('manage.letter.permission_denied') }}</v-alert>
+      </v-col>
+    </v-row>
+    <template v-else>
     <v-row class="justify-center">
       <v-col md="12" sm="12" cols="12">
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `npx prettier --check` が 3 ファイルで失敗する（`CommunityLetter.vue` / `EventLetter.vue` / `slackMessage.test.ts`）。`<template v-else>` で既存ブロックを囲んだ際にインデントが 1 段ずれたままになっている。PR verify の `format:check` が落ちる → `prettier --write` で整形する。

**コメント要約**: 追加した `<template v-else>` 配下のインデントが未整形で、`format:check`（PR verify 相当）が失敗する。`prettier --write` で解消でき、レビュー時の diff 可読性も改善する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `pr-verify.yml` の `format:check` が確実に失敗するためマージ前対応が必須。`prettier --write` で機械的に解消でき、挙動への影響はない。整形後に該当パッケージの `prettier --check` が全て通ることを確認済み。

---

**識別子**: RC-3（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/letter.ts:94`

**該当コード（レビュー時点の diff）**:

```diff
+          (err) => {
+            console.error('subscribeLetter snapshot error', err)
+            if (isFirestorePermissionDenied(err)) {
+              permissionDenied.value = true
+              letter.value = null
+              unsubscribeLetter?.()
+              unsubscribeLetter = null
+              return
+            }
+            reportClientError(err, { documentPath: `communities/*/letters/${letterId}`, severity: 'warn' })
+          },
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `documentPath` に `communities/*/letters/${letterId}` というワイルドカード入りの擬似パスを渡している。Cloud Logging から対象ドキュメントを特定できず、同 PR の目的（購読エラーの調査性向上）を損なう。`community.ts` / `event.ts` の同種ハンドラは `ref.path` を使っている → `await getLetterRef()` の結果を変数に取り、`letterRef.path` を渡す。

**コメント要約**: 購読エラー報告の `documentPath` が実在しない擬似パスで、どの community の letter か特定できない。他 store と同様に解決済み ref の `path` を使う。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 同一コミットで追加された `community.ts` / `event.ts` のエラーハンドラは `ref.path` を渡しており、`letter.ts` だけ擬似パスなのは一貫性を欠く。`onSnapshot` へ渡す ref を変数化するだけで修正でき、挙動は変わらない。

---

**識別子**: RC-4（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/letter.ts:122`

**該当コード（レビュー時点の diff）**:

```diff
     return {
       letter,
+      permissionDenied,
       updateLetter,
       copyLetter,
       unsubscribe,
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: `useLetterStore` の `permissionDenied` は store 内で購読解除に使うだけで、公開しても参照する側が無い（UI は `letterListStore.permissionDenied` のみ参照）。未使用 export を残すと「レター単体の権限エラーも UI が扱っている」と誤読される → LetterEdit 等で表示に使うか、公開をやめてローカル変数にするかを決める。

**コメント要約**: `letter.ts` の `permissionDenied` は export されているが参照箇所が無い。UI へ配線するか非公開にするかで方針が分かれるため、自動修正は行わず判断を仰ぐ。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: UI 配線は不要（`letterListStore.permissionDenied` が CommunityLetter / EventLetter で表示済み）。return から `permissionDenied` を外し、内部 unsubscribe 用 ref のみ維持。

---

**識別子**: RC-5（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/utils/shareSnsButton.ts:59`

**該当コード（レビュー時点の diff）**:

```diff
+const navigateShareUrl = (openUrl: string, popupWindow?: Window | null): void => {
+  if (popupWindow != null) {
+    popupWindow.location.href = openUrl
+    return
+  }
+  const opened = window.open(openUrl, '_blank')
+  if (opened == null) {
+    window.location.href = openUrl
+  }
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 新設した `window.open(openUrl, '_blank')` は `noopener` 指定が無く、開いた先から `window.opener` 経由で元タブを操作できる（reverse tabnabbing）。遷移先は Facebook / LINE の固定ホストのため実害は小さいが、規約上 `window.open` も `rel="noopener noreferrer"` 相当の対象 → ただし `window.open(url, '_blank', 'noopener')` は戻り値が常に null になり、直後の `opened == null` フォールバックが誤発火して現在タブが share URL に遷移してしまう。フォールバック判定の作り替えとセットで検討する。

**コメント要約**: 新規追加の `window.open` に noopener が無い。単純に `'noopener'` を足すと戻り値 null によりフォールバックが誤発火するため、判定方法の見直しが必要。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `'noopener'` feature 文字列は戻り値 null でフォールバック誤発火するため、`opened.opener = null` / `popupWindow.opener = null` で reverse tabnabbing 対策。Twitter 事前 open 経路も同様。`shareSnsButton.test.ts` で opener クリアと fallback 非破壊を検証。

---

**識別子**: RC-6（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/utils/shareSnsButton.ts:72`

**該当コード（レビュー時点の diff）**:

```diff
+  it('facebook: popupWindow が null のとき window.open にフォールバックする', async () => {
+    const openedWindow = { location: { href: '' } }
+    windowOpen.mockReturnValue(openedWindow)
+
+    await shareSnsButton('facebook', event, community, shop, null)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `shareSnsButton` の `_window?: Window` は `null` を受け付けない型なのに、テストは `null` を渡している。`base/tsconfig.json` が `**/*.test.ts` を除外しているため型検査をすり抜けているだけで、実体は型と不整合。呼び出し側も `window.open(...) ?? undefined` で null を潰す必要が生じている → 引数型を `Window | null` に広げ、呼び出し側の `?? undefined` を外す。

**コメント要約**: `_window` の型が実体（`window.open` の戻り値は `Window | null`）と合っておらず、テストの `null` 渡しが型検査から漏れている。引数型を広げれば呼び出し側の変換も不要になる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `navigateShareUrl` は既に `Window | null` を受ける実装であり、公開関数側の型だけが狭い。型を広げるのが最小かつ一意の修正で、呼び出し 2 箇所（`EventDetailsCard.vue` / `UserSuccessJoinEventDialog.vue`）の記述も簡素化できる。テスト 4 件が引き続き pass することを確認済み。

---

**識別子**: RC-7（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.rules:268`

**該当コード（レビュー時点の diff）**:

```diff
             match /letters/{letter} {
-                allow read, write: if isManager()
+                allow read, write: if isManager() || isSupport()
             }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/M]: `firestore.rules` を変更したが `tests/firestore-rules` にテストが追加されていない（現状 `chatReactions.test.ts` / `enterprise.test.ts` のみで letters は未カバー）。権限拡張の回帰を機械的に検知できない → support / コミュマネ / 無関係ユーザーの read・write を検証するテストを追加する。

**コメント要約**: letters の権限を support まで拡張したが rules テストが無く、意図しない権限緩和・縮小を検知できない。`tests/firestore-rules` に letters のケースを追加したい。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: `tests/firestore-rules/src/letters.test.ts` を新規追加。`configs/global.support_user_ids` seed、manager/support/member/outsider/未認証/クロスコミュニティの read・write・delete を 12 ケースで検証。emulator CI で pass。

---

**識別子**: RC-8（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/slackMessage.ts:37`

**該当コード（レビュー時点の diff）**:

```diff
+const handleInvalidSlackBot = async (communityId: string, bot: CommunityBot, status: number): Promise<void> => {
+  logger.warn('Slack webhook is gone; removing community bot binding', {
+    communityId,
+    botId: bot.id,
+    botKey: bot.id,
+    status,
+  })
+  try {
+    await removeCommunityBot(communityId, bot.id)
+  } catch (error) {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/M]: 1 回の 404 / 410 応答で `communities/{id}/bots/{botKey}` を即削除する設計になっている。Slack 側の一時的な応答異常や誤設定でも削除され、復旧にはコミュニティ管理者による Slack 再インストールが必要になる。削除は不可逆なので、連続失敗回数の閾値、または削除前に webhook 情報を退避・監査ログ化することを検討したい。

**コメント要約**: 単発の 404 / 410 で bot 紐付けを不可逆に削除する。誤削除時の復旧コスト（Slack 再インストール）が高いため、閾値の導入や削除内容の退避を検討したい。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: Issue #2141 の ERROR 止血を維持しつつ、404/410 一律削除をやめレスポンス本文で判定する。削除対象は `no_service` / `no_active_hooks` / `invalid_token` / `channel_is_archived` / `channel_not_found` および HTTP 410。消すのは `communities/{id}/bots` の紐付けのみで、復旧は `/shokujii add` で可能。未知の 404 本文は remove せず WARN のみ（ERROR 量産も回避）。

---

**識別子**: RC-9（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/slackMessage.ts:41`

**該当コード（レビュー時点の diff）**:

```diff
+  logger.warn('Slack webhook is gone; removing community bot binding', {
+    communityId,
+    botId: bot.id,
+    botKey: bot.id,
+    status,
+  })
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `botId` と `botKey` に同じ `bot.id` を出力している。ログの読み手には別の値に見えるうえ、同ファイル内の他のログ（`Slack webhook url is missing` / `Failed to remove community bot after gone webhook`）は `botId` のみ → 重複する `botKey` を削除する。

**コメント要約**: warn ログで同一値を `botId` / `botKey` の 2 キーに重複出力している。同ファイル内の他ログとも不揃いなので `botId` に統一する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 冗長かつ誤読を招くフィールドで、削除以外の妥当な修正方針がない（`botKey` に別値を入れる余地がない）。削除しても Cloud Logging での追跡性は `botId` で維持される。テスト（`slackMessage.test.ts` 7 件）は `objectContaining` で `botId` を検証しており影響なし。

---

## 評価セッション（2026-08-15 17:14・review-comments-evaluate）

- **評価日時**: 2026-08-15 17:14 JST
- **ブランチ名**: `fix/2141`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2259
- **REVIEW_REQUEST_SINCE**: 2026-08-15T08:04:00Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文 #5301285134、Codex 接続案内 #5301311933）
- **手順 4a 自動修正**: RC-10（🟡 1 件）
- **重複 RC 化せず**: RC-5（Copilot #3788927430 / Codex #3788932053）、RC-7（Copilot #3788927446 / Codex #3788932055）、RC-8（Codex #3788932061 で channel_archived 論点を追記）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-10 | 5301311591 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `letterList` の `handleLoadError` が re-throw し TaskExecutor で握りつぶされる<br>`reportClientError` を呼ぶよう修正 |
| [x] | RC-11 | 5301311591 | 👌 修正不要 | — | 📌 スコープ内 | — | 👀 確認のみ | — | partner 権限不一致時に setup が継続する点<br>`v-if` で非表示のため現状実害なし |
| [x] | RC-12 | 3788932059 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📋 仕様追加 | M | 単体 `Failed to fetch` のノイズ化を revert<br>#2174 調査完了まで ERROR 維持。store 購読耐性は残す |

---

**識別子**: RC-10（GitHub id: 5301311591・Copilot トップレベル）

**レビュワー**: Copilot

**指摘箇所**: `base/src/stores/letterList.ts:55`

**該当コード（レビュー時点の diff）**:

```diff
+      throw error
```

**レビュワーのコメント（原文）**:

🟡 `handleLoadError` で permission-denied 以外を re-throw すると TaskExecutor に `.catch()` がなく unhandled rejection となり `reportClientError` が呼ばれない。`community.ts` / `event.ts` と非一貫 → re-throw をやめ `reportClientError` を呼ぶ。

**コメント要約**: letterList の pagination エラーが TaskExecutor 経由で握りつぶされログに残らない。permission-denied 以外も `reportClientError` で報告する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: Copilot 指摘どおり `throw error` は TaskExecutor の `finally()` のみで捕捉されず実害がある。修正案が一意のため手順 4a で `reportClientError` 呼び出しに置換した。

---

**識別子**: RC-11（GitHub id: 5301311591・Copilot トップレベル）

**レビュワー**: Copilot

**指摘箇所**: `partner/src/pages/order/[eventId].vue:44`

**レビュワーのコメント（原文）**:

🟡 権限不一致時に `return` がなく setup が継続する。現状は `v-if="isAuthorized && ..."` で非表示のため実害は小さい。必須ではない。

**コメント要約**: 非認可時も setup が走るが、テンプレート側でガード済み。現 PR では対応不要。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: レビュワー自身が「必須ではない」と明記。`isAuthorized` ガードと `router.replace` で UX は確保されている。

---

**識別子**: RC-12（GitHub id: 3788932059）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/utils/clientErrorNoise.ts:57`

**レビュワーのコメント（原文）**:

🟡 単体 `Failed to fetch` を一律ノイズ扱いしない。CORS/DNS/API 停止でも同メッセージになり、Monitoring からも除外され検知経路がなくなる。

**コメント要約**: #2174 の noise 化が障害検知を弱める可能性。発生箇所限定や頻度監視など設計判断が必要。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: Codex 指摘どおり、#2174 原因未特定のうち単体 `Failed to fetch` を WARN 格下げすると CORS/API 障害の検知経路が弱くなる。`clientErrorNoise.ts` / Monitoring filter / `parse_logs.py` から単体 `Failed to fetch` のノイズ化のみ revert し、`community.ts` / `event.ts` の store 購読エラー耐性は維持。主因特定後に route 限定ノイズ化等を #2174 で再検討する。

---

## 評価セッション（2026-08-15 18:57・shokujii-code-review）

- **評価日時**: 2026-08-15 18:57 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `fix/2141`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2259
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

**レビュー範囲**: `git diff origin/development...HEAD` + 未コミット差分（RC-4〜12 対応・`letters.test.ts` 追加・Failed to fetch revert 等）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-13 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | RC-8/7 追修正後に Prettier 未整形が 3 ファイル残存<br>`slackMessage.ts` / `slackMessage.test.ts` / `letters.test.ts` |
| [x] | RC-14 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `letter.ts` の内部 `permissionDenied` ref が未参照の dead code<br>RC-4 で export 削除後も setter のみ残っていた |
| [x] | RC-15 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `letterList.handleLoadError` の `documentPath` が community_account 擬似パス<br>`_letterListRef?.path` を優先 |

---

**識別子**: RC-13（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/slackMessage.ts`、`functions/default/src/utils/slackMessage.test.ts`、`tests/firestore-rules/src/letters.test.ts`

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: RC-2 対応後に Slack 本文パース・rules テスト追加で 3 ファイルが再び Prettier 未整形になっている。`npx prettier --check` が失敗し PR verify の `format:check` が落ちる → `prettier --write` で整形する。

**コメント要約**: 追修正で整形漏れが再発。3 ファイルを Prettier 整形すれば CI format ゲートを通過できる。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: PR verify 必須ゲート。機械的修正のみで挙動影響なし。本セッションで `prettier --write` 実行済み。

---

**識別子**: RC-14（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/letter.ts:70`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-4 で `permissionDenied` の export を削除したが、内部 ref と `permissionDenied.value = true` の代入が残り、参照箇所が無い dead code になっている → ref と setter を削除し、permission-denied 時は `letter.value = null` と unsubscribe のみ行う。

**コメント要約**: export 削除後も内部 ref が書き込み専用で残っていた。UI は `letterListStore.permissionDenied` のみ使用するため letter store 側の ref は不要。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 修正方針が一意。本セッションで ref 削除済み。

---

**識別子**: RC-15（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/letterList.ts:56`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-10 で追加した `handleLoadError` の `reportClientError` が `communities/${communityAccount}/letters` という擬似パスを渡している。RC-3 と同様、解決済み ref があれば実 path を使うべき → `_letterListRef?.path` を優先し、未取得時のみフォールバックする。

**コメント要約**: letterList のエラー報告 path が community_account スラッグベースの擬似パス。`_letterListRef` があれば Firestore 実 path を渡す。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-3 と同一方針。1 行で修正可能。本セッションで `_letterListRef?.path ?? ...` に変更済み。

---

## 評価セッション（2026-08-15 19:05・shokujii-code-review）

- **評価日時**: 2026-08-15 19:05 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `fix/2141`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2259
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

**レビュー範囲**: `git diff origin/development...HEAD`（15 コミット / 24 ファイル・作業ツリー clean）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-16 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `subscribeEvent` の snapshot error で `rejectPendingLoadedEvent` を呼んでいない<br>購読が切れても `getLoadedEvent` が timeout まで待ち、原因が timeout Error にすり替わる |
| [x] | RC-17 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `letters.test.ts` に不要な `as never` キャストが 2 箇所<br>`RulesTestContext` で型が一致するためキャスト不要 |
| [x] | RC-18 | なし | 👌 修正不要 | — | 📤 スコープ外 | — | 👀 確認のみ | — | `community.ts` は snapshot error 時も `getLoadedCommunity` が timeout まで待つ<br>pending reject 機構自体が無く新設は M。本 PR で回帰は無いため対象外 |

---

**識別子**: RC-16（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/event.ts:400`

**該当コード（レビュー時点の diff）**:

```diff
+          (err) => {
+            console.error('subscribeEvent snapshot error', err)
+            reportClientError(err, { documentPath: eventRef.path, severity: 'warn' })
+            unsubscribeEvent?.()
+            unsubscribeEvent = null
+          },
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 本 PR で追加した `onSnapshot` の error コールバックが購読を破棄するだけで、待機中の `getLoadedEvent` を reject していない。購読が切れた以上 `event` は二度と更新されないため、待機者は timeout まで空振りする（`user` guard 5s、`enterprise` guard は 8s × 2 回リトライで最大 16s）。しかも最終的に投げられるのは実際の原因（permission-denied 等）ではなく `Event not loaded within Nms` にすり替わる → ZodError と同様に error コールバックでも `rejectPendingLoadedEvent(err)` を呼ぶ。

**コメント要約**: snapshot error で購読を捨てているのに pending の `getLoadedEvent` を reject しないため、ガード待ちが数秒〜十数秒伸び、原因も timeout Error に置き換わる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 既存の `rejectPendingLoadedEvent` を 1 行呼ぶだけで方針が一意。呼び出し元（`user` / `enterprise` / `partner` の guard・`currentUser.ts`）はいずれも catch 済みで、ZodError 以外は `/404` へ倒す挙動のため遷移先は変わらず、待ち時間と Cloud Logging に残る原因のみ改善する。pending が無いときは no-op のため unhandled rejection も生じない。`base` の vitest 119 件 pass。

---

**識別子**: RC-17（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `tests/firestore-rules/src/letters.test.ts:36`

**該当コード（レビュー時点の diff）**:

```diff
+function letterRef(
+  context: ReturnType<RulesTestEnvironment['authenticatedContext']>,
+  communityId: string,
+  letterId: string,
+) {
...
+  await letterRef(context as never, communityId, letterId).set(minimalLetterData(communityId, letterId))
...
+    await assertFails(letterRef(unauthenticated() as never, COMMUNITY_A, LETTER_ID).get())
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-7 で追加した rules テストに `as never` が 2 箇所ある。`authenticatedContext()` / `unauthenticatedContext()` / `withSecurityRulesDisabled()` はいずれも `RulesTestContext` を返すため、`letterRef` の引数型を `RulesTestContext` にすればキャストは不要になる。AGENTS.md の `as` 禁止に反し、将来 API が変わっても型エラーで気づけない → 引数型を `RulesTestContext` に変更し `as never` を削除する。

**コメント要約**: rules テストの `as never` は型が一致しているため不要。`as` を残すと将来のシグネチャ変更を型検査で検出できない。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `@firebase/rules-unit-testing` の型定義上 3 メソッドとも戻り値は `RulesTestContext` で、キャスト削除後も `tsc --noEmit --strict` と `eslint --max-warnings=0` が pass することを確認済み。修正方針が一意。

---

**識別子**: RC-18（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/community.ts:574`

**該当コード（レビュー時点の diff）**:

```diff
+          (err) => {
+            console.error('subscribeCommunity snapshot error', err)
+            reportClientError(err, { documentPath: communityRef.path, severity: 'warn' })
+            unsubscribeCommunity?.()
+            unsubscribeCommunity = null
+          },
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: RC-16 と同じ構造で、`getLoadedCommunity` の待機者は snapshot error 後も timeout（既定 5s）まで待つ。ただし `community.ts` には `event.ts` の `rejectPendingLoadedEvent` に相当する pending reject 機構が無く、新設は `getLoadedCommunity` の Promise 管理まで含む中規模改修になる → 本 PR は購読エラーの ERROR 化を止血する範囲に留め、対応しない。

**コメント要約**: community 側も同じ待ちが残るが、reject 機構の新設は本 PR のスコープ外。エラー未報告だった従来比で回帰は無い。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📤 スコープ外

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 変更前は error コールバック自体が無く、同じく timeout まで待っていたため本 PR による回帰ではない。`getLoadedCommunity` の pending 管理新設は工数 M で auto-fix 条件（S・方針一意）を満たさない。必要になった時点で `event.ts` と同じ機構を横展開する。

---

## 評価セッション（2026-08-15 19:12・review-comments-evaluate）

- **評価日時**: 2026-08-15 19:12 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `fix/2141`
- **PR**: #2259
- **REVIEW_REQUEST_SINCE**: 2026-08-15T10:03:04Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（5301727913 レビュー依頼定型文、5301753111 Codex 接続案内）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-19 | 5301752612 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Copilot: letterList re-throw → reportClientError は RC-10 と重複・既修正 |
| [x] | RC-20 | 5301752612 | 👌 修正不要 | — | 📌 スコープ内 | — | 👀 確認のみ | — | partner replace 後 return なしは RC-11 と同趣旨 |
| [x] | RC-21 | 3789150054 | 👌 修正不要 | — | 📌 スコープ内 | 💾 データ | 👀 確認のみ | — | `channel_is_archived` remove は RC-8 意図どおり |
| [x] | RC-22 | 3789150055 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `afterEach` + `vi.unstubAllGlobals()` 追加 |

**識別子**: RC-19（GitHub id: 5301752612）

**レビュワー**: Copilot

**指摘箇所**: `base/src/stores/letterList.ts`（インライン指摘なし・トップレベル）

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

> @codex この PR の Files changed をコードレビューしてください。指摘は shokujii-code-review チェックリストに沿って日本語でお願いします。
> 
> @copilot この PR ��...

shokujii-code-review チェックリストに沿って Files changed をレビューしました。

---

## 🟡 RC-1: `letterList.ts` — permission-denied 以外のエラーが握りつぶされる

**ファイル**: `base/src/stores/letterList.ts`

`handleLoadError` 内で permission-denied 以外のエラーを `throw` しても、`TaskExecutor` の `runNextTask` は `.catch()` を持たずに `.finally()` のみのため、unhandled rejection となり `reportClientError` が呼ばれません。`community.ts` / `event.ts` の getDocs catch では直接 `reportClientError` を呼んでいる実装と非一貫です。

**コメント要約**: letterList の pagination エラーが TaskExecutor 経由で握りつぶされる。reportClientError を直接呼ぶべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-10（5301311591）と同一指摘。71901a126 で `handleLoadError` が `reportClientError` を呼ぶよう修正済み。push 後の Copilot 再レビューは古い diff ベースの重複。

---

**識別子**: RC-20（GitHub id: 5301752612）

**レビュワー**: Copilot

**指摘箇所**: `partner/src/pages/order/[eventId].vue`（インライン指摘なし・トップレベル）

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

## 🟡 RC-2: `partner/[eventId].vue` — 権限不一致時に後続コードが継続実行される

`isAuthorized === false` 時に `router.replace` 後の `return` がないため、`<script setup>` の後続初期化処理がすべて実行されます。現状は `v-if="isAuthorized"` で非表示になっているため実害はありませんが、意図を示すコメントか `return` 追加を検討してください。

**コメント要約**: 権限不一致時に setup が継続する。return 追加を推奨。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-11 と同趣旨。`v-if="isAuthorized"` で DOM 非表示のため実害なし。return 追加は可読性改善だがマージ必須ではない。

---

**識別子**: RC-21（GitHub id: 3789150054）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `functions/default/src/utils/slackMessage.ts:12`

**該当コード（レビュー時点の diff）**:

```diff
@@ -1,9 +1,49 @@
 import { CommunityBot } from '@shokujii/common/schemas/CommunityBot.js'
 import { createModuleLogger } from './logger.js'
-import { getSlackWebhookUrl } from '../stores/slackBot.js'
+import { getSlackWebhookUrl, removeCommunityBot } from '../stores/slackBot.js'
 
 const logger = cr
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  アーカイブ時は bot 紐付けを削除しない**

前回指摘後の新しい本文判定でも `channel_is_archived` が削除対象として明示的に残っています。チャンネルを一時的にアーカイブして後から解除する運用では、この応答を契機に `communities/{id}/bots/{botId}` が削除されるため、解除後も Slack 通知は復旧せず、再追加するまで以後の通知が停止します。失効を示すエラーだけを削除対象とし、復旧可能なチャンネル状態では紐付けを維持してください。

Useful? React with 👍 / 👎.

**コメント要約**: アーカイブ解除後も通知を復旧したい運用では channel_is_archived で remove すべきでない。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-8 で webhook 失効・チャンネル不可状態（`channel_is_archived` / `channel_not_found` 等）を remove 対象とする設計を採用済み。アーカイブ中は Slack 配信不可であり、紐付けを残しても通知は失敗し続ける。解除後の再設定コストと、無効 bot が DB に残るコストのトレードオフで前者を許容。

---

**識別子**: RC-22（GitHub id: 3789150055）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `functions/default/src/utils/slackMessage.test.ts:51`

**該当コード（レビュー時点の diff）**:

```diff
@@ -0,0 +1,269 @@
+import { beforeEach, describe, expect, it, vi } from 'vitest'
+import { CommunityBot } from '@shokujii/common/schemas/CommunityBot.js'
+
+const { getSlackWebhookUrlMock, removeCommunityBotMock, loggerErrorMock, loggerWarnMock } = vi.hoisted(() => ({
+  getSlackWebhookUrlMock: vi.f
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  fetch のグローバルスタブを各テスト後に戻す**

このファイルでは多数のテストが `vi.stubGlobal('fetch', ...)` を実行しますが、`afterEach` の `vi.unstubAllGlobals()` がなく、`beforeEach` の `vi.restoreAllMocks()` は `stubGlobal` で置換した値を復元しません。`functions/default/vitest.config.ts` にも `unstubGlobals: true` がないため、同じワーカーで後続ファイルが実行されると最後の fetch モックが残り、テスト順によって通信処理の結果が変わります。既存の `shareSnsButton.test.ts` と同様に必ず teardown してください。

AGENTS.md reference: [AGENTS.md:L241-L244](https://github.com/nijuniinc/bokudeli-event-new/blob/93e122591bd3c6d8e528606ee9750cdef2df169a/AGENTS.md#L241-L244)

Useful? React with 👍 / 👎.

**コメント要約**: stubGlobal 後の teardown 不足でテスト間汚染の恐れ。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `shareSnsButton.test.ts` と同パターンでファイルスコープ `afterEach(() => vi.unstubAllGlobals())` を追加。vitest 11 テスト pass 確認済み。

---
