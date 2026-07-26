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
| [ ] | RC-1 | 3643250457 | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | M | member_tags の read がログインのみで緩すぎ<br>親イベント公開・is_show_member と整合させる |
| [x] | RC-2 | 3643250460 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | isShowMember=false 時に個別タグを描画<br>非公開時は集計タグのみ表示に修正 |
| [x] | RC-3 | 3643250463 | 🟡 修正提案 | 📤 別PR | 📤 スコープ外 | 🔒 セキュリティ | 🔧 微修正 | M | event_setting_tags Rules マスタ検証<br>イベントタグ PR（feat/1594-event-tags）へ移管 |

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

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 子コレクションは親 read を継承しないため、現状は任意イベントの参加者別タグが漏洩しうる。04 §4.2.3 では `is_show_member === false` 時は集計のみ表示可と明記。Rules 側でも event read + `is_show_member`（または manager/support/本人）に整合させる必要がある。firestore-rules テスト追加も要。

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

**判断理由**: 04 §4.2.3「`is_show_member === false` の場合…イベント詳細の参加者タグ**集計**（タグ名＋人数のみ）は別途表示可」と整合。`EventParticipantTags` は維持し、プレビュー内の個別タグのみ非表示にする。

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
