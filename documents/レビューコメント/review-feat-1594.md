# ブランチ feat/1594 レビュー記録

## 評価セッション（2026-07-24 15:06・review-comments-evaluate auto）

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

**ステータス**: 📤 別PR（`feat/1594-event-tags` へ移管。本 PR からイベントタグ実装を omit）

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
