# ブランチ fix/2141 レビュー記録

### RC 一覧（サマリ）

**ブランチ全体の RC 通し表**（RC 追加のたびに末尾へ行追記。セッション内サマリ表と `[x]` / `[ ]` を一致させる）。

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `window.open()!` の非 null アサーションが別コンポーネントに残存<br>#2164 と同じ型の嘘。`?? undefined` 相当へ統一 |
| [x] | RC-2 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Prettier 未整形で `format:check` が落ちる<br>`<template v-else>` 追加時のインデント崩れ等 3 ファイル |
| [x] | RC-3 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `reportClientError` の `documentPath` が `communities/*/...` の擬似パス<br>実 ref の path を渡さないと調査時にドキュメントを特定できない |
| [ ] | RC-4 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `useLetterStore` の `permissionDenied` が未使用 export<br>UI へ配線するか公開をやめるかの方針判断が必要 |
| [ ] | RC-5 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | `window.open(url, '_blank')` に noopener なし（reverse tabnabbing）<br>`'noopener'` 指定は戻り値 null で fallback が誤発火するため方針検討が必要 |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `_window?: Window` に対しテストが `null` を渡している<br>`base/tsconfig.json` が `*.test.ts` を除外しており型検査で検出されない |
| [ ] | RC-7 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 📋 仕様追加 | M | `firestore.rules` の letters 権限拡張に対する rules テストが無い<br>`tests/firestore-rules` に support / 非 support の read・write ケースを追加したい |
| [ ] | RC-8 | なし | 🟡 修正提案 | 未着手 | ❓ 要確認 | 💾 データ | 📋 仕様追加 | M | 単発の 404 / 410 で bot 紐付けを即削除する<br>誤削除時は Slack 再インストールが必要。連続失敗閾値・削除前の情報退避を検討 |
| [x] | RC-9 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | warn ログに `botId` と `botKey` で同一値を二重出力<br>読み手に別値と誤解させるため重複を削除 |

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
| [ ] | RC-4 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `useLetterStore` の `permissionDenied` が未使用 export<br>UI へ配線するか公開をやめるかの方針判断が必要 |
| [ ] | RC-5 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | `window.open(url, '_blank')` に noopener なし（reverse tabnabbing）<br>`'noopener'` 指定は戻り値 null で fallback が誤発火するため方針検討が必要 |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `_window?: Window` に対しテストが `null` を渡している<br>`base/tsconfig.json` が `*.test.ts` を除外しており型検査で検出されない |
| [ ] | RC-7 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 📋 仕様追加 | M | `firestore.rules` の letters 権限拡張に対する rules テストが無い<br>`tests/firestore-rules` に support / 非 support の read・write ケースを追加したい |
| [ ] | RC-8 | なし | 🟡 修正提案 | 未着手 | ❓ 要確認 | 💾 データ | 📋 仕様追加 | M | 単発の 404 / 410 で bot 紐付けを即削除する<br>誤削除時は Slack 再インストールが必要。連続失敗閾値・削除前の情報退避を検討 |
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

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: 規約の「未使用 export を残さない」に該当するが、修正方針が「UI へ配線」「非公開化」の 2 択で一意に定まらないため [auto-fix-policy](../../.agents/skills/review-comments-evaluate/references/auto-fix-policy.md) の条件付き 🟡 自動修正の対象外とした。

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

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 遷移先が信頼できる固定ホスト（facebook.com / social-plugins.line.me）で緊急性は低い。一方で `'noopener'` を付けると戻り値が null になりフォールバックが壊れるため、修正方針が一意でなく自動修正の対象外とした。

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

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: チェックリスト「`firestore.rules` を変更した場合、`tests/firestore-rules` 側のテストも追加・更新しているか」に該当する。ただし letters 用のテストファイル新規作成（エミュレータのセットアップ・`configs/global` の support_user_ids 準備を含む）が必要で工数 M のため、条件付き 🟡 自動修正の対象外とした。ルール自体は同ファイル内の `album_items` / `members` と同じ `isManager() || isSupport()` パターンで、記述の妥当性に問題はない。

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

**ステータス**: 未着手

**PRスコープ**: ❓ 要確認

**ラベル**: 💾 データ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 自動 remove は Issue #2141 で意図された仕様のため、変更するかどうかは仕様判断が必要（[auto-fix-policy](../../.agents/skills/review-comments-evaluate/references/auto-fix-policy.md) の「仕様判断が必要」に該当し自動修正対象外）。PRスコープを ❓ 要確認としたのは、Issue #2141 の要件が「404/410 で即削除」までを含むのか、耐性強化を別 Issue に切り出すのかがコード上から確定できないため。

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
