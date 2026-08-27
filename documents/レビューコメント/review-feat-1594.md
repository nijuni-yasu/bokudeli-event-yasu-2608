# ブランチ feat/1594 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3643250457 | 🚨 必須修正 | 👌 修正不要 | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | M | member_tags read 緩すぎ → コレクション廃止 |
| [x] | RC-2 | 3643250460 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | isShowMember=false 時タグ非表示 |
| [x] | RC-3 | 3643250463 | 🟡 修正提案 | 📤 #2225 別Issue化 | 📤 スコープ外 | 🔒 セキュリティ | 🔧 微修正 | M | event_setting_tags Rules → #2225 |
| [x] | RC-4 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | review doc 旧仕様要約 |
| [x] | RC-5 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | 廃止 Trigger GCP delete 手順 |
| [x] | RC-6 | 5083168653 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | updateUserTags の String(t) 型検証 |
| [x] | RC-7 | 5083168653 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | addTagToMyProfile tag 型検証 |
| [x] | RC-8 | 5083168653 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | M | user_tags Rules 要素型・長さ |
| [x] | RC-9 | 5083168653 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | タグクリック失敗の通知 UX |
| [x] | RC-10 | 3652325976 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | target=_blank に rel 追加 |
| [x] | RC-11 | 3652326000 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | TagInput 文言 i18n 化 |
| [x] | RC-12 | 3652326017 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | EventMemberCard 失敗通知 |
| [x] | RC-13 | 3652326028 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | event_setting_tags index 削除 |
| [x] | RC-14 | 4781511966 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | set(merge) 競合 → user_tags のみ update |
| [x] | RC-15 | 4781511966 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | EventMemberList 失敗通知（RC-9/12 同趣旨） |
| [x] | RC-16 | 4781511966 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 02_マイページ Phase1 文言整合 |
| [x] | RC-17 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | EventMemberCard SNS リンクに rel 未追加 |
| [x] | RC-18 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | user_tags Rules 変更に tests 追加 |
| [x] | RC-19 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | TagImportHintDialog dismiss 冗長 |
| [x] | RC-20 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 取り込み可能タグ無しでもヒント表示 |
| [x] | RC-21 | 3652333341 | 🟡 修正提案 | 📤 #2226 別Issue化 | 📤 スコープ外 | — | 🆕 新機能 | L | Callable デプロイ後に Hosting 公開<br>https://github.com/nijuniinc/bokudeli-event-new/issues/2226 |
| [x] | RC-22 | 3652333346 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📄 ドキュメントのみ | S | RC-3 を #2225 に紐付け |
| [x] | RC-23 | 3654654219 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | 退会時 user_tags 匿名化 |
| [x] | RC-24 | 3654654226 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | TagAddChip click.prevent 追加 |
| [x] | RC-25 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 13_アカウント削除に user_tags 匿名化追記 |
| [x] | RC-26 | 5302033496 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | userTags.ts の update を store 経由に |
| [x] | RC-27 | 4943743482 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | normalizeTag の強制 lowercase 廃止 |
| [x] | RC-28 | 4943743482 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | TagInput マスタタグ選択判定を正規化で比較 |
| [x] | RC-29 | 4943804721 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 04_プロフィールタグ lowercase 記載を実装に整合 |
| [x] | RC-30 | 4943804721 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | normalizeTag をコードポイント走査に変更 |
| [x] | RC-32 | 3862492175 | 👌 修正不要 | — | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | onCall 第2型引数 Promise（既存慣習） |
| [x] | RC-33 | 3862492226 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | setUserTags JSDoc 不一致 |
| [x] | RC-34 | 3862492263 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | addTag Transaction 原子化 |
| [ ] | RC-35 | なし・エージェントレビュー | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 💾 データ | 🔧 微修正 | M | user_tags read-then-write とクライアント stale 全置換 |
| [x] | RC-36 | 3863087690 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | updateUserTags 空白タグで全消し |
| [x] | RC-37 | 3863087764 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | TagImportHintDialog 多重マウント |
| [ ] | RC-38 | 3863090915 | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 💾 データ, 🔒 セキュリティ | 🔧 微修正 | M | 退会済みユーザーへのタグ再書き込み競合 |
| [x] | RC-39 | 3868288823 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 初回ヒント表示中の pendingExecute 上書き |
| [ ] | RC-40 | 5433627247 | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 💾 データ | 🔧 微修正 | M | toggleTag 削除がクライアント read-then-write |
| [ ] | RC-41 | 3868301684 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | タグ更新で未保存プロフィール入力が消える |

## 評価セッション（2026-08-15 21:16・review-comments-evaluate auto）

- **評価日時**: 2026-07-24 15:06 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **REVIEW_REQUEST_SINCE**: 2026-07-24T05:46:40Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（レビュー依頼定型文 1、Codex ボイラープレート review 3）
- **partial 評価**: いいえ（Codex substantive 3 件。Copilot 新規レビューなし）
- **手順 4a 自動修正**: RC-2（🚨 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3643250457 | 🚨 必須修正 | 👌 修正不要 | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | M | member_tags の read がログインのみで緩すぎ<br>→ `member_tags` コレクション自体を廃止 |
| [x] | RC-2 | 3643250460 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | isShowMember=false 時に個別タグを描画<br>非公開時は個別タグ非表示（集計 UI 廃止済み） |
| [x] | RC-3 | 3643250463 | 🟡 修正提案 | 📤 別PR | 📤 スコープ外 | 🔒 セキュリティ | 🔧 微修正 | M | event_setting_tags Rules マスタ検証<br>イベントタグ PR（feat/1594-event-tags）へ移管 |
| [x] | RC-4 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | review-feat-1594 RC-2 サマリ要約が旧仕様（集計表示）のまま |
| [x] | RC-5 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | 廃止 Trigger の GCP 明示削除手順が 04 仕様書に未記載 |

---

**識別子**: RC-1（GitHub id: 3643250457）

**レビュワー**: Codex

**指摘箇所**: `firestore.rules:238`

**該当コード（レビュー時点の diff）**:

```diff
+                match /member_tags/{tagUserId} {
+                    allow read: if request.auth != null
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  member_tags の読取条件を参加者公開設定に合わせる**

この子コレクションのルールは親の `events` の read 条件を継承しないため、現在はログイン済みなら任意のイベントの参加者別タグ（`tagUserId` と `user_tags`）を直接読めます。`is_show_member === false` のイベントやテナント外イベントでも個別参加者の興味タグが漏れるので、親イベントの公開・テナント条件と参加者プロフィール公開設定、または管理者権限に合わせて read を絞ってください。

**コメント要約**: member_tags の read が `request.auth != null` のみで、テナント外・参加者非公開イベントでも個別タグが読める。<br>親 events の read 条件と community の `is_show_member` に合わせて read を制限する必要がある。

**評価**: 🚨 必須修正

**ステータス**: 👌 修正不要（`member_tags` サブコレクション・Trigger を廃止。Rules 整備不要）

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 参加者タグの冗長化（`member_tags` / `event_members_tags`）をやめ、`users.user_tags` を正本とする方針に変更。子コレクション自体が存在しなくなるため、RC-1 の Rules 指摘は解消。

---

**識別子**: RC-2（GitHub id: 3643250460）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/EventMemberList.vue:117`

**該当コード（レビュー時点の diff）**:

```diff
       <v-row v-else-if="isShowMember === false">
         ...
+            <div v-if="(member.user_tags ?? []).length > 0" class="d-flex flex-wrap mt-2 w-100">
+              <TagBadge ... />
+            </div>
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  非公開参加者の個別タグを描画しない**

`isShowMember === false` の分岐でも参加者ごとの `member.user_tags` を描画しているため、参加者プロフィール非公開のコミュニティでイベント詳細を開くだけで、誰がどのタグを持つかが参加者単位で見えてしまいます。仕様では非公開時のイベント詳細は集計タグのみ表示可なので、このブロックは `isShowMember === true` 側だけに限定してください。

**コメント要約**: 参加者氏名非公開時も個別タグが表示され、誰がどのタグを持つか漏れる。<br>`isShowMember === false` 分岐から TagBadge ブロックを削除する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 04 §4.2.3「`is_show_member === false` の場合は個別タグ非表示」と整合。プレビュー内の個別タグのみ非表示にする（集計 UI は廃止済み）。

---

**識別子**: RC-3（GitHub id: 3643250463）

**レビュワー**: Codex

**指摘箇所**: `firestore.rules:202`

**該当コード（レビュー時点の diff）**:

```diff
+                function eventSettingTagsValid() {
+                    return !('event_setting_tags' in request.resource.data)
+                        || (request.resource.data.event_setting_tags is list
+                            && request.resource.data.event_setting_tags.size() <= 5);
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  event_setting_tags の値も Rules で検証する**

ここでは配列型と件数だけを許可しているため、コミュニティマネージャー等が直接 Firestore に `['存在しないタグ']` のような非マスタ値を書けます。一方で `EventSettingTagsSchema` は非マスタタグを parse 失敗にするので、不正値が入ったイベントはクライアント側で読めなくなる恐れがあります。Rules 側でもマスタ値のみ許可するか、読み込み側を破壊しない扱いに揃えてください。

**コメント要約**: Rules は件数のみ検証で非マスタ値を許容。<br>Schema は非マスタで parse 失敗するため、Rules でマスタ検証するか読み込み側を寛容に揃える。

**評価**: 🟡 修正提案

**ステータス**: 📤 #2225 別Issue化（`feat/1594-event-tags` へ移管。本 PR からイベントタグ実装を omit）

**PRスコープ**: 📤 スコープ外

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 指摘は妥当だが、修正方針が2案（Rules マスタ検証 vs 読み込み側寛容化）あり一意でない。マスタ一覧を Rules に埋め込む工数も大きい。別途方針決定後に対応推奨。

---

## 評価セッション（2026-07-26 19:47・shokujii-code-review）

- **評価日時**: 2026-07-26 19:47 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-4 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | review-feat-1594 RC-2 サマリ要約が旧仕様（集計表示）のまま |
| [x] | RC-5 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | 廃止 Trigger の GCP 明示削除手順が 04 仕様書に未記載 |

---

**識別子**: RC-4（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/レビューコメント/review-feat-1594.md:20`

**該当コード**:

```diff
-| [x] | RC-2 | ... | isShowMember=false 時に個別タグを描画<br>非公開時は集計タグのみ表示に修正 |
+| [x] | RC-2 | ... | isShowMember=false 時に個別タグを描画<br>非公開時は個別タグ非表示（集計 UI 廃止済み） |
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄 ドキュメントのみ/S]: RC-2 サマリ表の要約が旧仕様（「非公開時は集計タグのみ表示」）のまま残っている。本差分で `EventParticipantTags` / `event_members_tags` を廃止したため、「非公開時は個別タグ非表示（集計 UI 廃止済み）」に揃える。

**コメント要約**: レビュー記録の RC-2 要約行が集計タグ表示前提の文言のまま。<br>集計 UI 廃止後の説明に更新する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 仕様変更（冗長化廃止）に伴う記録の整合性修正。表1行の文言更新のみで一意。

---

**識別子**: RC-5（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/03_参加者獲得/04_プロフィールタグ機能.md:323`

**該当コード**:

```diff
 - 既存 Firestore の `member_tags` ...（物理削除は `bokudeli-event-batch` で任意）
+- 廃止した Trigger（`syncMemberTagOnOrderChanged` / `updateEventMemberTags` / `syncUserTagsToEvent`）は deploy リストから外すだけでは GCP 上に残る。本番反映時は ... `firebase functions:delete` で明示削除する
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄 ドキュメントのみ/S]: `index.ts` export と `deploy_functions.yml` から 3 Trigger を削除しているが、`--only` デプロイでは GCP 上の旧 Function は自動削除されない。デプロイ後も Trigger が稼働し `member_tags` / `event_members_tags` への書き込みが続く可能性がある。04 §7.3 に `functions:delete` 手順を追記する。

**コメント要約**: deploy リスト除外だけでは Cloud Functions が残存する。<br>運用ドキュメントに明示削除手順を追記する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: pr-2061 / デプロイ手順 v2.12 と同型の運用漏れ。アプリは旧データを参照しないが無駄な書き込みが続く。04 §7.3 への1行追記で一意。

---

## 評価セッション（2026-07-26 20:00・review-comments-evaluate auto）

- **評価日時**: 2026-07-26 20:00 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **REVIEW_REQUEST_SINCE**: 2026-07-26T10:54:07Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（Codex 接続案内ボイラープレート）
- **partial 評価**: はい（Codex substantive なし。Copilot レビュー 4 インライン + トップレベル指摘）
- **手順 4a 自動修正**: RC-6〜8（🚨 3件）、RC-13・RC-16（🟡 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-6 | 5083168653 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | updateUserTags String(t) → typeof 検証 |
| [x] | RC-7 | 5083168653 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | addTagToMyProfile tag typeof 検証 |
| [x] | RC-8 | 5083168653 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | M | Rules isValidUserTagsList 追加 |
| [x] | RC-9 | 5083168653 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | タグクリック失敗通知（ask） |
| [x] | RC-10 | 3652325976 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | SNS リンク rel=noopener |
| [ ] | RC-11 | 3652326000 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | TagInput ja.ts 集約 |
| [x] | RC-12 | 3652326017 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | EventMemberCard 失敗通知 |
| [x] | RC-13 | 3652326028 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | event_setting_tags index 削除 |
| [ ] | RC-14 | 4781511966 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | user_tags のみ update / transaction |
| [x] | RC-15 | 4781511966 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | EventMemberList 失敗通知 |
| [x] | RC-16 | 4781511966 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 02_マイページ イベントタグ別 PR 明記 |

---

**識別子**: RC-6（GitHub id: 5083168653・トップレベル [must] 1）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/userTags.ts:22`

**該当コード（レビュー時点の diff）**: `(diff_hunk 未取得・トップレベル指摘)`

**レビュワーのコメント（原文）**:

[must] `functions/default/src/userTags.ts:22`
`updateUserTags` で `raw.map((t) => String(t))` を使っており、`object` 等の不正型が `"[object Object]"` として保存され得ます。`Array.isArray` の後に `raw.every((t) => typeof t === 'string')` を必須化し、不正型は `invalid-argument` で拒否してください。

**コメント要約**: Callable で非 string 要素が String 化され不正タグが保存されうる。<br>typeof string 検証を追加する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘どおり。`every(typeof t === 'string')` を追加し auto-fix 済み。

---

**識別子**: RC-9（GitHub id: 5083168653・トップレベル [ask]）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/EventMemberList.vue:34-41` / `EventMemberCard.vue:28-35`

**該当コード（レビュー時点の diff）**: `（インライン指摘なし）`

**レビュワーのコメント（原文）**:

[ask] `base/src/components/EventMemberList.vue:34-41` / `base/src/components/EventMemberCard.vue:28-35`
タグクリック時の失敗が `catch` で握りつぶされ、利用者に失敗が伝わりません。通知（snackbar）を出すか、親へ `emit` して統一表示する方針に揃えますか？

**コメント要約**: UserBioPanel は notification あり。MemberList/Card は握りつぶし。<br>ja.ts に既存キーあり。UserBioPanel 同様の notification に揃えるのが自然。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: EventMemberList / EventMemberCard に UserBioPanel と同様の notification（未ログイン・成功・失敗）を追加済み。

---

**識別子**: RC-11（GitHub id: 3652326000）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/TagInput.vue:72`

**該当コード（レビュー時点の diff）**:

```diff
+const snackbarMessage = r
```

**レビュワーのコメント（原文）**:

TagInput 内の文言（ラベル・見出し・エラーメッセージ）が直書きになっており、リポジトリ方針（UI 文字列は ja.ts に集約）から外れています。`base/src/locales/messages/ja.ts` にキーを追加し、`useI18n()` 経由の `$t` に寄せてください。

**コメント要約**: TagInput の UI 文言がハードコード。<br>ja.ts + useI18n へ移行が必要（複数キー・M 工数）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: TagInput / TagSettingsDialog は `$t('user_tags.*')` + ja.ts 集約済み。ユーザー向け直書き日本語なしを確認し対応完了。

---

**識別子**: RC-14（GitHub id: 4781511966・suppressed）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/userTags.ts:70`

**該当コード（レビュー時点の diff）**: `(review body suppressed comment)`

**レビュワーのコメント（原文）**:

addTagToMyProfile でも users ドキュメント全体を set(merge) で書き戻しているため、同時に別フィールドが更新された場合に古い値で上書きする競合が起きえます。タグ追加は user_tags のみを update する形にして、不要なフィールドの書き戻しを避けてください（可能なら transaction で重複・上限チェックまで原子的に）。

**コメント要約**: set(merge) 全フィールド書き戻しは競合リスク。<br>user_tags 限定 update または transaction 化を推奨。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: `updateUserTags` / `addTagToMyProfile` の書き込みを `getUserRef(uid).update({ user_tags })` に変更。transaction は採用せず方針 A で他フィールド巻き戻しリスクを解消。

---

**識別子**: RC-10（GitHub id: 3652325976）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/UserBioPanel.vue:107`

**該当コード（レビュー時点の diff）**: SNS リンク `<a target="_blank">` に rel なし

**レビュワーのコメント（原文）**:

外部リンクが target="_blank" ですが rel="noopener noreferrer" が付いていないため、遷移先ページから window.opener 経由で操作されるリスクがあります。target="_blank" のリンクには rel を付与してください。

**コメント要約**: tabnabbing 対策のため rel="noopener noreferrer" を付与する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: UserBioPanel の SNS 4 リンクすべてに rel 追加済み。

---

**識別子**: RC-12（GitHub id: 3652326017）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/EventMemberCard.vue:35`

**該当コード（レビュー時点の diff）**: `onMemberTagClick` の catch で握りつぶし

**レビュワーのコメント（原文）**:

EventMemberCard でもタグクリック時の失敗が握りつぶしになっており、未ログイン時のフィードバックもありません。UserBioPanel と同様に notification を出して、少なくとも未ログイン/失敗時はユーザーに伝わるようにしてください。

**コメント要約**: EventMemberCard のタグクリック UX を UserBioPanel に揃える。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: useNotification + 既存 i18n キーで RC-9 と同時対応。

---

**識別子**: RC-15（GitHub id: 4781511966・suppressed）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/EventMemberList.vue:41`

**該当コード（レビュー時点の diff）**: `onMemberTagClick` の catch で握りつぶし

**レビュワーのコメント（原文）**:

タグクリック時のエラーハンドリングが握りつぶしになっており、未ログイン時も含めてユーザーに何もフィードバックされません。少なくとも未ログイン時はトースト表示（既に ja.ts に event_details.tag_toggle_login_required が存在）し、失敗時も tag_toggle_failed 等を表示した方が操作が分かりやすいです。

**コメント要約**: EventMemberList のタグクリック UX を UserBioPanel に揃える。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-9/12 と同パターンで notification 追加済み。

---

## 評価セッション（2026-07-26 20:06・shokujii-code-review）

- **評価日時**: 2026-07-26 20:06 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-17 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | EventMemberCard SNS リンク rel 未追加 |
| [ ] | RC-18 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | user_tags Rules テスト未追加 |

---

**識別子**: RC-17（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventMemberCard.vue:96`

**該当コード**:

```diff
-              <a v-if="twitterUrl" :href="twitterUrl" target="_blank" @click.stop>
+              <a v-if="twitterUrl" :href="twitterUrl" target="_blank" rel="noopener noreferrer" @click.stop>
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-10 で UserBioPanel の SNS リンクに `rel="noopener noreferrer"` を追加したが、同 diff 内の EventMemberCard（L96–105）の 4 リンクは `target="_blank"` のまま rel なし。チェックリスト「外部リンクに rel 付与」に合わせて揃える。

**コメント要約**: UserBioPanel と同様、EventMemberCard の SNS 外部リンクにも tabnabbing 対策の rel を付与する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: EventMemberCard の SNS 4 リンクすべてに `rel="noopener noreferrer"` を追加済み。

---

**識別子**: RC-18（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.rules:76-95`

**該当コード**:

```diff
+        function isValidUserTagsList(tags) {
+            return tags is list
+                && tags.size() <= 10
+                && userTagElementValid(tags, 0)
+                ... // index 0..9
+        }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/M]: `user_tags` の Rules バリデーション（要素 string・1〜20 文字・最大 10 件）を追加しているが、`tests/firestore-rules` に `user_tags` 向けテストが無い。許可/拒否ケース（空文字・21 文字・非 string 要素・11 件）を追加すると regressions を防げる。

**コメント要約**: Rules 変更に対する firestore-rules テストの追加を推奨。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: `tests/firestore-rules/src/userTags.test.ts` を追加。許可 2 件・拒否 5 件（11 件・空文字・21 文字・非 string・他人 update）をカバー。

---

## 評価セッション（2026-07-26 21:35・shokujii-code-review）

- **評価日時**: 2026-07-26 21:35 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3b 自動修正**: RC-19・RC-20（🟡 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-19 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | TagImportHintDialog dismiss 冗長 |
| [x] | RC-20 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 取り込み可能タグ無しでもヒント表示 |

---

**識別子**: RC-19（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/TagImportHintDialog.vue:9`

**該当コード**:

```vue
const emit = defineEmits<{ dismiss: [] }>()
// ...
emit('dismiss')
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `TagImportHintDialog` の `dismiss` emit と親の `@dismiss` ハンドラは、`v-model` と composable 内の `showDialog` watch（閉じたときに sessionStorage 記録）と重複している。OK ボタンは `model = false` のみで十分。

**コメント要約**: dismiss イベントを削除し v-model のみで閉じる処理に統一する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `TagImportHintDialog` から emit を削除。各呼び出し元は `v-model` のみに簡略化。`useTagImportHint` の `dismiss` 返却も削除。

---

**識別子**: RC-20（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventMemberList.vue:29`

**該当コード**:

```typescript
const showTagImportHintEnabled = computed(() => isLoggedIn.value && props.isShowMember === true)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: ログイン済みかつ参加者名表示 ON だけで初回ヒントが出るため、他参加者にタグが1件も無い画面や `/members` の event 読み込み前でも説明ダイアログが表示されうる。取り込み操作が可能なとき（他参加者にタグあり・event ロード済み）に限定すべき。

**コメント要約**: `hasImportableMemberTags`（自分以外で tag 保有者がいる）と event ロード完了を `enabled` 条件に追加する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `EventMemberList` と `members.vue` に `hasImportableMemberTags` を追加し、取り込み可能なタグがある場合のみヒントを表示するよう変更。

---

## 評価セッション（2026-07-26 21:38・review-comments-evaluate auto）

- **評価日時**: 2026-07-26 21:38 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **REVIEW_REQUEST_SINCE**: 2026-07-26T12:25:15Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼定型文 5083456665、Copilot 問題なし 5083482038、Codex 接続案内 5083482425）
- **partial 評価**: はい（Codex substantive なし。Copilot は 🚨/🟡 指摘なし）
- **新規 RC**: なし
- **手順 4a 自動修正**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| — | — | — | — | — | — | — | — | — | 新規 RC なし |

---

## 評価セッション（2026-07-29 16:21・review-comments-evaluate）

- **評価日時**: 2026-07-29 16:21 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（3652478112: RC-18 と同一指摘のため RC 採番なし）
- **手順 4a 自動修正**: RC-23（🚨 1件）、RC-22（🟡 1件・Issue #2225 作成 + RC-3 更新）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-21 | 3652333341 | 🟡 修正提案 | 未着手 | 📤 スコープ外 | — | 🆕 新機能 | L | deploy_functions と deploy_user のデプロイ順序未保証<br>新 Callable 追加時の既知パターン。CI 横断改善は別 Issue 化推奨 |
| [x] | RC-22 | 3652333346 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📄 ドキュメントのみ | S | RC-3 が Issue 番号なし `📤 別PR` のまま<br>#2225 作成・RC-3 を 📤 #2225 別Issue化 に更新 |
| [x] | RC-23 | 3654654219 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | 退会時 `anonymizeUser` が user_tags を残す<br>空配列へ置換（13_アカウント削除と整合） |
| [x] | RC-24 | 3654654226 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | TagAddChip の @click.stop.prevent へ修正 |

---

**識別子**: RC-21（GitHub id: 3652333341）

**レビュワー**: Codex

**指摘箇所**: `.github/workflows/deploy_functions.yml:84`

**該当コード（レビュー時点の diff）**:

```diff
             pf)
-              echo "args=--force --only functions:...functions:getUserFriendMeetLog,functions:eventReceipt,..."
+              echo "args=--force --only functions:...functions:getUserFriendMeetLog,functions:updateUserTags,functions:addTagToMyProfile,functions:eventReceipt,..."
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Callable のデプロイ完了後にフロントを公開する**

確認した `deploy_functions.yml` と `deploy_user.yml` は同じ development／production への push で独立して起動し、相互の `needs` や完了待ちがありません。この変更ではフロントが新規 `updateUserTags`／`addTagToMyProfile` を直ちに呼ぶため、Hosting 側が先に公開された場合、Functions のデプロイが終わるまでタグの保存が `not-found` になります。Functions 完了後に Hosting をデプロイする順序をワークフローで保証するか、先に Callable だけを提供できるリリース手順にしてください。

**コメント要約**: deploy_functions と deploy_user が並列起動のため、Hosting が先に公開されると新 Callable が未デプロイで not-found になりうる。<br>デプロイ順序の保証またはリリース手順の明文化が必要。

**評価**: 🟡 修正提案

**ステータス**: 📤 #2226 別Issue化

**PRスコープ**: 📤 スコープ外

**ラベル**: —

**変更種別**: 🆕 新機能

**想定工数**: L

**判断理由**: CI 横断のデプロイ順序設計は本 PR スコープ外。#2226 を作成（milestone v2.12・shokujii-all-task Todo）。https://github.com/nijuniinc/bokudeli-event-new/issues/2226

---

**識別子**: RC-22（GitHub id: 3652333346）

**レビュワー**: Codex

**指摘箇所**: `documents/レビューコメント/review-feat-1594.md:46`

**該当コード（レビュー時点の diff）**:

```diff
+| [x] | RC-3 | 3643250463 | 🟡 修正提案 | 📤 別PR | 📤 スコープ外 | ...
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  RC-3 を実在する別 Issue に紐付ける**

RC-3 は Rules のセキュリティ指摘を本 PR から外しているのに、Issue 番号のない `📤 別PR` のまま `[x]` にしており、`feat/1594-event-tags` が作成・マージされなければ対応が追跡不能になります。別対応として完了扱いにする場合は Issue を作成し、ステータスを `📤 #NNNN 別Issue化`、要約を Issue URL または番号付きに更新してください。

**コメント要約**: RC-3 の別 PR 移管が Issue 未作成のまま完了扱いになっている。<br>AGENTS.md に従い Issue 作成とステータス更新が必要。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📄 ドキュメントのみ

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: AGENTS.md「別 Issue 化は Issue 作成まで完了」に合致。#2225 を作成し、冒頭通し表・RC-3 ブロックのステータスを `📤 #2225 別Issue化` に更新済み。

---

**識別子**: RC-23（GitHub id: 3654654219）

**レビュワー**: Codex

**指摘箇所**: `common/src/schemas/User.ts:104`

**該当コード（レビュー時点の diff）**:

```diff
   enterprise_id?: string
+  user_tags!: string[]
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  退会時にプロフィールタグも匿名化する**

ユーザーがタグを設定した後にアカウントを削除すると、`anonymizeUser()` は `existingUser` を展開したまま `user_tags` を上書きしないため、興味・関心タグだけが `users/{uid}` に残り続けます。このコレクションは公開 read であり、過去イベントの参加者表示も `user_tags` を直接描画するため、退会後もタグが第三者に公開されます。ほかのプロフィール項目と同様、匿名化時に空配列へ置換するかフィールドを削除してください。

**コメント要約**: `anonymizeUser` が spread で `user_tags` を残し、退会後も興味タグが公開される。<br>13_アカウント削除の他フィールド匿名化と同様に空配列へ置換する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘どおりプライバシー上の問題。`functions/default/src/stores/user.ts` の `anonymizeUser` に `user_tags: []` を追加済み（手順 4a 自動修正）。

---

**識別子**: RC-24（GitHub id: 3654654226）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/TagAddChip.vue:33`

**該当コード（レビュー時点の diff）**:

```diff
+      @click.stop="tagDialog = true"
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  追加チップで親カードのリンク遷移も止める**

`/members` の自分の参加者カードでは、このチップが `EventMemberCard` 全体の `<router-link>` 内に配置されています。ここで `.stop` すると、外側のタグ領域にある `@click.stop.prevent` までイベントが届かず、リンクのデフォルト動作もキャンセルされないため、ダイアログを開くクリックと同時に自分のプロフィールへ遷移してダイアログがアンマウントされます。このハンドラ自身で `.prevent` するか、操作領域をカードリンクの外へ移してください。

**コメント要約**: TagAddChip の `@click.stop` だけでは router-link の遷移を防げず、ダイアログと同時にプロフィールへ遷移する。<br>`@click.stop.prevent` への変更が最小修正。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `@click.stop.prevent="tagDialog = true"` に変更。router-link のデフォルト遷移をチップ自身でキャンセル。

---

## 評価セッション（2026-07-29 16:24・shokujii-code-review）

- **評価日時**: 2026-07-29 16:24 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3b 自動修正**: RC-25（🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-25 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 13_アカウント削除 §6.1.1 に user_tags 匿名化行が未記載 |

---

**識別子**: RC-25（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/03_参加者獲得/13_アカウント削除.md:113`

**該当コード**:

```diff
 | user_sns_* | 空文字 `""` に上書き |
+| user_tags | 空配列 `[]` に上書き（プロフィールタグの匿名化） |
 | user_account | 空文字 `""` に上書き |
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄 ドキュメントのみ/S]: `anonymizeUser` に `user_tags: []` を追加したが、13_アカウント削除 §6.1.1 の匿名化対象表に `user_tags` が未記載。他 PII フィールドと同様、退会時は空配列に上書きする旨を追記する。

**コメント要約**: アカウント削除仕様書の匿名化対象表に `user_tags` の行を追加し、実装と整合させる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: RC-23 対応（`user_tags: []`）と仕様書の差分。§6.1.1 に 1 行追記で一意。手順 3b で自動修正済み。

---

## 評価セッション（2026-07-30 00:06・残 RC 対応実装）

- **評価日時**: 2026-07-30 00:06 JST
- **評価者**: Cursor Agent（feat/1594 残 RC 対応計画）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **手順 4a 自動修正**: 該当なし（計画に沿った手動実装）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-11 | 3652326000 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | TagInput i18n 確認済み（コード変更なし） |
| [x] | RC-14 | 4781511966 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | user_tags のみ update（方針 A） |
| [x] | RC-18 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | userTags.test.ts 追加（7 ケース） |
| [x] | RC-21 | 3652333341 | 🟡 修正提案 | 📤 #2226 別Issue化 | 📤 スコープ外 | — | 🆕 新機能 | L | CI デプロイ順序 → #2226 |
| [x] | RC-24 | 3654654226 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | TagAddChip @click.stop.prevent |

---

## 評価セッション（2026-08-15 20:40・review-comments-evaluate auto）

- **評価日時**: 2026-08-15 20:40 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・partial: Codex connect のみ）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **REVIEW_REQUEST_SINCE**: 2026-08-15T11:24:58Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文 1、Codex connect 1）
- **partial 評価**: はい（Codex substantive なし。Copilot substantive 3 件）
- **手順 4a 自動修正**: RC-26〜28（🚨 3件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-26 | 5302033496 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | userTags Callable が getUserRef.update を直呼び<br>→ stores/user.setUserTags 経由 |
| [x] | RC-27 | 4943743482 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | normalizeTag が AI/DX 等を lowercase 化<br>→ trim + 全角半角のみ |
| [x] | RC-28 | 4943743482 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | TagInput マスタ選択判定が未正規化比較<br>→ normalizeTag で stored 突合 |

---

**識別子**: RC-26（GitHub id: 5302033496）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/userTags.ts:36,71`

**レビュワーのコメント（原文）**:

`getUserRef(uid).update({ user_tags: ... })` を Callable 本体から直接呼んでおり、「DB 操作は必ず store 経由」のルールから外れています。`stores/user.ts` に `setUserTags` を追加し、`userTags.ts` からはその関数のみを呼ぶ形にしてください。

**コメント要約**: user_tags 更新が store を経由していない。<br>`setUserTags` を stores/user に追加して Callable から呼ぶ。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-14 で update 方針は採用済みだが store 関数化が未完了。手順 4a で `setUserTags` 追加。

---

**識別子**: RC-27（GitHub id: 4943743482・suppressed 1）

**レビュワー**: Copilot

**指摘箇所**: `common/src/utils/normalizeTag.ts:39`

**レビュワーのコメント（原文）**:

[must] normalizeTag が ASCII 英字を強制 lowercase 化しているため、マスタタグ定数（例: common/src/constants/tags.ts の「AI」「DX」「CRM」等）を選んだ場合でも保存・表示が「ai」「dx」…になり、表示崩れやマスタタグ突合の不整合が起きます。少なくとも現状のマスタ定数の表記（大文字・混在）を前提にするなら、ここでは case を変えず「全角→半角」「trim」のみに留めてください。

**コメント要約**: マスタタグの大文字表記（AI/DX 等）が lowercase 化され UI と不整合。<br>case 変換をやめ trim + 全角半角のみに。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: マスタ定数 `AI`/`DX`/`CRM` との整合。手順 4a で lowercase 処理を削除。

---

**識別子**: RC-28（GitHub id: 4943743482・suppressed 2）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/TagInput.vue:82`

**レビュワーのコメント（原文）**:

[must] マスタタグ選択の判定が props.tags.includes(tag)（未正規化）になっていますが、tryAddTag() 側で normalizeTag() が走るため、英字タグ（例:「AI」→「ai」）だと「選択済みのはずなのにハイライトされない / クリックで解除できない」状態になります。マスタタグ側も normalizeTag(tag) で比較して、保存値と判定を揃えてください。

**コメント要約**: マスタタグの選択状態判定が未正規化の includes のまま。<br>normalizeTag で stored タグと突合する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-27 とセットで UI 不整合。`findStoredTag` / `isTagSelected` で正規化比較に統一。

---

## 評価セッション（2026-08-15 21:16・review-comments-evaluate auto）

- **評価日時**: 2026-08-15 21:16 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・partial: いいえ）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **REVIEW_REQUEST_SINCE**: 2026-08-15T12:05:46Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文 1、Copilot 指摘なしサマリ 1）
- **partial 評価**: いいえ（Codex connect 案内のみ。Copilot suppressed 2 件）
- **手順 4a 自動修正**: RC-29〜30（🚨 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-29 | 4943804721 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 04_プロフィールタグの lowercase 記載が実装と不一致<br>→ 大文字小文字維持に修正 |
| [x] | RC-30 | 4943804721 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | normalizeTag がコードユニット走査<br>→ for...of でコードポイント単位 |

---

**識別子**: RC-29（GitHub id: 4943804721・suppressed 1〜3）

**レビュワー**: Copilot

**指摘箇所**: `documents/03_参加者獲得/04_プロフィールタグ機能.md:266,273,280`

**コメント要約**: 仕様書に lowercase 正規化の記載が残っているが、実装は大文字小文字を維持する。<br>3 箇所を実装に合わせて修正。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: RC-27 対応後の仕様書ドrift。手順 4a で lowercase 記載を削除。

---

**識別子**: RC-30（GitHub id: 4943804721・suppressed 4）

**レビュワー**: Copilot

**指摘箇所**: `common/src/utils/normalizeTag.ts:37`

**コメント要約**: `s[i]` 走査だとサロゲートペアが分断される。<br>コードポイント単位（`for...of`）で走査する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 絵文字タグの正規化破損リスク。手順 4a で `for...of` に変更。

---

## 評価セッション（2026-08-18 16:23・review-comments-evaluate auto）

- **評価日時**: 2026-08-18 16:23 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・partial: いいえ）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **REVIEW_REQUEST_SINCE**: 2026-08-18T07:13:40Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（依頼定型文 1、Codex 接続案内 1、Copilot 指摘なしサマリ 1）
- **partial 評価**: いいえ
- **手順 4a 自動修正**: RC-31（🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-31 | 3801862833 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | タグ長を `string.length` ではなくコードポイント数で判定<br>→ `tagCodePointLength` を common に追加 |

---

**識別子**: RC-31（GitHub id: 3801862833）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/userTags.ts:27`

**該当コード（レビュー時点の diff）**:

```diff
+      if (t.length > MAX_TAG_LEN) {
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  タグ長をUnicode文字数で判定する**

フリータグに絵文字などBMP外の文字が含まれる場合、JavaScriptの `string.length` はUTF-16コードユニット数を返すため、たとえば11個の絵文字が22文字扱いとなり、仕様上の20文字以内でもCallableが拒否します。同じ判定が `addTagToMyProfile` と `TagInput.vue` にもあるため、コードポイント数またはユーザー知覚文字数で一貫して判定してください。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-30 で正規化はコードポイント単位にしたが、長さ判定が UTF-16 単位のまま。手順 4a で `tagCodePointLength` を common に追加し userTags / TagInput で使用。

---

## 評価セッション（2026-08-26 21:05・review-comments-evaluate auto）

- **評価日時**: 2026-08-26 21:05 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・partial: はい）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **REVIEW_REQUEST_SINCE**: 2026-08-26T11:56:30Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文 1、Codex no_issues 1）
- **partial 評価**: はい（Codex は no_issues のみ。Copilot のみ substantive）
- **新規 RC**: RC-32〜34（3件）
- **手順 4a 自動修正**: RC-33（🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-32 | 3862492175 | 👌 修正不要 | — | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | onCall 第2型引数 Promise（既存慣習） |
| [x] | RC-33 | 3862492226 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | setUserTags JSDoc 不一致 |
| [ ] | RC-34 | 3862492263 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | addTag Transaction 原子化 |

---

**識別子**: RC-32（GitHub id: 3862492175）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/userTags.ts:12`

**該当コード（レビュー時点の diff）**:

```diff
+export const updateUserTags = onCall<UpdateUserTagsRequest, Promise<{ success: boolean; message: string }>>(
```

**レビュワーのコメント（原文）**:

[must] onCall の型引数に Promise を入れてしまっており、Callable の戻り値型が二重 Promise のように解釈されます（クライアント側の型とズレて混乱しやすいです）。onCall の第2型引数は resolve 後の値型（{ success, message }）にしてください。

This issue also appears on line 42 of the same file.

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `functions/default` 全体で `onCall<Req, Promise<Res>>` が既存慣習（eventCopy / cancelOrders / enterprise 等）。本 PR だけ変更すると型スタイルが不整合になる。横断リファクタは別 Issue 化が妥当。

---

**識別子**: RC-33（GitHub id: 3862492226）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/stores/user.ts:273`

**該当コード（レビュー時点の diff）**:

```diff
+/**
+ * ユーザー個人情報を匿名化する。ドキュメントが存在しない場合も merge で作成する。
+ * トランザクション内で呼び出すこと。
+ */
+export const setUserTags = async (uid: string, tags: string[]): Promise<void> => {
```

**レビュワーのコメント（原文）**:

[must] JSDoc の内容が setUserTags にぶら下がってしまっていて、実際の処理（ユーザー個人情報の匿名化）とコメントが不一致です。setUserTags 用の説明に差し替え、anonymizeUserPersonalInformation 側に匿名化コメントを付け直してください。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 手順 4a で `setUserTags` に専用 JSDoc を付与し、`anonymizeUserPersonalInformation` 側に匿名化コメントを復元。

---

**識別子**: RC-34（GitHub id: 3862492263）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/userTags.ts:71`

**該当コード（レビュー時点の diff）**:

```diff
+    await setUserTags(uid, [...current, tag])
```

**レビュワーのコメント（原文）**:

[must] addTagToMyProfile が「getUser で読み取り → setUserTags で更新」の read-then-write になっているため、連続タップや複数端末で同時更新が走ると更新取りこぼし（最後に書いた配列で上書き）や上限チェックのすり抜けが起きえます。users/{uid} を Transaction で read→検証→update する形にして原子性を担保してください。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: `41d90af60` / マージ `4daaa7119` で `stores/user.ts` の `addUserTag` が Transaction 化され、`addTagToMyProfile` Callable から利用。read-then-write 指摘は解消。

---

## 評価セッション（2026-08-26 21:07・shokujii-code-review）

- **評価日時**: 2026-08-26 21:07 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **REVIEW_REQUEST_SINCE**: 2026-08-26T12:02:38Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0
- **partial 評価**: いいえ
- **新規 RC**: RC-35（1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-35 | なし・エージェントレビュー | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 💾 データ | 🔧 微修正 | M | `user_tags` の追加/削除が read-then-write のため同時更新で消える |

---

**識別子**: RC-35（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/userTags.ts:60`

**該当コード（レビュー時点の diff）**:

```diff
+    const existing = await getUser(uid, false)
+    if (existing == null) {
+      throw new HttpsError('not-found', 'ユーザーが見つかりません')
+    }
+    const current = normalizeTagList([...(existing.user_tags ?? [])])
+    if (current.includes(tag)) {
+      return { success: true, message: '既に設定済みです' }
+    }
+    if (current.length >= MAX_TAGS) {
+      throw new HttpsError('failed-precondition', `タグは最大${MAX_TAGS}個までです`)
+    }
+    await setUserTags(uid, [...current, tag])
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧 微修正/M]: `functions/default/src/userTags.ts:60-71`

`addTagToMyProfile` が `getUser()` で現在値を読んでから `setUserTags()` で配列全体を書き戻しており、同時実行時に last-write-wins でタグを失います。クライアント側の削除も `base/src/apis/userTags.ts` で stale な `currentUserTags` をそのまま `updateUserTags(current.filter(...))` に流しているため、別画面・別端末の直前更新を巻き戻せます。→ 追加・削除ともサーバー側で Transaction か原子的更新に寄せ、クライアントの stale 配列全置換をやめてください。

**評価**: 🚨 必須修正

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: `addTagToMyProfile` は `getUser()` → `setUserTags()` の read-then-write で実装されており、同じユーザーからタグ追加が並行すると最後に書いた配列だけが残る。さらに削除系もクライアントが保持している `currentUserTags` の全置換で送るため、別タブや別端末で直前に追加されたタグを古い配列で消し戻せる。

---

## 評価セッション（2026-08-26 22:17・review-comments-evaluate auto）

- **評価日時**: 2026-08-26 22:17 JST
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **REVIEW_REQUEST_SINCE**: 2026-08-26T13:10:06Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼定型文 1、Copilot overview 1）
- **partial 評価**: いいえ
- **新規 RC**: RC-36〜38（3件）
- **手順 4a 自動修正**: RC-36・RC-37（🚨 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-36 | 3863087690 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | `tags: ['']` が全消し成功<br>normalize 前に空白タグを invalid-argument |
| [x] | RC-37 | 3863087764 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | singleton なのに Dialog 多重マウント<br>TagImportHintHost を layout に集約 |
| [ ] | RC-38 | 3863090915 | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 💾 データ, 🔒 セキュリティ | 🔧 微修正 | M | 退会処理と並行でタグ再書き込み<br>is_deleted を Transaction で拒否 |

---

**識別子**: RC-36（GitHub id: 3863087690）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/userTags.ts:23`

**該当コード（レビュー時点の diff）**:

```diff
+    const normalized = normalizeTagList(raw)
+    if (normalized.length > MAX_TAGS) {
```

**レビュワーのコメント（原文）**:

[must] `updateUserTags` は `normalizeTagList` が空文字（空白のみ含む）を除去するため、`tags: ['']` のような入力がエラーにならず「タグ全消し」として成功してしまいます。`addTagToMyProfile` や Firestore Rules の方針（空文字は拒否）と不整合なので、空/空白のみタグが含まれる場合は `invalid-argument` で弾いた方が安全です。

**コメント要約**: `normalizeTagList` 前に空白のみタグを除去するため `tags: ['']` が意図せず全消しになる。Rules / addTag と整合させ invalid-argument で拒否すべき。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 空白のみ要素は normalize 前に `invalid-argument` で拒否するのが妥当。手順 4a で `normalizeTag(t).length === 0` チェックを追加。

---

**識別子**: RC-37（GitHub id: 3863087764）

**レビュワー**: Copilot

**指摘箇所**: `base/src/composable/useTagImportHint.ts:15`

**該当コード（レビュー時点の diff）**:

```diff
+const showDialog = ref(false)
+let pendingExecute: (() => Promise<void>) | null = null
+
+watch(showDialog, (visible, wasVisible) => {
```

**レビュワーのコメント（原文）**:

[must] `showDialog` / `pendingExecute` がモジュールスコープの singleton なのに、`TagImportHintDialog` が複数コンポーネント（例: UserBioPanel / EventMemberList / members ページ）で描画されているため、`showDialog.value = true` の瞬間に複数のダイアログが同時に開く可能性があります。ダイアログの描画場所を1箇所に集約（ページ or レイアウトに1つだけ置く）し、他の場所ではダイアログをマウントしない構成にしてください。

**コメント要約**: composable が singleton なのに Dialog を複数マウントしており同時表示の恐れ。layout 等 1 箇所に集約すべき。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `TagImportHintHost` を user / enterprise layout に 1 つだけ配置し、各コンポーネントから Dialog マウントを削除。

---

**識別子**: RC-38（GitHub id: 3863090915）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/userTags.ts:36`

**該当コード（レビュー時点の diff）**:

```diff
+    const existing = await getUser(uid, false)
+    if (existing == null) {
+      throw new HttpsError('not-found', 'ユーザーが見つかりません')
+    }
+    await setUserTags(uid, normalized)
```

**レビュワーのコメント（原文）**:

**P1** 退会済みユーザーへのタグ再書き込みを拒否する

複数タブなどでタグ保存が `deleteUserAccount` と並行すると、この存在確認後に削除側のトランザクションが `is_deleted: true` と `user_tags: []` を保存し、その後の `setUserTags` がタグを再び公開 `users/{uid}` ドキュメントへ書き戻せます。既存の匿名化対応後もプロフィールタグが残る競合であり、`addTagToMyProfile` にも同路経があるため、`is_deleted` の確認とタグ書き込みを削除処理と競合する同一トランザクション内で行い、退会済みなら拒否してください。

**コメント要約**: 退会トランザクションとタグ更新が競合し、匿名化後にタグが復活し得る。is_deleted 確認と書き込みを Transaction 化して拒否すべき（RC-35 と関連）。

**評価**: 🚨 必須修正

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ, 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 妥当な指摘。deleteUserAccount との競合は Transaction + is_deleted ガードが必要。RC-34/35 と合わせて Functions 側の原子化タスクとして未着手（セキュリティ影響範囲の確認が必要なため auto-fix 対象外）。

---

## 評価セッション（2026-08-27 11:40・review-comments-evaluate manual）

- **評価日時**: 2026-08-27 11:40 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼定型文 1、Codex 接続案内ボイラープレート 1）
- **手順 4a 自動修正**: RC-39（🚨 1件）
- **既存 RC ステータス更新**: RC-34 → ✅ 対応済み（`addUserTag` Transaction 化済み）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-34 | 3862492263 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | addTagToMyProfile → addUserTag Transaction 化済み |
| [x] | RC-39 | 3868288823 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 初回ヒント表示中の pendingExecute 上書き<br>showDialog 中は後続クリック無視 |
| [ ] | RC-40 | 5433627247 | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 💾 データ | 🔧 微修正 | M | toggleTag 削除が updateUserTags 全置換<br>removeTag Callable 等でサーバー側原子化が必要 |

---

**識別子**: RC-39（GitHub id: 3868288823）

**レビュワー**: Copilot

**指摘箇所**: `base/src/composable/useTagImportHint.ts:25`

**該当コード（レビュー時点の diff）**:

```diff
+  const interceptTagClick = async (execute: () => Promise<void>) => {
+    if (hasSeenTagImportHint()) {
+      await execute()
+      return
+    }
+    pendingExecute = execute
+    showDialog.value = true
+  }
```

**レビュワーのコメント（原文）**:

[must] 初回ヒント表示中にタグが複数回クリックされると、pendingExecute が後勝ちで上書きされて最初のクリックが失われます（interceptTagClick が showDialog の表示中かどうかを見ずに pendingExecute を再代入しているため）。ダイアログ表示中の後続クリックは無視する等、pendingExecute を上書きしないようにしてください。

**コメント要約**: 初回ヒントダイアログ表示中に別タグをクリックすると pendingExecute が上書きされ、最初の操作が失われる。<br>`showDialog` 表示中は後続クリックを無視する等で pendingExecute を保護すべき。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘は妥当。`showDialog.value === true` のときは `return` して pendingExecute を上書きしないよう手順 4a で修正済み。

---

**識別子**: RC-40（GitHub id: 5433627247）

**レビュワー**: Copilot

**指摘箇所**: `base/src/apis/userTags.ts:22-36`

**該当コード（レビュー時点の diff）**:

```diff
+export const toggleTagOnMyProfile = async (
+  tag: string,
+  currentUserTags: string[] | undefined,
+): Promise<'added' | 'removed'> => {
+  ...
+  if (current.includes(t)) {
+    await updateUserTags(current.filter((x) => x !== t))
+    return 'removed'
+  }
+  await addTagToMyProfile(t)
+  return 'added'
+}
```

**レビュワーのコメント（原文）**:

shokujii-code-review チェックリストで Files changed を確認し、以下 1 点は 🚨必須修正です。

🚨 **必須修正** [🔧微修正/S]: `base/src/apis/userTags.ts:22-36`
`toggleTagOnMyProfile` の削除分岐が `currentUserTags` を使ったクライアント側 read-then-write（`updateUserTags(current.filter(...))`）になっており、別端末・別画面の直前更新を上書きする race が残っています。追加だけでなく削除もサーバー側で原子的に処理する API（Transaction/arrayRemove 等）に寄せて、stale 配列の全置換を避けてください。

**コメント要約**: タグ削除時に Pinia の stale 配列で `updateUserTags` 全置換しており、他端末の更新を上書きし得る。<br>追加は `addTagToMyProfile`（Transaction）だが、削除もサーバー側原子 API（removeUserTag 等）が必要。RC-35 の削除経路に相当。

**評価**: 🚨 必須修正

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 指摘は妥当。`removeUserTag` Callable + store Transaction の新規追加が必要で設計判断を伴うため auto-fix 対象外。RC-35・RC-38 と合わせて Functions 側タスクとして未着手。

---

## 評価セッション（2026-08-27 11:45・review-comments-evaluate auto）

- **評価日時**: 2026-08-27 11:45 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: feat/1594
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/1947
- **REVIEW_REQUEST_SINCE**: 2026-08-27T02:31:48Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼定型文 1、Codex 接続案内 1）
- **partial 評価**: はい（Codex substantive 1 件 + Copilot 1 件。RC-39/40 は manual セッションで記録済みのため重複採番なし）
- **手順 4a 自動修正**: なし
- **新規 RC**: RC-41（1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-41 | 3868301684 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | タグ更新で未保存の名前・自己紹介が watch で消える<br>user_tags のみ同期するか一括保存に統合 |

---

**識別子**: RC-41（GitHub id: 3868301684）

**レビュワー**: Codex

**指摘箇所**: `user/src/pages/profile.vue:367`

**該当コード（レビュー時点の diff）**:

```diff
+              <UserProfileTagsEditSection />
```

**レビュワーのコメント（原文）**:

**P2** タグ更新で編集中のプロフィールを破棄しない

名前や自己紹介を編集してからこのセクションでタグを追加・削除すると、Callable による `users/{uid}` 更新を受けた snapshot により、26〜34行目の `watch(user, ...)` が `currentUser` 全体を保存済みデータから作り直すため、まだ送信していない入力内容が失われます。`enterprise/src/pages/profile.vue` でも同じ構成です。タグ更新時はフォームの未保存フィールドを維持して `user_tags` だけを同期するか、タグもフォームのドラフトに含めて一括保存してください。

**コメント要約**: プロフィール編集フォーム入力中にタグを追加/削除すると Firestore snapshot で `watch(user)` が `currentUser` を丸ごと上書きし、未保存の名前・自己紹介等が消える。<br>タグだけ同期するか、タグもフォームドラフトに含めて一括保存する設計が必要（user / enterprise 共通）。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 指摘は妥当。`watch(user)` が User 全体を再構築する既存パターンとタグの即時 Callable 更新が衝突。UX ラベル・M 工数のため auto-fix 対象外。

---
