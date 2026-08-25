# ブランチ ui/2289 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Copilot PR 概要<br>インライン 3 件・Codex 5 件を RC-2〜9 に分離 |
| [x] | RC-2 | 3829028085 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Rules: enterprise 判定と null 許可の問題 |
| [x] | RC-3 | 3829028133 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | EventDetailsCard 表示判定を event_num_members に |
| [x] | RC-4 | 3829028180 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | members.vue 判定を event_num_members に |
| [x] | RC-5 | 3829031008 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | partner update 経路にも Rules 検証を追加 |
| [x] | RC-6 | 3829031012 | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | しきい値未達でもグループチャットボタンは表示 |
| [x] | RC-7 | 3829031017 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | partner 新規作成経路のデフォルトしきい値 3 |
| [x] | RC-8 | 3829031022 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | 明示 null 非許可（RC-2 と一体で対応） |
| [x] | RC-9 | 3829031026 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 404 遷移を router.replace に変更 |
| [x] | RC-10 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | eventCopy で members_visible_min_count がコピーされない |
| [x] | RC-11 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ, 🐛 実害 | 🔧 微修正 | S | partner 作成 UI が enterprise でも PF 設定を表示 |
| [x] | RC-12 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | partner update がしきい値の変更・削除を許可 |
| [x] | RC-13 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📋 仕様追加 | S | しきい値 > 定員のバリデーション欠如 |
| [x] | RC-14 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | 注文完了ダイアログのチャットが閾値ゲート外 |
| [x] | RC-15 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | コミュニティ・プロフィールの EventCard でアバター露出 |
| [x] | RC-16 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | 人気イベントメールに参加者数が載る |
| [ ] | RC-17 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | 閾値未達時の説明 UI が主催者・参加者に無い |
| [x] | RC-18 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | /members 直アクセスが無言 404 |
| [x] | RC-19 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 参加者表示設定が props.readonly を無視 |
| [x] | RC-20 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | デフォルトしきい値 3 が 2 箇所に重複 |
| [x] | RC-21 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | キャンセルで閾値割れすると導線が消える |
| [x] | RC-22 | なし | 👌 修正不要 | — | 📌 スコープ内 | — | 👀 確認のみ | — | Firestore read は UI 非表示のみ（Issue スコープ） |
| [x] | RC-23 | 3843213997 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 参加者 0 人時にセクションが表示される回帰 |
| [x] | RC-24 | 3843241138 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Rules でしきい値を定員以下に制約 |
| [x] | RC-25 | 3843241148 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | partner 既存イベント編集で参加者表示設定が編集可能 |
| [ ] | RC-26 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | S | セクション表示判定と表示件数のデータソースが不一致 |
| [x] | RC-27 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | EventEdit で支払い UI 戦略を二重取得 |
| [x] | RC-28 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | common 定数をローカル別名で中継 |
| [x] | RC-29 | なし | 👌 修正不要 | — | 📌 スコープ内 | 📏 規約 | 👀 確認のみ | — | validator と step4 検証で定員ガード条件が非対称 |
| [x] | RC-30 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | is_show_member false 時に /404 が replace で打ち消される |
| [x] | RC-31 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 関数名の Pf 接頭辞が実際の判定範囲と不一致 |
| [x] | RC-32 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | eventCopy で enterprise 判定を独自実装 |
| [x] | RC-33 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | partner 作成画面の computed にリアクティブ依存が無い |
| [x] | RC-34 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Rules テストに enterprise 拒否・不正値ケースが無い |

---

## 評価セッション（2026-08-21 18:24 JST・review-comments-evaluate auto）

- **評価日時**: 2026-08-21 18:24 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・pr review wake）
- **ブランチ名**: ui/2289
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2291
- **REVIEW_REQUEST_SINCE**: 2026-08-21T09:14:03Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼 id:5367940856、Codex 接続案内 id:5368018059）
- **手順 4a 自動修正**: RC-2, RC-3, RC-4, RC-5, RC-8, RC-9（🚨 3件 / 🟡 3件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Copilot PR 概要 |
| [x] | RC-2 | 3829028085 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Rules 改修 |
| [x] | RC-3 | 3829028133 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | event_num_members 判定 |
| [x] | RC-4 | 3829028180 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | members.vue 判定 |
| [x] | RC-5 | 3829031008 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | partner update Rules |
| [x] | RC-6 | 3829031012 | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | チャットボタンをゲート外へ |
| [x] | RC-7 | 3829031017 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | partner 作成デフォルト 3 |
| [x] | RC-8 | 3829031022 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | 明示 null 非許可 |
| [x] | RC-9 | 3829031026 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | replace で 404 |

---

## 評価セッション（2026-08-21 18:45 JST・shokujii-code-review）

- **評価日時**: 2026-08-21 18:45 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: ui/2289
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2291
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **背景**: 「閾値未達時にユーザーを表示しない」機能の仕様バグ・UI 取りこぼし洗い出し（ユーザー依頼）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-10 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | eventCopy で members_visible_min_count がコピーされない |
| [x] | RC-11 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ, 🐛 実害 | 🔧 微修正 | S | partner 作成 UI が enterprise でも PF 設定を表示 |
| [x] | RC-12 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | partner update がしきい値の変更・削除を許可 |
| [x] | RC-13 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📋 仕様追加 | S | しきい値 > 定員のバリデーション欠如 |
| [x] | RC-14 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | 注文完了ダイアログのチャットが閾値ゲート外 |
| [x] | RC-15 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | コミュニティ・プロフィールの EventCard でアバター露出 |
| [x] | RC-16 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | 人気イベントメールに参加者数が載る |
| [ ] | RC-17 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | 閾値未達時の説明 UI が主催者・参加者に無い |
| [x] | RC-18 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | /members 直アクセスが無言 404 |
| [x] | RC-19 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 参加者表示設定が props.readonly を無視 |
| [x] | RC-20 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | デフォルトしきい値 3 が 2 箇所に重複 |
| [x] | RC-21 | なし | 👌 修正不要 | — | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | キャンセルで閾値割れすると導線が消える |
| [x] | RC-22 | なし | 👌 修正不要 | — | 📌 スコープ内 | — | 👀 確認のみ | — | Firestore read は UI 非表示のみ（Issue スコープ） |

---

**識別子**: RC-1（GitHub id: なし・Copilot review body）

**レビュワー**: Copilot

**指摘箇所**: PR 全体

**評価**: 👌 修正不要

**判断理由**: 概要のみ。具体指摘は RC-2〜9。

---

**識別子**: RC-2（GitHub id: 3829028085）

**レビュワー**: Copilot

**指摘箇所**: `firestore.rules:14-24`

**評価**: 🚨 必須修正 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内

**判断理由**: `if` 構文は Rules 非対応（デプロイ失敗原因）。update 時 enterprise 判定を resource 側も含め、`in` 演算子で明示 null とフィールド削除を区別する式に書き換え。

---

**識別子**: RC-6（GitHub id: 3829031012）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/EventDetailsCard.vue:332`

**評価**: 👌 修正不要 | **ステータス**: — | **PRスコープ**: 📌 スコープ内

**判断理由**: ユーザー確定仕様: イベント詳細は閾値未達で参加者セクション（チャット含む）を非表示のまま。注文完了ダイアログから閾値なしでチャットを開けるのは意図どおり。RC-14・RC-21 と一体で対応不要と確定。

---

**識別子**: RC-7（GitHub id: 3829031017）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/EventEdit.vue:167`

**評価**: 🟡 修正提案 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内

**判断理由**: `partner/src/pages/events/create.vue` の PF 新規作成時に `DEFAULT_PF_MEMBERS_VISIBLE_MIN_COUNT` を初期値として設定。RC-20 の common 定数と整合。

---

**識別子**: RC-10（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventCopy.ts:62-91`

**該当コード（レビュー時点）**:

```typescript
  const newEvent = new ShokujiiEvent(null, {
    community_id: srcEvent.community_id,
    ...
    event_max_people: srcEvent.event_max_people,
    // members_visible_min_count が列挙に無い
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `copyEventCore` はコピー対象フィールドを明示列挙しているが、`members_visible_min_count` が含まれていない。コピー元が「3人に達したら表示」でもコピー先は常時表示（フィールド未設定）に戻る。`eventCopyRepeat` も同経路のため繰り返し作成でも同様。→ PF イベント（`enterprise_id == null`）のとき `members_visible_min_count: srcEvent.members_visible_min_count` を追加する。

**コメント要約**: イベントコピーで参加者表示しきい値が失われる。<br>`eventCopy.ts` の明示列挙に `members_visible_min_count` を追加する。

**評価**: 🚨 必須修正 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内

**判断理由**: PF イベント（`enterprise_id == null`）かつコピー元にしきい値がある場合、`copyEventCore` の明示列挙に `members_visible_min_count` を spread 追加。

---

**識別子**: RC-11（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `partner/src/pages/events/create.vue:200-207`

**該当コード（レビュー時点）**:

```vue
        <EventDetailCard
          v-model="event"
          v-model:coverImage="coverImage"
          :readonlyDeadline="event.event_status.value !== 'in_draft'"
          :subdomainTags="community.subdomain_tags"
          :show-album-preview="false"
          :is-new="route.query.id == null"
        />
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: partner 作成画面は `EventDetailCard` に `paymentUiStrategy` を渡しておらず、既定の PF 戦略により `showPfMembersVisibleSettings` が常に true になる。enterprise イベントでも「参加者表示」設定 UI が出る。店舗が保存すると `members_visible_min_count` が書き込まれ、Rules の `enterpriseOnWrite` で update が permission-denied になりうる。→ enterprise コミュニティ経路では `EventDetailCard` を出さない、または `paymentUiStrategy` を community の `enterprise_id` から注入する（RC-7 の partner デフォルト 3 も同画面で未適用）。

**コメント要約**: partner 経路で enterprise イベントに PF 専用 UI が表示される。<br>`paymentUiStrategy` 注入または UI 非表示で Rules 拒否を防ぐ。

**評価**: 🚨 必須修正 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内

**判断理由**: `partner/src/pages/events/create.vue` で `community.enterprise_id` から `paymentUiStrategy` を computed 注入し `EventDetailCard` に渡す。enterprise コミュニティでは PF 参加者表示 UI を非表示。

---

**識別子**: RC-12（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.rules:14-25`, `firestore.rules:235-236`

**該当コード（レビュー時点）**:

```
return unchanged || (!enterpriseOnWrite && validPfValue);
...
allow update: if request.auth != null && resource.data.partner_id == request.auth.uid
                && eventMembersVisibleMinCountValid()
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: RC-5 で partner update に `eventMembersVisibleMinCountValid()` を追加したが、`unchanged || validPfValue` のため partner（店舗）が PF イベントの `members_visible_min_count` を**変更・削除（常時表示化）**できる。主催者設定項目であり partner 経路は `unchanged` のみ許可すべき。→ partner update 用に `eventMembersVisibleMinCountUnchangedForPartner()` を分離するか、partner 経路では `unchanged` のみ true にする。

**コメント要約**: partner が主催者の参加者表示しきい値を改変できる。<br>partner update ではフィールド unchanged のみ許可する。

**評価**: 🚨 必須修正 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内

**判断理由**: `eventMembersVisibleMinCountUnchangedForPartner()` を新設し partner update では `unchanged` のみ許可。manager/support 経路は従来の `eventMembersVisibleMinCountValid()` を維持。

---

**識別子**: RC-13（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/eventcreate/EventDetailCard.vue:538-549`, `base/src/utils/eventEditValidationMessages.ts:110-116`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/S]: `members_visible_min_count` は「1 以上の整数」のみ検証し、`event_max_people` との関係は見ていない。定員 4・閾値 10 等で参加者セクションが**永久に非表示**になるイベントを保存できる。定員を後から減らした場合も同様。→ `members_visible_min_count <= event_max_people` を EventDetailCard の rules と `collectEventDetailValidationMessages` に追加。

**コメント要約**: しきい値が定員を超える設定を許容している。<br>定員との大小バリデーションを追加する。

**評価**: 🟡 修正提案 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内

**判断理由**: `EventDetailCard` の `membersVisibleThresholdValidator` と `collectEventDetailValidationMessages` に `members_visible_min_count <= event_max_people` を追加。

---

**識別子**: RC-14（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/UserSuccessJoinEventDialog.vue:60-64`, `base/src/components/UserSuccessJoinEventDialog.vue:259`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/M]: 注文完了ダイアログの `canOpenChat` は `event.members.includes(userId)` のみ。`EventDetailsCard` は `shouldShowParticipantsSection` でチャットボタンごと非表示にするため、詳細ページと注文直後ダイアログで導線が不一致。→ Issue 確定仕様（未達時チャット非表示）に合わせるならダイアログ側も `shouldShowPfEventParticipantsSection` でゲート。参加済みユーザー向けに残すなら RC-6 と一体で仕様更新。

**コメント要約**: 注文完了ダイアログのチャットが閾値判定外。<br>EventDetailsCard と同じゲートを適用するか RC-6 で仕様確定。

**評価**: 👌 修正不要 | **ステータス**: — | **PRスコープ**: 📌 スコープ内

**判断理由**: ユーザー確定仕様: 注文完了ダイアログの `canOpenChat` は参加済み（`members.includes`）のみでよく、閾値ゲートは不要。詳細ページとの導線差は意図的。

---

**識別子**: RC-15（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/pages/c/[communityAccount]/index.vue:165-168`, `base/src/components/ProfileEventCard.vue:14`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/M]: #2287 で PF トップは `showMemberAvatars=false` にしたが、コミュニティページとユーザープロフィールの `EventCard` は `:members` を渡し `showMemberAvatars` 既定 true のまま。閾値未達でも参加者アバターが並ぶ。#2289 の非表示ポリシーが一覧系で抜ける。→ `shouldShowPfEventParticipantsSection` が false のとき `showMemberAvatars=false` または members 未渡しにする（`is_show_member` 非考慮の既存穴も含む）。

**コメント要約**: コミュニティ・プロフィールの EventCard で参加者アバターが露出する。<br>閾値未達時はトップ同様アバター非表示に揃える。

**評価**: 👌 修正不要 | **ステータス**: — | **PRスコープ**: 📌 スコープ内

**判断理由**: ユーザー確定仕様: コミュニティ・プロフィールの EventCard で閾値未達でもアバター表示する現状を維持。詳細ページ非表示との差は許容。

---

**識別子**: RC-16（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/popularEventMail.ts:93`, `functions/default/src/popularEventMail.ts:168-204`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/M]: 人気イベントメールは `event_num_members_label`（`3 / 20` 形式）を常にテンプレートへ渡す。閾値未達の PF イベントでもメール本文に参加者数が載り、詳細ページでは非表示という矛盾が起きる。→ `shouldShowPfEventParticipantsSection` 相当でラベルを空／非表示にするか、別 Issue でメール仕様を明文化。

**コメント要約**: 人気イベントメールが閾値未達でも参加者数を表示する。<br>表示ゲートをメール組み立てにも適用する。

**評価**: 👌 修正不要 | **ステータス**: — | **PRスコープ**: 📌 スコープ内

**判断理由**: ユーザー確定仕様: 人気イベントメールの参加者数ラベルは現状どおり表示。詳細ページの非表示ポリシーとメールチャネルは切り離す。

---

**識別子**: RC-17（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventDetailsCard.vue:332`, `base/src/locales/messages/ja.ts`（`event_detail.members_visible_threshold_hint`）

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/M]: 閾値未達時、イベント詳細は参加者セクション全体を無言で非表示にする。主催者向けに「あと○人で表示（設定: ○人）」の manage 注記がなく、参加者にも「注文したが誰もいないように見える」体験になる。`is_show_member=false` には `participants_profile_hidden` 注記があるのに非対称。→ 主催者向け manage overview 注記、未達時の参加者向け控えめメッセージ、設定 UI への現在人数表示を検討。

**コメント要約**: 閾値未達の理由を主催者・参加者に伝える UI が無い。<br>manage 注記・参加者向け文言・hint 拡充を検討。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: Issue 確定仕様どおり非表示は正しいが、説明不足はサポート問い合わせ・離脱要因になりうる。

---

**識別子**: RC-18（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/pages/c/[communityAccount]/e/[eventId]/members.vue:53-60`

**該当コード（レビュー時点）**:

```typescript
watch(
  shouldShowParticipantsPage,
  (visible) => {
    if (visible === false) {
      router.replace('/404')
    }
  },
  { immediate: true },
)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 閾値未達で `/members` 直アクセス時は `router.replace('/404')` のみ。共有 URL やブックマーク利用者に理由が伝わらない。→ イベントページへ replace + トースト（「参加者一覧は設定人数に達するまで表示されません」等）を検討。RC-9 の replace 化は履歴対策として妥当だが、説明は別途必要。

**コメント要約**: /members 未達時が無言 404。<br>イベントページへ誘導し理由を表示する。

**評価**: 🟡 修正提案 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内

**判断理由**: 閾値未達時は `/404` ではなくイベントページへ `router.replace` し、`members_page_hidden_until_threshold` トーストを表示。

---

**識別子**: RC-19（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/eventcreate/EventDetailCard.vue:528-549`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 参加者表示設定（radio / 数値入力）に `:readonly="props.readonly"` が付いていない。partner 作成画面等 `readonly=true` 時、他項目は読み取り専用なのに本設定だけ編集可能に見える。→ 他フィールドと同様 `props.readonly` をバインド。

**コメント要約**: 参加者表示設定が readonly モードを無視する。<br>v-radio-group / v-text-field に readonly を付与。

**評価**: 🟡 修正提案 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内

**判断理由**: 参加者表示の v-radio-group / v-text-field に `:readonly="props.readonly"` を付与。

---

**識別子**: RC-20（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventEdit.vue:165-167`, `base/src/components/eventcreate/EventDetailCard.vue:65-66`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: デフォルトしきい値 `3` が `EventEdit.vue`（新規 BokudeliEvent 初期化）と `EventDetailCard.vue`（`DEFAULT_MEMBERS_VISIBLE_MIN_COUNT`）に重複。片方だけ変更すると UI 表示と保存値がずれる。→ `common` 定数（例: `DEFAULT_PF_MEMBERS_VISIBLE_MIN_COUNT`）に集約。

**コメント要約**: デフォルト 3 が二重定義。<br>common 定数に一本化する。

**評価**: 🟡 修正提案 | **ステータス**: ✅ 対応済み | **PRスコープ**: 📌 スコープ内

**判断理由**: `common/src/utils/eventParticipantsVisibility.ts` に `DEFAULT_PF_MEMBERS_VISIBLE_MIN_COUNT` を定義し EventEdit / EventDetailCard / partner 作成で参照。

---

**識別子**: RC-21（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventDetailsCard.vue:145-147`, `common/src/utils/eventParticipantsVisibility.ts:10-22`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/M]: 表示判定はリアルタイムの `memberCount >= threshold`。キャンセル等で人数が閾値を下回ると、一度表示された参加者セクション・チャットボタン・`/members` が再び消える。閲覧中ユーザーは 404 へ replace される。Issue 確定仕様どおりだが、参加済みユーザー・主催者への影響が大きい。→ RC-6 と合わせ「一度表示したら維持」「参加済みのみチャット残す」等の仕様判断を推奨。

**コメント要約**: キャンセルで閾値割れすると導線が巻き戻る。<br>表示一度きり／チャット例外等の仕様再検討（RC-6 関連）。

**評価**: 👌 修正不要 | **ステータス**: — | **PRスコープ**: 📌 スコープ内

**判断理由**: ユーザー確定仕様: `memberCount >= threshold` のリアルタイム判定どおり、キャンセル等で閾値を下回れば参加者セクションは再び非表示。巻き戻しは意図どおり（RC-6・RC-14 と整合）。

---

**識別子**: RC-22（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.rules`（events / members read）, Issue #2289 確定仕様

**レビュワーのコメント（原文）**:

👌 **修正不要**: PF イベントの `event.members` と members サブコレクションは Rules 上引き続き read 可能。本 Issue の非表示は UI レイヤーのみ。離脱抑制目的では許容。プライバシー保護として説明する場合は別 Issue（Rules 側ゲート）が必要。

**コメント要約**: Firestore 上の参加者データは依然公開。<br>Issue スコープ（UI 非表示）としては修正不要。将来のプライバシー要件は別途。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: Issue #2289 のスコープはイベント詳細 UI。SDK 直 read 制限は要件に含まれていない。

---

## 評価セッション（2026-08-25 16:33 JST・review-comments-evaluate manual）

- **評価日時**: 2026-08-25 16:33 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: ui/2289
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2291
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 7（レビュー依頼定型 3 件、Copilot 新規指摘なしサマリ 2 件、Codex 接続案内 1 件、Codex 問題なし 1 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-23 | 3843213997 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 参加者 0 人時にセクションが表示される回帰<br>`eventParticipantsVisibility` で 0 人非表示を復元済み |
| [x] | RC-24 | 3843241138 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Rules でしきい値を定員以下に制約<br>UI 迂回の永久非表示を防止 |
| [x] | RC-25 | 3843241148 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | partner 既存イベント編集で参加者表示設定が編集可能<br>`readonly` を EventDetailCard に渡して解消 |

**識別子**: RC-23（GitHub id: 3843213997）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/EventDetailsCard.vue:160`

**該当コード（レビュー時点の diff）**:

```diff
@@ -143,10 +144,12 @@ const isShowMember = computed(() =>
   props.community.is_show_member !== undefined ? props.community.is_show_member : true,
 )
 
+const shouldShowParticipantsSection = computed(() =>
+  shouldShowPfEventParticipantsSection(props.event, props.event.members.length),
+)
```

**レビュワーのコメント（原文）**:

[must] 参加者セクションの表示条件が `hasParticipants`（参加者が0人のとき非表示）から `shouldShowPfEventParticipantsSection(...)` のみに置き換わっており、enterprise イベント（本機能の対象外）や PF でしきい値未設定のイベントでも参加者0人時にセクションが表示される挙動に変わっています。従来挙動（0人ならセクション非表示）を維持しつつ、PF のしきい値ゲートだけ追加するなら `members.length > 0` を AND してください。

**コメント要約**: 0 人時非表示が失われ参加者セクションが空表示になる回帰。<br>`shouldShowPfEventParticipantsSection` 内で `memberCount <= 0` を false にする対応で解消。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: コミット `1e020c6db` で `common/src/utils/eventParticipantsVisibility.ts` に `memberCount <= 0` ガードを追加済み。評価時点で既に解消。

---

**識別子**: RC-24（GitHub id: 3843241138）

**レビュワー**: Codex

**指摘箇所**: `firestore.rules:23`

**該当コード（レビュー時点の diff）**:

```diff
…（diff 先頭省略）
+        function eventMembersVisibleMinCountValid() {
+            let newHas = 'members_visible_min_count' in request.resource.data;
+            …
+            let validPfValue = !newHas || (newVal is int && newVal >= 1);
+            return unchanged || (!enterpriseOnWrite && validPfValue);
+        }
```

**レビュワーのコメント（原文）**:

**P1** Rulesでもしきい値を定員以下に制約する

`validPfValue` は正の整数であることしか検証しないため、管理者またはサポートが旧クライアント・REST SDK等から `members_visible_min_count > event_max_people` のイベントを作成した場合や、しきい値を残したまま定員だけを下げた場合も書き込みが許可されます。UI側の検証を迂回すると、満員になっても参加者セクションが永久に表示されないイベントになるため、Rulesでも `request.resource.data.event_max_people` 以下であることを検証してください。

**コメント要約**: Rules がしきい値と定員の関係を検証していない。<br>REST 等で閾値 > 定員のイベントが保存され永久非表示になり得る。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `eventMembersVisibleMinCountValid` に `newVal <= event_max_people` 条件を追加。`tests/firestore-rules` に manager 経路のテストを追加。

---

**識別子**: RC-25（GitHub id: 3843241148）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/eventcreate/EventDetailCard.vue`（Outdated 表示あり・指摘内容は有効）

**該当コード（レビュー時点の diff）**:

```diff
+    <template v-if="showPfMembersVisibleSettings">
+      …
+        <v-radio-group v-model="membersVisibleMode" … :readonly="props.readonly">
```

**レビュワーのコメント（原文）**:

**P2** Partner更新時は参加者表示設定を編集不可にする

最終差分では店舗向けの Rules が `eventMembersVisibleMinCountUnchangedForPartner()` によりこの値の変更を禁止していますが、`partner/src/pages/events/create.vue` は既存PFイベントの編集時にもこのカードへPF戦略を渡し、フィールド固有の readonly 制御を渡していません。そのためコミュニティ管理者権限を持たない店舗ユーザーにも有効なラジオと数値入力が表示され、変更して更新するとイベント全体の `setDoc` が `permission-denied` になります。Partnerの既存イベント編集ではこの設定だけを無効化するなど、RulesとUIの編集可否を一致させてください。

**コメント要約**: partner 既存イベント編集で参加者表示設定が編集可能に見える。<br>Rules では partner 変更不可のため permission-denied になる UX 不整合。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `partner/src/pages/events/create.vue` の `EventDetailCard` に `:readonly="event.event_status.value !== 'in_draft'"` を追加し、下書き以外は編集不可に統一。

---

## 評価セッション（2026-08-25 16:50 JST・shokujii-code-review）

- **評価日時**: 2026-08-25 16:50 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: ui/2289
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2291
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **背景**: RC-1〜25 対応後の差分（`origin/development...HEAD`）に対するセルフレビュー
- **手順 3a/3b 自動修正**: RC-27, RC-28, RC-30, RC-31, RC-32, RC-33, RC-34（🚨 0 件 / 🟡 7 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-26 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | S | セクション表示判定と表示件数のデータソースが不一致 |
| [x] | RC-27 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | EventEdit で支払い UI 戦略を二重取得 |
| [x] | RC-28 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | common 定数をローカル別名で中継 |
| [x] | RC-29 | なし | 👌 修正不要 | — | 📌 スコープ内 | 📏 規約 | 👀 確認のみ | — | validator と step4 検証で定員ガード条件が非対称 |
| [x] | RC-30 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | is_show_member false 時に /404 が replace で打ち消される |
| [x] | RC-31 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 関数名の Pf 接頭辞が実際の判定範囲と不一致 |
| [x] | RC-32 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | eventCopy で enterprise 判定を独自実装 |
| [x] | RC-33 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | partner 作成画面の computed にリアクティブ依存が無い |
| [x] | RC-34 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Rules テストに enterprise 拒否・不正値ケースが無い |

---

**識別子**: RC-26（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventDetailsCard.vue:158`

**該当コード（レビュー時点）**:

```typescript
const shouldShowParticipantsSection = computed(() =>
  shouldShowEventParticipantsSection(props.event, props.event.members.length),
)
// 表示側は members（members サブコレクション）を使う
// {{ members.length }} / {{ event.event_max_people }}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/S]: セクションの表示判定はイベントドキュメントの `event.members`（配列）だが、セクション内の件数表示と一覧は `eventStore.members`（members サブコレクション）を使う。サブコレクションの購読が完了する前に判定が true になるため、`0 / 25` の空セクションが一瞬描画される（旧 `hasParticipants` はサブコレクション基準だったため発生しなかった）。→ 判定に `members.length > 0` を AND する、または件数表示を `event.members.length` 側に揃える。どちらを正本にするかは RC-3 / RC-23 の判断（doc 側 `members` を正本にする）と併せて仕様確認が必要。

**コメント要約**: 表示ゲートと件数表示のデータソースが別で、読み込み中に空セクションが出る。<br>どちらを正本にするかは仕様確認が必要。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: S

**判断理由**: 修正方針が一意でなく（doc 側 / サブコレクション側のどちらを正本にするかで挙動が変わる）、RC-3 / RC-23 の判断と整合を取る仕様確認が必要なため自動修正の対象外とした。

---

**識別子**: RC-27（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventEdit.vue:156`, `base/src/components/EventEdit.vue:170`

**該当コード（レビュー時点）**:

```typescript
const draftPayment = eventPaymentUiStrategyFromEnterpriseId(community.enterprise_id).defaultPaymentWhenDraft
...
  ...(!eventPaymentUiStrategyFromEnterpriseId(community.enterprise_id).isEnterpriseMode
    ? { members_visible_min_count: DEFAULT_PF_MEMBERS_VISIBLE_MIN_COUNT }
    : {}),
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 同一 watch 内で `eventPaymentUiStrategyFromEnterpriseId(community.enterprise_id)` を 2 回呼んでおり、片方だけ引数を変えると支払い既定値と参加者表示既定値の判定がずれる。→ ローカル定数に集約して両方から参照する。

**コメント要約**: 支払い UI 戦略の二重取得。<br>ローカル定数に集約する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `draftStrategy` に集約し、`defaultPaymentWhenDraft` と `isEnterpriseMode` の両方をここから参照するよう変更。

---

**識別子**: RC-28（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/eventcreate/EventDetailCard.vue:75`

**該当コード（レビュー時点）**:

```typescript
/** PF 新規イベント設定 UI のデフォルトしきい値 */
const DEFAULT_MEMBERS_VISIBLE_MIN_COUNT = DEFAULT_PF_MEMBERS_VISIBLE_MIN_COUNT
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-20 で common 定数へ一本化した直後に、同じ値をローカル別名へ再代入している。不要な変数中継であり、`grep DEFAULT_PF_MEMBERS_VISIBLE_MIN_COUNT` で参照箇所が追えなくなる。→ 別名を削除し `DEFAULT_PF_MEMBERS_VISIBLE_MIN_COUNT` を直接使う。

**コメント要約**: common 定数の不要な別名中継。<br>別名を削除して直接参照する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `DEFAULT_MEMBERS_VISIBLE_MIN_COUNT` を削除し、`membersVisibleMode` / `membersVisibleThreshold` から common 定数を直接参照。

---

**識別子**: RC-29（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/eventcreate/EventDetailCard.vue:227`, `base/src/utils/eventEditValidationMessages.ts:119`

**該当コード（レビュー時点）**:

```typescript
// EventDetailCard: 定員ガードなし
if (v > event.value.event_max_people) {
// eventEditValidationMessages: event_max_people > 0 のガードあり
event.event_max_people > 0 &&
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: 同じ「しきい値 <= 定員」検証で、`collectEventDetailValidationMessages` には `event_max_people > 0` ガードがあるが `membersVisibleThresholdValidator` には無い。→ `EventAppSchema` の `event_max_people` は `positive()` + 既定値 25 のため 0 は保持されず、入力途中の空文字は `requiredValidator` が先に弾くため実害はない。

**コメント要約**: 定員ガード条件が 2 実装で非対称。<br>スキーマ制約により実害がないため対応不要。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: `event_max_people` は `z.number().int().positive().default(25)` で 0 になり得ず、空入力は `requiredValidator` が先に検出するため挙動差は生じない。

---

**識別子**: RC-30（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/pages/c/[communityAccount]/e/[eventId]/members.vue:57`

**該当コード（レビュー時点）**:

```typescript
watch(
  shouldShowParticipantsPage,
  (visible) => {
    if (visible === false) {
      ...
      router.replace(getEventPath(props.communityAccount, props.eventId))
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 上部の `isShowMember` 監視は `is_show_member === false` のとき `/404` へ遷移するが、その直後に本 watch が `immediate` で走り、しきい値未達なら `router.replace` でイベントページへ上書きしてしまう。参加者非公開コミュニティなのに 404 ではなくイベント詳細へ着地する。→ `isShowMember` が true のときだけ replace する。

**コメント要約**: is_show_member false 時に /404 遷移が replace で打ち消される。<br>replace の条件に isShowMember を加える。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `if (visible === false && isShowMember)` に変更し、`/404` 遷移を上書きしないようコメントで意図を明記。

---

**識別子**: RC-31（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/utils/eventParticipantsVisibility.ts:15`

**該当コード（レビュー時点）**:

```typescript
export function shouldShowPfEventParticipantsSection(
  event: EventParticipantsVisibilitySource,
  memberCount: number,
): boolean {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-23 対応で 0 人非表示・enterprise 常時表示まで内包したため、関数は PF 専用ではなく全イベントの参加者セクション表示判定になった。`Pf` 接頭辞が実際の責務と食い違い、enterprise 経路で呼んで良いか読み手が判断できない。→ `shouldShowEventParticipantsSection` にリネームする。

**コメント要約**: 関数名の Pf 接頭辞が実際の判定範囲と不一致。<br>PF 専用でないためリネームする。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `shouldShowEventParticipantsSection` にリネームし、`EventDetailsCard.vue` / `members.vue` / テストの参照を更新（JSDoc の PF / enterprise 挙動説明は維持）。

---

**識別子**: RC-32（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventCopy.ts:94`

**該当コード（レビュー時点）**:

```typescript
    ...((srcEvent.enterprise_id == null || srcEvent.enterprise_id === '') && srcEvent.members_visible_min_count != null
      ? { members_visible_min_count: srcEvent.members_visible_min_count }
      : {}),
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: enterprise 判定を `enterprise_id == null || enterprise_id === ''` とインラインで再実装している。同一セマンティクスの `isEnterpriseEvent`（`functions/default/src/utils/enterpriseMail.ts`）が既にあり、`functions/default` 内の他ファイルはそちらを使っている。判定を増やすと `''` の扱い等がファイル単位でずれる。→ `!isEnterpriseEvent(srcEvent)` に置き換える。

**コメント要約**: enterprise 判定の独自実装。<br>既存の isEnterpriseEvent を使う。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `utils/enterpriseMail.js` の `isEnterpriseEvent` を import し `!isEnterpriseEvent(srcEvent)` に置換。`npm -w functions_default run build` で型検査通過を確認。

---

**識別子**: RC-33（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `partner/src/pages/events/create.vue:137`

**該当コード（レビュー時点）**:

```typescript
const paymentUiStrategy = computed(() => eventPaymentUiStrategyFromEnterpriseId(community.enterprise_id))
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `community` は `await` で確定済みの固定値なので、この `computed` には更新されるリアクティブ依存が無く値の中継にしかなっていない。さらに同じ呼び出しが新規イベント初期化側（129 行）にも重複している。→ 定数に集約し、初期化とテンプレート双方から参照する。

**コメント要約**: リアクティブ依存の無い computed と呼び出しの重複。<br>定数に集約する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `community` 解決直後に `const paymentUiStrategy` を定義し、`members_visible_min_count` 既定値注入と `EventDetailCard` への注入の両方で参照するよう変更。

---

**識別子**: RC-34（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `tests/firestore-rules/src/membersVisibleMinCount.test.ts:1`

**該当コード（レビュー時点）**:

```typescript
// partner 3 ケース + manager 2 ケースのみ
// enterprise イベントでの拒否・0 / 負値 / 非整数の拒否・create 経路のテストが無い
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-2 / RC-8（🚨）の中核である「enterprise イベントでは `members_visible_min_count` を書き込めない」と、`validPfValue` の値域制約（1 以上の整数）に対するテストが無い。create 経路も未検証で、Rules の条件式を崩す変更が検知できない。→ enterprise イベントの create / update 拒否、enterprise の他フィールド更新は許可、0 / 負値 / 非整数の拒否、PF の create 許可を追加する。

**コメント要約**: Rules テストに enterprise 拒否・不正値・create のケースが無い。<br>境界ケースを追加する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 6 ケース（0 / 負値 / 非整数の拒否、enterprise への追加拒否、enterprise の他フィールド更新許可、PF create 許可、enterprise create 拒否）を追加。`firebase emulators:exec --only firestore` で 10 件パスを確認。

---
