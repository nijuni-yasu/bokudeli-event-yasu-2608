# ブランチ doc/v2.12-deploy レビュー記録

v2.12 リリースに向けた `v2.11.0..HEAD` 全差分のセルフレビュー記録（445 コミット / 約 400 ソースファイル）。

**記載方針**: 指摘件数が 74 件と多いため、**RC 一覧（サマリ）に全件**を記録し、13 項目ブロックは **🚨 必須修正**と**リリース判断が必要な指摘**に限定する。それ以外の 🟡 は要約列 2 行（指摘の要点 / 参照・影響・方向性）で追跡する。既存の `review-*.md` に記録済みの指摘（未着手を含む）は重複計上を避けて再掲していない。

**評価 + ステータス（共通区分）**: **評価**（不変）= 🚨 必須修正 / 🟡 修正提案 / 👌 修正不要。**ステータス**（可変）= 未着手 / ✅ 対応済み / 📤 #NNNN 別Issue化 / `—`。**❌ 未対応は使わない**。

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | `ogpRequest.ts:209` イベント側にパス長チェックが無く `/c/a/e/{id}/foo` が 200 + 自己参照 canonical を返す<br>コミュニティ側（`:293`）と揃えて `paths.length !== 5` を追加。回帰テストも追加 |
| [x] | RC-2 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 📑 仕様書 | 🆕 新機能 | M | `ogpRequest.ts:228` 限定公開イベント / 非公開・未承認コミュニティが素の 404 になり、URL 共有・直リンク・リロードで到達不能（v2.11.0 からの退行）<br>「インデックス除外」と「画面配信」を分離。不在・削除・エンプラ配下は 404 のまま、限定公開・未承認は 200 + `X-Robots-Tag: noindex, nofollow` で素の SPA を返す。SEO タスク P2-5 の記述も更新 |
| [x] | RC-3 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | `seo/escape.ts:11` `&amp;` が二重エスケープされ meta description に `&amp;` が露出<br>エンティティのデコードを拡張し、タグ除去 → デコードの順に変更。テスト 2 件追加 |
| [x] | RC-4 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `seo/jsonLd.ts:6` `DEFAULT_TIME_ZONE` をローカル再定義し ISO 変換も call site 実装<br>`common/utils/datetime.ts` に `convertToIso8601` を追加して置換 |
| [x] | RC-5 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `slackEventNotification.ts:36` `EVENT_HOST` 固定の `getEventUrl` のままで、enterprise イベントの Slack リンクが必ず 404 になる<br>メール系と同じ `getEventUrlForEvent` に移行。host 未解決時は `logger.error` を出して通知を送らない |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `slackOrderNotification.ts:72` RC-5 と同一問題（注文通知の URL）<br>RC-5 と同じ方針で `getEventUrlForEvent` に移行。同一メッセージ内のプロフィール URL も同じ理由で 404 になるため `getUserUrlForCommunity` を追加して解決 |
| [ ] | RC-7 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | `stores/community.ts:214` `limit(1)` + `docs[0]` で `community_account` 重複を無警告に片方だけ返す<br>PF 側にアカウント一意性キーが無い。`limit(2)` + 重複時 `logger.error` に変更 |
| [ ] | RC-8 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `stripe.ts:33` モジュールトップレベルで `getFirestore()` を呼んでいる<br>現状は `index.ts` の動的 import で動くが、静的 import された瞬間に `initializeApp` 前評価で落ちる |
| [x] | RC-9 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `common/billingSnapshot.ts:8` 正規表現が月範囲を検証せず `2026-00` が通過し 500 になる<br>`parseYearMonth` による検証に置換。月範囲外のテスト 2 件追加 |
| [x] | RC-10 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `common/dashboardAggregation.ts:83` 12 ヶ月上限の検査前に全期間配列を実体化（`0001-01`〜`9999-12` で約 12 万要素）<br>`countMonthsInRange` を算術計算に置換 |
| [ ] | RC-11 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💰 金銭 | 📋 仕様追加 | M | `common/enterpriseInvoice.ts:73` 請求書番号が `enterprise_id` 先頭 8 文字由来で、前方一致する 2 社が同月に同番号になる<br>`review-dev-enterprise-mvp-v5.md` RC-15 と同一。PDF を本番運用するならリリース前に方針決定 |
| [x] | RC-12 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `functions/enterprise/members.ts:302` `'Asia/Tokyo'` 直書きで当月キーを call site 生成<br>`formatYearMonth(Date.now())` に置換 |
| [ ] | RC-13 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害, 🔒 セキュリティ | 📐 リファクタ | M | `functions/enterprise/members.ts:379` 「最低 1 人の有効な管理者」を Transaction 外の read-then-write で担保しており、同時無効化で管理者 0 人になりうる<br>`role.ts:28-33` の降格チェックも同型。Callable では復旧不能になる |
| [ ] | RC-14 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | S | `functions/enterprise/role.ts:35` Auth クレームを先に更新し member doc を後で更新するため、失敗時にクレームと Firestore が乖離する<br>実害はアクセス不能側に倒れるが自動復旧しない。Firestore 先行に変更 |
| [x] | RC-15 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `functions/enterprise/subsidySettings.ts:39` 履歴が空の企業で監査ログの old 値取得が素の `Error` を投げ、初回の補助設定を保存できない<br>`resolveEnterpriseSubsidySettingsForMonthOrNull` に変更し、初回は監査ログの old 値を `null` にする |
| [x] | RC-16 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | S | `functions/stores/auditLog.ts:67` カーソル doc を毎ページ read しており、doc 不在時は `startAfter` なしで**先頭に巻き戻る**<br>orderBy と同じ値（`timestamp`・`documentId`）指定の `startAfter` に変更。カーソル doc の read も不要になった |
| [ ] | RC-17 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | `functions/stores/dashboard.ts:30` 期間フィルタ・limit なしの全件取得を `Promise.all` でメモリに載せる<br>表示は最大 12 ヶ月。読み取り課金が累積データ量に線形。snapshot バッチで乗算される |
| [x] | RC-18 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `functions/utils/enterpriseSubsidyOrders.ts:104` `auth.token.enterprise_id as string \| undefined` の `as` キャスト<br>`typeof` 型ガードに置換 |
| [ ] | RC-19 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 📐 リファクタ | M | `functions/utils/enterpriseSubsidyOrders.ts:104` 注文系ガードが `enterprise_id` クレームの単純比較のみで、`user_type` 確認と `firebase.tenant` 照合が無い<br>管理者系（`assertEnterpriseAdminFromUid`）は強化済みで非対称。現時点で悪用経路は未確認 |
| [ ] | RC-20 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `functions/utils/enterpriseSubsidyOrders.ts:132` `orderIds` が型に残るのみで参照されず、渡した順序が使われると誤解させる<br>`review-dev-enterprise-mvp-v5.md` RC-4 と同一 |
| [x] | RC-21 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `functions/utils/enterpriseSubsidyOrders.ts:166` 同一ループ内で `saveOrder` だけ `await` されていない<br>166 行と 430 行を `await` に統一 |
| [ ] | RC-22 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `ChatLog.vue:523` `store.activeRoomId!` の非 null アサーションが 3 箇所（523 / 571 / 586）<br>実行時は関数ガードで守られるが型は絞られていない。RC-86 と同種 |
| [x] | RC-23 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `ChatReactionDetailDialog.vue:49` `fetchUser` の catch が完全無言で、Rules 拒否・通信断がログに残らない<br>`reportClientError(severity: 'warn')` を追加（不存在と失敗の表示分離は RC-24 で扱う） |
| [ ] | RC-24 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | `ChatReactionDetailDialog.vue:103` 表示名フォールバックが Firebase UID 先頭 8 文字で、退会（不存在）と取得失敗が同一表示<br>`base` の `ja.ts` に「退会したユーザー」相当のキーを追加し、失敗は別文言に |
| [ ] | RC-25 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | M | `UserProfileCommunitiesPreviewCard.vue:40` base のプロフィール共通コンポーネントが参照する i18n キー 16 個が base に無く user / enterprise に重複定義<br>片方の削除・変更で生キー表示（RC-146 と同じ事故）。base へ移設が必要 |
| [x] | RC-26 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `UserProfileCommunitiesPreviewCard.vue:51` 同一ファイルで 1 箇所だけ `t()`、他は `$t()`<br>`$t()` に統一し未使用の `useI18n` を削除 |
| [ ] | RC-27 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 📐 リファクタ | M | `userProfilePanel.scss:1` 178 行の共有クラス定義を 12 個の SFC が `<style scoped>` で `@import` し、重複排除されず約 2,100 行出力される<br>`base/src/styles/` へ移してエントリで 1 回読み込む |
| [ ] | RC-28 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 📐 リファクタ | S | `stores/profileListFilter.ts:3` テナント境界フィルタの未指定が `kind: 'none'` → 制約 0 個（全テナント横断）の fail-open<br>`?? { kind: 'none' }` の暗黙デフォルトが 2 store にあり、最後の防衛線が Rules だけになる |
| [ ] | RC-29 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `stores/userFoods.ts:15` `autoLoad` が store ID に含まれず「最初の呼び出し勝ち」になる。JSDoc の「`userOrderHistoryList` と同様」も事実と異なる<br>RC-17（`autoSubscribe`）と同型のアンチパターン |
| [ ] | RC-30 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `base/pages/orders.vue:23` ページサイズ定義が base / user / enterprise の 4 箇所に分散し、store ID に pageSize が含まれる<br>1 箇所変えた時点で注文後の一覧再読込が別インスタンスを掴み無言で失敗する |
| [ ] | RC-31 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 🔧 微修正 | S | `base/pages/orders.vue:58` Stripe 復帰 URL では同一 tick で `reload()` が 2 回走る<br>機能不全ではないが決済直後の読み取りが倍増する |
| [ ] | RC-32 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `base/pages/orders.vue:78` 「空 + hasMore なら追加ロード」が `useAutoLoadWhenEmpty` と重複したインライン実装<br>RC-80 のような修正が入った際に反映漏れになる |
| [ ] | RC-33 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `base/pages/orders.vue:146` base コンポーネントが参照する `tab_orders` / `empty.orders` が base に無く user / enterprise に重複定義<br>RC-25 と同構造 |
| [ ] | RC-34 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 📐 リファクタ | S | `base/composable/cartMonthlyUsage.ts:4` `CartMonthlyUsage` 系 4 export と `enterprise/composable/enterpriseCartMonthlyUsage.ts` が本番コードから未参照の dead code<br>`cart.vue` が `enterpriseSubsidyBudgetLoader` に移行した残骸。削除は影響確認が必要なため未実施 |
| [x] | RC-35 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `base/composable/validators.ts:48` `phoneValidator` だけ `as string` キャストが残存<br>`unknown` + 型ガードに統一 |
| [x] | RC-36 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `downloadBlob.test.ts:141` UA が Android のため share が呼ばれず、テスト名の「share 失敗時のフォールバック」を検証していない<br>iOS UA で share を reject させ `unavailable` を検証する形に変更（未カバーだった catch 分岐をカバー） |
| [x] | RC-37 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `pr-verify.yml:52` `root` フィルタに `.node-version` が無く、Node バージョンのみの変更で verify が丸ごとスキップされる<br>`.node-version` を追加 |
| [ ] | RC-38 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | `firebase.json:73` `partner` / `manager` / `enterprise` には `X-Robots-Tag: noindex` があるが `user` に無く、dev / sandbox がクロール対象になる<br>本番と同一コンテンツで重複コンテンツ扱いになり SEO 施策と衝突する |
| [x] | RC-39 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `firestore.rules:99` `chatMessageExists` が未参照のデッドコード<br>削除（存在チェックは `chatMessageAllowsReaction` の `get()` が兼ねる） |
| [ ] | RC-40 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 👀 確認のみ | S | `firestore.rules:379` `member_orders` collectionGroup の未認証 read で PF 注文（`user_id`・金額・数量）が誰でも横断列挙できる<br>#2282 として据え置き済み。**v2.12 で本番に出る点の受容判断が必要** |
| [ ] | RC-41 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `terraform/scripts/print-enterprise-tenant-fqdns.sh:72` macOS の bash 3.2 では空配列 `${#hosts[@]}` が `set -u` で unbound variable になる<br>テナント 0 件時にエラーメッセージではなく異常終了する |
| [ ] | RC-42 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `user/profile/UserProfilePage.vue:68` ページサイズ `6` のリテラル直書き（RC-30 と同一構造）<br>`[userId].vue` の `PROFILE_EVENT_PAGE_SIZE` と片側だけ変えると Stripe 復帰後の一覧が更新されない |
| [ ] | RC-43 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `user/profile/UserProfilePage.vue:115` リアクティブ依存を持たない `computed` で不変オブジェクトを中継している<br>将来 `profileFilter` を可変にしたとき更新されない罠。`shallowRef` 等で依存を明示する |
| [ ] | RC-44 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📐 リファクタ | S | `user/pages/orders.vue:17` `useNavigateToEventChat` と同一責務の実装が 2 ページにコピーされ、遷移中フラグが無く多重タップを許す<br>composable に寄せる |
| [ ] | RC-45 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `user/router/documentTitle.ts:17` `as` キャストで `EventStoreOptions` を通しており、フィールド追加時に型エラーで気付けない<br>戻り値型注釈または `satisfies` で解消（動的 i18n キーの `as` は別途方針判断が必要） |
| [ ] | RC-46 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `user/pages/u/[userId].vue:89` `autoLoad: false` が store ID に含まれず、子が先に生成済みのため無視される<br>「抑止しているつもりが効いていない」誤解を生む。RC-29 と同根 |
| [ ] | RC-47 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `AdminDiscountSettingsSection.vue:36` `円` / `%` が `ja.ts` を経由せず 4 箇所にハードコード<br>金額整形も `toLocaleString()` 直書きで `priceString` と表記系統が分かれている |
| [ ] | RC-48 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `AdminInvoicesTable.vue:12` 同一実装の `formatYen` が 4 ファイルに複製され、`円` の文言も 4 重管理<br>共有ヘルパーに一本化する |
| [ ] | RC-49 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `AdminDashboardPeriodPicker.vue:29` `defineModel` で受けたオブジェクトのネストプロパティを子が直接書き換えている<br>親の `{ deep: true }` watch のおかげで動いているだけで、`computed` や不変オブジェクトを渡すと静かに壊れる |
| [x] | RC-50 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `RegisterVerticalOverlayNavToggle.vue:16` アンマウント時に無条件で `null` を書き、レイアウト切替でナビの閉じるボタンが無反応になる<br>`unregisterVerticalOverlayNavClose(toggle)` を追加し一致時のみ解除 |
| [ ] | RC-51 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | `enterprise/profile/UserProfilePage.vue:47` setup 内の `throw` でプロフィール単体の失敗が全画面エラー（`/520`）になり、53 行の分岐は到達不能<br>同ファイルに gate 用のローディング / エラー表示があるのに使われていない |
| [ ] | RC-52 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `enterpriseMemberMonthlyUsageHistory.ts:45` `formatYearMonthLabel` が `utils/adminDashboardPeriod.ts:111` と重複し、参照元も分裂している<br>一本化先が 3 案（utils / composable / common）あり方針が一意でないため未実施 |
| [ ] | RC-53 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | `enterpriseMemberMonthlyUsageHistory.ts:151` 設定解決の失敗を無言で握りつぶし、「補助対象外」と同じ `—` 表示になる<br>純関数のユーティリティのため `reportClientError` 追加は設計判断（テスト影響）。未実施 |
| [x] | RC-54 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | `useSessionTimeout.ts:44` catch が `console.error` のみで、タイムアウト強制ログアウトの不成立を運用側から検知できない<br>`reportClientError` に置換 |
| [x] | RC-55 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `enterprise/layouts/default.vue:30` `getChatPath()` を import しているのに `isChatRoute` 内で `/chat` を 2 回リテラル保持<br>`getChatPath()` 基点の判定に変更 |
| [x] | RC-56 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | `enterprise/locales/ja.ts:49` 参照 0 件の i18n キー 3 個（`navigation.discount` / `members.role_change` / `user_profile.tab_usage`）と dead export `getAdminDiscountPath`<br>4 件すべて削除 |
| [ ] | RC-57 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | `audit-logs.vue:10` 監査ログの action 種別 19 個が画面コンポーネントに定義され、`common` の schema は `z.string()` で列挙が無い<br>Functions 側で action を追加してもフィルタ選択肢とラベルの追加漏れを検知できない |
| [x] | RC-58 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `communities/index.vue:17` `EnterpriseCommunityListItem` があるのに構造型を再定義<br>API 型を import して置換 |
| [x] | RC-59 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `communities/index.vue:63` `onMounted` の `getEnterpriseIdFromToken()` 失敗が unhandled rejection になり、空状態が表示される<br>try/catch + 通知を追加（`members/index.vue` `communities/import.vue` も同時対応） |
| [x] | RC-60 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `communities/index.vue:123` `target="_blank"` に `rel="noopener noreferrer"` が無い<br>同種指摘（pr-2071 RC-37〜42 等）と揃えて付与 |
| [x] | RC-61 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `invoices/[yearMonth].vue:59` 非 null アサーション `url!`<br>`v-else-if="url != null"` に変更 |
| [x] | RC-62 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | `invoices/index.vue:23` 期間が不正なとき前回の請求行を残したまま return し、古いデータが有効値に見える<br>`admin/index.vue` と同様に `rows` を空にしてから return |
| [x] | RC-63 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `members/import.vue:22` `onMounted` 失敗時に実行ボタンが完全に無反応になる<br>try/catch と早期 return 時の通知を追加（`communities/import.vue` も同時対応） |
| [x] | RC-64 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `members/import.vue:31` CSV の任意文字列を `as EnterpriseMemberRoleType` でキャスト<br>`ENTERPRISE_MEMBER_ROLE_VALUES` による型ガードに置換 |
| [x] | RC-65 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `members/index.vue:180` `ConfirmDialog` が `okClick` を await しないため、最後の有効な管理者を無効化した際の `failed-precondition` が UI に出ず成功したように見える<br>無効化 / 有効化に try/catch + エラー通知を追加 |
| [x] | RC-66 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `members/index.vue:212` `in` で絞った後に `as` キャストし、サーバー文言をそのまま画面に出している<br>`FirebaseError` + `functions/failed-precondition` の型ガードに変更し、それ以外は既定文言にフォールバック |
| [x] | RC-67 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | `settings.vue:52` 取得失敗時に空フォームがエラー表示なしで描画され、保存ボタンが無反応になる<br>早期 return 前に通知を追加 |
| [x] | RC-68 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `settings.vue:80` `as HTMLInputElement` キャスト<br>`instanceof` 型ガードに置換 |
| [x] | RC-69 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | `settings.vue:91` 生成した Blob URL を `revokeObjectURL` していない<br>選び直し時とアンマウント時に解放（`blob:` 判定でサーバー URL は除外） |
| [ ] | RC-70 | なし | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | `settings.vue:104` 固定パスのロゴを Callable より先にアップロードしており、`updateEnterpriseSettings` 失敗時に「保存に失敗」と出ながらロゴ画像だけ差し替わる<br>初回は Storage に孤児データが残る。パス設計（固定 + `updated_at` バスター）に関わるため方針確認が必要 |
| [x] | RC-71 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `settings.vue:165` テンプレート内 `$refs` + `as` キャストと、空文字を truthy 判定している `v-if`<br>`ref()` バインドと `!== ''` 比較に変更 |
| [ ] | RC-72 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `adminDashboardCsv.ts:10` CSV 列見出しが日本語リテラルで `ja.ts` を通っておらず、`'表示名'` が画面の `'氏名'` と不一致<br>画面とダウンロードで列名が変わる |
| [ ] | RC-73 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | `adminDashboardPeriod.ts:2` `DEFAULT_TIME_ZONE` をアプリ層で新規参照し、luxon による月シフト・当月算出を call site で組み立てている（4 箇所）<br>`common` 側に閉じた util を追加して呼ぶ方針に反する |
| [ ] | RC-74 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 🔧 微修正 | S | `enterpriseTenantCache.ts:72` `cached_at` を持つのに読み出し側で有効期限判定に使っておらず、テナント再割り当て後も古い `tenant_id` が bootstrap に使われる<br>照合は fail-closed なので不正アクセスにはならないが、`cached_at` の意図が未実装 |
| [x] | RC-75 | 3805184137 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `members/import.vue:27` 不正な role を `member` に黙って置換し、Functions の行単位拒否が効かなくなる退行<br>空欄のみ `member` 既定化。非空の不正値はクライアントで行エラーにし API へ送らない |
| [x] | RC-76 | 3805184152 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | `review-fix-2260.md:634` が削除済み `デプロイ手順_v2.12_260719.md` を参照しリンク 404<br>`デプロイ手順_v2.12_260818.md` に更新 |
| [x] | RC-77 | 4962399563 | 👌 修正不要 | — | 📤 スコープ外 | — | 確認のみ | — | Copilot `Pull request overview`（変更サマリのみ・具体指摘なし）<br>情報提供として有用だが対応不要 |
| [x] | RC-78 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | `デプロイ手順_v2.12_260818.md:106` 手動デプロイの参照が `B-7`（CI デプロイ監視）になっており、実体は `B-8`（3 箇所）<br>`B-8` に修正。B-7 を見ても手動 `--force` デプロイの手順に行き着かない |
| [x] | RC-79 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `members/import.vue:64` 行エラー文言 `'ロールが不正です'` が `ja.ts` を経由せずハードコード<br>`admin.members.import_invalid_role` を追加し `t()` 経由に変更 |
| [x] | RC-80 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `members/import.vue:82` `apiResults` の `status: string` が `CsvImportPanel` の `ResultRow`（`'success' \| 'error'`）に不適合で `vue-tsc` が TS2345。PR verify の `build:types` が落ちる<br>RC-75 の対応で導入。`status: 'success' \| 'error'` に修正 |
| [ ] | RC-81 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `user/components/Footer.vue:60` `compact` / 非 `compact` でリンク一覧を全文複製し、下部 5 リンクが完全重複<br>リンク定義の配列化 + `v-for` で解消できるが、既存踏襲の未 i18n 文言の扱いと合わせた判断が必要 |
| [ ] | RC-82 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 📐 リファクタ | S | `user/layouts/default.vue:37` 新規 `isEventPageRoute` がイベント詳細パスを正規表現で直書き（同 PR で enterprise 側は `getChatPath()` に置換済みで非対称）<br>`route.name` 判定 / `router/utils` に判定関数追加の 2 案に分かれるため未着手 |
| [ ] | RC-83 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `invoices/index.vue:23` 不正期間へ切り替えた後でも、先行リクエストの古い請求行が遅れて描画されうる<br>invalid 遷移時にも in-flight 応答を失効させる必要がある |
| [ ] | RC-84 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | `members/import.vue:124` `showResults([...clientErrors, ...apiResults])` が row 順未ソートで、不正ロール行が CSV の順序に関わらず API 結果より常に先に表示される<br>`.sort((a, b) => a.row - b.row)` を追加するだけで解消 |

---

## 評価セッション（2026-08-19・shokujii-code-review / Copilot）

- **評価日時**: 2026-08-19 JST
- **評価者**: Copilot（PR #2286 コードレビュー依頼）
- **ブランチ名**: `doc/v2.12-deploy`
- **PR**: [#2286](https://github.com/nijuniinc/bokudeli-event-new/pull/2286)
- **レビュー範囲**: PR #2286 の Files changed（52 ファイル、全コミット）
- **Outdated 除外件数**: 該当なし
- **既存 review doc との重複除外**: RC-1〜RC-83 と同一の指摘は再掲していない
- **自動修正**: なし（RC-84 のみ新規追加）

### RC 一覧（サマリ）

| 対応 | RC | 評価 | ステータス | 要約 |
|:----:|:---|:---|:---|:---|
| [ ] | RC-84 | 🟡 修正提案 | 未着手 | `members/import.vue:124` `showResults` に渡す配列が row 順未ソート |

---

**識別子**: RC-84（GitHub id: なし）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/pages/admin/members/import.vue:124`（`panelRef.value?.showResults(...)` の行）

**該当コード（レビュー時点の diff）**:

```diff
+    panelRef.value?.showResults([...clientErrors, ...apiResults])
```

**レビュワーのコメント（原文）**:

🟡 修正提案 [🔧微修正/S]: `[...clientErrors, ...apiResults]` はクライアント検証エラー（不正ロール行）を常に先頭にまとめたあと API 結果を並べるため、結果テーブルの表示順序が元の CSV 行番号と一致しません。たとえば 10 行の CSV で行 3・7 が不正ロールだった場合、画面は「行3 error → 行7 error → 行1 result → 行2 result → ...」のように並びます。`CsvImportPanel` の `showResults` は渡された配列をそのまま表示するため、呼び出し側で `.sort((a, b) => a.row - b.row)` を追加するだけで解消できます。

**コメント要約**: `members/import.vue:124` `showResults([...clientErrors, ...apiResults])` が row 順未ソートで、不正ロール行が CSV の順序に関わらず API 結果より常に先に表示される。`.sort((a, b) => a.row - b.row)` を追加するだけで解消。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-75 の対応（クライアント側 role 検証）で `clientErrors` と `apiResults` を分けて構築するようになったが、合算時にソートが入っていない。`CsvImportPanel` は受け取った配列を順序通り表示するため、混在行がある CSV では表示順が元の行番号と乖離する。修正は 1 行（`.sort()`）で局所的に済み、方針判断が不要なため 🟡。

---

## 評価セッション（2026-08-18 23:20・shokujii-code-review）

- **評価日時**: 2026-08-18 23:20 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `doc/v2.12-deploy`
- **PR**: 未作成
- **レビュー範囲**: `v2.11.0..HEAD`（445 コミット / 約 400 ソースファイル）。6 領域に分割して並列レビュー（functions メール・SEO / functions enterprise・common / base chat・profile / base その他 / enterprise アプリ / firebase 設定・CI・terraform・user・partner）
- **Outdated 除外件数**: 該当なし（エージェントのみのセッション）
- **レビュー非該当スキップ件数**: 該当なし
- **既存 review doc との重複除外**: 各領域で `documents/レビューコメント/review-*.md` の既存 RC（✅ 対応済み・未着手とも）を突き合わせ、重複する指摘は再掲していない
- **自動修正**: 🚨 1 件（RC-65）と条件付き 🟡 29 件を修正。lint / format / build:types / vitest はすべて成功

### 検証結果

| チェック | 対象 | 結果 |
|:---|:---|:---|
| lint | base / user / enterprise | ✅ |
| format:check | base / user / enterprise | ✅（enterprise のみ自動修正後に緑） |
| build:types | base / user / enterprise | ✅ |
| test | common / base / user / enterprise | ✅（321 / 125 / 36 / 47 tests） |

---

## 追加対応セッション（2026-08-18 23:45・v2.12 優先修正）

ユーザー依頼「優先して修正すべきものがあれば進める / v2.12 に修正しなくても良いものはそのまま」に基づき、**実害が確定していて修正方針が一意な 6 件**を追加対応した。

| RC | 評価 | 内容 | 対応 |
|:---|:---|:---|:---|
| RC-2 | 🚨 | 限定公開イベント / 非公開・未承認コミュニティの素の 404（v2.11.0 退行） | noindex + 200 で SPA 配信に分離。回帰テスト 8 件追加 |
| RC-1 | 🟡 | イベント側のパス長チェック欠落 | `paths.length !== 5` を追加 |
| RC-5 | 🟡 | enterprise イベントの Slack 通知リンクが必ず 404 | `getEventUrlForEvent` に移行 |
| RC-6 | 🟡 | 同（注文通知）。プロフィール URL も同じ理由で 404 | `getEventUrlForEvent` に移行し、`getUserUrlForCommunity` を新規追加 |
| RC-15 | 🟡 | 履歴が空の企業で初回の補助設定を保存できない | `...OrNull` 版に変更 |
| RC-16 | 🟡 | 監査ログのカーソル doc 不在時に先頭へ巻き戻る | 値指定 `startAfter` に変更 |

**v2.12 では対応しないと判断した主な指摘**

| RC | 評価 | 据え置き理由 |
|:---|:---|:---|
| RC-70 | 🚨 | Storage のパス設計（固定パス + `updated_at` キャッシュバスター）の変更が必要。保存失敗時にエラー表示自体は出るため、リリース阻害ではない |
| RC-13 | 🟡 | 管理者 2 名の同時操作が前提で発生確率が低い。Auth と Firestore をまたぐ Transaction 化は設計判断が必要 |
| RC-40 | 🟡 | #2282 として据え置き済み。コード変更ではなくリリース受容判断が必要 |
| RC-38 | 🟡 | dev / sandbox のみ noindex にする実装が Functions rewrite / 環境別 `robots.txt` の 2 案に分かれる |
| RC-11 | 🟡 | 請求書番号の採番方式変更（工数 M・仕様判断） |
| その他 🟡 | 🟡 | PAGE_SIZE 定義の分散、base への i18n キー移設、dead code 削除、`as` キャスト整理等。工数 M 以上または方針が複数 |

### 検証結果（追加対応分）

| チェック | 対象 | 結果 |
|:---|:---|:---|
| build（tsc -b） | functions/default | ✅ |
| lint | functions/default | ✅ |
| format:check | functions/default | ✅ |
| test | functions/default | ✅（65 files / 452 tests。`ogpRequest.test.ts` 8 件を新規追加、`urls.test.ts` に 3 件追加） |
| verify:functions-deploy | root | ✅（export 87 件） |

---

**識別子**: RC-2（GitHub id: なし）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/ogpRequest.ts:228`

**該当コード（レビュー時点の diff）**:

```diff
       const eventData = await getEvent(eventId)
+      if (eventData === undefined || !eventData.is_public || eventData.is_deleted || eventData.enterprise_id != null) {
+        sendNotFound(res)
+        return
+      }
```

**レビュワーのコメント（原文）**:

`firebase.json` の rewrite は `/c/**/e/**` と `/c/**` を**全リクエスト**（クローラだけでなくブラウザの初回表示・リロード・共有 URL からの遷移も含む）このハンドラに向けています。そして `sendNotFound` は SPA の `index.html` ではなく `<!doctype html><title>404 Not Found</title>...` という**JS を含まない静的 HTML**を返します（`:68-73`）。

v2.11.0 の `ogpRequest.ts` は `is_public` / `is_deleted` / `is_approved` を一切見ておらず、どのケースでも `returnOriginalIndexHtml`（200 + SPA）を返していました（`git show v2.11.0:functions/default/src/ogpRequest.ts` に 404 分岐は存在しません）。したがって v2.12 で次が退行します。

1. **限定公開イベント（`is_public === false`）の URL 共有が機能しなくなる**。限定公開は「URL を知る人だけが参加できる」機能（`user/src/locales/messages/ja.ts` の限定公開チップ、`pr-2095.md` PV-01〜03）なので、共有 URL を開いた参加者は必ず素の 404 に当たります。ログイン済みメンバーでもリロード・直リンクで到達不能です。
2. **限定公開コミュニティ（`is_public === false`）のページも同様に到達不能**。
3. **未承認コミュニティ（`is_approved === false`）のページが管理者からも見えなくなる**。`user/src/pages/c/[communityAccount]/index.vue:120` は `is_approved === false` のとき「承認待ち」チップを表示する設計で、未承認状態でもページを閲覧できる前提になっています。

`documents/12_SEO対策/01_SEO対策_タスク.md` の P2-5 は「データ不在・非公開時は 404」と定めていますが、これは**クローラ向けにインデックスさせない**という要件であり、認証済みユーザーの画面配信まで止める要件ではありません。SEO 目的は `noindex` で達成できます。

修正案: 「インデックス除外」と「画面配信」を分離する。`enterprise_id != null` / `is_deleted` / ドキュメント不在は現状どおり 404 とし、`!is_public`（イベント・コミュニティ）と `!is_approved`（コミュニティ）は **SPA の `index.html` を 200（または `noindex` 付き）で返す**。

**コメント要約**: 限定公開イベント / 非公開・未承認コミュニティが素の 404 になり、URL 共有・直リンク・リロードで到達不能（v2.11.0 からの退行）。
SEO 要件（P2-5）は `noindex` で達成できるため、「インデックス除外」と「画面配信」を分離する必要がある。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 📑 仕様書

**変更種別**: 🆕 新機能

**想定工数**: M

**判断理由**: v2.11.0 と比較して機能が失われる退行であり、限定公開の「URL を知る人だけが参加できる」という機能仕様そのものを壊す。`documents/12_SEO対策/01_SEO対策_タスク.md` P2-5 の記述は「非公開時は 404」だが、同ドキュメントの検証項目は「**存在しない**イベント URL が 404 を返す」であり、P2-5 の実質的な目的は**ソフト 404 の解消**である。インデックス除外は `X-Robots-Tag: noindex` で達成できるため、機能仕様を壊さない「インデックス除外と画面配信の分離」を採用した。

**対応内容**:

- `sendNoindexSpaHtml` を追加し、`Cache-Control: private, no-store` + `X-Robots-Tag: noindex, nofollow` で SEO メタ・JSON-LD を注入しない素の `index.html` を 200 で返す
- イベント: 不在 / `is_deleted` / `enterprise_id != null` / `community_account` 不一致は 404 のまま。`!is_public` のみ noindex 配信に変更
- コミュニティ: 不在 / `enterprise_id != null` は 404 のまま。`!is_public` または `!is_approved` を noindex 配信に変更
- `documents/12_SEO対策/01_SEO対策_タスク.md` の P2-5 と検証チェックリストを実装に合わせて更新
- `functions/default/src/ogpRequest.test.ts` を新規追加し、限定公開・未承認・404 条件・パス長を回帰テストで固定（8 件）

**残る確認事項**: `v2.12_テスト項目書.md` の SEO-06（「404 または noindex 相当（仕様どおり）」）は本対応により **noindex 相当**が正となる。PF-06（限定公開チップ）は URL 共有で到達できる前提が回復した。

---

**識別子**: RC-70（GitHub id: なし）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/settings.vue:104`

**該当コード（レビュー時点の diff）**:

```diff
     let logoUrl = companyLogoUrl.value
     if (logoFile.value != null) {
       const path = getEnterpriseLogoStoragePath(enterpriseId.value)
       await uploadImage(logoFile.value, path)
       logoUrl = convertStoragePathToURL(path)
     }

     await updateEnterpriseSettings({ ... })
```

**レビュワーのコメント（原文）**:

`getEnterpriseLogoStoragePath`（`common/src/utils/storagePaths.ts:57`）は `enterprises/{id}/logo/company-logo.png` の固定パスを返すため、Storage 上の既存ロゴを先に上書きしてから Callable を呼んでいます。`updateEnterpriseSettings` が失敗すると、画面には「保存に失敗しました」と出る一方で、既にロゴを設定済みの企業では `company_logo_url` が同一パスを指しているためロゴ画像だけが差し替わった状態になります（ロールバックなし）。初回アップロード時は Firestore 未更新で Storage にだけ画像が残る孤児データになります。

修正案: バージョン付きパス（例 `logo/company-logo-{timestamp}.png`）にアップロードし、Callable 成功後に `company_logo_url` を切り替える。固定パスを維持する場合は、Callable 失敗時に旧画像を復元する（事前ダウンロード＋再アップロード）か、アップロード自体を Callable / Functions 側に寄せて 1 トランザクション相当にする。

**コメント要約**: 固定パスのロゴを Callable より先にアップロードしており、`updateEnterpriseSettings` 失敗時に「保存に失敗」と出ながらロゴ画像だけ差し替わる。
初回は Storage に孤児データが残る。現行のパス設計（固定パス + `updated_at` キャッシュバスター）に関わるため方針確認が必要。

**評価**: 🚨 必須修正

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 保存失敗時に「失敗した」という表示と実際の状態（ロゴだけ変わっている）が食い違う点は実害であり 🚨 とした。ただし修正には Storage のパス設計変更が伴い、現行は「固定パス + `Enterprise.updated_at` をキャッシュバスターに使う」設計（`enterprise/src/utils/enterpriseLogoUrl.ts`）で成立しているため、バージョン付きパスへ移すと旧画像の削除・キャッシュバスターの扱いを併せて決める必要がある。`storage.rules` は `enterprises/{enterpriseId}/logo/{fileName}` のワイルドカードなので rules 変更は不要だが、設計判断のため自動修正の対象外とし、方針をユーザーに確認する。

---

**識別子**: RC-65（GitHub id: なし）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/members/index.vue:180`

**該当コード（レビュー時点の diff）**:

```diff
   confirmDialog.action = async () => {
     if (enterpriseId.value == null) return
-    await disableEnterpriseMember({ enterprise_id: enterpriseId.value, user_id: member.user_id })
-    notification.show(t('admin.members.disable_success'), 'success')
-    await loadMembers()
+    try {
+      await disableEnterpriseMember({ enterprise_id: enterpriseId.value, user_id: member.user_id })
+      notification.show(t('admin.members.disable_success'), 'success')
+      await loadMembers()
+    } catch (error: unknown) {
+      notification.show(resolveCallableErrorMessage(error, t('admin.members.disable_failed')), 'error')
+    }
   }
```

**レビュワーのコメント（原文）**:

`base/src/components/ConfirmDialog.vue` の `okClick` は `() => void` 型で、`clickOkHandler` は戻り値を await せずに即 `closeDialog()` します。そのため無効化（180 行）・有効化（192 行）の action が reject しても、成功トーストも失敗トーストも出ないままダイアログが閉じ、操作が成功したように見えます。これは仮定ではなく到達可能な経路で、`functions/default/src/enterprise/members.ts:379-383` は最後の有効な管理者を無効化しようとすると `failed-precondition`「最低1人の有効な管理者が必要です」を投げます。グローバルの `unhandledrejection` は `reportClientError` するだけで UI 表示はしません。ロール変更（205-217 行）だけは try/catch を持っており、同一ファイル内でも扱いが不揃いです。

**コメント要約**: `ConfirmDialog` が `okClick` を await しないため、最後の有効な管理者を無効化した際の `failed-precondition` が UI に出ず成功したように見える。
無効化 / 有効化に try/catch + エラー通知を追加（ロール変更と揃えた）。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `ConfirmDialog.vue` の `clickOkHandler` が `props.okClick()` の戻り Promise を捨てて即 `closeDialog()` することを実コードで確認した。Functions 側が「最低1人の有効な管理者が必要です」を投げる経路も実在するため、管理者が「停止できた」と誤認する。同一ファイル内のロール変更と同じ形（try/catch + `notification.show`）で揃えた。エラー文言はサーバー由来をそのまま出すのではなく、`FirebaseError` かつ `functions/failed-precondition` のときだけ業務エラーとして表示し、それ以外は既定文言にフォールバックする（RC-66 と同時対応）。`ConfirmDialog` 側の `okClick` を `() => void | Promise<void>` にして await する恒久対応は base 共通コンポーネントの全アプリ影響があるため、本セッションでは実施していない。

---

**識別子**: RC-40（GitHub id: なし）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.rules:379`

**該当コード（レビュー時点の diff）**:

```diff
+    match /{path=**}/member_orders/{orderId} {
+      // PF（enterprise_id == null）の注文のみ未認証読み取りを許可
+      allow read: if resource.data.enterprise_id == null;
+      allow write: if false;
+    }
```

**レビュワーのコメント（原文）**:

collectionGroup クエリに対して未認証 read を許可しているため、`enterprise_id == null` の注文（PF 全件）を**誰でも横断列挙できます**。`member_orders` には `user_id`・金額・数量などが含まれるため、実質的に PF の注文データが公開状態です。これは RC-1 として記録され `📤 #2282 別Issue化` で意図的に据え置かれた判断であることを確認済みなので新規指摘としては 🚨 にしていませんが、**v2.12 リリース時点でこの露出が本番に出る**点は明示的に受容判断を取ってください。

**コメント要約**: `member_orders` collectionGroup の未認証 read で PF 注文（`user_id`・金額・数量）が誰でも横断列挙できる。
#2282 として据え置き済みだが、v2.12 で本番に出る点の受容判断が必要。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 👀 確認のみ

**想定工数**: S

**判断理由**: 既に #2282 として別 Issue 化された既知の判断であり、本セッションで新たに評価を変える材料はないため 🟡 とした。ただし「別 Issue 化済み」は「リリースしてよい」と同義ではなく、v2.12 で初めて本番に露出する変更であるため、リリース判断としての受容確認をユーザーに求める。コード変更は行わない。

---

**識別子**: RC-13（GitHub id: なし）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/enterprise/members.ts:379`

**該当コード（レビュー時点の diff）**:

```diff
     if (member.role === 'admin' && member.is_active) {
       const activeAdminCount = await countActiveEnterpriseAdmins(enterpriseId)
       if (activeAdminCount <= 1) {
         throw new HttpsError('failed-precondition', '最低1人の有効な管理者が必要です')
       }
     }

     const tenantAuth = await authForEnterprise(enterpriseId)
     await tenantAuth.updateUser(userId, { disabled: true })
```

**レビュワーのコメント（原文）**:

「最低 1 人の有効な管理者を残す」という不変条件が、Transaction 外の read-then-write で担保されています。管理者 A・B の 2 名が残っている状態で「A が B を無効化」「B が A を無効化」が同時に走ると、双方が `activeAdminCount === 2` を観測して両方成功し、有効な管理者 0 人の企業が生まれます。この状態は Callable 側からは復旧できず、運用（support）による直接介入が必要になります。`functions/default/src/enterprise/role.ts:28-33` の `admin → member` 降格チェックも完全に同型です。

修正案: メンバー無効化・ロール降格を `db.runTransaction` 内に入れ、admin 一覧の read → `is_active` / `role` の write を同一 Transaction で行う。あるいは `enterprises/{id}` に `active_admin_count` を持たせて `FieldValue.increment(-1)` + 更新後値の検証（Transaction 内）で不変条件を守る。

**コメント要約**: 「最低 1 人の有効な管理者」を Transaction 外の read-then-write で担保しており、同時無効化で管理者 0 人になりうる。
`role.ts` の降格チェックも同型。発生すると Callable では復旧不能になる。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 🔒 セキュリティ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 発生には 2 名の管理者による同時操作が必要で確率は低いが、発生した場合は企業が自力で復旧できない（管理画面に入れる管理者が 0 人になる）。Auth の `updateUser` と Firestore 更新をまたぐため、Transaction 化には Auth 側の扱い（Transaction 内で外部 API を呼べない）を含む設計判断が必要で、工数 M かつ方針が複数あるため自動修正の条件（S + 🔧/📄 + 方針が一意）を満たさない。リリース前に対応するか別 Issue に切り出すかの判断をユーザーに求める。

---

**識別子**: RC-38（GitHub id: なし）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firebase.json:73`

**該当コード（レビュー時点の diff）**:

```diff
     {
       "target": "user",
       "public": "user/dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         { "source": "/sitemap.xml", "function": { "functionId": "handleSitemapRequest", "region": "asia-northeast1" } },
```

**レビュワーのコメント（原文）**:

`partner` / `manager` / `enterprise` の hosting には `X-Robots-Tag: noindex` ヘッダが追加されましたが、**`user` には付いていません**。同時に `user/public/robots.txt`（全ページ Allow）と動的 sitemap が追加されたため、`*-dev.web.app` / sandbox の user アプリがクロール対象になります。本番と同一コンテンツなので重複コンテンツ扱いになり、SEO 施策の目的自体と衝突します。

修正案: 本番ホスト以外へ `noindex` を返す仕組みを入れる。最小構成としては `handleSitemapRequest` と同様に `robots.txt` も Functions rewrite にして `req.hostname` が本番ドメイン以外なら `Disallow: /` を返す、または deploy 時に環境別 `robots.txt` を配置する。少なくとも v2.12 のデプロイ手順に「dev/sandbox の user は noindex 未対応」である旨を明記する。

**コメント要約**: `partner` / `manager` / `enterprise` には `X-Robots-Tag: noindex` があるが `user` に無く、dev / sandbox がクロール対象になる。
本番と同一コンテンツで重複コンテンツ扱いになり、今回の SEO 施策と衝突する。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: user hosting は本番も同一 target を使うため、`X-Robots-Tag: noindex` を単純に追加すると本番までインデックス対象外になり、今回の SEO 施策を無効化してしまう。ホスト名による分岐（Functions rewrite）か環境別 `robots.txt` の配置かで実装が分かれ、修正方針が一意でないため自動修正の対象外とした。少なくともデプロイ手順への注記だけでも先に入れるかを含め、方針をユーザーに確認する。

---

## 評価セッション（2026-08-18 23:51 JST・review-comments-evaluate auto）

- **評価日時**: 2026-08-18 23:51 JST
- **ブランチ名**: doc/v2.12-deploy
- **PR**: #2286
- **REVIEW_REQUEST_SINCE**: 2026-08-18T14:42:38Z
- **partial**: false
- **新規 RC**: RC-75〜RC-77（Codex インライン 2 件 + Copilot overview 1 件）。レビュー依頼コメント・Codex ボイラープレートはスキップ

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|
| [x] | RC-75 | 3805184137 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 不正 role の黙示 `member` 化を修正 |
| [x] | RC-76 | 3805184152 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 旧デプロイ手順リンクを 260818 に更新 |
| [x] | RC-77 | 4962399563 | 👌 修正不要 | — | 📤 スコープ外 | Copilot overview（サマリのみ） |

### 自動修正

- RC-75: `enterprise/src/pages/admin/members/import.vue` — 空欄のみ `member`、不正 role は行エラー
- RC-76: `documents/レビューコメント/review-fix-2260.md` — リンク先を `_260818.md` に更新

---

## 評価セッション（2026-08-19 00:30・shokujii-code-review）

- **評価日時**: 2026-08-19 00:30 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `doc/v2.12-deploy`
- **PR**: [#2286](https://github.com/nijuniinc/bokudeli-event-new/pull/2286)
- **レビュー範囲**: `origin/development...HEAD`（5 コミット / 52 ファイル）。RC-75・RC-76 の追加対応後の差分を対象に再レビュー
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **既存 review doc との重複除外**: RC-1〜RC-77 と同一の指摘は再掲していない
- **自動修正**: 🚨 1 件（RC-80）と条件付き 🟡 2 件（RC-78・RC-79）を修正

### RC 一覧（サマリ）

| 対応 | RC | 評価 | ステータス | 要約 |
|:----:|:---|:---|:---|:---|
| [x] | RC-78 | 🟡 修正提案 | ✅ 対応済み | デプロイ手順の `B-7` 参照を `B-8` に修正（3 箇所） |
| [x] | RC-79 | 🟡 修正提案 | ✅ 対応済み | CSV 行エラー文言を `ja.ts` 経由に変更 |
| [x] | RC-80 | 🚨 必須修正 | ✅ 対応済み | `apiResults.status` の型不一致で `build:types` が失敗していたのを修正 |
| [ ] | RC-81 | 🟡 修正提案 | 未着手 | Footer の compact / 非 compact でリンク一覧が全文複製 |
| [ ] | RC-82 | 🟡 修正提案 | 未着手 | `isEventPageRoute` がイベント詳細パスを正規表現で直書き |

---

**識別子**: RC-80（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/members/import.vue:82`

**該当コード（レビュー時点の diff）**:

```diff
+    const apiResults: Array<{
+      row: number
+      label: string
+      status: string
+      error_message?: string
+    }> = []
...
     panelRef.value?.showResults([...clientErrors, ...apiResults])
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `apiResults` の要素型を `status: string` と明示したため、`CsvImportPanel` の `showResults(items: ResultRow[])`（`status: 'success' | 'error'`）に渡せません。`npm -w enterprise run build:types` は次のエラーで失敗し、PR verify の Typecheck が落ちます。→ API 応答（`CreateEnterpriseMembersResultItem.status`）と同じ `'success' | 'error'` に揃えてください。

```text
src/pages/admin/members/import.vue(124,33): error TS2345: Argument of type '{ ...; status: string; ... }[]'
is not assignable to parameter of type 'ResultRow[]'.
```

**コメント要約**: RC-75 の対応で追加した `apiResults` の `status` を `string` に広げたため、`ResultRow`（`'success' | 'error'`）に代入できず `vue-tsc` が TS2345 で失敗する。
`common/src/apis/enterprise.ts:83` の応答型は既に union なので、注釈を合わせるだけで解消する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: マージ前に PR verify（`build:types`）が必ず失敗するため、リリース阻害。修正方針は応答型と同一の union に揃える 1 通りに定まるため、確認なしで自動修正した。

**対応内容**:

- `apiResults` の要素型を `status: 'success' | 'error'` に変更
- `npm -w enterprise run build:types` の再実行で緑を確認

### 自動修正

- RC-78: `documents/デプロイ手順/デプロイ手順_v2.12_260818.md` — 手動デプロイ参照を `B-7` → `B-8`（0-1 チェックリスト / トラブルシュート 2 箇所）
- RC-79: `enterprise/src/locales/messages/ja.ts` に `admin.members.import_invalid_role` を追加し、`import.vue` から `t()` で参照
- RC-80: `enterprise/src/pages/admin/members/import.vue` — `apiResults` の `status` を `'success' | 'error'` に

### 検証結果

| チェック | 対象 | 結果 |
|:---|:---|:---|
| build:types | enterprise | ✅（修正前は TS2345 で失敗） |
| format:check | 変更 3 ファイル | ✅ |

---

## 評価セッション（2026-08-18 23:53・shokujii-code-review）

- **評価日時**: 2026-08-18 23:53 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `doc/v2.12-deploy`
- **PR**: [#2286](https://github.com/nijuniinc/bokudeli-event-new/pull/2286)
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **既存 review doc との重複除外**: RC-75（Codex 指摘・23:51 セッションで ✅ 対応済み）は再掲していない

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-83 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `invoices/index.vue:23` 不正期間へ切り替えた後でも、先行リクエストの古い請求行が遅れて描画されうる<br>invalid 遷移時にも in-flight 応答を失効させる必要がある |

---

**識別子**: RC-83（GitHub id: なし）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/invoices/index.vue:23`

**該当コード（レビュー時点の diff）**:

```diff
-  if (periodError.value != null) return
+  if (periodError.value != null) {
+    // 期間が不正なまま前回の行を残すと、新しい見出しの下に古い請求内容が有効値として見えてしまう
+    rows.value = []
+    return
+  }
```

**レビュワーのコメント（原文）**:

🟡 修正提案 [🔧微修正/S]: `enterprise/src/pages/admin/invoices/index.vue:21-37`
不正期間時に `rows.value = []` して return するだけだと、直前の有効期間で飛んでいた `getDashboardMonthlyData()` のレスポンスを無効化できません。`loadSeq` は有効期間のときしか更新していないため、期間変更の途中で一時的に不正状態になると、後から返った古いレスポンスが `seq === loadSeq` のまま通って、現在の期間表示の下に別期間の請求データを再描画します。無効期間へ遷移した時点でも in-flight 応答を失効させるよう `loadSeq` を進めるか、リクエスト時の period スナップショット一致を確認してください。

**コメント要約**: `invoices/index.vue:23` 不正期間へ切り替えた後でも、先行リクエストの古い請求行が遅れて描画されうる。
invalid 遷移時にも in-flight 応答を失効させる必要がある。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 現在の実装は「不正期間では前回行を消す」改善自体は入っているが、先行リクエストの完了タイミング次第で別期間の請求行が再描画される race を残している。表示データの整合性に影響するものの、必ず発生するわけではなくサーバー不整合も伴わないため、優先度は 🟡 に留めた。`loadSeq` の失効または period snapshot 比較で局所修正できる。

---
