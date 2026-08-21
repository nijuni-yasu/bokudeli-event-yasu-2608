# ブランチ ui/2287 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Copilot PR 概要サマリ<br>具体指摘なし。変更内容の要約のみ |
| [x] | RC-2 | 3819011254 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | PF/enterprise 共通文言に変更<br>新着メール・shokujii トップ限定表現を削除 |
| [ ] | RC-3 | 3819011256 | 🟡 修正提案 | 未着手 | 📤 スコープ外 | 📏 規約 | 📐 リファクタ | M | computed 内 useUserStore は副作用<br>旧実装より遅延化は改善。明示 init は別 PR が妥当 |
| [x] | RC-4 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | target=_blank に rel 不足（suppressed）<br>少人数案内モーダル内の外部リンクへ rel を付与 |

---

## 評価セッション（2026-08-21 12:26・review-comments-evaluate）

- **評価日時**: 2026-08-21 12:26 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: ui/2287
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2290
- **Outdated 除外件数**: 1（GitHub id: 3819000933）
- **レビュー非該当スキップ件数**: 4（レビュー依頼定型文 id:5351972800、Copilot 承知返信 id:5352005249、Codex 接続案内 id:5352006355、Codex レビュー概要ボイラープレート）
- **手順 4a 自動修正**: なし（🚨 0件 / 条件付き 🟡 0件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Copilot PR 概要サマリ<br>具体指摘なし。変更内容の要約のみ |
| [x] | RC-2 | 3819011254 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | PF/enterprise 共通文言に変更<br>新着メール・shokujii トップ限定表現を削除 |
| [ ] | RC-3 | 3819011256 | 🟡 修正提案 | 未着手 | 📤 スコープ外 | 📏 規約 | 📐 リファクタ | M | computed 内 useUserStore は副作用<br>旧実装より遅延化は改善。明示 init は別 PR が妥当 |
| [x] | RC-4 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | target=_blank に rel 不足（suppressed）<br>少人数案内モーダル内の外部リンクへ rel を付与 |

---

**識別子**: RC-1（GitHub id: なし・Copilot review body）

**レビュワー**: Copilot

**指摘箇所**: PR トップレベル（Pull request overview）

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

## Pull request overview

PF（user）トップのイベントカードから参加者アバター一覧を非表示にしつつ、トップの公開イベント一覧で「参加者0人」のイベントも表示対象に広げることで、露出と見た目の両面を改善するPRです。

**Changes:**
- `user/src/pages/index.vue` のトップ3クエリを `event_num_members >= 0` に変更し、0人イベントも表示対象に変更
- `base/src/components/EventCard.vue` に `showMemberAvatars` を追加し、トップではアバター一覧を非表示化
- `base/src/stores/event.ts` の members 生成で `useUserStore` を遅延ロードに変更し、未参照時の不要購読を回避（テスト追加）

（以下 Reviewed changes 表・Suppressed comments セクション等省略）

**コメント要約**: PR 変更の概要サマリ。8 ファイルの変更内容をファイル別に列挙している。マージ判断に必要な具体的修正指摘は含まない。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 変更内容の要約のみで、コード修正を求める指摘ではない。RC 化は記録・トレーサビリティのため。

---

**識別子**: RC-2（GitHub id: 3819011254）

**レビュワー**: Codex

**指摘箇所**: `base/src/locales/messages/ja.ts:582`

**該当コード（レビュー時点の diff）**:

```diff
@@ -579,7 +579,7 @@ export default {
            以下手順で友人知人を食事会に招待して盛り上げていきましょう。<br />
            <br />
            ① まずは、<b>「主催者」</b>や<b>「運営メンバー」</b>で早速注文💨<br />
-           ② 公開設定の場合、どなたかが注文すると <a href="https://shokujii.jp/" target="_blank">shokujiiのトップページ</a> にも表示されます👀<br />
+           ② 公開設定のイベントは <a href="https://shokujii.jp/" target="_blank">shokujiiのトップページ</a> にも表示されています👀 どなたかが<b>初めて</b>注文すると、コミュニティメンバーへ<b>新着通知メール</b>も届きます📧<br />
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  エンプラ向けに送られない通知メールを案内しないでください**

この共通キーは `enterprise/src/pages/c/[communityAccount]/e/[eventId]/index.vue` の少人数案内モーダルでも表示されますが、`functions/default/src/orderCompletionMail.ts` の `sendNewEventNotificationToMembers` は `isEnterpriseEvent(transactionEvent)` の場合に送信せず終了します。そのため、エンタープライズイベントの主催者には「初回注文で新着通知メールも届く」と実際には起きない動作を案内します。PF 専用文言として分離するか、アプリ種別に応じてメール案内を出し分けてください。

**コメント要約**: 本 PR で追加した「新着通知メール」案内が enterprise の `event_few_members_notice_modal` にも出る。enterprise イベントでは当該メールは送信されないため誤案内になる。PF 専用キーへの分離またはアプリ別出し分けが必要。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 指摘は妥当。本 PR（#2288）が当該文言を変更したため、enterprise 向け誤案内は本 PR で解消すべき。`enterprise/.../index.vue` も同一キーを参照しており、`orderCompletionMail.ts` L180-182 で enterprise は早期 return。修正方針は複数（キー分割・enterprise 専用 desc・条件付き v-html）あり、仕様判断を要するため自動修正対象外。

**対応内容（2026-08-21）**: `event_few_members_notice_modal.desc` ② を PF/enterprise 共通文言に変更。「shokujii トップ」「新着通知メール」など PF 限定の機能言及をやめ、「サービス内の一覧で見つけやすい」旨に統一。

---

**識別子**: RC-3（GitHub id: 3819011256）

**レビュワー**: Codex

**指摘箇所**: `base/src/stores/event.ts:321`

**該当コード（レビュー時点の diff）**:

```diff
+    const getMemberUserStore = (memberId: string): UserStore => {
+      let store = _memberUserStores.get(memberId)
+      if (store == null) {
+        store = useUserStore(memberId) as UserStore
+        _memberUserStores.set(memberId, store)
+      }
+      return store
+    }
+
+    const members = computed<BokudeliEventMember[] | null>(() => {
+      if (_memberIds.value == null) {
+        return null
+      }
+      return _memberIds.value.flatMap((memberId) => {
+        const memberStore = getMemberUserStore(memberId)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  computed 内でメンバーストアを生成しないでください**

`eventStore.members` がテンプレートや `watch` から初めて評価されると、この computed の途中で `useUserStore(memberId)` が呼ばれ、`base/src/stores/user.ts` の `storeInstance.subscribe()` により Firestore の `onSnapshot` 購読が開始されます。これでは値を読むだけの computed の評価タイミングにネットワーク購読という副作用が依存し、条件付き描画や別の参照元が getter を評価しただけで意図せずリスナーが増えます。メンバー表示を必要とする呼び出し元から明示的な初期化メソッドを呼ぶなど、ストア生成・購読開始を computed の外へ移してください。

**コメント要約**: `members` computed 内の `useUserStore` 呼び出しは副作用付き。評価タイミングで Firestore 購読が始まる。明示的 init API への移行を提案。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📤 スコープ外

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: パターンとしての指摘は理解できるが、旧実装は `onSnapshot` 時に全 member 分 `useUserStore` を即時生成しており、本 PR は `showMemberAvatars=false` 等で `members` 未参照時の購読を避ける改善が #2287 の目的。明示 init 化は store API 設計変更を伴い本 PR スコープを超える。別 Issue / PR でのリファクタが妥当。

---

**識別子**: RC-4（GitHub id: なし・Copilot review Suppressed comments）

**レビュワー**: Copilot

**指摘箇所**: `base/src/locales/messages/ja.ts:586`（周辺の `<a target="_blank">` 群）

**該当コード（レビュー時点の diff）**:

```diff
           ③ <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2b9c62499c1_0_4#slide=id.g2b9c62499c1_0_4" target="_blank">SNS投稿</a> / ...
           などで告知しよう📢 <br />
           <br />
           詳しくは <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit#slide=id.g2b9c62499c1_0_0" target="_blank">コミュニティガイド「告知・集客のコツ」</a> も参考にしてください。`,
```

**レビュワーのコメント（原文）**:

[must] `target="_blank"` のリンクに `rel="noopener noreferrer"` が付いておらず、reverse tabnabbing のリスクがあります。i18n 文言内の `<a>` も対象なので、このブロック内の外部リンクすべてに `rel` を付与してください。

**コメント要約**: `event_few_members_notice_modal.desc` 内の `target="_blank"` リンクに `rel="noopener noreferrer"` が無い。reverse tabnabbing 対策として rel 付与を求める。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: セキュリティ上妥当な指摘。少人数案内モーダル文言は本 PR で更新しており、同一ブロック内の `target="_blank"` 付き外部リンクに `rel` を付与して解消するのが最小対応。

**対応内容（2026-08-21）**: `event_few_members_notice_modal.desc` 内の `target="_blank"` 付き外部リンクすべてに `rel="noopener noreferrer"` を追加。

---
