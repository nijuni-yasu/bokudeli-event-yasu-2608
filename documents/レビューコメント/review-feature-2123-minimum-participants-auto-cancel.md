# ブランチ feature/2123-minimum-participants-auto-cancel レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 最小催行デフォルト値 `?? 3` / `?? 1` のマジックナンバー<br>common の `MINIMUM_PARTICIPANTS_DEFAULT_*` 定数を使用 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `isMinimumParticipantsEditingAllowed` の引数が生 `string`<br>`RawEventStatusType` に変更しタイポ・未定義値を型で防止 |
| [x] | RC-3 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Transaction 内で読む注文を Transaction 外でも読んでいる（`orderedPre`）<br>user_advance の stripe_id チェックを Transaction 内へ移動し外読みを削除 |
| [x] | RC-4 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 💾 データ | 🔧 微修正 | M | Transaction 内で複数ユーザーの usage revert が read→write→read となり実行時エラー<br>全メンバー read を先に行う bulk 関数（store）を追加して解消 |
| [x] | RC-5 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `applyOrderCanceledSideEffects` をユーザーごとに逐次 await<br>並列化すると同一イベントの `recalcEventMembers` が競合するため逐次が妥当 |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | S | 参加者向けテンプレ ID が店舗用と同一のプレースホルダ<br>SendGrid で参加者向けテンプレ作成後に差し替えないと文面が壊れる（リリース前必須） |
| [x] | RC-7 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | メール失敗の catch がログのみで握りつぶし理由コメントなし<br>意図（中止・返金確定済みのため呼び出し元を失敗させない）をコメントに明記 |
| [x] | RC-8 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | S | 参加者向け中止メールの宛先が常に空（cancel 後に `ordered` を再取得）<br>`canceledOrders` の user_id から宛先解決するよう変更 |
| [x] | RC-9 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 参加者メール一括送信に `Promise.all` + 個別 send を使用<br>`sendDynamicTemplateWithPersonalizations` のバッチ送信へ変更 |
| [x] | RC-10 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `event.minimum_participants!` の non-null assertion<br>ローカル変数への代入 + null ガードに変更 |
| [x] | RC-11 | 3690582388 等 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | S | 参加者 SendGrid テンプレ ID が店舗用のまま（RC-6 と同一論点） |
| [x] | RC-12 | 3690582434 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | participantUserIds の重複で二重送信 → Set でユニーク化 |
| [x] | RC-13 | 3690582454 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 返金期限判定が DateTime.now → nowMillis 基準に変更 |
| [x] | RC-14 | 3690587615 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 決済 | 🔧 微修正 | S | 先払いで stripe_id 一部欠落時も中止続行 → 1 件でも欠落でエラー |
| [x] | RC-15 | 3690587649 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 評価済みイベント保存で判断日過去エラー → judgment_evaluated_at 時は検証スキップ |
| [x] | RC-16 | Copilot RC-4 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | JST 定数重複 → DEFAULT_TIME_ZONE 利用 |
| [x] | RC-17 | 3690587603 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 📋 仕様追加 | M | Firestore Rules で minimum_participants クライアント更新制約 |
| [x] | RC-18 | 3690587609 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🧵 レース | 📐 リファクタ | M | 人数判定と一括中止を同一 Transaction で確定 |
| [x] | RC-19 | 3690587633 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 決済 | 📐 リファクタ | M | 中止済みでも返金未完了を冪等再開する永続化 |
| [x] | RC-20 | 3690587641 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | M | 一括中止時の友人履歴削除が空 members でスキップ |
| [ ] | RC-21 | 3690582496 等 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | ⚡ 性能 | 📐 リファクタ | M | キャッチアップクエリの評価済み除外（インデックス要検討） |
| [x] | RC-22 | Copilot RC-2 | 👌 修正不要 | — | 📌 スコープ内 | — | 👀 確認のみ | — | applyOrderCanceledSideEffects 逐次は競合回避のため妥当（RC-5 と同趣旨） |
| [x] | RC-23 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | rules 関数内の `if` 文でコンパイル不能（エミュレータで確認）<br>三項演算子相当の式に変更 |
| [x] | RC-24 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | M | already_canceled で pipeline 未確認のまま常に後処理を実行<br>pipeline 存在 + 未完了のときのみ resume するようゲート |
| [x] | RC-25 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 💾 データ | 🔧 微修正 | M | `bulkParticipantSnapshot` が resume で空配列となり後処理が全スキップ・送信済み扱い<br>snapshot を廃止し canceledOrders / pipeline 由来に統一 |
| [x] | RC-26 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | M | メール送信の成否に関わらず sent_at を確定（テンプレ未作成スキップ時も）<br>send が成否を返し、成功時のみフラグ確定 |
| [x] | RC-27 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 💰 決済 | 📐 リファクタ | M | resume の canceled 再取得に事前の個別キャンセル分が混入<br>中止トランザクション内で pipeline にスナップショットを保存し resume で使用 |
| [ ] | RC-28 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🧵 レース | 📐 リファクタ | M | Scheduled resume と Callable resume の同時実行でメール二重送信の可能性<br>フラグの原子的クレームと「送信成功前に確定しない」方針のトレードオフ |
| [x] | RC-29 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | event_auto_cancel 監査が完了マーカーより後でクラッシュ時に喪失<br>監査ログ確定をメール送信より前へ移動 |
| [x] | RC-30 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | resume 分岐の catch が理由コメントなしで握りつぶし<br>次回ポーリングで再開される意図をコメントに明記 |
| [x] | RC-31 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | ⚡ 性能 | 🔧 微修正 | S | resume 候補クエリが全期間スキャン + pipeline を逐次 await<br>判定日時 7 日の lookback 窓 + `Promise.all` 化 |
| [x] | RC-32 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | M | 判定 Transaction が write 後に read で自動中止パスが必ず実行時エラー<br>read を前段に集約し preloaded 引き渡し + 同一インスタンスで更新 |
| [x] | RC-33 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | pipeline store が withConverter なし生 ref・`as` キャスト・common 外スキーマ・`Date.now()`<br>common に `EventBulkCancelPipeline` Zod スキーマ + Converter を新設 |
| [ ] | RC-34 | 5341053508 | 👌 修正不要 | — | 📌 スコープ内 | — | 👀 確認のみ | — | canceled パスで applyBulk 後に members 同期する順序<br>`updateEvent` は Object.assign + merge で event_canceled を保持（コメント済み） |
| [ ] | RC-35 | 5341053508 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | `cancelEventBulkCore` が Transaction 外 `recalcEventMembers` で judgment 経路と非対称 |
| [ ] | RC-36 | 5341053508 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | ⚡ 性能 | 📐 リファクタ | M | `removeEventFromFriendHistory` が参加者 n 人で O(n²) write |
| [x] | RC-37 | 5341053508 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 先払い `some(stripe_id==null)` の意図をコメントで明示 |
| [x] | RC-38 | 3812300951 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 決済 | 🔧 微修正 | S | `isPostProcessingIncomplete` に `stripe_refunds_done_at` を含める |
| [ ] | RC-39 | 3828183031 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | pipeline の read→set 丸ごと書き戻しが並列 resume で競合<br>Transaction または原子的 update が必要（RC-28 と関連） |
| [x] | RC-40 | 3830028169 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 💾 データ | 🔧 微修正 | S | `isPostProcessingIncomplete` が副作用・友人履歴未完了を見ていない<br>participant 全員の side_effects と friend_history を resume 判定に含める |
| [ ] | RC-41 | 3830033339 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | ⚡ 性能, 💾 データ | 📐 リファクタ | L | 大量注文を単一 Transaction で更新すると 500 write 上限超過<br>分割・再開可能な一括中止パイプラインが必要 |
| [x] | RC-42 | なし | 👌 修正不要 | — | 📌 スコープ内 | 🔐 セキュリティ | 👀 確認のみ | — | `canceled_by` が PF 未認証 read 可能な `member_orders` に追加される<br>既存の `user_id` / Event `created_by` と同等の公開 uid で追加露出なし |
| [x] | RC-43 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `orderCancelSource.test.ts` の import が Prettier 未整形で PR verify の format:check が落ちる |
| [x] | RC-44 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🧪 テスト | 🔧 微修正 | S | `cancel_source='user'` かつイベント中止済みのケースのテストが無い |
| [ ] | RC-45 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | UI 文言の i18n キーを返す関数を `common` に置いている<br>`base` 専用ロジックのため `base/src/utils` が適切 |
| [x] | RC-46 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `orderCanceledLabelI18nKey` の `default` で網羅性チェックが効かず、`cancel_source` 追加時にサイレントで「キャンセル済み」表示になる |
| [x] | RC-47 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📄 ドキュメント | 📄 ドキュメントのみ | S | 全キャンセル時カードラベルの混在ルール（`canceled_event` 優先）が仕様書に未記載 |
| [x] | RC-48 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `BulkCancelInitiator` と `CancelEventBulkInitiator` の二重定義 |
| [x] | RC-49 | 3832127253 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 決済, 💾 データ | 🔧 微修正 | S | 返金リトライ時に既存 `stripes.refunds` を見ず累計超過で例外<br>同一 order_ids 記録済みなら skip |
| [x] | RC-50 | 3832139569 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 決済, 🐛 実害 | 🔧 微修正 | S | `stripe_id` 検証が `user_advance` のみ<br>自己負担あり注文全般で ID 欠落を中止前に拒否 |
| [ ] | RC-51 | 3832139575 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX, 💾 データ | 📋 仕様追加 | M | 参加者メールで宛先未解決ユーザーを無言除外し完了扱い<br>対象数と有効宛先数の不一致を記録・再処理可能に |

---

## 評価セッション（2026-07-31 20:45・shokujii-code-review）

- **評価日時**: 2026-07-31 20:45 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `feature/2123-minimum-participants-auto-cancel`
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 最小催行デフォルト値 `?? 3` / `?? 1` のマジックナンバー<br>common の `MINIMUM_PARTICIPANTS_DEFAULT_*` 定数を使用 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `isMinimumParticipantsEditingAllowed` の引数が生 `string`<br>`RawEventStatusType` に変更しタイポ・未定義値を型で防止 |
| [x] | RC-3 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Transaction 内で読む注文を Transaction 外でも読んでいる（`orderedPre`）<br>user_advance の stripe_id チェックを Transaction 内へ移動し外読みを削除 |
| [x] | RC-4 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 💾 データ | 🔧 微修正 | M | Transaction 内で複数ユーザーの usage revert が read→write→read となり実行時エラー<br>全メンバー read を先に行う bulk 関数（store）を追加して解消 |
| [x] | RC-5 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `applyOrderCanceledSideEffects` をユーザーごとに逐次 await<br>並列化すると同一イベントの `recalcEventMembers` が競合するため逐次が妥当 |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | S | 参加者向けテンプレ ID が店舗用と同一のプレースホルダ<br>SendGrid で参加者向けテンプレ作成後に差し替えないと文面が壊れる（リリース前必須） |
| [x] | RC-7 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | メール失敗の catch がログのみで握りつぶし理由コメントなし<br>意図（中止・返金確定済みのため呼び出し元を失敗させない）をコメントに明記 |
| [x] | RC-8 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | S | 参加者向け中止メールの宛先が常に空（cancel 後に `ordered` を再取得）<br>`canceledOrders` の user_id から宛先解決するよう変更 |
| [x] | RC-9 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 参加者メール一括送信に `Promise.all` + 個別 send を使用<br>`sendDynamicTemplateWithPersonalizations` のバッチ送信へ変更 |
| [x] | RC-10 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `event.minimum_participants!` の non-null assertion<br>ローカル変数への代入 + null ガードに変更 |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/eventcreate/EventDetailCard.vue:202`

**該当コード（レビュー時点の diff）**:

```diff
+const minimumParticipantsCount = computed({
+  get: () => event.value.minimum_participants?.count ?? 3,
...
+  get: () => event.value.minimum_participants?.judgment_days_before ?? 1,
...
+const minimumParticipantsBelowCount = computed(() => {
+  const count = event.value.minimum_participants?.count ?? 3
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: デフォルト値 `?? 3` / `?? 1` がマジックナンバーになっている。`common/src/schemas/Event.ts` に `MINIMUM_PARTICIPANTS_DEFAULT_COUNT` / `MINIMUM_PARTICIPANTS_DEFAULT_JUDGMENT_DAYS_BEFORE` が定義済み → 定数を import して使用する。

**コメント要約**: 最小催行デフォルト値 `?? 3` / `?? 1` のマジックナンバー。
common の `MINIMUM_PARTICIPANTS_DEFAULT_*` 定数を使用。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「マジックナンバー・インデックス固定をしていないか」。既存定数があり修正方針が一意のため手順 3b で自動修正（`MINIMUM_PARTICIPANTS_DEFAULT_COUNT` / `_JUDGMENT_DAYS_BEFORE` を使用）。

---

**識別子**: RC-2（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/utils/minimumParticipants.ts:86`

**該当コード（レビュー時点の diff）**:

```diff
+export function isMinimumParticipantsEditingAllowed(rawEventStatus: string): boolean {
+  return rawEventStatus === 'in_draft' || rawEventStatus === 'applying_reservation'
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 引数が生 `string` のため、タイポや未定義ステータスをコンパイル時に検出できない。`common/src/schemas/Event.ts` に `RawEventStatusType` が定義済み → 引数型を `RawEventStatusType` に変更する。

**コメント要約**: `isMinimumParticipantsEditingAllowed` の引数が生 `string`。
`RawEventStatusType` に変更しタイポ・未定義値を型で防止。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 型安全性の向上。既存の型 union があり修正方針が一意のため手順 3b で自動修正。

---

**識別子**: RC-3（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/cancelEventBulkCore.ts:99`

**該当コード（レビュー時点の diff）**:

```diff
+  const orderedPre = await getOrders(community_id, event_id, 'ordered')
...
+  if (eventPayment === 'user_advance' && orderedPre.length > 0 && orderedPre.every((o) => o.stripe_id == null)) {
+    throw new Error('先払い注文に決済情報（stripe_id）が紐づいていません')
+  }
+
+  const canceledOrders = await getFirestore().runTransaction(async (transaction) => {
...
+    const ordered = await getOrders(community_id, event_id, 'ordered', transaction)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: Transaction 内で読み込む注文（`ordered`）と同じものを Transaction 外でも `orderedPre` として読んでおり、チェックリスト「Transaction 内で読み込む場合、Transaction 外で同じドキュメントを読んでいないか」に抵触。user_advance の stripe_id チェックは `cancelOrders` と同様に Transaction 内の `ordered` で行えば外読みは不要 → チェックを Transaction 内へ移動し `orderedPre` を削除する。

**コメント要約**: Transaction 内で読む注文を Transaction 外でも読んでいる（`orderedPre`）。
user_advance の stripe_id チェックを Transaction 内へ移動し外読みを削除。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリストの Transaction 二重読み禁止に該当。既存 `cancelOrders` と同じパターン（Transaction 内チェック）に揃えるだけで修正方針が一意のため手順 3b で自動修正。

---

**識別子**: RC-4（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/cancelEventBulkCore.ts:124`

**該当コード（レビュー時点の diff）**:

```diff
+    if (eventPayment === 'enterprise_subsidy' && enterpriseId != null && eventMonth != null) {
+      for (const [userId, userOrders] of groupOrdersByUser(ordered)) {
+        await revertEnterpriseSubsidyUsageOnCancel({
+          enterpriseId,
+          userId,
+          eventMonth,
+          orders: userOrders,
+          transaction,
+        })
+      }
+    }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/M]: `revertEnterpriseSubsidyUsageOnCancel` は内部で `transaction.get` → `transaction.update` を行う（`adjustEnterpriseMemberMonthlyUsage`）。これをユーザーごとにループすると、2 人目以降の read が 1 人目の write の後になり、Firestore Admin SDK が「reads before writes」制約でエラーになる。enterprise_subsidy イベントの一括中止は参加者 2 人以上で必ず失敗する → 全メンバーの read を先に済ませてから write する bulk 関数を store に追加し、一括で減算する。

**コメント要約**: Transaction 内で複数ユーザーの usage revert が read→write→read となり実行時エラー。
全メンバー read を先に行う bulk 関数（store）を追加して解消。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: チェックリスト「Transaction 内で すべての read が write より前 に実行されているか」。enterprise_subsidy の一括中止が実行時に必ず失敗するバグ。`stores/enterprise.ts` に `adjustEnterpriseMemberMonthlyUsageBulk`、`utils/enterpriseSubsidyOrders.ts` に `revertEnterpriseSubsidyUsageOnCancelBulk` を追加し、`cancelEventBulkCore` から一括呼び出しに変更（手順 3a 自動修正）。既存単体版は bulk へ委譲し実装を一本化。

---

**識別子**: RC-5（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/cancelEventBulkCore.ts:160`

**該当コード（レビュー時点の diff）**:

```diff
+  const userIds = [...new Set(canceledOrders.map((o) => o.user_id))]
+  for (const userId of userIds) {
+    try {
+      await applyOrderCanceledSideEffects({ event: eventAfter, userId })
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: ユーザーごとの `applyOrderCanceledSideEffects` を逐次 await しており、チェックリスト「ループ内で Firestore の read/write を逐次 await していないか」に形式上は該当する → ただし内部で同一イベントに対する `recalcEventMembers`（read-then-write）を行うため、並列化すると自イベントの members 再集約が競合する。逐次実行が安全であり修正不要。

**コメント要約**: `applyOrderCanceledSideEffects` をユーザーごとに逐次 await。
並列化すると同一イベントの `recalcEventMembers` が競合するため逐次が妥当。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 並列化はレースコンディションを生むため逐次が正しい。件数もイベント参加者数上限程度で許容範囲。

---

**識別子**: RC-6（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventBulkCancellationMail.ts:27`

**該当コード（レビュー時点の diff）**:

```diff
+/** 参加者向け返金通知（SendGrid 上でテンプレ作成後に差し替え） */
+export const EVENT_BULK_CANCELLATION_PARTICIPANT_TEMPLATE_ID = 'd-9c498e754b91498b9ce0f2e83c219728'
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/S]: 参加者向け返金通知のテンプレ ID が店舗向け `EVENT_CANCELLATION_TEMPLATE_ID` と同一のプレースホルダのまま。店舗向けテンプレは `shop_name` / `admin_url` 等を前提とするため、参加者向けデータで送ると文面が壊れる → リリース前に SendGrid で参加者向けテンプレを作成し ID を差し替える（コード上のコメントどおり）。

**コメント要約**: 参加者向けテンプレ ID が店舗用と同一のプレースホルダ。
SendGrid で参加者向けテンプレ作成後に差し替えないと文面が壊れる（リリース前必須）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: S

**判断理由**: SendGrid 側でのテンプレ作成という運用作業が必要でコードのみでは解消できないため自動修正対象外。リリース前の差し替えが必須である点を明記して未着手のまま残す。→ 2026-08-21: SendGrid テンプレ `d-819d30069d304bb69235c4e207b7bd1c` 作成・`EVENT_BULK_CANCELLATION_PARTICIPANT_TEMPLATE_ID` 反映（`documents/sendgridテンプレ/02_event_bulk_cancellation_participant.md`）。

---

**識別子**: RC-7（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventBulkCancellationMail.ts:65`

**該当コード（レビュー時点の diff）**:

```diff
+  } catch (error) {
+    logger.error('Failed to send cancellation mail to shop', {
+      eventId,
+      error: error instanceof Error ? error.message : String(error),
+    })
+  }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: catch した例外をログのみで握りつぶしているが理由コメントがない。チェックリストは「意図的に握りつぶす場合は理由をコメントに明記する」を要求 → 中止・返金は確定済みでメール失敗により呼び出し元（Scheduled / Callable）を失敗させない意図をコメントに明記する。

**コメント要約**: メール失敗の catch がログのみで握りつぶし理由コメントなし。
意図（中止・返金確定済みのため呼び出し元を失敗させない）をコメントに明記。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 握りつぶし自体は妥当（メール失敗で再実行すると中止処理全体が重複しうる）だが、規約によりコメント必須。店舗向け・参加者向け両方の catch にコメントを追記（手順 3b 自動修正）。

---

**識別子**: RC-8（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventBulkCancellationMail.ts:77`

**該当コード（レビュー時点の diff）**:

```diff
+  if (!hadOrderedParticipants) {
+    return
+  }
+
+  try {
+    const memberEmails = await getEventMemberEmails(event)
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `sendEventBulkCancellationMails` は `cancelEventBulkCore` の Transaction で全注文を `canceled` に更新した**後**に呼ばれるが、`getEventMemberEmails` は `event.getOrders('ordered')` でステータス `ordered` の注文を再取得するため、宛先が常に空になり参加者に中止・返金通知が一切届かない → 宛先は `canceledOrders` の user_id（呼び出し元から渡す）から `getUserPersonalInformation` で解決する。

**コメント要約**: 参加者向け中止メールの宛先が常に空（cancel 後に `ordered` を再取得）。
`canceledOrders` の user_id から宛先解決するよう変更。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 仕様書（08_イベントキャンセル_参加者あり_返金）は参加者への中止・返金通知を要求しており、宛先が常に空になるのは実害バグ。引数を `hadOrderedParticipants: boolean` → `participantUserIds: string[]` に変更し、user_id から宛先を解決するよう修正（手順 3a 自動修正）。

---

**識別子**: RC-9（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventBulkCancellationMail.ts:86`

**該当コード（レビュー時点の diff）**:

```diff
+    await Promise.all(
+      memberEmails.map(async (to) => {
+        await sgMail.send({
+          to,
+          from: DEFAULT_FROM,
+          templateId: EVENT_BULK_CANCELLATION_PARTICIPANT_TEMPLATE_ID,
+          dynamicTemplateData,
+        })
+      }),
+    )
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: メールの一括送信に `Promise.all` + 個別 `sgMail.send` を使用している。チェックリストは SendGrid personalizations の `sendDynamicTemplateWithPersonalizations`（`utils/sendgridBulk.ts`）によるバッチ送信を要求 → バッチ送信に変更する（バッチ単位の失敗・受付件数ログは util 内で記録される）。

**コメント要約**: 参加者メール一括送信に `Promise.all` + 個別 send を使用。
`sendDynamicTemplateWithPersonalizations` のバッチ送信へ変更。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「メールの一括送信に Promise.all を使っていないか」に明確に該当。既存 util があり修正方針が一意のため手順 3a で自動修正。呼び出し元 `pollingTask` は `SENDGRID_API_KEY` secret 指定済み。

---

**識別子**: RC-10（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/minimumParticipants.ts:73`

**該当コード（レビュー時点の diff）**:

```diff
+async function evaluateOneMinimumParticipantsEvent(event: ShokujiiEvent, stripe: Stripe): Promise<void> {
+  if (!isUnevaluatedMinimumParticipants(event)) {
+    return
+  }
+
+  const mp = event.minimum_participants!
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `event.minimum_participants!` の non-null assertion を使用している。プロジェクトは `as` 回避を型ガードで行う方針であり、non-null assertion も同様に避けるべき → `const mp = event.minimum_participants` を先に取り出し `mp == null || mp.judgment_evaluated_at != null` の早期 return で型を絞り込む。

**コメント要約**: `event.minimum_participants!` の non-null assertion。
ローカル変数への代入 + null ガードに変更。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 型ガードで自然に書き換え可能で修正方針が一意のため手順 3b で自動修正。挙動は同一（`enabled` は literal `true` のため null チェックで十分）。

---

## 評価セッション（2026-07-31 22:04 JST・review-comments-evaluate auto）

- **評価日時**: 2026-07-31 22:04 JST
- **評価者**: Cursor Agent（wait-ai-pr-review → review-comments-evaluate auto）
- **ブランチ名**: feature/2123-minimum-participants-auto-cancel
- **PR**: #2231
- **REVIEW_REQUEST_SINCE**: 2026-07-31T12:52:20Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文、Codex 接続案内のみ）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|
| [x] | RC-11 | 3690582388 等 | 🚨 必須修正 | ✅ 対応済み | 📌 | 参加者 SendGrid テンプレ ID が店舗用のまま（RC-6 と同一論点） |
| [x] | RC-12 | 3690582434 | 🟡 修正提案 | ✅ 対応済み | 📌 | participantUserIds の重複で二重送信 → Set でユニーク化 |
| [x] | RC-13 | 3690582454 | 🟡 修正提案 | ✅ 対応済み | 📌 | 返金期限判定が DateTime.now → nowMillis 基準に変更 |
| [x] | RC-14 | 3690587615 | 🚨 必須修正 | ✅ 対応済み | 📌 | 先払いで stripe_id 一部欠落時も中止続行 → 1 件でも欠落でエラー |
| [x] | RC-15 | 3690587649 | 🟡 修正提案 | ✅ 対応済み | 📌 | 評価済みイベント保存で判断日過去エラー → judgment_evaluated_at 時は検証スキップ |
| [x] | RC-16 | Copilot RC-4 | 🟡 修正提案 | ✅ 対応済み | 📌 | JST 定数重複 → DEFAULT_TIME_ZONE 利用 |
| [x] | RC-17 | 3690587603 | 🚨 必須修正 | ✅ 対応済み | 📌 | Firestore Rules で minimum_participants クライアント更新制約 |
| [x] | RC-18 | 3690587609 | 🚨 必須修正 | ✅ 対応済み | 📌 | 人数判定と一括中止を同一 Transaction で確定 |
| [x] | RC-19 | 3690587633 | 🚨 必須修正 | ✅ 対応済み | 📌 | 中止済みでも返金未完了を冪等再開する永続化 |
| [x] | RC-20 | 3690587641 | 🟡 修正提案 | ✅ 対応済み | 📌 | 一括中止時の友人履歴削除が空 members でスキップ |
| [ ] | RC-21 | 3690582496 等 | 🟡 修正提案 | 未着手 | 📌 | キャッチアップクエリの評価済み除外（インデックス要検討） |
| [ ] | RC-22 | Copilot RC-2 | 👌 修正不要 | — | 📌 | applyOrderCanceledSideEffects 逐次は競合回避のため妥当（RC-5 と同趣旨） |

自動修正後はローカル未コミット。push 前にコミットまたは amend を検討してください。

---

## 評価セッション（2026-07-31 22:52・shokujii-code-review）

- **評価日時**: 2026-07-31 22:52 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `feature/2123-minimum-participants-auto-cancel`
- **PR**: #2231
- **レビュー対象**: 未コミット差分（RC-17〜20 自動修正で導入された一括中止パイプライン・resume 機構）
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-23 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | rules 関数内の `if` 文でコンパイル不能（エミュレータで確認）<br>三項演算子相当の式に変更 |
| [x] | RC-24 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | M | already_canceled で pipeline 未確認のまま常に後処理を実行<br>pipeline 存在 + 未完了のときのみ resume するようゲート |
| [x] | RC-25 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 💾 データ | 🔧 微修正 | M | `bulkParticipantSnapshot` が resume で空配列となり後処理が全スキップ・送信済み扱い<br>snapshot を廃止し canceledOrders / pipeline 由来に統一 |
| [x] | RC-26 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | M | メール送信の成否に関わらず sent_at を確定（テンプレ未作成スキップ時も）<br>send が成否を返し、成功時のみフラグ確定 |
| [x] | RC-27 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 💰 決済 | 📐 リファクタ | M | resume の canceled 再取得に事前の個別キャンセル分が混入（監査過大・誤メール・返金重複試行）<br>中止トランザクション内で pipeline に注文/参加者スナップショットを保存し resume で使用 |
| [ ] | RC-28 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🧵 レース | 📐 リファクタ | M | Scheduled resume と Callable resume の同時実行でメール二重送信の可能性<br>フラグの原子的クレームが必要だが「送信成功前に確定フラグを立てない」方針とトレードオフ |
| [x] | RC-29 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | event_auto_cancel 監査が完了マーカー（メールフラグ）より後でクラッシュ時に喪失<br>監査ログ確定をメール送信より前へ移動 |
| [x] | RC-30 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | resume 分岐の catch が理由コメントなしで握りつぶし<br>次回ポーリングで再開される意図をコメントに明記 |
| [x] | RC-31 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | ⚡ 性能 | 🔧 微修正 | S | resume 候補クエリが全期間スキャン + pipeline を逐次 await<br>判定日時 7 日の lookback 窓 + `Promise.all` 化 |
| [x] | RC-32 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | M | 判定 Transaction が write 後に read（members 同期 write → apply 内 read、apply write 後の再 read）で自動中止パスが必ず実行時エラー<br>read を前段に集約し preloaded 引き渡し + 同一インスタンスで更新 |
| [x] | RC-33 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | pipeline store が withConverter なし生 ref・`as` キャスト・common 外スキーマ・`Date.now()`<br>common に `EventBulkCancelPipeline` Zod スキーマ + Converter を新設 |

---

**識別子**: RC-23（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.rules:136`

**該当コード（レビュー時点の diff）**:

```diff
+        function eventMinimumParticipantsCreateValid() {
+            let newMp = request.resource.data.get('minimum_participants', null);
+            if (newMp == null) {
+                return true;
+            }
+            return newMp.get('judgment_evaluated_at', null) == null;
+        }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: Firestore Security Rules の関数は単一の `return` 式しか書けず `if` 文は構文エラーになる。エミュレータで `L136:13 Unexpected 'if'` を確認、rules テストが全件失敗しデプロイも不可能 → `let` + 三項演算子の式に書き換える。

**コメント要約**: rules 関数内の `if` 文でコンパイル不能（エミュレータで確認）。
三項演算子相当の式に変更。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: エミュレータ実行で rules コンパイルエラーを実証（`Error compiling rules: L136:13 Unexpected 'if'`）。機械的な書き換えで修正方針が一意のため手順 3a で自動修正。修正後 rules テスト 45 件成功を確認。

---

**識別子**: RC-24（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/cancelEventBulkCore.ts:43`

**該当コード（レビュー時点の diff）**:

```diff
   if (eventBefore.event_status.value === 'event_canceled') {
-    logger.info('cancelEventBulkCore idempotent skip', { community_id, event_id })
-    return { outcome: 'already_canceled' }
+    logger.info('cancelEventBulkCore resume post-processing', { community_id, event_id })
+    const resumed = await finishBulkEventCancelPostProcessing({ ... })
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/M]: 中止済みイベントに対して pipeline の有無・完了状態を確認せず常に後処理を再実行する。本機能導入前（または本機能以外の経路）で中止済みのイベントに Callable を再実行すると、pipeline が空扱いになり中止メールの再送・全 canceled 注文への返金試行・副作用の再実行が走る → pipeline doc が存在し未完了の場合のみ resume し、それ以外はべき等 no-op に戻す。

**コメント要約**: already_canceled で pipeline 未確認のまま常に後処理を実行。
pipeline 存在 + 未完了のときのみ resume するようゲート。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 旧経路で中止済みのイベントへの誤送信・誤返金試行は実害。`resumeAlreadyCanceled` ヘルパーで pipeline null / 完了済みを no-op 化（手順 3a 自動修正）。テスト 3 ケース（未完了 resume / pipeline なし / 完了済み）を追加。

---

**識別子**: RC-25（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/cancelEventBulkCore.ts:69`

**該当コード（レビュー時点の diff）**:

```diff
+  const orderedPre = await getOrders(community_id, event_id, 'ordered')
+  const bulkParticipantSnapshot = [...new Set(orderedPre.map((o) => o.user_id))]
...
+      bulkCancelParticipantUserIds: bulkParticipantSnapshot,
...
+  const participantIds =
+    bulkParticipantSnapshot.length > 0 ? bulkParticipantSnapshot : [...new Set(canceledOrders.map((o) => o.user_id))]
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/M]: (1) 中止済みイベントの resume 分岐では `ordered` が 0 件のため snapshot が**空配列**になり、`bulkCancelParticipantUserIds ?? 導出` の `??` を素通りして参加者 0 人扱い → 副作用・友人履歴・参加者メールが全てスキップされ、メールは送信済みフラグまで立つ。(2) 通常パスでも snapshot はトランザクション前の値で、直前に入った注文のユーザーが漏れる。(3) RC-3 で排除した「Transaction 内で読む注文の Transaction 外読み」の再導入 → snapshot を廃止し、canceledOrders（および RC-27 の pipeline スナップショット）から導出する。

**コメント要約**: `bulkParticipantSnapshot` が resume で空配列となり後処理が全スキップ・送信済み扱い。
snapshot を廃止し canceledOrders / pipeline 由来に統一。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: resume 時に後処理が完了扱いになるのは再開機構の根幹を壊すバグ。`orderedPre` / snapshot / `bulkCancelParticipantUserIds` パラメータを削除し、参加者は pipeline のスナップショット（RC-27）から解決（手順 3a 自動修正）。

---

**識別子**: RC-26（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventBulkCancellationMail.ts:82`（+ `finishBulkEventCancelPostProcessing.ts` のフラグ確定）

**該当コード（レビュー時点の diff）**:

```diff
+  if (EVENT_BULK_CANCELLATION_PARTICIPANT_TEMPLATE_ID === EVENT_CANCELLATION_TEMPLATE_ID) {
+    logger.error('Participant cancellation mail skipped: ...')
+    return
+  }
...（finish 側）
+    if (pipeline.participant_mails_sent_at == null) {
+      mailPatch.participant_mails_sent_at = nowMillis
+    }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/M]: `sendEventBulkCancellationMails` は失敗を握りつぶし（テンプレ未作成ガードでもスキップ）て `void` を返すのに、呼び出し側は送信の成否に関わらず `shop_mail_sent_at` / `participant_mails_sent_at` を確定する。テンプレ差し替え前に中止が走ると参加者メールは永久に未送信のまま「完了」になり、再開機構が機能しない（チェックリスト「送信成功前に sent 確定フラグだけ立てない」）→ send が対象ごとの成否を返し、成功時（参加者 0 人含む）のみフラグを確定する。

**コメント要約**: メール送信の成否に関わらず sent_at を確定（テンプレ未作成スキップ時も）。
send が成否を返し、成功時のみフラグ確定。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: pipeline による再開の目的（クラッシュ・失敗からの回復）と矛盾する実装。`SendEventBulkCancellationMailsResult`（shopMailSent / participantMailsSent）を返すよう変更し、finish 側は成功時のみ確定（手順 3a 自動修正）。RC-6 / RC-11 のテンプレ差し替えが完了するまで参加者メールは再試行され続ける（lookback 7 日以内）。

---

**識別子**: RC-27（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/finishBulkEventCancelPostProcessing.ts:38`

**該当コード（レビュー時点の diff）**:

```diff
+async function loadCanceledOrdersForPostProcessing(...) {
+  if (canceledOrders != null && canceledOrders.length > 0) {
+    return canceledOrders
+  }
+  return getOrders(communityId, eventId, 'canceled')
+}
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [📐リファクタ/M]: resume 時に `canceled` を全件再取得すると、一括中止**前**にユーザーが個別キャンセルした注文（返金済み）が混入する。監査ログの `order_ids` / `returned_subsidy_amount` が過大になり、個別キャンセル済みユーザーにも中止メールが届き、Stripe 返金は注文集合が変わることで idempotency key が変化し重複返金リスクまたは累計額チェック超過で正当な返金がブロックされる → 一括中止トランザクション内で pipeline に `bulk_canceled_order_ids` / `participant_user_ids` を保存し、resume はそのスナップショットで絞り込む。

**コメント要約**: resume の canceled 再取得に事前の個別キャンセル分が混入（監査過大・誤メール・返金重複試行）。
中止トランザクション内で pipeline に注文/参加者スナップショットを保存し resume で使用。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ, 💰 決済

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 決済・監査データの正確性に直結。`applyBulkEventCancelInTransaction` が同一トランザクションで pipeline（スナップショット付き）を作成するよう変更し、resume は `bulk_canceled_order_ids` でフィルタ（手順 3a 自動修正）。あわせて返金再試行は `stripe_refunds_done_at`（refundErrors 0 件時のみ確定）でゲート。

---

**識別子**: RC-28（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/finishBulkEventCancelPostProcessing.ts:50`

**該当コード（レビュー時点の diff）**:

```diff
+export async function finishBulkEventCancelPostProcessing(
+  params: FinishBulkEventCancelPostProcessingParams,
+): Promise<FinishBulkEventCancelPostProcessingResult> {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: Scheduled（pollingTask の resume）と Callable（主催者の再実行）が同時に走ると、双方が未確定のメールフラグを読んで二重送信になりうる。フラグの原子的なクレーム（Transaction で「処理中」を確保）が必要だが、「送信成功前に確定フラグを立てない」方針（RC-26）とトレードオフがあり、クレーム + 失敗時ロールバックの設計判断が必要 → 発生確率が低く影響がメール重複に限られるため、本 PR では見送りも可。

**コメント要約**: Scheduled resume と Callable resume の同時実行でメール二重送信の可能性。
フラグの原子的クレームが必要だが「送信成功前に確定フラグを立てない」方針とトレードオフ。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🧵 レース

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 修正方針が一意でなく（クレーム方式 vs 送信成功後確定方式）、工数 M のため自動修正対象外。発生には Callable 再実行と Scheduled resume の同時実行が必要で確率は低く、影響もメール重複に限定される。人間の判断を待つ。

---

**識別子**: RC-29（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/finishBulkEventCancelPostProcessing.ts:192`

**該当コード（レビュー時点の diff）**:

```diff
+  if (pipeline.participant_mails_sent_at == null || pipeline.shop_mail_sent_at == null) {
+    ...（メール送信 + フラグ確定）
+  }
+
+  const bulkEnterpriseId = getEventEnterpriseId(eventAfter)
+  if (initiator === 'minimum_participants' && bulkEnterpriseId != null && !pipeline.enterprise_event_auto_cancel_audit_done) {
+    await writeAuditLog({ ... action: 'event_auto_cancel' ... })
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `event_auto_cancel` 監査ログの書き込みが完了マーカー（メール送信フラグ）より後にある。メール確定直後にクラッシュすると pipeline は「完了」となり、監査ログが永久に書かれない → 監査ログ確定をメール送信ブロックより前に移動する。

**コメント要約**: event_auto_cancel 監査が完了マーカー（メールフラグ）より後でクラッシュ時に喪失。
監査ログ確定をメール送信より前へ移動。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 並び替えのみで修正方針が一意（🟡 + 📌 + S + 🔧 → 手順 3b 自動修正）。監査ログはエンプラ仕様の要件のため喪失リスクを排除。

---

**識別子**: RC-30（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/minimumParticipants.ts:53`

**該当コード（レビュー時点の diff）**:

```diff
+    } catch (error) {
+      logger.error('finishBulkEventCancelPostProcessing resume failed', {
+        error,
...
+      })
+    }
+    return
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: resume 分岐の catch がログのみで例外を握りつぶしており、意図（再 throw しない理由）のコメントがない（チェックリスト「意図的に握りつぶす場合は理由をコメントに明記する」）→ pipeline 未完了なら次回ポーリングで再開されるため他イベントの処理を優先する旨をコメントに明記する。

**コメント要約**: resume 分岐の catch が理由コメントなしで握りつぶし。
次回ポーリングで再開される意図をコメントに明記。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: コメント追記のみ（🟡 + 📌 + S + 🔧 → 手順 3b 自動修正）。

---

**識別子**: RC-31（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/minimumParticipants.ts:109` / `functions/default/src/stores/event.ts:433`

**該当コード（レビュー時点の diff）**:

```diff
+    getEventCanceledMinimumParticipantsForPostProcessing(),
...
+  const resumeTargets: ShokujiiEvent[] = []
+  for (const event of dedupeEventsByKey(resumeCandidates)) {
+    const pipeline = await getEventBulkCancelPipeline(event.community_id, event.id)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: resume 候補クエリが `judgment_evaluated_at > 0` の全期間スキャンで、自動中止イベントが増えるほど毎ポーリング（5 分毎）の read コストが際限なく増加する。さらに候補ごとの pipeline 取得を for ループで逐次 `await` している（チェックリスト「ループ内で Firestore の read を逐次 await していないか」）→ 判定日時に lookback 窓（7 日）を設け、pipeline 取得は `Promise.all` で並列化する。

**コメント要約**: resume 候補クエリが全期間スキャン + pipeline を逐次 await。
判定日時 7 日の lookback 窓 + `Promise.all` 化。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: ⚡ 性能

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: クエリ条件 1 箇所 + 並列化のみで修正方針が一意（🟡 + 📌 + S + 🔧 → 手順 3b 自動修正）。`BULK_CANCEL_RESUME_LOOKBACK_MILLIS`（7 日）を定数化し、超過分は手動対応とする旨をコメントに明記。

---

**識別子**: RC-32（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/minimumParticipantsJudgment.ts:45`

**該当コード（レビュー時点の diff）**:

```diff
+    await syncEventMembersFromOrderedInTransaction(tEvent, ordered, transaction)  // write
...
+    const canceledOrders = await applyBulkEventCancelInTransaction({ ... })       // 内部で read
...
+    const freshEvent = await getEventInCommunity(community_id, event_id, transaction)  // write 後の read
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [📐リファクタ/M]: Firestore の Transaction は全 read を write より前に実行する必要があるが、(1) members 同期（write）の後に `applyBulkEventCancelInTransaction` が Event・ordered・補助金 usage を read、(2) apply の write 後に `freshEvent` を再 read しており、自動中止パスは必ず `READ_AFTER_WRITE` の実行時エラーになる（テストは transaction / apply をモックしているため検出不能）→ read を前段に集約し、apply へ読み込み済みの Event / ordered を渡し、`judgment_evaluated_at` の確定は再 read せず同一インスタンスの `updateEvent` で行う。

**コメント要約**: 判定 Transaction が write 後に read で自動中止パスが必ず実行時エラー。
read を前段に集約し preloaded 引き渡し + 同一インスタンスで更新。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 機能の主目的（最小催行自動中止）が常に失敗する重大バグ（RC-4 と同種の read-after-write）。`applyBulkEventCancelInTransaction` に `preloadedEvent` / `preloadedOrdered` を追加し、judgment は read → apply（補助金 read 含む）→ members 同期 write → `updateEvent` の順に再構成（手順 3a 自動修正）。preloaded 引き渡しと read 回数のテストを追加。

---

**識別子**: RC-33（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/stores/eventBulkCancelPipeline.ts:23`

**該当コード（レビュー時点の diff）**:

```diff
+function pipelineRef(communityId: string, eventId: string) {
+  return getFirestore().collection('communities')...doc(PIPELINE_DOC_ID)   // withConverter なし
+}
...
+    side_effects_user_ids: Array.isArray(data?.side_effects_user_ids) ? (data.side_effects_user_ids as string[]) : [],
...
+  const payload = { ...patch, updated_at: Date.now() }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [📐リファクタ/M]: pipeline store が規約違反の複合: (1) `withConverter` なしの生 ref で read/write（Zod バリデーションなし）、(2) `as string[]` キャスト（`as` 禁止）、(3) common 外での手書きスキーマ定義、(4) `Date.now()`（luxon を使う）、(5) `updated_at` が number（DbSchema は TimestampSchema）→ `common/src/schemas/EventBulkCancelPipeline.ts` に DbSchema / AppSchema + クラスを新設し、store は Converter 経由の get / save に書き直す。

**コメント要約**: pipeline store が withConverter なし生 ref・`as` キャスト・common 外スキーマ・`Date.now()`。
common に `EventBulkCancelPipeline` Zod スキーマ + Converter を新設。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: AGENTS.md「xxxRef は必ず withConverter 付き」「`as` 禁止」「スキーマは common に Zod で定義」は厳守ルール。EventStripe のパターンに倣い `EventBulkCancelPipeline`（DbSchema: TimestampSchema / AppSchema: EpochMillisSchema）を新設、store を Converter + 全フィールド書き戻しに変更（手順 3a 自動修正）。`isPostProcessingIncomplete` はクラスの getter に移動。

---

## 評価セッション（2026-08-19 19:54 JST・review-comments-evaluate auto）

- **評価日時**: 2026-08-19 19:54 JST
- **ブランチ名**: feature/2123-minimum-participants-auto-cancel
- **PR**: #2231
- **REVIEW_REQUEST_SINCE**: 2026-08-19T10:45:39Z
- **partial**: true（Codex usage limits / connect のみ。Copilot substantive あり）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（依頼定型文 id:5341026303、Codex limits id:5341027791、Codex connect id:5341054419、参加者テンプレ id:5341053508 RC-6/RC-11 重複）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-34 | 5341053508 | 👌 修正不要 | — | 📌 スコープ内 | — | 👀 確認のみ | — | canceled パスで applyBulk 後に members 同期する順序<br>`updateEvent` は Object.assign + merge で event_canceled を保持（コメント済み） |
| [ ] | RC-35 | 5341053508 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | `cancelEventBulkCore` が Transaction 外 `recalcEventMembers` で judgment 経路と非対称 |
| [ ] | RC-36 | 5341053508 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | ⚡ 性能 | 📐 リファクタ | M | `removeEventFromFriendHistory` が参加者 n 人で O(n²) write |
| [x] | RC-37 | 5341053508 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 先払い `some(stripe_id==null)` の意図をコメントで明示 |
| [x] | RC-38 | 3812300951 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 決済 | 🔧 微修正 | S | `isPostProcessingIncomplete` に `stripe_refunds_done_at` を含める |

**識別子**: RC-34（GitHub id: 5341053508・Copilot トップレベル RC-2）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/minimumParticipantsJudgment.ts:74`

**該当コード（レビュー時点の diff）**:

```typescript
    const canceledOrders = await applyBulkEventCancelInTransaction({ ... })
    await syncEventMembersFromOrderedInTransaction(tEvent, ordered, transaction)
    await tEvent.updateEvent({ minimum_participants: evaluatedMp }, 'system', transaction)
```

**レビュワーのコメント（原文）**:

🟡 RC-2: `minimumParticipantsJudgment.ts:59-68` — canceled パスでのメンバー同期タイミング。`applyBulkEventCancelInTransaction` 内で既に `tEvent.updateEvent`（注文キャンセル・event_canceled 化）が呼ばれています。その後に `syncEventMembersFromOrderedInTransaction` → `tEvent.updateEvent({ minimum_participants })` の順で実行されますが、コード末尾のコメント（「同一インスタンスを更新済みのため event_canceled を保ったまま確定できる」）は `updateEvent` の実装が差分マージであることを前提としています。`updateEvent` の実装を確認し、`event_status` が上書きされないことをテストで保証するか、コメントに明記してください。

**コメント要約**: applyBulk 後の members 同期順序と updateEvent の部分更新前提。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: `ShokujiiEvent.updateEvent` は `Object.assign(this, data)` + Firestore `merge: true` で部分更新。75–76 行目のコメントが同一インスタンス前提を明記済み。event_status 上書きリスクは実装どおり発生しない。

---

**識別子**: RC-35（GitHub id: 5341053508・Copilot トップレベル RC-3）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/cancelEventBulkCore.ts:80`

**該当コード（レビュー時点の diff）**:

```typescript
  await recalcEventMembers(eventBefore)
  const canceledOrders = await getFirestore().runTransaction(async (transaction) => {
    return applyBulkEventCancelInTransaction({ ... })
  })
```

**レビュワーのコメント（原文）**:

🟡 RC-3: `cancelEventBulkCore.ts:80` — Transaction 外 `recalcEventMembers` と `runMinimumParticipantsJudgmentTransaction` 経路の非対称（前回継続）。`runMinimumParticipantsJudgmentTransaction` では `syncEventMembersFromOrderedInTransaction`（Transaction 内）でメンバーを同期する一方、`cancelEventBulkCore` 経路では `recalcEventMembers`（Transaction 外）で同期しています。`applyBulkEventCancelInTransaction` 自体はメンバー同期をしないため、`cancelEventBulkCore` 経路では Transaction 後に members フィールドが中止前の状態で残るリスクがあります。設計意図をコメントで明示するか、Transaction 内で `syncEventMembersFromOrderedInTransaction` を呼ぶよう統一することを検討してください。

**コメント要約**: cancelEventBulkCore と judgment 経路の members 同期タイミング非対称。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 後処理の `applyOrderCanceledSideEffects` で members は最終的に再集約されるが、Transaction 直後〜後処理までの窗口と経路差は設計上の確認事項。統一または意図コメントが望ましい。

---

**識別子**: RC-36（GitHub id: 5341053508・Copilot トップレベル RC-4）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/finishBulkEventCancelPostProcessing.ts:139`

**該当コード（レビュー時点の diff）**:

```typescript
  for (const anchorUserId of participantUserIds) {
    const counterparts = participantUserIds.filter((id) => id !== anchorUserId)
    await removeEventFromFriendHistory({ ... })
  }
```

**レビュワーのコメント（原文）**:

🟡 RC-4: `finishBulkEventCancelPostProcessing.ts:139-149` — `removeEventFromFriendHistory` が O(n²)（前回継続）。n 人参加の場合 n × (n-1) 回の Firestore write が発生します。`removeEventFromFriendHistory` のシグネチャ上、anchor 1 人・counterparts n-1 人の組み合わせが必要なのか、1 度の呼び出しで全ペアを処理できないか実装を確認してください。

**コメント要約**: 友人履歴削除ループが O(n²) write。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: ⚡ 性能

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 大規模イベントで write コスト増。API 制約の確認と batch 化検討は別タスクとして妥当。

---

**識別子**: RC-37（GitHub id: 5341053508・Copilot トップレベル RC-5）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/applyBulkEventCancelInTransaction.ts:82`

**該当コード（レビュー時点の diff）**:

```typescript
  if (eventPayment === 'user_advance' && ordered.length > 0 && ordered.some((o) => o.stripe_id == null)) {
```

**レビュワーのコメント（原文）**:

🟡 RC-5: `applyBulkEventCancelInTransaction.ts:82` — `ordered.some` の意図明示。`some`（1件でも null なら throw）は「先払い注文は全件 stripe_id 必須」という仕様を実装しており正しいですが、旧実装（`every`）と挙動が異なります。意図の違いをインラインコメントで一言添えると保守時の混乱を防げます。

**コメント要約**: `some` による部分欠落検出の意図をコメント化。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 妥当な保守性指摘。インラインコメントを追加（手順 4a 自動修正）。

---

**識別子**: RC-38（GitHub id: 3812300951）

**レビュワー**: Copilot

**指摘箇所**: `common/src/schemas/EventBulkCancelPipeline.ts:72`

**該当コード（レビュー時点の diff）**:

```diff
+  get isPostProcessingIncomplete(): boolean {
+    return this.shop_mail_sent_at == null || this.participant_mails_sent_at == null
+  }
```

**レビュワーのコメント（原文）**:

[must] pipeline の再開判定がメール送信フラグのみになっており、Stripe 返金が失敗して `stripe_refunds_done_at` が未確定のままでも `isPostProcessingIncomplete === false` になり得ます。これだと `finishBulkEventCancelPostProcessing` のコメント（失敗が残る場合は再開時に再試行）と矛盾し、返金が自動再開されません。`stripe_refunds_done_at` も未完了判定に含めてください。

**コメント要約**: 返金失敗時も resume 対象にするため `stripe_refunds_done_at` を未完了判定へ。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 決済

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-19 の finish 側ゲートと矛盾する実バグ。getter に `stripe_refunds_done_at == null` を追加（手順 4a 自動修正）。

---

## 評価セッション（2026-08-21 16:22・review-comments-evaluate・auto・partial）

- **評価日時**: 2026-08-21 16:22 JST
- **ブランチ名**: `feature/2123-minimum-participants-auto-cancel`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2231
- **REVIEW_REQUEST_SINCE**: 2026-08-21T07:12:55Z
- **partial**: true（Codex は connect 案内のみ。Copilot substantive あり）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文 id:5366438816、Codex connect id:5366475852）
- **重複指摘スキップ件数**: 1（Copilot トップレベル id:5366474371 — RC-6/11・RC-21・RC-36 と同一論点）
- **手順 4a 自動修正**: なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-39 | 3828183031 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | pipeline の read→set 丸ごと書き戻しが並列 resume で競合<br>Transaction または原子的 update が必要（RC-28 と関連） |

**識別子**: RC-39（GitHub id: 3828183031）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/finishBulkEventCancelPostProcessing.ts:78`

**該当コード（レビュー時点の diff）**:

```diff
…（diff 先頭省略）
+  const pipeline = await getEventBulkCancelPipeline(community_id, event_id)
+  if (pipeline == null) {
+    // 一括中止トランザクション（applyBulkEventCancelInTransaction）が必ず作成するため、
+    // 無い場合は本機能以外の経路で中止されたイベント。後処理してはいけない
+    throw new Error('一括中止パイプラインが見つかりません')
+  }
```

**レビュワーのコメント（原文）**:

[imo] `finishBulkEventCancelPostProcessing` が pipeline を一度 read して以降、各ステップ完了ごとに `set` で丸ごと書き戻しています。Scheduled が重複起動した場合や手動再開が並列で走った場合、古い pipeline を上書きしてチェックポイントが巻き戻る/二重送信の余地があります（特にメール送信フラグや `side_effects_user_ids`）。排他が必要なら、pipeline 更新は Transaction で read→更新、もしくは `update` + `arrayUnion` 等の競合に強い更新に寄せるのが安全です。

**コメント要約**: 各ステップ後の pipeline 全件 `set` が並列実行で古い状態を上書きしうる。
Transaction または `arrayUnion` 等の原子的更新へ寄せるべき（RC-28 のレース論点と関連）。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 指摘は妥当。現状は side_effects ループ内でも毎回 pipeline 全体を save しており、Scheduled 重複や Callable との並列で lost update が起きうる。ただしメールは送信成功後のみフラグ確定（RC-26）など緩和あり。RC-28 と合わせて排他設計（Transaction / フィールド単位 update）を検討する工数 M のリファクタ。自動修正対象外。

---

## 評価セッション（2026-08-21 17:58・review-comments-evaluate）

- **評価日時**: 2026-08-21 17:58 JST
- **ブランチ名**: `feature/2123-minimum-participants-auto-cancel`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2231
- **REVIEW_REQUEST_SINCE**: 2026-08-21T08:51:25Z
- **partial**: true（Codex は connect 案内のみ。Copilot substantive あり）
- **新規 RC なし**
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文 id:5367720693、Codex connect id:5367738190）
- **重複指摘スキップ件数**: 2（Copilot トップレベル id:5367736171 — RC-6/11・RC-21 と同一論点）
- **手順 4a 自動修正**: なし

### RC 一覧（サマリ）

（本セッションで新規 RC 採番なし。Copilot 指摘 2 件は既存 RC-6/11・RC-21 と重複のためスキップ）

---

## 評価セッション（2026-08-21 21:11・review-comments-evaluate・auto）

- **評価日時**: 2026-08-21 21:11 JST
- **ブランチ名**: `feature/2123-minimum-participants-auto-cancel`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2231
- **REVIEW_REQUEST_SINCE**: 2026-08-21T12:00:19Z
- **partial**: false（Copilot substantive 2 件 + Codex substantive 1 件）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（依頼定型文 id:5369540352、Copilot エラー id:5369541149、Codex connect id:5369615405）
- **重複指摘スキップ件数**: 4（Copilot トップレベル id:5369614328 — RC-6/11・RC-38・RC-21・RC-36 と同一論点）
- **手順 4a 自動修正**: RC-40（`EventBulkCancelPipeline.isPostProcessingIncomplete` 拡張 + テスト追加）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-40 | 3830028169 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 💾 データ | 🔧 微修正 | S | `isPostProcessingIncomplete` が副作用・友人履歴未完了を見ていない<br>participant 全員の side_effects と friend_history を resume 判定に含める |
| [ ] | RC-41 | 3830033339 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | ⚡ 性能, 💾 データ | 📐 リファクタ | L | 大量注文を単一 Transaction で更新すると 500 write 上限超過<br>分割・再開可能な一括中止パイプラインが必要 |

**識別子**: RC-40（GitHub id: 3830028169）

**レビュワー**: Copilot

**指摘箇所**: `common/src/schemas/EventBulkCancelPipeline.ts:74`

**該当コード（レビュー時点の diff）**:

```diff
  get isPostProcessingIncomplete(): boolean {
    return (
      this.shop_mail_sent_at == null || this.participant_mails_sent_at == null || this.stripe_refunds_done_at == null
    )
  }
```

**レビュワーのコメント（原文）**:

[must] pipeline の resume 判定が shop/participant メールと Stripe 返金の3項目だけになっており、`side_effects_user_ids` や `friend_history_removed_at` が未完了でも `isPostProcessingIncomplete=false` になり得ます。これだと後処理の一部失敗（例: applyOrderCanceledSideEffects の一時失敗）を次回ポーリングで再開できず、データ整合が崩れたまま確定してしまいます。`participant_user_ids` を基準に副作用・友達履歴の未完了も resume 対象に含めてください。

**コメント要約**: resume 判定に side_effects 未完了・友人履歴未削除が含まれておらず、部分失敗後に再開されない。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘は妥当。`finishBulkEventCancelPostProcessing` は side_effects / friend_history 失敗時にログのみで続行するため、getter に未完了判定を含めないと Scheduled が resume しない。手順 4a で getter を拡張し Vitest を追加。

---

**識別子**: RC-41（GitHub id: 3830033339）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/applyBulkEventCancelInTransaction.ts:99`

**レビュワーのコメント（原文）**:

**P2** 大量注文を単一トランザクションで更新しない — 注文数量ごとに `member_orders` ドキュメントが作成され、`event_max_people` にも上限がないため、注文ドキュメント数と Event・pipeline・企業利用枠の更新を合わせて Firestore の 500 write 上限を超えるイベントでは、このトランザクションが毎回失敗します。その場合はイベントの中止も評価済みマーカーの保存も行われず、Scheduler が同じ失敗を繰り返すため、注文数を制限するか、処理対象を分割して再開可能な一括中止パイプラインにしてください。

**コメント要約**: 大規模イベントで Transaction write 500 上限を超え、中止・評価済みマーカー保存が永続的に失敗しうる。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: ⚡ 性能, 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: L

**判断理由**: 指摘は妥当だが、Transaction 分割・再開設計は RC-19 以降のパイプライン拡張に波及する大規模リファクタ。Phase 1 では event_max_people 無上限の既存制約もあり、別途設計判断が必要。自動修正対象外。

---

## 評価セッション（2026-08-21 24:08・review-comments-evaluate・auto・partial）

- **評価日時**: 2026-08-21 24:08 JST
- **ブランチ名**: `feature/2123-minimum-participants-auto-cancel`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2231
- **REVIEW_REQUEST_SINCE**: 2026-08-21T14:59:57Z
- **partial**: true（Codex は connect 案内のみ。Copilot substantive 1 件）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文 id:5371579871、Codex connect id:5371590892）
- **重複指摘スキップ件数**: 1（Copilot トップレベル id:5371589598 — RC-21・RC-36 継続、RC-38/40 解消確認、UI 文言 cd74914 は問題なし）
- **新規 RC**: 0
- **手順 4a 自動修正**: なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| — | — | — | — | — | — | — | — | — | 新規 RC なし（継続: RC-21 / RC-36 / RC-39 / RC-41） |

---

## 評価セッション（2026-08-22 01:20・shokujii-code-review）

- **評価日時**: 2026-08-22 01:20 JST
- **ブランチ名**: `feature/2123-minimum-participants-auto-cancel`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2231
- **レビュー範囲**: 直近 4 コミット（`186fec8b` 〜 `35f6b746`。`cancel_source` / `canceled_by` の追加と注文履歴ラベル表示）
- **新規 RC**: 7（RC-42 〜 RC-48）
- **手順 3a/3b 自動修正**: 5 件（RC-43 / RC-44 / RC-46 / RC-47 / RC-48）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-42 | なし | 👌 修正不要 | — | 📌 スコープ内 | 🔐 セキュリティ | 👀 確認のみ | — | `canceled_by` が PF 未認証 read 可能な `member_orders` に追加される<br>既存の `user_id` / Event `created_by` と同等の公開 uid で追加露出なし |
| [x] | RC-43 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `orderCancelSource.test.ts` の import が Prettier 未整形で PR verify の format:check が落ちる |
| [x] | RC-44 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🧪 テスト | 🔧 微修正 | S | `cancel_source='user'` かつイベント中止済みのケースのテストが無い |
| [ ] | RC-45 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | UI 文言の i18n キーを返す関数を `common` に置いている<br>`base` 専用ロジックのため `base/src/utils` が適切 |
| [x] | RC-46 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `orderCanceledLabelI18nKey` の `default` で網羅性チェックが効かず、`cancel_source` 追加時にサイレントで「キャンセル済み」表示になる |
| [x] | RC-47 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📄 ドキュメント | 📄 ドキュメントのみ | S | 全キャンセル時カードラベルの混在ルール（`canceled_event` 優先）が仕様書に未記載 |
| [x] | RC-48 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `BulkCancelInitiator` と `CancelEventBulkInitiator` の二重定義 |

---

**識別子**: RC-42（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/EventMemberOrder.ts:90`

**該当コード（レビュー時点の diff）**:

```diff
   canceled_at: TimestampSchema.optional(),
+  cancel_source: z.enum(EVENT_MEMBER_ORDER_CANCEL_SOURCE_VALUES).optional(),
+  canceled_by: z.string().nonempty().optional(),
```

**レビュワーのコメント（原文）**:

👌 **修正不要** [👀確認のみ/—]: `firestore.rules` の collectionGroup `member_orders` には「PF（`enterprise_id == null`）は doc 全体が未認証 read 可。機微情報を `member_orders` に追加しないこと（#2282）」というコメントがあり、今回追加した `canceled_by`（主催者 uid / サポート uid / `'system'`）もこの公開範囲に入る → 露出する uid は既に公開されている `member_orders.user_id`・`Event.created_by` と同種であり、追加の情報漏洩にはならない。

**コメント要約**: `canceled_by` が PF 未認証 read 対象に含まれるが、露出する uid は既存公開分と同等。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔐 セキュリティ

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: `canceled_by` の値域は `'system'`・主催者 uid・本人 uid。主催者 uid は `Event.created_by`（公開 read）、本人 uid は `member_orders.user_id`（同一ドキュメント）で既に取得可能なため、#2282 の公開範囲見直し以上の追加対応は不要。

---

**識別子**: RC-43（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/utils/orderCancelSource.test.ts:1`

**該当コード（レビュー時点の diff）**:

```diff
+import {
+  cancelSourceFromBulkInitiator,
+  orderCanceledLabelI18nKey,
+} from './orderCancelSource.js'
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: import が Prettier の整形結果と異なり、`npx prettier --check` が warn を出す（printWidth 内に収まるため 1 行になるべき）→ PR verify の `format:check` が失敗するため 1 行にまとめる。

**コメント要約**: テストファイルの import が未整形で CI の format:check が落ちる。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `prettier --check` で再現を確認。手順 3a で 1 行 import に修正し、再チェックで All matched files use Prettier code style を確認。

---

**識別子**: RC-44（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/utils/orderCancelSource.test.ts:18`

**該当コード（レビュー時点の diff）**:

```diff
+describe('orderCanceledLabelI18nKey', () => {
+  it('user → canceled', () => {
+    expect(orderCanceledLabelI18nKey('user', false)).toBe('user_event_card.canceled')
+  })
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 「参加者が自分でキャンセルした後にイベントが中止された」ケース（`cancel_source='user'` + `eventCanceled=true`）のテストが無い。仕様上 `cancel_source` は推定より優先されるべき分岐であり、推定ロジックを触ったときに退行を検知できない → `orderCanceledLabelI18nKey('user', true)` のケースを追加する。

**コメント要約**: `cancel_source` が推定より優先されることを保証するテストが不足。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🧪 テスト

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 微修正で修正方針が一意のため手順 3b で自動修正。テストケースを追加し 8 件パスを確認。

---

**識別子**: RC-45（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/utils/orderCancelSource.ts:17`

**該当コード（レビュー時点の diff）**:

```diff
+/** 注文キャンセル理由からユーザー向け i18n キーを返す */
+export function orderCanceledLabelI18nKey(
+  cancelSource: EventMemberOrderCancelSourceType | undefined,
+  eventCanceled: boolean,
+): 'user_event_card.canceled' | 'user_event_card.canceled_event' | 'user_event_card.canceled_reject' {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: `common` に UI 文言の i18n キー（`user_event_card.*`）を持つ関数を新設している。`common` は `functions` からも参照される UI 非依存レイヤであり、他の `common/src/utils` にも i18n キーを返す前例が無い → 表示層専用の `orderCanceledLabelI18nKey` は `base/src/utils/` に移し、`cancelSourceFromBulkInitiator`（functions が使う）のみ `common` に残す構成が望ましい。

**コメント要約**: UI 文言キーのマッピングが `common` にあり、レイヤ責務が UI 側に染み出している。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: 指摘は妥当だが、種別が 📐 リファクタ（ファイル移動 + テスト移動 + import 変更）で auto-fix-policy の自動修正条件（🔧 微修正 / 📄 ドキュメントのみ）に該当しない。`base` 側でテストを持てるかも含め方針判断が必要なため、ユーザー判断待ちとする。

---

**識別子**: RC-46（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/utils/orderCancelSource.ts:26`

**該当コード（レビュー時点の diff）**:

```diff
+    case 'organizer_reject':
+      return 'user_event_card.canceled_reject'
+    default:
+      return 'user_event_card.canceled'
+  }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `switch` の `default` により `EventMemberOrderCancelSourceType` の網羅性チェックが効かない。`EVENT_MEMBER_ORDER_CANCEL_SOURCE_VALUES` に値を追加しても型エラーにならず、新しいキャンセル種別がサイレントに「キャンセル済み」と表示される（同ファイルの `cancelSourceFromBulkInitiator` は網羅 switch で書かれており不統一）→ `case 'user'` を明示して `default` を削除する。

**コメント要約**: `default` 分岐で網羅性チェックが無効化され、enum 追加時に誤ラベル表示となる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 現時点で表示が誤るわけではないため 🟡 とし、📌 + S + 🔧 微修正で方針が一意のため手順 3b で自動修正。`case 'user'` を明示して `default` を削除し、`tsc -b` と vitest の通過を確認。

---

**識別子**: RC-47（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/07_リファクタリング/09_EventMemberOrderに伴うキャンセル機能.md:151`

**該当コード（レビュー時点の diff）**:

```diff
+**表示箇所**: 注文履歴カード右下（全キャンセル時）、キャンセルダイアログ内のグレーアウト行。**注文行ごと**に分岐（同一イベント内で `user` と `event_*` が混在しうる）。
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 正本ドキュメントは「注文行ごとに分岐」までしか定義していないが、実装（`UserEventCard.vue` の `allCanceledLabelKey`）はカード右下の 1 ラベルに丸める際「`canceled_event` があれば優先、それ以外は `canceled`」という独自ルールを持つ → 混在時の優先順位を正本に明記する。

**コメント要約**: カード右下ラベルの混在時優先順位が実装のみに存在し、仕様書に未記載。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📄 ドキュメント

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 📌 + S + 📄 ドキュメントのみで方針が一意のため手順 3b で自動修正。正本に「カード右下（全キャンセル時）のラベル決定」表を追記した。

---

**識別子**: RC-48（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/cancelEventBulkCore.ts:14`

**該当コード（レビュー時点の diff）**:

```diff
 export type CancelEventBulkInitiator = 'minimum_participants' | 'organizer_manual' | 'support'
```

```diff
+/** 一括中止コアの initiator（functions の CancelEventBulkInitiator と同一） */
+export const BULK_CANCEL_INITIATOR_VALUES = ['minimum_participants', 'organizer_manual', 'support'] as const
+export type BulkCancelInitiator = (typeof BULK_CANCEL_INITIATOR_VALUES)[number]
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: initiator の値集合が `common/src/utils/orderCancelSource.ts` と `functions/default/src/cancelEventBulkCore.ts` に二重定義されており、コメントで「同一」と書いて整合を人手に委ねている → `CancelEventBulkInitiator` を `BulkCancelInitiator` のエイリアスにして単一の正本に統一する。

**コメント要約**: initiator 型が common と functions で二重定義され、整合がコメント頼りになっている。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 微修正で方針が一意のため手順 3b で自動修正。`CancelEventBulkInitiator` を common の `BulkCancelInitiator` エイリアスに変更し、common 側コメントも「正本」表記に更新。`tsc -b`（common / functions）で型通過を確認。

---

## 評価セッション（2026-08-22 02:04・review-comments-evaluate・auto）

- **評価日時**: 2026-08-22 02:04 JST
- **ブランチ名**: `feature/2123-minimum-participants-auto-cancel`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2231
- **REVIEW_REQUEST_SINCE**: 2026-08-21T16:52:40Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼定型文 id:5372771373、Codex connect id:5372848928）
- **重複指摘スキップ件数**: 1（Copilot トップレベル id:5372847493 — RC-49 インラインと同一）
- **新規 RC**: 3（RC-49 〜 RC-51）
- **手順 4a 自動修正**: 2 件（RC-49 / RC-50）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-49 | 3832127253 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 決済, 💾 データ | 🔧 微修正 | S | 返金リトライ時に既存 `stripes.refunds` を見ず累計超過で例外<br>同一 order_ids 記録済みなら skip |
| [x] | RC-50 | 3832139569 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 決済, 🐛 実害 | 🔧 微修正 | S | `stripe_id` 検証が `user_advance` のみ<br>自己負担あり注文全般で ID 欠落を中止前に拒否 |
| [ ] | RC-51 | 3832139575 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX, 💾 データ | 📋 仕様追加 | M | 参加者メールで宛先未解決ユーザーを無言除外し完了扱い<br>対象数と有効宛先数の不一致を記録・再処理可能に |

---

**識別子**: RC-49（GitHub id: 3832127253）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/refundMemberOrdersStripe.ts:82`

**レビュワーのコメント（原文）**:

[must] `refundMemberOrdersStripe` が同一 `stripe_id` + 同一 `order_ids` のリトライで、既に返金済みでも `existingRefundTotalPre + refundAmount > pay_amount` に引っかかって例外になり得ます。事前に `stripes.refunds` に同一 `order_ids`（+ amount） の返金記録がある場合は skip してください。

**コメント要約**: 返金済みリトライで Stripe API 前に累計超過例外となり `stripe_refunds_done_at` が未確定のまま。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 決済, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。手順 4a で同一 order_ids + amount の記録済み判定を追加し skip。

---

**識別子**: RC-50（GitHub id: 3832139569）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/applyBulkEventCancelInTransaction.ts:86`

**レビュワーのコメント（原文）**:

P1 自己負担のある注文でも決済 ID を必須にする — `enterprise_subsidy` でも自己負担額が正の注文は Stripe 決済されるが、`stripe_id` 欠落時に未返金のまま `stripe_refunds_done_at` が確定する。

**コメント要約**: 返金必要な注文の `stripe_id` 欠落を `user_advance` 以外で検出できていない。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 決済, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。手順 4a で `menu_price - getMemberOrderDiscountAmount(o) > 0` の注文に `stripe_id` 必須チェックを追加（`user_advance` 限定を置換）。

---

**識別子**: RC-51（GitHub id: 3832139575）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/eventBulkCancellationMail.ts:92`

**レビュワーのコメント（原文）**:

P2 宛先を解決できない参加者を送信済みにしない — 有効宛先のみ送信成功で参加者メール工程全体が完了扱いとなり、除外参加者に永久に通知が届かない。

**コメント要約**: 宛先未解決ユーザーと送信済みフラグの不整合。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 💾 データ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 指摘妥当だが pipeline への未送信ユーザー記録等が必要で 📋 仕様追加 M。自動修正対象外。

---
