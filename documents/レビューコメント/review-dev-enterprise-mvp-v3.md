# ブランチ dev/enterprise-mvp-v3 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3637896931 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | 同一 logo URL 上書き時にヘッダー img が更新されない<br>`logoRenderGeneration` + cache-bust クエリで src を毎 resolve 変化 |
| [x] | RC-2 | 3637896937 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | login_bg.png が 4.7MB で初回ログインが重い<br>1.1MB に圧縮済み（#2213 amend） |
| [x] | RC-3 | 3637896939 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | vertical-nav-header スロット差替えでモバイル閉じるボタン欠落<br>`closeVerticalOverlayNav` + `d-lg-none` close ボタン復元 |
| [x] | RC-4 | 3637896943 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | Phase2 計画の H-2/H-1/H-9 が未完了のまま<br>実装・closes と揃え `[x]` に更新 |
| [x] | RC-5 | 3637896952 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 🔒 セキュリティ | 📄 ドキュメントのみ | S | Storage Rules の「子 match 優先」誤記<br>「いずれか allow が許可すれば read 可」に修正 |
| [x] | RC-6 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | orders.vue の canLinkToDetail が isPublic のみ参照<br>非公開イベントで本人の詳細リンクが消える → isOwner 相当に修正 |
| [x] | RC-7 | 3643243986 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ, 👤 UX | 🔧 微修正 | S | user /orders が isLoginRequired 外<br>未ログイン直叩きで空画面 → /orders をログイン必須に追加 |
| [x] | RC-8 | 3650196173 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | orders.vue の canLinkToDetail が isPublic \|\| true で常に true<br>`isLinkable ?? true` に簡約 |
| [x] | RC-9 | 3650196180 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🏗️ 設計 | 🔧 微修正 | S | base orders.vue が @/router/utils に依存<br>resolveEventPath / resolveReceiptPath を props 注入 |
| [x] | RC-10 | 3650196186 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | shokujii-code-review の「既存のみ」注記が orders 新規追加と矛盾<br>#2208 例外として表現修正 |
| [x] | RC-11 | 3651873400 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | downloadReceipt の window.open に noopener,noreferrer 未指定 |
| [x] | RC-12 | 3651873404 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | enterprise /orders の fetchEnterpriseUsageTabEligible 未 catch |
| [x] | RC-13 | 3651873409 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | legacy ?tab=usage redirect の fetch 失敗時に空白画面 |
| [x] | RC-14 | 3651873411 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | user /orders の navigateToEventChat に try/catch なし |
| [x] | RC-15 | 3651873413 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | useUserProfileTabSync の route.query スプレッドに as 使用 |
| [x] | RC-16 | 3650210089 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | base の @/router/utils 依存（RC-9 と同一指摘）<br>props 注入済み |
| [x] | RC-17 | 3650210086 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 💾 データ | 🔧 微修正 | S | Enterprise モードで useUserStore が無条件 subscribe<br>autoSubscribe: false で preview 前 Firestore 直読を防止 |
| [x] | RC-18 | 3650210088 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | members/managers 条件に converter なし doc()<br>getUserRef に統一 |
| [x] | RC-19 | 3651896167 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | S | Checkout 直後 loginUser 未確定で完了ダイアログ表示<br>firebaseUser.uid 確定後に v-if |
| [x] | RC-20 | 3650210091 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 🔒 セキュリティ | 📋 仕様追加 | M | /orders に preview ゲート追加<br>停止メンバーは access_denied / not-found 表示 |
| [x] | RC-21 | 3650210092 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 🔧 微修正 | S | eligible=false 時 ?tab=usage 残存<br>router.replace(getOrdersPath()) で正規化 |
| [x] | RC-22 | 3649670521 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | 旧 usage URL 失敗時フォールバック（RC-13 と同一）<br>.catch で /orders へ replace 済み |
| [x] | RC-23 | 3650210093 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 旧 usage 非同期 redirect が route 変更後も発火<br>requestPath 一致確認を追加 |
| [x] | RC-24 | 3649670518 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | logoRenderGeneration を廃止<br>getEnterpriseByDomain.updated_at で cache-bust |
| [x] | RC-25 | 3650210094 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | RC-24 と同一（再読込後 v=1 再利用）<br>Enterprise.updated_at を cache キーに |
| [x] | RC-26 | 3651880394 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | RC-24/25 と同一（セッション跨ぎ cache キー）<br>updated_at ベースに置換 |
| [x] | RC-27 | 3651880391 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | useNavigateToEventChat 再利用提案<br>RC-14 で try/catch 済み。composable 化は任意 |
| [x] | RC-28 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 💾 データ | 🔧 微修正 | S | /orders で loginUser 先読みにより useUserStore が先に subscribe<br>RC-17 autoSubscribe:false が Pinia 再利用で無効化 |
| [x] | RC-29 | 5119902663 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | user UserProfile 外部リンクに rel 未指定<br>noopener noreferrer を追加 |
| [x] | RC-30 | 3675795403 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | cart の startOrderProcess が /orders を直指定<br>resolveOrdersPath を props 注入 |
| [x] | RC-31 | 3675795410 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 🔧 微修正 | S | autoSubscribe:false 先行生成後 subscribe 未開始<br>useUserStore 再利用時に subscribe() を呼ぶ |
| [x] | RC-32 | 3675741933 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | gateUserId 空で preview Callable 失敗<br>getAuth().currentUser 優先 + 空 ID は load 抑止 |
| [x] | RC-33 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | userProfilePreview.reload が空 ID で Callable 呼び出し<br>load 先頭で targetUserId 空なら return |
| [x] | RC-34 | 3689139785 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | getOrdersPathAfterOrder が位置引数2個<br>ResolveOrdersPathFn と不一致で query 壊れ |
| [x] | RC-35 | 3689139789 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 注文完了時に参加イベント一覧未 reload<br>userEventListStore.reload を orders watch に追加 |
| [x] | RC-36 | 5140905153 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | useUserStore の subscribe 二重呼び出し<br>setup 内と store 再利用時の意図整理 |
| [x] | RC-37 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | S | エンプラ Checkout 戻り /orders replace が loginUser のみ<br>profileOwnerUid + firebaseUser で RC-19 同等 |
| [x] | RC-38 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | user /orders の navigateToEventChat が loginUser のみ<br>firebaseUser.uid フォールバック |
| [x] | RC-39 | なし・エージェントレビュー | 👌 修正不要 | — | — | — | 👀 確認のみ | — | PF 完了モーダルを [userId] shell に移した重複<br>RC-27 同様 composable 化は任意 |
| [x] | RC-40 | なし・エージェントレビュー | 👌 修正不要 | — | 📌 スコープ内 | 💾 データ | 👀 確認のみ | — | UserAppSchema enterprise_id null→undefined<br>PF ZodError 解消・vitest 追加で妥当 |
| [x] | RC-41 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | usage パネル刷新後の未使用 i18n キー残存<br>`current_used` / `current_limit` / `history_used` |
| [x] | RC-42 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | toEnterpriseMemberMonthlyUsageView の `monthly_user_paid ?? {}` が冗長<br>AppSchema default({}) で常に定義済み → 直接アクセスに修正 |
| [x] | RC-43 | なし・エージェントレビュー | 👌 修正不要 | — | 📌 スコープ内 | 💾 データ | 👀 確認のみ | — | リリース前確定注文の cancel で monthly_user_paid が未加算のまま減算されうる<br>Math.max(0,...) ガード + 仕様書に backfill 言及済みで許容 |
| [x] | RC-44 | 5143396806 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | [userId].vue の v-if に profileOwnerUid 空チェックが冗長<br>isOwner に含まれるため削除 |
| [x] | RC-45 | 5143396806 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | orders.vue の Dialog v-if が \|\| で setup の && と不整合<br>両方 null でないときのみマウントに揃えた |
| [x] | RC-46 | 5143396806 | 👌 修正不要 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | エンプラ orders で navigateToEventChat 未注入<br>チャット導線不要の意図を template コメントで明示 |
| [x] | RC-47 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 🔧 微修正 | S | 当月行挿入後に履歴が 12 件超えうる<br>EP-22 に合わせ slice(0, 12) を再適用 |
| [x] | RC-48 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | settings_note の「最も先」が曖昧<br>「最も新しい開催月」に修正 |
| [x] | RC-49 | 5151102953 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | enterprise router / イベント詳細の冗長 as CommunityStore<br>戻り値型注釈済みのためキャスト削除 |
| [x] | RC-50 | 5151102953 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | useCommunityMemberFlags の catch が console.error のみ<br>reportClientError severity warn を追加 |
| [x] | RC-51 | 3695670677 | 🟡 修正提案 | 📤 #2236 別Issue化 | 📤 スコープ外 | 📏 規約 | 📐 リファクタ | M | チャット onOpenEvent の getDoc を store 関数へ<br>#2236 で user/enterprise 横断対応 |
| [x] | RC-52 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | EventEdit computed/非同期の useAppEventStore<br>inject 外 → useCreateAppEventStore |
| [x] | RC-53 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | M | 公開/管理 base を useAppCommunityStore 化<br>続き PR で event 横断・LetterTable 等も完了 |
| [x] | RC-54 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | EventDetailsCard が useEventStore のまま<br>useAppEventStore に統一 |
| [x] | RC-55 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | M | enterprise 導線の event/community store 置換漏れ<br>EventCard 等 + LetterTable factory |
| [x] | RC-56 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | injection key ファイル名・buildEnterpriseCommunityScope<br>useCreateAppCommunityStore 追加 |
| [x] | RC-57 | 3711453831 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | /orders 同一コンポーネント再利用時に完了ダイアログが開かない<br>query watcher 内で visible を true に |
| [x] | RC-58 | 4853112013・suppressed | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | normalizeCartEnterpriseSubsidyBudget が値型未検証<br>monthlyUsage 各 entry を number 検証 |
| [x] | RC-59 | 4853112013・suppressed | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | getCommunityData 重複チェックに limit(1) なし<br>読み取りコスト削減 |
| [x] | RC-60 | 3736796647 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🔒 セキュリティ | 🔧 微修正 | M | CommunityLetter が account のみで communities 先頭取得<br>enterprise scope をレター store へ渡す |
| [x] | RC-61 | 3736796632 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 🐛 実害 | 🔧 微修正 | M | カート onMounted が UID 確定前に終了<br>福利厚生予算・replay が欠落 |
| [x] | RC-62 | 3736796642 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | M | partner で provider 未設定時 PF 固定クエリ<br>enterprise イベントが購読不能 |
| [x] | RC-63 | 3740504522 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | M | community store が scope 省略を null 固定<br>partner 1 引数呼び出しが誤検索 |
| [x] | RC-64 | 3740504524 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | robots が /chat/ のみ Disallow<br>/chat 一覧を追加 |
| [x] | RC-65 | 3736796651 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 未来月 12 件で当月行が slice から脱落<br>当月を必ず残す |
| [x] | RC-66 | 3740504526 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🔒 セキュリティ | 📋 仕様追加 | M | 管理タブのイベント一覧に enterprise scope 未注入<br>EventsPanel / Invoice 等が account のみ |
| [x] | RC-67 | Copilot suppressed 2026-08-08 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | enterprise 未解決時 validateNewAccount が false<br>誤ってアカウント名重複表示 |
| [x] | RC-68 | 3740504520 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | waitEnterpriseAuthentication が beforeEach 二重で最大 4 秒<br>pending 共有で 1 回に集約 |
| [x] | RC-69 | Copilot suppressed 2026-08-08 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | tenantCache test の localStorage stub 未解除<br>afterEach で unstubAllGlobals |
| [x] | RC-70 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🔒 セキュリティ | 🔧 微修正 | S | EventList が collectionGroup に enterprise_id 未付与<br>CommunityLetter のイベント選択が RC-66 漏れ |
| [x] | RC-71 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | resolveCommunityDocumentRef が limit なし全件 read<br>limit(2) でコストと曖昧性検知を両立 |
| [x] | RC-72 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | community subscribe 初回 lookup が limit なし<br>docs[0] 採用で RC-71 と不整合 |
| [x] | RC-73 | 5226250696 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 📋 仕様追加 | M | createSingleEnterpriseCommunity が save と manager 付与を非原子的<br>後段失敗で管理者不在 community が残る |
| [x] | RC-74 | 5226250696 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | M | 管理ガード canView が community null のまま pending<br>timeout / 404 分岐が必要 |
| [x] | RC-75 | 3695636873 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 📋 仕様追加 | M | sendLetter が PF 固定 getCommunityByAccount<br>enterprise レター送信が not found |
| [x] | RC-76 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 💾 データ | 🔧 微修正 | M | enterprise プロフィールで preview ゲート前に<br>コミュニティ所属クエリが無条件実行 |
| [x] | RC-77 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | community subscribe 曖昧一致が console のみ<br>reportClientError なし・永久ローディング |
| [x] | RC-78 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 空 profileUserId で useUserStore('') が throw |
| [x] | RC-79 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | useProfileLinkPolicy の computed が依存未追跡 |
| [x] | RC-80 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | useAutoLoadWhenEmpty に immediate なし |
| [x] | RC-81 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | preview 再読込で failedFoodMenuImageIds が残る |
| [x] | RC-82 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | acceptInvitation 後の enterprise 照合がデッドコード |
| [x] | RC-83 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | テナント整合リトライ 2 回目以降 force なし token |
| [x] | RC-84 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | M | 未ログイン+キャッシュ有で遷移ごと 2 秒待機 |
| [x] | RC-85 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | usage パネル背景 #f6f7fb 直指定 |
| [x] | RC-86 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | UserProfilePage の enterpriseId.value! |
| [x] | RC-87 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | vertical-nav の render 中副作用登録 |
| [x] | RC-88 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | EventList の冗長 as EventListStore |
| [x] | RC-89 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | EventsTabPanel の void ?? で二重 next |
| [x] | RC-90 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | UserEventCard の subsidy 計算を common へ |
| [x] | RC-91 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | profile プレビューカードのタイル markup 重複 |
| [x] | RC-92 | 3766045327 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | manageCommunityCanView が tenant 未解決・enterprise_id null を許容<br>enterpriseId 解決待ちと tenant 不一致拒否を厳格化 |
| [x] | RC-93 | 3766743215 | 👌 修正不要 | — | 📌 スコープ内 | 📑 仕様書 | 確認のみ | — | updateEnterpriseMember の Auth displayName 同期<br>#2232 仕様どおりのため対応不要 |
| [x] | RC-94 | 3766778628 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | getCommunityData が scope 省略を null 固定<br>partner 1 引数呼び出しが PF のみ検索 |
| [x] | RC-95 | 3766778635 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📋 仕様追加 | M | CSV 同時作成で同一 account が二重作成<br>enterprise/community_accounts キー doc で原子的確保 |
| [x] | RC-96 | なし・エージェントレビュー | 🚨 必須修正 | 📤 #2250 別Issue化 | 📤 スコープ外 | 📏 規約, 🐛 実害 | 🔧 微修正 | M | vue-tsc 2.0.16 が TS 5.8.3 で無反応終了し build:types が型検査していない |
| [ ] | RC-97 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🏗️ 設計 | 📐 リファクタ | M | base の CancelPolicyDialog が `@/router/utils` に依存（RC-9 方針と不整合） |
| [ ] | RC-98 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約, 💰 金銭 | 🔧 微修正 | S | 福利厚生 budget ローダー失敗が console.warn のみ |
| [x] | RC-99 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | orders.vue の user_message に文字列 falsy チェック |
| [x] | RC-100 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約, 🐛 実害 | 🔧 微修正 | S | resolver の RouteLocationRaw を `string \| undefined` 前提で受けている<br>#2250 でプレビューカード / タイルを `RouteLocationRaw \| undefined` に揃えた |
| [x] | RC-101 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | EventPreviewTile の未使用 props（communityId / eventId） |
| [ ] | RC-102 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🏗️ 設計 | 📐 リファクタ | S | EventsTabPanel の「もっと読む」が callback と store の 2 系統 |
| [x] | RC-103 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | withDefaults 済み props への `?.` + `?? true` が冗長 |
| [ ] | RC-104 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約, 📑 仕様書 | 🔧 微修正 | S | 旧 cart monthlyUsage ローダー一式がデッドコード化 |
| [x] | RC-105 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | normalizeCartEnterpriseSubsidyBudget の as キャスト |
| [ ] | RC-106 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | isPreviewAccessGranted が既存 computed の条件を再実装 |
| [ ] | RC-107 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | M | 新規 profile composable の戻り値型が未指定 |
| [ ] | RC-108 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | friendUserOf が composable とカードで二重定義 |
| [ ] | RC-109 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約, 📑 仕様書 | 🔧 微修正 | S | cart.monthly_usage_label が未参照キーとして残存 |
| [x] | RC-110 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 🔧 微修正 | S | PF 確定の enterprise_id null が scope で上書きされる |
| [x] | RC-111 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | event store options を doc ごとに再計算し既存 util 未使用 |
| [ ] | RC-112 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ, 📏 規約 | 🔧 微修正 | S | getCommunityData の enterpriseId 3 値セマンティクスが逆転 |
| [ ] | RC-113 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 重複チェッククエリが withConverter なし |
| [ ] | RC-114 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害, 📏 規約 | 🔧 微修正 | S | letterList の lookup 例外が握りつぶされ永久ローディング |
| [x] | RC-115 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | userProfilePreview の空 ID 二重ガード |
| [x] | RC-116 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 🔧 微修正 | S | enterprise_id null の user doc 書き戻しで undefined キーが混入し set 失敗 |
| [ ] | RC-117 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | EP-22 が未来月の履歴扱いを規定していない |
| [ ] | RC-118 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | enterprise robots.txt が user 版 allow-list のコピー |
| [ ] | RC-119 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 新規レイアウトの defineProps が PropType 形式 |
| [x] | RC-120 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 関数 props が PropType + eslint-disable |
| [ ] | RC-121 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | usage パネルの catch が reportClientError なし・未設定と失敗が同一表示 |
| [ ] | RC-122 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | loading / error の 2 ref でローディング表現 |
| [ ] | RC-123 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | ⚡ パフォーマンス | 🔧 微修正 | S | タブ判定と本体表示で同一 Firestore 読み込みが二重 |
| [ ] | RC-124 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💰 金銭 | 🔧 微修正 | S | 降順 12 件 slice で未来月が履歴枠を占有 |
| [x] | RC-125 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | useEnterpriseCommunityMemberFlags の戻り値型が未指定 |
| [x] | RC-126 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | レイアウト内の /chat ハードコード |
| [ ] | RC-127 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🏗️ 設計 | 📐 リファクタ | M | enterprise chat ページが user 版の全文コピー（差分 1 行） |
| [ ] | RC-128 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | loadEventForRouteGuard の意図不明な無言リトライ |
| [x] | RC-129 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | currentUserId as string のキャスト |
| [x] | RC-130 | なし・エージェントレビュー | 🚨 必須修正 | 📤 #2248 別Issue化 | 📌 スコープ内 | 🐛 実害, 📋 仕様追加 | 📋 仕様追加 | M | レター通知メールのリンクが常に PF ホストでエンプラ会員が開けない<br>P1 維持メールは #2249 |
| [ ] | RC-131 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 自己負担 0 円検証済み経路で自己負担合計を再計算 |
| [ ] | RC-132 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | community_accounts キー doc が converter / スキーマなし |
| [ ] | RC-133 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📋 仕様追加 | M | キー doc の解放処理がなく account が永久予約される |
| [x] | RC-134 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | ⚡ パフォーマンス | 🔧 微修正 | S | profileFilter のインラインオブジェクト prop |
| [x] | RC-135 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | legacy tab リダイレクトの重複分岐 |
| [x] | RC-136 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | user の getOrdersPath が常に同値を返す tab 引数を持つ |
| [ ] | RC-137 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書, 🐛 実害 | 🔧 微修正 | S | eventStatusChangeMail がホスト未解決時に throw し onDocumentWritten が永続リトライする<br>AC-13 はバッチを ERROR ログ + 送信スキップ。letter.ts に揃える |
| [x] | RC-138 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | getEventUrlForEvent が resolveAppHostForCommunity を再実装していた<br>`getEventUrlForCommunity` へ委譲 + 失敗系 vitest を追加 |
| [x] | RC-139 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 未使用の `getUserUrlForHost` が残っていた<br>呼び出しが無いため削除 |

---

## 評価セッション（2026-07-23 21:10・review-comments-evaluate）

- **評価日時**: 2026-07-23 21:10 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-07-23T11:49:02Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0（Copilot 承知返信・レビュー依頼定型文等は別途 PR 上に存在するが since 以降の RC 対象外）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3637896931 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | 同一 logo URL 上書き時にヘッダー img が更新されない<br>`logoRenderGeneration` + cache-bust クエリで src を毎 resolve 変化 |
| [x] | RC-2 | 3637896937 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | login_bg.png が 4.7MB で初回ログインが重い<br>1.1MB に圧縮済み（#2213 amend） |
| [x] | RC-3 | 3637896939 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | vertical-nav-header スロット差替えでモバイル閉じるボタン欠落<br>`closeVerticalOverlayNav` + `d-lg-none` close ボタン復元 |
| [x] | RC-4 | 3637896943 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | Phase2 計画の H-2/H-1/H-9 が未完了のまま<br>実装・closes と揃え `[x]` に更新 |
| [x] | RC-5 | 3637896952 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 🔒 セキュリティ | 📄 ドキュメントのみ | S | Storage Rules の「子 match 優先」誤記<br>「いずれか allow が許可すれば read 可」に修正 |

---

**識別子**: RC-1（GitHub id: 3637896931）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/composable/useEnterpriseBranding.ts:20`

**該当コード（レビュー時点の diff）**:

```diff
+  function syncHeaderLogo(enterprise: GetEnterpriseByDomainResponse | null): void {
+    const url = enterprise?.company_logo_url
+    const src = url != null && url !== '' ? url : defaultHeaderLogo
+    const alt = enterprise?.company_name ?? 'shokujii'
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ロゴ更新時に src を必ず変化させてください**

既存ロゴを上書き保存するケースでは Storage パスが `enterprises/{id}/logo/company-logo.png` で固定のため、保存後に `resolveEnterprise()` しても `company_logo_url` は同じ文字列のままです。この行で同じ `src` を再代入しても Vue は DOM を更新せず、既にヘッダーに表示済みの `<img>` は再取得されないため、管理画面でロゴを変更してもヘッダーだけ古い画像が残ります。アップロード完了時刻などのバージョンをクエリに付けるか、保存直後は新しい object URL / cache-busted URL を反映してください。

**コメント要約**: 同一 Storage URL のロゴ上書き後、ヘッダー img がブラウザキャッシュのまま更新されない。resolve 毎に変化する cache-bust 付き URL が必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 実害あり。`logoRenderGeneration` を `resolveEnterprise` 成功毎に increment し、`withEnterpriseLogoCacheBust` で HTTP(S) URL に `?v=` を付与。ヘッダー・ログイン双方の composable に適用。

---

**識別子**: RC-2（GitHub id: 3637896937）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/components/login/LoginBackgroundLayout.vue:2`

**該当コード（レビュー時点の diff）**:

```diff
+import loginBg from '@/assets/images/login/login_bg.png'
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ログイン背景画像を軽量化してください**

未ログインユーザーが login / pass-code に初回アクセスするたび、この PNG 背景（ローカルで 4,773,289 bytes）を背景画像として読み込むため、モバイル回線やキャッシュ未保持時にログインフォーム表示までの体感速度が大きく悪化します。写真系の背景なら WebP/JPEG への変換や複数サイズ化で大幅に削減できるので、ログイン導線に載せる前に軽量版を参照してください。

**コメント要約**: login_bg.png が約 4.7MB で PWA バンドル・初回表示が重い。圧縮または WebP 等への変換が必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。#2213 コミット amend で 1,153,636 bytes（約 1.1MB）に圧縮済み。Workbox 2MiB 制限内に収まり sandbox デプロイも成功。

---

**識別子**: RC-3（GitHub id: 3637896939）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/components/layouts/DefaultLayoutWithVerticalNav.vue:33`

**該当コード（レビュー時点の diff）**:

```diff
+    <template #vertical-nav-header>
+      <EnterpriseVerticalNavHeader />
+    </template>
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-lightgrey?style=flat)</sub></sub>  モバイル用の閉じる操作を復元してください**

この `vertical-nav-header` スロットを渡すと Materio の既定 nav header が丸ごと置き換わり、既定実装にあった `d-lg-none` の閉じるボタンも消えます。`EnterpriseVerticalNavHeader` は pin/unpin だけを再実装しているため、スマホ幅でドロワーを開いた利用者はヘッダーから閉じられず、外側タップに頼る退行になります。スロット化するなら mobile close action も同時に渡せる形で復元してください。

**コメント要約**: カスタム vertical-nav-header で Materio 既定のモバイル close ボタンが消えた。スロット差替え時に close 操作を復元すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: UX 退行の指摘は妥当。`useVerticalOverlayNavClose` で navbar スロットの toggle を登録し、`EnterpriseVerticalNavHeader` に `layoutConfig.icons.close` + `d-lg-none` を追加。

---

**識別子**: RC-4（GitHub id: 3637896943）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `documents/08_エンタープライズ/00_計画/04_Phase2機能拡張計画.md:49`

**該当コード（レビュー時点の diff）**:

```diff
-| - [ ] | H-2 | **RC-20 確定** — 未ログイン時ロゴ URL 方針（Storage 公開 read / signed URL） |
-| - [ ] | H-1 | ヘッダー常時表示に `company_logo_url` を反映 |
-| - [ ] | H-9 | login / pass-code を背景画像 + 中央 v-card レイアウト化 |
+| - [x] | H-2 | ...
+| - [x] | H-1 | ...
+| - [x] | H-9 | ...
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-lightgrey?style=flat)</sub></sub>  WS-H の完了状態を実装内容と揃えてください**

この新規計画書では H-2/H-1/H-9 が未完了のままですが、この同じ変更で未ログイン時ロゴ URL 方針、ヘッダーロゴ反映、login/pass-code レイアウト刷新を追加し、コミットも #2205/#2206/#2213 を closes しています。進捗表を参照する後続作業者が完了済みタスクを再着手対象と誤認するので、完了済みなら ✅ に揃え、未完了なら実装/close 側を分けてください。

**コメント要約**: Phase2 計画表の WS-H タスク（H-2/H-1/H-9）が実装・Issue closes と不一致。完了済みならチェックを付けるべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 指摘妥当。本 PR で実装・closes 済みの 3 タスクを `- [x]` に更新。

---

**識別子**: RC-5（GitHub id: 3637896952）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `documents/08_エンタープライズ/10_仕様/02_アーキテクチャ.md:833`

**該当コード（レビュー時点の diff）**:

```diff
-// より具体的な match が親 match /enterprises/{enterpriseId}/{allPaths=**} より優先される
+// 同一パスに複数 match が一致した場合、いずれかの allow が許可すれば read 可（logo 側の `allow read: if true` が未認証 read を許可）
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-lightgrey?style=flat)</sub></sub>  Storage Rules の一致判定を正しく記述してください**

Firebase Storage Rules は「より具体的な match が親より優先」されるのではなく、同じパスに一致した `allow` のいずれかが許可すればアクセス可になります。この説明のままだと、将来 `/enterprises/{enterpriseId}/{allPaths=**}` 側の条件を変更した時に子 match が親を上書きすると誤解して、公開 read / tenant 限定 read の境界を誤設計するリスクがあります。ここは優先順位ではなく「両方一致し、ロゴ側の `allow read: if true` が許可を与える」と書き換えてください。

**コメント要約**: Storage Rules の match 優先順位の説明が Firebase 仕様と異なる。OR 評価（いずれか allow が許可すれば可）に修正すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書, 🔒 セキュリティ

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 指摘妥当。誤解を招く「優先」表現を削除し、複数 match の OR 許可モデルに書き換え済み。

---

## 評価セッション（2026-07-23 22:55・shokujii-code-review）

- **評価日時**: 2026-07-23 22:55 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **対象**: H-5/H-6/H-3/H-5d 未コミット差分（`/orders` 専用画面・リダイレクト・enterprise プロフィール UI 同期・ドキュメント）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-6 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | orders.vue の canLinkToDetail が isPublic のみ参照<br>非公開イベントで本人の詳細リンクが消える → isOwner 相当に修正 |

---

**識別子**: RC-6（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/pages/orders.vue:68`

**該当コード（レビュー時点）**:

```typescript
const canLinkToDetail = (isPublic: boolean, isLinkable?: boolean): boolean => isLinkable ?? isPublic
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `orders.vue` の `canLinkToDetail` が `isLinkable ?? isPublic` のみで、UserProfilePage の `isLinkable ?? (isOwner || isPublic)` と異なる。注文履歴は本人専用ページのため `is_linkable` 未指定かつ `is_public === false` の非公開イベントでイベント詳細リンクが表示されなくなる → `isLinkable ?? (isPublic || true)`（本人常時 true）に修正する。

**コメント要約**: 非公開イベントの注文履歴で本人向けイベント詳細リンクが欠落する regression。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: UserProfilePage から orders タブを切り出す際に isOwner 相当の分岐が落ちていた。本人専用ページとして `isLinkable ?? (isPublic || true)` に修正済み。

---

## 評価セッション（2026-07-24 15:07・review-comments-evaluate auto）

- **評価日時**: 2026-07-24 15:07 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-07-24T05:47:03Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（手順 12 の Copilot/Codex 依頼コメント）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-7 | 3643243986 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ, 👤 UX | 🔧 微修正 | S | user /orders が isLoginRequired 外<br>未ログイン直叩きで空画面 → /orders をログイン必須に追加 |

---

**識別子**: RC-7（GitHub id: 3643243986）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `user/src/pages/orders.vue:31`

**該当コード（レビュー時点の diff）**:

```diff
+<template>
+  <Orders :profile-filter="{ kind: 'pf-null' }" :navigate-to-event-chat="navigateToEventChat" />
+</template>
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  /orders をログイン必須にしてください**

user 側の新しい `/orders` は個人の注文履歴画面ですが、確認した `user/src/router/index.ts` の `isLoginRequired` は `/profile`・`/manage`・`/chat` 等だけを対象にしており、この追加ページは未認証でもそのまま表示されます。仕様上も `/orders` は「ログイン必須。PF / エンプラ共通の専用画面」（`documents/08_エンタープライズ/10_仕様/04_詳細_マイページ・友人.md:151`）なので、ログアウト状態で直接 `/orders` や決済後URLを開いた場合にログインへリダイレクトされず、空の注文履歴画面になって戻り先も保持されません。user ルーターのログイン必須判定に `/orders` を追加してください。

**コメント要約**: user 側 /orders がログインガード対象外で、未ログイン直叩き時に login へ redirect されない。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`user/src/router/index.ts` の `isLoginRequired` に `/orders` を追加。enterprise 側は `authGuards` で public 以外がログイン必須のため追加不要。

---

## 評価セッション（2026-07-25 22:05・review-comments-evaluate）

- **評価日時**: 2026-07-25 22:05 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-07-25T12:52:08Z
- **partial**: true（Codex 未レビューまたは limits/connect のみ）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（Copilot Pull request overview のみ・具体指摘なし）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-8 | 3650196173 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | canLinkToDetail の `isPublic \|\| true` を `isLinkable ?? true` に簡約 |
| [x] | RC-9 | 3650196180 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🏗️ 設計 | 🔧 微修正 | S | base orders.vue の `@/router/utils` 依存を props 注入に変更 |
| [x] | RC-10 | 3650196186 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | shokujii-code-review の orders「既存のみ」注記を #2208 例外表現に修正 |

**付記（自動修正）**: sandbox デプロイ失敗原因の `UserProfileFriendsPreviewCard.vue` の `withDefaults` ローカル変数参照も同セッションで修正（`() => true` に変更）。

---

**識別子**: RC-8（GitHub id: 3650196173）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/pages/orders.vue:70`

**レビュワーのコメント（原文）**:

[must] `canLinkToDetail` の実装が `isPublic || true` になっていて常に `true` になるため、意図が読み取りづらいです（結果として `is_linkable` 未指定時は常にリンク可、指定時のみ従う、という挙動）。意図どおりなら式を簡約して誤読余地をなくしてください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。本人のみ閲覧のため `isLinkable ?? true` に簡約。

---

**識別子**: RC-9（GitHub id: 3650196180）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/pages/orders.vue:17`

**レビュワーのコメント（原文）**:

[must] `base` 側の共通コンポーネントで `@/router/utils` に依存すると、各 app のルーティング差分/責務分離（path resolver を props 注入する方針）から外れます。`getEventPath` / `getReceiptPath` は `profilePathResolvers.ts` の型に揃えて props で受け取り、user/enterprise の wrapper から注入する形に寄せてください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🏗️ 設計

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`ResolveEventPathFn` / `ResolveReceiptPathFn` を追加し user/enterprise wrapper から注入。

---

**識別子**: RC-10（GitHub id: 3650196186）

**レビュワー**: Copilot

**指摘箇所**: `.agents/skills/shokujii-code-review/SKILL.md:153`

**レビュワーのコメント（原文）**:

`base/src/components/pages/orders.vue` をこの PR で新規追加しているため、「参照: … は既存のみ」という注記が事実と矛盾しています。今後のレビュー基準として誤解を招くので、表現を修正してください。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 指摘妥当。#2208 時点の例外として SKILL.md / shokujii-code-review.md を修正。

---

## 評価セッション（2026-07-26 14:52・review-comments-evaluate）

- **評価日時**: 2026-07-26 14:52 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-07-26T05:44:59Z
- **partial**: true（Codex 未レビュー・connect 案内のみ）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（手順 12 依頼コメント・Codex connect 案内・RC-13 と重複のトップレベルサマリ）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-11 | 3651873400 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | window.open に noopener,noreferrer を追加 |
| [x] | RC-12 | 3651873404 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | fetchEnterpriseUsageTabEligible 失敗時 showUsage=false |
| [x] | RC-13 | 3651873409 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | legacy usage redirect 失敗時 /orders へフォールバック |
| [x] | RC-14 | 3651873411 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | navigateToEventChat を try/catch 化 |
| [x] | RC-15 | 3651873413 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | route.query スプレッドを型注釈で受ける |

**付記（自動修正）**: 上記 RC-11〜15 を同一セッションでコード修正済み。

---

**識別子**: RC-11（GitHub id: 3651873400）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/pages/orders.vue:123`

**レビュワーのコメント（原文）**:

[must] `window.open(..., '_blank')` は `opener` 経由のタブ乗っ取りリスクがあるため、`noopener,noreferrer` を付けて `opener` を切ってください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。第3引数に `noopener,noreferrer` を追加。

---

**識別子**: RC-12（GitHub id: 3651873404）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/pages/orders.vue:28`

**レビュワーのコメント（原文）**:

[must] `fetchEnterpriseUsageTabEligible` の Promise を `catch` していないため、API 失敗時に unhandled rejection になり得ます（`showUsage` も前回値のまま残ります）。失敗時は `showUsage=false` にフォールバックしてください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`.catch(() => { showUsage.value = false })` を追加。

---

**識別子**: RC-13（GitHub id: 3651873409）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/pages/u/[userId].vue:31`

**レビュワーのコメント（原文）**:

[must] `fetchEnterpriseUsageTabEligible` の失敗時に `catch` していないため、unhandled rejection になり得ます。失敗時は安全側で `/orders`（usage なし）へリダイレクトしてください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`.catch` で `getOrdersPath()` へ replace。

---

**識別子**: RC-14（GitHub id: 3651873411）

**レビュワー**: Copilot

**指摘箇所**: `user/src/pages/orders.vue:27`

**レビュワーのコメント（原文）**:

[must] `waitForEventChatMembership` / `router.push` が例外を投げると `Promise<boolean>` が reject して呼び出し側が想定外になります（エラートーストも出ません）。既存の `useNavigateToEventChat` と同様に `try/catch` で `false` を返し、失敗時メッセージを出してください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`useNavigateToEventChat` と同様に try/catch + `chat.error.open_failed`。

---

**識別子**: RC-15（GitHub id: 3651873413）

**レビュワー**: Copilot

**指摘箇所**: `base/src/composable/useUserProfileTabSync.ts:45`

**レビュワーのコメント（原文）**:

[nits] `as` キャストは避けたいので、ここは型注釈で受けてください（`as` を残すと型安全性が下がります）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。変数に型注釈を付け `as` を削除。

---

## 評価セッション（2026-07-29 16:19・review-comments-evaluate）

- **評価日時**: 2026-07-29 16:19 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 5（レビュー依頼定型文×3・Codex connect 案内×1・Copilot トップレベル RC-13 重複×1）
- **手順 4a 自動修正**: RC-17〜19・RC-23（🚨 2件 / 🟡 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-16 | 3650210089 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | RC-9 と同一（router utils props 注入）<br>評価時点で対応済み |
| [x] | RC-17 | 3650210086 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 💾 データ | 🔧 微修正 | S | Enterprise で useUserStore 無条件 subscribe<br>autoSubscribe: false で回避 |
| [x] | RC-18 | 3650210088 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | members/managers に getUserRef 未使用<br>withConverter 付き ref に統一 |
| [x] | RC-19 | 3651896167 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | S | Checkout 直後 UID 空で完了ダイアログ<br>firebaseUser.uid + v-if で待機 |
| [x] | RC-20 | 3650210091 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 🔒 セキュリティ | 📋 仕様追加 | M | 停止メンバーが /orders を利用可能<br>useUserProfileAuthState ゲート後に Orders マウント |
| [x] | RC-21 | 3650210092 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 🔧 微修正 | S | eligible=false 時 ?tab=usage 残存<br>router.replace で /orders 正規化 |
| [x] | RC-22 | 3649670521 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | RC-13 と同一（legacy usage 失敗時）<br>.catch で /orders へ replace 済み |
| [x] | RC-23 | 3650210093 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 非同期 redirect の route 競合<br>requestPath 一致確認を追加 |
| [x] | RC-24 | 3649670518 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | logoRenderGeneration が再読込でリセット<br>updated_at ベース cache-bust に置換 |
| [x] | RC-25 | 3650210094 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | RC-24 と同一（v=1 再利用問題） |
| [x] | RC-26 | 3651880394 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | RC-24/25 と同一（セッション跨ぎ） |
| [x] | RC-27 | 3651880391 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | useNavigateToEventChat 再利用提案<br>RC-14 で try/catch 済み |

---

**識別子**: RC-16（GitHub id: 3650210089）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/pages/orders.vue:16`

**該当コード（レビュー時点の diff）**:

```diff
+import { getEventPath, getReceiptPath } from '@/router/utils'
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  base から app の router util を参照しないでください**

共有 `base` コンポーネントが `@/router/utils` を import すると、`@` が利用側アプリの alias として解決され、各 consumer が `getEventPath` と `getReceiptPath` を同じ形で実装していることに依存します。base 単体や別アプリで利用した場合に解決不能または誤ったルートになるため、他の path resolver と同様に app shell から props で注入してください。

**コメント要約**: base 共有コンポーネントが `@/router/utils` に依存している。RC-9（Copilot id: 3650196180）と同一指摘で、props 注入に修正済み。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-9 対応済み。`ResolveEventPathFn` / `ResolveReceiptPathFn` を props で受け取る実装に置換済み。重複指摘のため新規対応不要。

---

**識別子**: RC-17（GitHub id: 3650210086）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/composable/useUserProfileAuthState.ts:38`

**該当コード（レビュー時点の diff）**:

```diff
+  const { user, exists } = storeToRefs(useUserStore(profileUserId))
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Enterprise モードでは user store を生成しないでください**

Enterprise の `/u/:userId` でもこの行が無条件に `useUserStore` を生成するため、`getUserProfilePreview` の認可ゲートが完了する前に公開 Firestore の `users/{uid}` へ `onSnapshot` が開始されます。`useUserStore` の購読はページ離脱時にも解除されず、閲覧した UID ごとに不要なリスナーと課金 read が蓄積するうえ、`documents/08_エンタープライズ/10_仕様/04_詳細_マイページ・友人.md:361` の「preview 成功前の Firestore 直読を防ぐ」という方針にも反します。`pf-firestore` モードのときだけ store を生成してください。

**コメント要約**: enterprise-callable-gate でも useUserStore が onSnapshot を開始し、preview 前 Firestore 直読・リスナー蓄積が発生する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。§5.2.1 RC-44 に反する。`useUserStore` に `autoSubscribe` オプションを追加し、enterprise モードでは `autoSubscribe: false` で subscribe を抑止。

---

**識別子**: RC-18（GitHub id: 3650210088）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/composable/useUserProfileCommunityLists.ts:23`

**該当コード（レビュー時点の diff）**:

```diff
+        where('members', 'array-contains', doc(db, 'users', options.profileUserId)),
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ユーザー参照には getUserRef を使用してください**

コミュニティの `members` 条件に converter のない `doc(db, 'users', ...)` を渡しており、同じファイルの `managers` 条件にも同じ参照が複製されています。`base/src/stores/user.ts` が array-contains 用にも `getUserRef` を使うよう明記しているため、参照生成をそちらへ統一し、DocumentReference の converter 保証を維持してください。

**コメント要約**: array-contains 用 DocumentReference が withConverter なし `doc()`。AGENTS.md の xxxRef 規約違反。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`members` / `managers` 両方を `getUserRef` に置換。

---

**識別子**: RC-19（GitHub id: 3651896167）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/pages/orders.vue:42`

**該当コード（レビュー時点の diff）**:

```diff
+const userId = computed(() => loginUser.value?.user_id ?? '')
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Auth UID の確定後に決済完了ダイアログを表示してください**

Stripe Checkout からコールドリダイレクトされた場合、Firebase Auth が復元済みでも `users/{uid}` の snapshot が返るまでは `loginUser` が `null` のため、ここでは一時的に空の UID が渡されます。`UserSuccessJoinEventDialog` は空 UID の場合に注文読込中・`processing` 判定を無効化するため、PayPay などの処理中決済でも通常の完了表示やシェア誘導を先に表示し得ます。ログイン必須ルートで既に確定している `firebaseUser.uid` を使用するか、UID が非空になるまでダイアログを生成しないでください。

**コメント要約**: Checkout 直後は loginUser 未ロードで UID 空。完了ダイアログが processing 判定をスキップし誤表示しうる。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`firebaseUser.uid` をフォールバックに追加し、`userId !== ''` まで `UserSuccessJoinEventDialog` を v-if で抑止。

---

**識別子**: RC-20（GitHub id: 3650210091）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/pages/orders.vue:52`

**該当コード（レビュー時点の diff）**:

```diff
+  <Orders v-if="enterpriseId != null" :profile-filter="profileFilter" hide-share-sns>
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  /orders を有効な EnterpriseMember でゲートしてください**

Enterprise 版ではこの条件だけで注文画面をマウントするため、`disableEnterpriseMember` 後も有効期限内の ID トークンを持つ停止ユーザーが注文履歴を取得し、期限前注文のキャンセルまで実行できます。従来のプロフィール内注文タブは `getUserProfilePreview` 成功後の `isPreviewAccessGranted` を条件に `reload()` していましたが、新画面は即座に collectionGroup を読み、Rules と `cancelOrders` も本人・テナント一致のみで `is_active` を検証しません。既存の EnterpriseMember active 判定を通過するまで `<Orders>` を生成しないでください。

**コメント要約**: 停止メンバーが /orders で注文履歴取得・キャンセル可能。preview / active 判定ゲートが欠落。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書, 🔒 セキュリティ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: `useUserProfileAuthState(..., 'enterprise-callable-gate')` を追加。`isPreviewAccessGranted` 成立後のみ `<Orders>` をマウントし、停止メンバーは access_denied / not-found を表示。usage eligible 取得も gate 後に限定。

---

**識別子**: RC-21（GitHub id: 3650210092）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/pages/orders.vue:27`

**該当コード（レビュー時点の diff）**:

```diff
+    void fetchEnterpriseUsageTabEligible(uid).then((eligible) => {
+      showUsage.value = eligible
+    })
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  利用対象外では usage クエリを取り除いてください**

`/orders?tab=usage` を直接開いたユーザーが月額上限未設定の場合、この callback は `showUsage` を false にするだけなので URL が `/orders?tab=usage` のまま残ります。仕様では対象外時は `/orders` に正規化すると定義されており、現在の実装では存在しないセクションへの深リンクをブックマーク・共有できてしまいます。`eligible === false` のときは `tab` を除去する `router.replace` も行ってください。

**コメント要約**: 上限未設定時も URL が `?tab=usage` のまま。§4.2.9 の `/orders` 正規化未実装。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `fetchEnterpriseUsageTabEligible` 完了時（catch 含む）に `eligible === false` かつ `tab=usage` なら `router.replace(getOrdersPath())` で §4.2.9 に準拠。

---

**識別子**: RC-22（GitHub id: 3649670521）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/pages/u/[userId].vue:29`

**該当コード（レビュー時点の diff）**:

```diff
+    void fetchEnterpriseUsageTabEligible(uid).then((eligible) => {
+      void router.replace(getOrdersPath(eligible ? 'usage' : undefined))
+    })
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  旧利用状況URLの判定失敗時にも遷移を完了してください**

本人が旧ブックマーク `/u/:userId?tab=usage` を開いた際、Callable が一時的なネットワーク障害や Functions エラーで reject すると、この Promise には成功ハンドラしかないため遷移が実行されません。一方で関数は直後に `true` を返して `shouldShowProfile` を `false` にするので、利用者は旧 URL 上の空白画面に取り残され、未処理の Promise rejection も発生します。失敗時は `/orders` へフォールバックするかプロフィール表示を復元してください。

**コメント要約**: RC-13（Copilot id: 3651873409）と同一。legacy usage redirect の fetch 失敗時フォールバック。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-13 対応済み。`.catch(() => router.replace(getOrdersPath()))` が評価時点のコードに存在。

---

**識別子**: RC-23（GitHub id: 3650210093）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/pages/u/[userId].vue:29`

**該当コード（レビュー時点の diff）**:

```diff
+    void fetchEnterpriseUsageTabEligible(uid).then((eligible) => {
+      void router.replace(getOrdersPath(eligible ? 'usage' : undefined))
+    })
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  旧 usage URL の非同期リダイレクトを失効させてください**

旧 `/u/:userId?tab=usage` を開いた直後にユーザーが戻る操作や別ページへの遷移を行っても、この非同期判定はキャンセルされず、完了時に現在のルートを `/orders` へ `replace` します。判定には ID token と Firestore の複数 read が含まれるため競合時間があり、後からユーザーの正常な遷移を上書きできます。開始時の route を記録して完了時に一致を確認するか、watch の cleanup で古いリダイレクトを無効化してください。

**コメント要約**: 非同期 redirect が route 変更後も発火し、ユーザーの後続遷移を上書きしうる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`requestPath = route.fullPath` を記録し、then/catch 完了時に一致確認してから replace。

---

**識別子**: RC-24（GitHub id: 3649670518）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/stores/enterprise.ts:12`

**該当コード（レビュー時点の diff）**:

```diff
+  const logoRenderGeneration = ref(0)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ロゴのキャッシュ版をページ再読込後も一意にしてください**

管理画面で固定 Storage パスのロゴを上書きした後、この世代番号はページ再読込のたびに `0` へ戻り、最初の解決で再び `v=1` になります。そのため、更新前に `...?v=1` がブラウザへキャッシュされ、更新直後は `v=2` で新画像を表示できても、次回の再読込では再利用された `v=1` から古いロゴが復活し得ます。既存指摘後に世代番号が追加されたことが新しい根拠ですが、セッション内でしか単調増加しないため、アップロード日時やオブジェクト世代など永続的に変化する値を使用してください。

**コメント要約**: RC-1 の logoRenderGeneration はセッション内のみ有効。再読込後 v=1 再利用で古いロゴが復活しうる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: `logoRenderGeneration` を削除。`GetEnterpriseByDomainResponse.updated_at` と `Enterprise` コンストラクタの `src.updated_at` 読み取りを修正し、`withEnterpriseLogoCacheBust(url, updated_at)` に一本化。

---

**識別子**: RC-25（GitHub id: 3650210094）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/stores/enterprise.ts:24`

**該当コード（レビュー時点の diff）**:

```diff
+      logoRenderGeneration.value += 1
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ロゴの cache-bust 値をページ再読込後も再利用しないでください**

`logoRenderGeneration` はメモリ上で 0 から始まり、最初の企業解決で毎回 1 になるため、固定 Storage URL は各ページロードで同じ `?v=1` に戻ります。旧ロゴを `?v=1` でキャッシュしたブラウザでは、管理画面で同一パスへ新ロゴを上書きして一度 `?v=2` を表示できても、ページ再読込後に再びキャッシュ済みの旧画像へ戻ります。サーバー側の更新時刻・保存済みバージョンなど、再起動をまたいでロゴ更新ごとに変わる値を使用してください。

**コメント要約**: RC-24 と同一論点。メモリ世代では再読込後 cache キーがリセットされる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: RC-24 と同根。`updated_at` を cache キーに使用し再読込後も同一 `v=` を維持。

---

**識別子**: RC-26（GitHub id: 3651880394）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/stores/enterprise.ts:24`

**該当コード（レビュー時点の diff）**:

```diff
+      logoRenderGeneration.value += 1
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ロゴのキャッシュキーをセッションをまたいで更新してください**

`logoRenderGeneration` はページを読み直すたびに 0 へ戻り、初回の `resolveEnterprise()` で常に 1 になります。そのため、同じ Storage URL のロゴを上書きしたセッションでは一時的に `?v=2` で更新できても、その後の再読み込みでは過去にも使った `?v=1` に戻り、ブラウザが上書き前のロゴをキャッシュから再表示し得ます。ロゴの更新日時や保存世代など、サーバー側で更新のたびに変わり再読み込み後も維持される値をキャッシュキーに使用してください。

**コメント要約**: RC-24/25 と同一。セッション跨ぎで cache キーが単調増加しない。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: RC-24 と同根。`updated_at` ベース cache-bust でセッション跨ぎも正しいロゴを表示。

---

**識別子**: RC-27（GitHub id: 3651880391）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `user/src/pages/orders.vue:20`

**該当コード（レビュー時点の diff）**:

```diff
+  const roomId = await waitForEventChatMembership(userId, params.communityId, params.eventId)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  既存のチャット遷移 composable を再利用してください**

注文完了ダイアログからチャットを開く際、`router.push` などが例外を返すと、この関数の Promise がそのまま reject されます。呼び出し元の `UserSuccessJoinEventDialog` は `finally` しか持たないため、ユーザーには失敗通知が出ずダイアログに留まります。既存の `useNavigateToEventChat` は同じ処理を `try/catch` で包み、`chat.error.open_failed` を表示して `false` を返すので、ここでもその composable を利用してください。

**コメント要約**: RC-14 と同趣旨。composable 再利用を推奨するが try/catch 自体は RC-14 で対応済み。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-14 で try/catch + `chat.error.open_failed` を実装済み。composable 化は 📐 リファクタ相当で必須ではない。

---

## 評価セッション（2026-07-30 00:07・shokujii-code-review）

- **評価日時**: 2026-07-30 00:07 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **対象**: 直近 5 コミット（`86ec628f0`〜`b7ee39d2a`）
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-28 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 💾 データ | 🔧 微修正 | S | /orders で loginUser 先読みにより useUserStore 先 subscribe<br>RC-17 autoSubscribe:false が無効 |

---

**識別子**: RC-28（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/orders.vue:18`

**該当コード（レビュー時点の diff）**:

```diff
+const profileUserId = computed(() => loginUser.value?.user_id ?? firebaseUser.value?.uid ?? '')
+
+const {
+  ...
+} = useUserProfileAuthState(profileUserId.value, 'enterprise-callable-gate')
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `profileUserId.value` 評価時に `loginUser` を先に読むため、`useCurrentUserStore().user` computed 経由で `useUserStore(uid)`（デフォルト `autoSubscribe: true`）が先に生成される。Pinia は同一 `/users/${uid}` ストアを再利用するため、直後の `useUserProfileAuthState` 内 `{ autoSubscribe: false }` は無視され、RC-17 対応が `/orders` では効いていない。`UserProfilePage` と同様、`loginUser` を読む前に `firebaseUser.value?.uid` を `useUserProfileAuthState` に渡すか、ゲート用 UID の取得順序を入れ替えること。

**コメント要約**: RC-17 の autoSubscribe 抑止が orders ページで Pinia ストア再利用により無効化。preview 前 Firestore 直読が残る。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `currentUser.user` computed が `useUserStore(uid)` を副作用付きで呼ぶ設計と、`profileUserId` が `loginUser` を先参照するため、初回 store 生成時に subscribe が開始される。`UserProfilePage` は route param を先に渡しており問題なし。

**対応内容**: `firebaseUser.value?.uid` を `loginUser` 参照前に `gateUserId` として `useUserProfileAuthState` に渡すよう順序を入れ替え。

---

## 評価セッション（2026-07-31 16:52・review-comments-evaluate）

- **評価日時**: 2026-07-31 16:52 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼定型文×1・Codex connect 案内×1・Copilot 承知返信×1）
- **手順 4a 自動修正**: RC-29・RC-31・RC-32（🚨 2件 / 🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-29 | 5119902663 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | user UserProfile 外部リンク rel 未指定<br>noopener noreferrer 追加 |
| [x] | RC-30 | 3675795403 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | cart が /orders 直指定<br>resolveOrdersPath props 注入 |
| [x] | RC-31 | 3675795410 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 🔧 微修正 | S | autoSubscribe:false 後の subscribe 欠落<br>store 再利用時 subscribe() |
| [x] | RC-32 | 3675741933 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | gateUserId 空で preview 失敗<br>getAuth uid + 空 ID load 抑止 |

---

**識別子**: RC-29（GitHub id: 5119902663・PR トップレベル）

**レビュワー**: Copilot（copilot-pull-request-reviewer）

**指摘箇所**: `user/src/components/UserProfile.vue:105`

**該当コード（レビュー時点の diff）**:

```diff
+        <v-list-item :href="`https://forms.gle/QSuf1LNP8nR9pZbW9`" target="_blank">
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `user/src/components/UserProfile.vue:105` の外部リンクで `target="_blank"` を使っていますが `rel="noopener noreferrer"` が未指定です。`window.opener` 経由のタブ乗っ取りリスクがあるため、`rel` を追加してください。

**コメント要約**: Google Forms 外部リンクに `rel="noopener noreferrer"` が無い。shokujii-code-review のセキュリティチェック違反。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。enterprise 側は既に rel 付与済み。user のみ欠落。

---

**識別子**: RC-30（GitHub id: 3675795403）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/pages/cart.vue:301`

**該当コード（レビュー時点の diff）**:

```diff
+        await router.push({
+          path: '/orders',
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  注文履歴パスを app shell から注入してください**

`startOrderProcess` が共有 `base` コンポーネント内で `/orders` を直接指定しているため、利用側アプリで注文履歴のルートを変更したり別の app から再利用した場合、注文成功後に存在しない画面へ遷移します。現在の user / enterprise が同じパスであることに依存させず、`resolveOrdersPath` のような props を各 app の cart shell から渡してください。プロジェクト指定のレビュー項目にも、base 内へルーティングパスをハードコードしない規約があります。

**コメント要約**: base cart が `/orders` をハードコード。orders.vue と同様 path resolver を props 注入すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 指摘妥当。`ResolveOrdersPathFn` を `profilePathResolvers.ts` に追加し、base cart は `resolveOrdersPath` props 経由で遷移。user / enterprise の cart shell と `getOrdersPathAfterOrder` で注入。

---

**識別子**: RC-31（GitHub id: 3675795410）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/stores/user.ts:139`

**該当コード（レビュー時点の diff）**:

```diff
+    if (options?.autoSubscribe !== false) {
+      subscribe()
+    }
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  キャッシュ済みストアでも購読を開始してください**

Enterprise で別ユーザーのプロフィールを最初に開くと `useUserStore(id, { autoSubscribe: false })` がこの ID の Pinia ストアを生成しますが、後から `useUserStore(id)` を通常モードで呼んでも同じキャッシュ済みインスタンスが返り、この初期化処理は再実行されないため `subscribe()` が一度も開始されません。その後に同じユーザーを含むコミュニティやイベント参加者画面を開くと、`getLoadedUser()` が解決せず、氏名やアバター、参加者行が欠落したままになります。通常モードで取得するたびに既存ストアの `subscribe()` を呼ぶか、認可ゲートでは同じ Pinia ストアを生成しないようにしてください。

**コメント要約**: RC-17 の autoSubscribe:false 導入後、Pinia 再利用で subscribe が永久に開始されない regression。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`useUserStore` 取得時に `autoSubscribe !== false` なら `store.subscribe()` を毎回呼ぶよう修正（subscribe 内は idempotent）。

---

**識別子**: RC-32（GitHub id: 3675741933）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/pages/orders.vue:21`

**該当コード（レビュー時点の diff）**:

```diff
+const gateUserId = firebaseUser.value?.uid ?? ''
```

**レビュワーのコメント（原文）**:

[must] `gateUserId` を setup 時点の `firebaseUser.value?.uid` で固定しているため、ここが空文字のタイミングで評価されると `useUserProfileAuthState('', ...)` が走り、`getUserProfilePreview` Callable が空の `target_user_id` で呼ばれて `previewError` になったまま復帰できない可能性があります（`gateUserId` が以後更新されないため）。`getAuth().currentUser?.uid`（router guard が待っている認証確定値）を優先して初期化するか、少なくとも空文字ではゲート初期化しないようにしてください。

**コメント要約**: RC-28 修正後も setup 時点 UID 固定で preview が空 ID 呼び出ししうる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `/orders` は login 必須で router guard 後にマウントされるが、防御として `getAuth().currentUser?.uid` を優先し、`userProfilePreview` は `targetUserId === ''` のとき load しないよう変更。UID のリアクティブ再初期化は未実装（実害低）。

---

## 評価セッション（2026-07-31 16:54・shokujii-code-review）

- **評価日時**: 2026-07-31 16:54 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **対象**: 未コミット差分（RC-29〜32 自動修正 + evaluate 記録）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-33 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | reload 経由の空 target_user_id Callable<br>load 先頭 guard で抑止 |

---

**識別者**: RC-33（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/userProfilePreview.ts:23`

**該当コード（レビュー時点の diff）**:

```diff
     const reload = () => {
       data.value = null
       load()
     }
 
     if (targetUserId !== '') {
       load()
     }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 初期 `load()` のみ空 ID を抑止しており、`reload()` は `targetUserId === ''` でも `getUserProfilePreview({ target_user_id: '' })` を呼び得る。`load()` 先頭で空 ID なら return するよう統一すること。

**コメント要約**: RC-32 防御の抜け道。reload が空 Callable を再発火しうる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-32 と同根。初期化ガードだけでは不十分。`load()` 先頭 guard で init / reload 双方をカバー。

---

## 評価セッション（2026-07-31 17:35・review-comments-evaluate auto）

- **評価日時**: 2026-07-31 17:35 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・PR review wake）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-07-31T08:20:32Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（依頼定型文・Codex 接続案内のみ・Copilot 確認済み表）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-34 | 3689139785 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | getOrdersPathAfterOrder 引数不一致<br>オブジェクト destructuring に修正 |
| [x] | RC-35 | 3689139789 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 注文完了 watch で参加イベント未 reload<br>userEventListStore.reload 追加 |
| [x] | RC-36 | 5140905153 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | useUserStore subscribe 二重呼び出し<br>setup 内呼び出し削除・出口のみ |

**手順 4a 自動修正**: RC-34・RC-35

---

**識別子**: RC-34（GitHub id: 3689139785）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）/ Copilot トップレベル

**指摘箇所**: `user/src/router/utils.ts:11`, `enterprise/src/router/utils.ts:13`

**該当コード（レビュー時点）**:

```typescript
export const getOrdersPathAfterOrder = (eventId: string, communityAccount: string) => ({
```

**コメント要約**: Cart は `resolveOrdersPath({ eventId, communityAccount })` で呼ぶが utils は位置引数2個のため query が壊れ完了ダイアログが開かない。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。RC-30 実装のランタイムバグ。両 app の `getOrdersPathAfterOrder` をオブジェクト引数に変更。

---

**識別子**: RC-35（GitHub id: 3689139789）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/pages/orders.vue:136`

**コメント要約**: 注文完了 query 付き `/orders` 遷移時、注文履歴のみ reload し参加イベント Pinia キャッシュが stale のまま。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。移行前 mypage watcher 相当として `useUserEventListByUserId(..., autoLoad: false).reload()` を watch に追加。

---

**識別子**: RC-36（GitHub id: 5140905153・Copilot トップレベル内 [nits]）

**レビュワー**: Copilot

**指摘箇所**: `base/src/stores/user.ts:137-139`, `155-157`

**コメント要約**: autoSubscribe 時に setup 内と store 再利用時で subscribe が二重に見える。ガードで実害はないが意図が読みにくい。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。Pinia setup 内 subscribe は初回 options のみ効き RC-31 外側と重複。setup 内呼び出しを削除し `useUserStore` 出口の subscribe のみに統一。

---

## 評価セッション（2026-07-31 19:27・shokujii-code-review）

- **評価日時**: 2026-07-31 19:27 JST
- **ブランチ名**: dev/enterprise-mvp-v3
- **PR**: 未作成
- **Outdated**: 該当なし
- **手順 3a/3b 自動修正**: RC-37・RC-38

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-37 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | S | エンプラ Checkout 戻り redirect が loginUser のみ<br>firebaseUser フォールバック |
| [x] | RC-38 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | user /orders navigateToEventChat loginUser のみ<br>firebaseUser フォールバック |
| [x] | RC-39 | なし・エージェントレビュー | 👌 修正不要 | — | — | — | 👀 確認のみ | — | PF 完了モーダル shell 重複<br>composable 化は任意 |
| [x] | RC-40 | なし・エージェントレビュー | 👌 修正不要 | — | 📌 スコープ内 | 💾 データ | 👀 確認のみ | — | enterprise_id null read 互換<br>transform + テストで妥当 |

---

**識別子**: RC-37（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/u/[userId].vue:19`

**該当コード（レビュー時点）**:

```typescript
const uid = loginUser.value?.user_id
const isOwner = uid != null && uid === userId.value
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: エンプラ Stripe 成功 URL は PF 同様 `/u/{uid}?eventId=…` に着地するが、Checkout 直後の `/orders` への replace 判定が `loginUser.user_id` のみのため、Firestore ユーザ doc 未確定時は redirect が走らず注文完了モーダル（`base/orders.vue`）まで到達しない → PF `[userId].vue` / RC-19 と同様 `profileOwnerUid = loginUser.user_id ?? firebaseUser.uid` に揃える

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: エンプラはプロフィール上ではなく `/orders` でモーダル表示のため、redirect 遅延は PF と同種の UX 障害。同一セッションで修正済み。

---

**識別子**: RC-38（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/pages/orders.vue:16`

**該当コード（レビュー時点）**:

```typescript
const userId = loginUser.value?.user_id
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: PF の注文完了は主に `/u/` shell だが、legacy `?tab=orders` 等で `/orders` に query 付き着地した場合、`navigateToEventChat` が loginUser のみ参照し Auth 直後にチャット遷移が失敗しうる → `firebaseUser.uid` フォールバック

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: base `orders.vue` の `userId` は既に firebaseUser フォールバック済み。shell 側コールバックのみ揃えた。

---

**識別子**: RC-39（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/pages/u/[userId].vue:63`, `user/src/pages/orders.vue:15`

**レビュワーのコメント（原文）**:

👌 **修正不要**: `navigateToEventChat` と Checkout reload watch が `user/[userId].vue` と `/orders` shell に重複 → RC-27 と同様 composable 化は任意。PF 主経路（マイページ上モーダル）のスコープ内では許容

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 動作優先の shell 分割。リファクタは別 Issue 可。

---

**識別子**: RC-40（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/User.ts:66`

**レビュワーのコメント（原文）**:

👌 **修正不要**: `enterprise_id` に `nullable().transform(v => v ?? undefined)` を追加し PF materialize 後の `null` read を App 型に正規化。DbSchema 方針と矛盾せず、vitest で回帰防止済み

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: Stripe 戻り時の User 読込 ZodError 解消に直結。backfill 不要（read 互換のみ）。

---

## 評価セッション（2026-07-31 22:05・shokujii-code-review）

- **評価日時**: 2026-07-31 22:05 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: 未作成
- **Outdated**: 該当なし
- **レビュー非該当**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-41 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | usage パネル刷新後の未使用 i18n キー残存<br>`current_used` / `current_limit` / `history_used` |

---

**識別子**: RC-41（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/locales/messages/ja.ts:1011`

**該当コード**:

```typescript
      current_used: '今月の利用額',
      company_subsidy: '会社負担額',
      user_paid: '自己負担額',
      current_limit: '月額上限',
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `EnterpriseSubsidyUsagePanel.vue` の UI 刷新後、`current_used` / `current_limit` / `history_used` がテンプレートから参照されなくなった。`ja.ts` から削除するか、意図的に残すならコメントで理由を残すと dead key が増えない。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `enterprise/src/locales/messages/ja.ts` から未参照の 3 キーを削除済み。

---

## 評価セッション（2026-07-31 22:12・shokujii-code-review）

- **評価日時**: 2026-07-31 22:12 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: 未作成
- **Outdated**: 該当なし
- **レビュー非該当**: 該当なし
- **レビュー対象**: `monthly_user_paid`（自己負担額）追加 + 利用状況パネル 1 カード化のステージ済み差分

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-42 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | toEnterpriseMemberMonthlyUsageView の `monthly_user_paid ?? {}` が冗長<br>AppSchema default({}) で常に定義済み → 直接アクセスに修正 |
| [x] | RC-43 | なし・エージェントレビュー | 👌 修正不要 | — | 📌 スコープ内 | 💾 データ | 👀 確認のみ | — | リリース前確定注文の cancel で monthly_user_paid が未加算のまま減算されうる<br>Math.max(0,...) ガード + 仕様書に backfill 言及済みで許容 |

---

**識別子**: RC-42（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/composable/enterpriseMemberMonthlyUsageHistory.ts:64`

**該当コード**:

```typescript
  const userPaid = (member.monthly_user_paid ?? {})[currentMonth] ?? 0
  // ...
    history: buildMonthlyUsageHistory(
      member.monthly_usage,
      member.monthly_order_count,
      member.monthly_user_paid ?? {},
    ),
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `EnterpriseMember` は constructor で `EnterpriseMemberAppSchema.parse`（`monthly_user_paid` に `.default({})`）を通るため、`monthly_user_paid` は常に定義済み。同じ関数内の `monthly_usage` / `monthly_order_count` は直接アクセスしており、`?? {}` は冗長（チェックリスト「型で保証されているものを再チェックしない」）→ 直接アクセスに揃える。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 手順 3b の条件（📌 + S + 🔧 + 方針一意）を満たすため自動修正。`?? {}` を 2 箇所削除し、vitest 6 件（欠損時 0 のテスト含む）成功を確認。

---

**識別子**: RC-43（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:363`

**該当コード**:

```typescript
  const userPaidTotal = sumEnterpriseUserPaidAmounts(orders)
  await adjustEnterpriseMemberMonthlyUsage(
    enterpriseId,
    userId,
    eventMonth,
    -subsidyTotal,
    -orders.length,
    -userPaidTotal,
    transaction,
  )
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: 本デプロイ前に確定した注文（`monthly_user_paid` 未加算）を cancel すると、同月内の他注文の加算分から自己負担額を誤って減算しうる → `Math.max(0, ...)` ガードで負値は防止済み。仕様書 §5.6.3 に「リリース前確定分は 0 表示のまま・backfill は `bokudeli-event-batch` で実施可」と明記されており、backfill 実施で整合する。エンプラ MVP は未リリースのため実害なし。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 仕様書に既存データの扱い（0 表示 + batch 側 backfill）が明記済みで、減算は `Math.max(0, ...)` でガードされている。追加対応不要。

---

## 評価セッション（2026-07-31 · PR #2223 · wait-ai-pr-review auto · partial: Codex connect のみ）

**REVIEW_REQUEST_SINCE**: 2026-07-31T13:23:38Z

**スキップ**: 依頼定型文 1 件、Codex 接続案内 1 件。#2230 新規差分は Copilot が問題なし（RC 化なし）。

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-44 | 5143396806 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | profileOwnerUid 空チェック冗長 → v-if から削除 |
| [x] | RC-45 | 5143396806 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | UserSuccessJoinEventDialog v-if を && に統一 |
| [x] | RC-46 | 5143396806 | 👌 修正不要 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | navigateToEventChat 未注入意図をコメント追記 |

**自動修正**: RC-44〜46 を同一ターンで反映（user/base/enterprise 3 ファイル + 本記録）。

**識別子**: RC-44（GitHub id: 5143396806 · Copilot トップレベル）

**レビュワー**: Copilot

**指摘箇所**: `user/src/pages/u/[userId].vue:102`

**該当コード**:

```html
v-if="isOwner && hasCheckoutReturnQuery && profileOwnerUid !== ''"
```

**レビュワーのコメント（原文）**:

🟡 [nits] `profileOwnerUid !== ''` が冗長（前回未修正）。`isOwner` が true なら常に true。

**評価**: 🟡 修正提案 **ステータス**: ✅ 対応済み **PRスコープ**: 📌 スコープ内 **ラベル**: 📏 規約 **変更種別**: 🔧 微修正 **工数**: S

**判断理由**: 指摘妥当。冗長条件を削除。

---

**識別子**: RC-45（GitHub id: 5143396806 · Copilot トップレベル）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/pages/orders.vue:199`

**該当コード**:

```html
v-if="userId !== '' && (route.query.eventId != null || route.query.communityAccount != null)"
```

**レビュワーのコメント（原文）**:

🟡 [nits] v-if の `||` と初期化の `&&` が不整合。片方のみ query 時に空 store が走る可能性。

**評価**: 🟡 修正提案 **ステータス**: ✅ 対応済み **PRスコープ**: 📌 スコープ内 **ラベル**: 🐛 実害 **変更種別**: 🔧 微修正 **工数**: S

**判断理由**: setup / watch と同様 `eventId && communityAccount` のときのみマウントに揃えた。

---

**識別子**: RC-46（GitHub id: 5143396806 · Copilot トップレベル）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/pages/orders.vue:86`

**レビュワーのコメント（原文）**:

[ask] `navigateToEventChat` 未注入の意図確認。エンプラでチャット不要ならコメントで明示を。

**評価**: 👌 修正不要 **ステータス**: ✅ 対応済み **PRスコープ**: 📌 スコープ内 **変更種別**: 📄 ドキュメントのみ **工数**: S

**判断理由**: hide-share-sns と同様、意図を template コメントで明示。コード変更はコメントのみ。

---

## 評価セッション（2026-07-31 23:09・shokujii-code-review）

**評価日時**: 2026-07-31 23:09 JST  
**ブランチ名**: dev/enterprise-mvp-v3  
**PR**: #2223

利用状況 UI 再構成（会社設定ブロック + テーブル上限・残り）の未コミット差分をセルフレビュー。

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-47 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 🔧 微修正 | S | 当月挿入で 13 行になりうる → 12 件に再 slice |
| [x] | RC-48 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | settings_note 文言を「最も新しい開催月」に |

**識別子**: RC-47（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/composable/enterpriseMemberMonthlyUsageHistory.ts:135`

**該当コード**:

```typescript
  const withCurrentMonth = ensureCurrentMonthInHistory(rawHistory, currentMonth)
  const history = applyBudgetColumnsToHistory(withCurrentMonth, currentMonth, monthlyLimit)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案**: `ensureCurrentMonthInHistory` で rawHistory（最大 12 件）に当月を足すと 13 件になり EP-22 に反する。挿入後に `slice(0, 12)` すること。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `HISTORY_MAX_MONTHS` 定数と `trimmedHistory` で再 slice。vitest で 12 件上限を追加。

---

**識別子**: RC-48（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/locales/messages/ja.ts`（`user_profile.usage.settings_note`）

**レビュワーのコメント（原文）**:

🟡 **修正提案**: 「最も先の開催月」は未来方向の意味が曖昧。仕様書どおり「最も新しい開催月」に揃える。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: i18n 文案のみ修正。

---

## 評価セッション（2026-08-01 20:47・review-comments-evaluate）

- **評価日時**: 2026-08-01 20:47 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-08-01T10:44:42Z
- **partial**: true（Codex は no_issues のみ。connect 案内ボイラープレートあり。実質レビューは Copilot トップレベル）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（依頼定型文 5151078763、Codex no_issues 5151102480、Copilot 承知・対応確認のみ部分は RC 化せず、connect 案内 5151103278）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-49 | 5151102953 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | enterprise router / イベント詳細の冗長 as CommunityStore<br>キャスト削除 |
| [x] | RC-50 | 5151102953 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | useCommunityMemberFlags catch に reportClientError warn<br>community store と揃えた |

---

**識別子**: RC-49（GitHub id: 5151102953）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/router/index.ts:174` / `enterprise/src/pages/c/[communityAccount]/e/[eventId]/index.vue:44`

**レビュワーのコメント（原文）**:

### 🟡 [nits] `router/index.ts:174` / `c/[communityAccount]/e/[eventId]/index.vue:44` — 冗長な `as CommunityStore` キャスト

```ts
const communityStore = useEnterpriseCommunityStore(communityAccount) as CommunityStore
```

`useEnterpriseCommunityStore()` の戻り値型は明示的に `CommunityStore` と注釈されているため、`as CommunityStore` は冗長です。削除できます。

**該当コード**:

```ts
const communityStore = useEnterpriseCommunityStore(communityAccount) as CommunityStore
```

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: ラッパー戻り値型が CommunityStore のためキャストは不要。該当2箇所と未使用 import を削除。

---

**識別子**: RC-50（GitHub id: 5151102953）

**レビュワー**: Copilot

**指摘箇所**: `base/src/composable/useCommunityMemberFlags.ts:60`

**レビュワーのコメント（原文）**:

### 🟡 [nits] `base/src/composable/useCommunityMemberFlags.ts:60` — `console.error` のみで `reportClientError` 未使用

```ts
} catch (error) {
  console.error('Failed to get current user roles:', error)
```

既存の `community.ts` では同様の catch 節で `reportClientError(err, { severity: 'warn' })` を使っています。一貫性のため `reportClientError` に揃えることを推奨します（`getCurrentUserRoles` 失敗は fatal ではないので `severity: 'warn'` が適切）。

**該当コード**:

```ts
    } catch (error) {
      console.error('Failed to get current user roles:', error)
```

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: ロール取得失敗はフォールバックで継続するため warn で reportClientError を追加。

---

## 評価セッション（2026-08-02 20:16・review-comments-evaluate）

- **評価日時**: 2026-08-02 20:16 JST
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-08-01T12:59:52Z（直近 reflect 時のレビュー依頼以降）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（依頼定型文 5151528215、Codex connect 5151546842、Copilot トップレベル「新規指摘なし」5151546464）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-51 | 3695670677 | 🟡 修正提案 | 📤 #2236 別Issue化 | 📤 スコープ外 | 📏 規約 | 📐 リファクタ | M | チャット onOpenEvent の getDoc を store 関数へ<br>#2236 で user/enterprise 横断対応 |
| [x] | RC-52 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | EventEdit computed/非同期の useAppEventStore<br>inject 外 → useCreateAppEventStore |
| [x] | RC-53 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | M | 公開/管理 base を useAppCommunityStore 化<br>続き PR で event 横断・LetterTable 等も完了 |
| [x] | RC-54 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | EventDetailsCard が useEventStore のまま<br>useAppEventStore に統一 |
| [x] | RC-55 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | M | enterprise 導線の event/community store 置換漏れ<br>EventCard 等 + LetterTable factory |
| [x] | RC-56 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | injection key ファイル名・buildEnterpriseCommunityScope<br>useCreateAppCommunityStore 追加 |

---

**識別子**: RC-51（GitHub id: 3695670677）

**レビュワー**: Codex

**指摘箇所**: `enterprise/src/pages/chat/index.vue:25`

**該当コード（レビュー時点の diff）**:

```diff
@@ -0,0 +1,92 @@
+<script setup lang="ts">
+import { getDoc } from 'firebase/firestore'
+import ChatApp from '@shokujii/base/components/chat/ChatApp.vue'
+import { getEventInCommunityRef } from '@shokujii/base/stores/event.js'
+import { getChatPath, getEventPath, getUserPath } from '@/router/utils'
+
+definePage({
+  meta: {
+    layoutWrapperClasses: 'layout-content-height-fixed chat-layout-stretch',
+  },
+})
+
+const router = useRouter()
+
+const onNavigateRoom = (payload: { path: Parameters<typeof router.push>[0]; replace?: boolean }) => {
+  if (payload.replace === true) {
+    void router.replace(payload.path)
+  } else {
+    void router.push(payload.path)
+  }
+}
+
+const onOpenEvent = async (payload: { communityId: string; eventId: string }) => {
+  try {
+    const snapshot = await getDoc(getEventInCommunityRef(payload.communityId, payload.eventId))
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  Firestore 読み取りを store に移してください**

Enterprise チャットでイベントを開く際、このページと `enterprise/src/pages/chat/[roomId].vue` が `getDoc` を直接実行しており、Firestore 操作を store 関数へ集約するプロジェクトの必須境界を迂回しています。現在も両ページで取得・例外処理が重複し、失敗を握りつぶしているため、`base/src/stores/event.ts` に読み取り関数を設けて双方から呼び出してください。

AGENTS.md reference: [AGENTS.md:L186-L190](https://github.com/nijuniinc/bokudeli-event-new/blob/c6af6662abee0793394c62d6d5a3a4a094a72bbe/AGENTS.md#L186-L190)

Useful? React with 👍 / 👎.

**コメント要約**: チャット画面の `onOpenEvent` が `getDoc(getEventInCommunityRef(...))` をページ内で直接呼んでおり、store 経由の読み取り関数化を求めている。<br>`index.vue` / `[roomId].vue` で処理が重複。ref は store 由来だが read 本体はページ側。

**評価**: 🟡 修正提案

**ステータス**: 📤 #2236 別Issue化

**PRスコープ**: 📤 スコープ外

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: AGENTS.md の「store 経由」原則には沿う改善だが、`user/src/pages/chat/*.vue` も同一実装（#2235 は PF parity で enterprise フロントのみ追加）。`getEventInCommunityRef` は store の withConverter 付き ref を使用しており、今回差分だけを enterprise に store 読み取り関数を足すと user/enterprise で非対称になる。横断リファクタ（`fetchEventInCommunity` 等 + user/enterprise 両方）が自然なため本 PR（#2235）スコープ外とし、https://github.com/nijuniinc/bokudeli-event-new/issues/2236 に切り出した。Copilot トップレベル（5151546464）は当該チャット実装に問題なしと確認済み。

---

## 評価セッション（2026-08-02 20:45 JST・shokujii-code-review）

- **評価日時**: 2026-08-02 20:45 JST
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: 未作成（#2237 対応差分）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-52 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | EventEdit computed/非同期の useAppEventStore が inject 外 |
| [x] | RC-53 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | M | 公開/管理 base を useAppCommunityStore 化 |

---

**識別子**: RC-52（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventEdit.vue:169`（computed 内の event store 取得）

**該当コード（レビュー時点）**:

```typescript
const eventStore = useAppEventStore(props.eventId) as EventStore
```

（`existingMenus` computed・`updateEventDraft`・`onUnmounted` 等でも同様）

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `useAppEventStore` は内部で `inject()` するため、**setup 外**（computed getter・非同期ハンドラ）から呼ぶと enterprise スコープが取れず PF 用 `buildEventStoreOptions` に戻る。コミュニティ store は setup 一回呼び出しで #2237 の主症状は解消するが、保存・予約申請時の event store / draftPreparer が enterprise 向けにならない恐れがある → setup で `useCreateAppEventStore()` を一度呼び、返却クロージャを各所で使う。

**コメント要約**: inject コンテキストと Pinia store オプションの一貫性。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `useCreateAppEventStore` を追加し EventEdit は setup で factory を保持。同一レビュー内で修正済み。

---

**識別子**: RC-53（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/manage/community/CommunitySettings.vue:10` 等

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: #2237 はイベント編集経路（EventEdit / EventLetter 等）を `useAppCommunityStore` 化した。コミュニティ管理タブの `CommunitySettings`・`CommunityMemberTable` 等は依然 `useCommunityStore(account)` のままで、enterprise テナントでは同種の「存在しない community」問題が残る。Issue #2237 の完了条件外として別途横断置換を検討。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: `CommunityBioPanel` / `EventDetailsCard` / `CommunityMembershipButton` / `CommunityCardMini` および manage/community/* を `useAppCommunityStore` に置換。続く横断 PR（RC-54〜56）で event store・LetterTable・命名整理まで完了。

---

## 評価セッション（2026-08-02 21:15 JST・shokujii-code-review）

- **評価日時**: 2026-08-02 21:15 JST
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: 未作成
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-54 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | EventDetailsCard の event store PF 固定 |
| [x] | RC-55 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | M | enterprise 導線 component の useApp* 横断 |
| [x] | RC-56 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | communityInjectionKeys・factory・buildEnterpriseCommunityScope |

---

**識別子**: RC-54（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventDetailsCard.vue:79`

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: community は `useAppCommunityStore` 化済みだが event は `useEventStore(event_id)` のままで、enterprise 公開イベント詳細のメンバー・注文が PF Pinia スコープになる → `useAppEventStore(props.event)` に統一。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 本セッションで `useAppEventStore` に置換済み。

---

**識別子**: RC-55（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/EventCard.vue` 等（enterprise トップ・イベント詳細・管理）

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: inject スコープ対応の置換漏れ（EventCard / EventMenuList / EventCartDialog / EventFlyer / members / invites / UserSuccessJoinEventDialog / ProfileEventCard / LetterCard）。LetterTable は computed 内 store のため `useCreateAppCommunityStore` + `useCreateAppEventStore` を使用。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 計画どおり横断置換。`community.ts` の `subscribeEvents` も `buildEventStoreOptions(resolvedEnterpriseId)` を渡すよう修正。

---

**識別子**: RC-56（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/communityScopeSymbols.ts` / `useEnterpriseCommunityScope`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: `communityInjectionKeys.ts` へリネーム、`resolveInjectedCommunityScope` export、`useCreateAppCommunityStore` 追加、`useEnterpriseCommunityScope` → `buildEnterpriseCommunityScope`、冗長 `as CommunityStore` 削除。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: 本セッションで実装済み。

---

## 評価セッション（2026-08-04 19:30・review-comments-evaluate auto）

- **評価日時**: 2026-08-04 19:30 JST
- **評価者**: Cursor Agent（`wait-ai-pr-review` sentinel → auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: #2223
- **REVIEW_REQUEST_SINCE**: 2026-08-04T10:13:13Z
- **partial**: false
- **新規 RC**: RC-57〜59（依頼コメント 1 件・Copilot overview 1 件はスキップ）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-57 | 3711453831 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | クライアント遷移で /orders?eventId=… 時に完了ダイアログ未表示 |
| [x] | RC-58 | 4853112013・suppressed | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | cart monthlyUsage 正規化の値型検証不足 |
| [x] | RC-59 | 4853112013・suppressed | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | community 重複チェック query に limit(1) |

**自動修正**: RC-57〜59 を同一セッションでコード反映（`orders.vue` / `cartMonthlyUsage.ts` / `communityList.ts` + vitest）

### RC-57

**識別子**: RC-57（GitHub id: 3711453831）

**指摘箇所**: `base/src/components/pages/orders.vue`（L126-129 付近）

**diff_hunk**（抜粋）:

```diff
+const isUserSuccessJoinEventDialogVisible = ref(false)
+if (route.query.eventId != null && route.query.communityAccount != null) {
+  isUserSuccessJoinEventDialogVisible.value = true
+}
```

**レビュワーのコメント（原文）**:

クエリ変更時にも注文完了ダイアログを開いてください。同じ `/orders` コンポーネント再利用のままクライアントサイド遷移で query が付与された場合、初期化が再実行されずダイアログが開かない。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**判断理由**: `route.query` watcher 内で `isUserSuccessJoinEventDialogVisible = true` を設定。

### RC-58

**識別子**: RC-58（GitHub id: 4853112013・Copilot suppressed）

**指摘箇所**: `base/src/composable/cartMonthlyUsage.ts:39`

**レビュワーのコメント（原文）**:

[must] `normalizeCartEnterpriseSubsidyBudget` が `monthlyUsage` の値型を検証していないため、想定外データで下流計算が壊れる可能性。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

### RC-59

**識別子**: RC-59（GitHub id: 4853112013・Copilot suppressed）

**指摘箇所**: `base/src/stores/communityList.ts:81`

**レビュワーのコメント（原文）**:

[imo] 重複チェック query に `limit(1)` を付けて読み取りコストを抑える。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

---

## 評価セッション（2026-08-08 20:55・review-comments-evaluate）

- **評価日時**: 2026-08-08 20:55 JST
- **評価者**: Cursor Agent（review-comments-evaluate manual）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（レビュー依頼 2 行・Codex 接続案内・Copilot 承知返信・Codex 問題なしサマリ）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-60 | 3736796647 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🔒 セキュリティ | 🔧 微修正 | M | CommunityLetter のレター store に enterprise scope 未伝播 |
| [x] | RC-61 | 3736796632 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 🐛 実害 | 🔧 微修正 | M | カート福利厚生予算取得が Auth UID 確定前にスキップ |
| [x] | RC-62 | 3736796642 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | M | partner で useAppEventStore が PF 固定フィルタ |
| [x] | RC-63 | 3740504522 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | M | community subscribe の scope 省略が null 固定 |
| [x] | RC-64 | 3740504524 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | robots.txt に Disallow: /chat を追加 |
| [x] | RC-65 | 3736796651 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 利用履歴 12 件 slice で当月行脱落の edge case |
| [x] | RC-66 | 3740504526 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🔒 セキュリティ | 📋 仕様追加 | M | 管理コミュニティタブのイベント系 panel に scope 未注入 |
| [x] | RC-67 | Copilot suppressed | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | newcommunity validateNewAccount を未解決時 true |
| [x] | RC-68 | 3740504520 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | waitEnterpriseAuthentication の二重待機を pending 共有 |
| [x] | RC-69 | Copilot suppressed | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | enterpriseTenantCache.test afterEach unstub |

**自動修正（手順 4a）**: RC-64 / RC-67 / RC-68 / RC-69 をコード反映。enterprise vitest 38 件成功。

---

## 評価セッション（2026-08-08 21:30・shokujii-code-review）

- **評価日時**: 2026-08-08 21:30 JST
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: 未作成（ステージ済み差分を対象）
- **Outdated / レビュー非該当**: 該当なし

| 対応 | RC | 評価 | ステータス | PRスコープ | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-70 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔧 微修正 | S | EventList の enterprise scope 漏れ |
| [x] | RC-71 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔧 微修正 | S | resolveCommunityDocumentRef の limit |

### RC-70

- **識別子**: RC-70（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/components/EventList.vue:21`
- **評価**: 🚨 必須修正
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 💾 データ, 🔒 セキュリティ
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🚨 **必須修正** [🔧微修正/S]: `CommunityEventsPanel` / `CommunityInvoice` は `useCreateAppCommunityEventListStore` で `enterprise_id` 付き collectionGroup クエリに切り替わった一方、`CommunityLetter` が使う `EventList.vue` は引き続き `community_account` のみで `useEventListStore` を呼んでいる。Enterprise 管理のレタータブで PF 側と同一 `community_account` のイベントが混在しうる（RC-66 と同種）。→ `useCreateAppCommunityEventListStore()` で pageSize 5 の一覧を組み立てる。
- **判断理由**: テナント分離の穴がレター作成 UI に残る。→ EventList.vue を `useCreateAppCommunityEventListStore` に変更済み。

### RC-71

- **識別子**: RC-71（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/stores/community.ts:208`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📏 規約
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: 新設 `resolveCommunityDocumentRef` が一致件数分をすべて `getDocs` してから件数判定している。RC-59 と同様、`limit(2)` 等で読み取りを抑えつつ 2 件以上で曖昧エラーにできる。→ クエリに `limit(2)` を付与し、`docs.length > 1` で throw。
- **判断理由**: レター store 解決のたびに呼ばれ、データ異常時の read コストが増える。→ `limit(2)` 追加済み。

---

## 評価セッション（2026-08-08 21:34・shokujii-code-review）

- **評価日時**: 2026-08-08 21:34 JST
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **対象**: ステージ済み差分 + 本セッション追修正（community subscribe）
- **Outdated / レビュー非該当**: 該当なし

| 対応 | RC | 評価 | ステータス | PRスコープ | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-72 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔧 微修正 | S | community subscribe の communities クエリに limit(2) |

### RC-72

- **識別子**: RC-72（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/stores/community.ts:600`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📏 規約
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: `resolveCommunityDocumentRef` は RC-71 で `limit(2)` + 複数件 throw に揃えたが、`useCommunityStore` の `subscribe()` 初回 lookup は依然 limit なしで `docs[0]` を採用する。データ異常時の read コストと、意図しない community への購読リスクが残る → `resolveCommunityDocumentRef` と同様 `limit(2)` と `docs.length > 1` 時の停止を入れる。
- **判断理由**: RC-71 と対称にすべき。本セッションで subscribe クエリに `limit(2)` と曖昧時 early return を追加済み。

**その他（RC 化せず）**: `useCreateAppCommunityScope` は現状未参照。letter/event factory と inject パターンが重複するが、公開 API として残す判断も可能（害は小さい）。

---

## 評価セッション（2026-08-08 22:15・review-comments-evaluate auto · partial）

- **評価日時**: 2026-08-08 22:15 JST
- **評価者**: Cursor Agent（wait-ai-pr-review auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-08-08T13:08:07Z
- **partial**: true（Codex は connect 案内ののち no_issues のみ。実質レビュー指摘なし）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（依頼定型文 5226238671、Codex connect 5226251398、Codex no_issues 5226261322）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-73 | 5226250696 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 📋 仕様追加 | M | enterprise community 作成と manager 付与の原子的化 |
| [x] | RC-74 | 5226250696 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | M | 管理ルート canView の community 未解決 pending |

**自動修正（手順 4a）**: 対象外（🚨 2 件とも工数 M・transaction / ルータ設計の判断が必要）

### RC-73

- **識別子**: RC-73（GitHub id: 5226250696・Copilot トップレベル）
- **レビュワー**: Copilot
- **指摘箇所**: `functions/default/src/enterprise/community.ts:125`
- **評価**: 🚨 必須修正
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 💾 データ, 🐛 実害
- **変更種別**: 仕様追加
- **想定工数**: M
- **レビュワーのコメント（原文）**: [must] createSingleEnterpriseCommunity が saveCommunity 成功後に setCommunityMemberWithRoles を別実行。後段だけ失敗すると管理者不在の communities が残り、重複チェックのせいで再試行もしづらい。作成と manager 付与は transaction / batched write で原子的に扱うか、失敗時の補償削除が必要。
- **判断理由**: 指摘妥当。`createEnterpriseCommunityWithManager` で transaction 内に community set + manager member set と enterprise 内 account 再チェックを集約（RC-73 対応）。

### RC-74

- **識別子**: RC-74（GitHub id: 5226250696・Copilot トップレベル・2 点目）
- **レビュワー**: Copilot
- **指摘箇所**: `enterprise/src/router/index.ts:167`
- **評価**: 🚨 必須修正
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 🐛 実害, 👤 UX
- **変更種別**: 微修正
- **想定工数**: M
- **レビュワーのコメント（原文）**: [must] 管理画面ガードの canView 判定は、別テナント / 未存在で communityStore.community が null のまま終わる経路を考慮できていない。subscribe 側はリトライ打ち切り後も null のままなので Promise が resolve されず遷移 pending のまま。timeout か not-found 分岐で false / 404 へ倒す必要がある。
- **判断理由**: 指摘妥当。→ evaluateManageCommunityCanView + 8 秒タイムアウトで false に倒し、コミュニティ一覧へリダイレクト。

---

## 評価セッション（2026-08-08 22:21・review-comments-evaluate manual）

- **評価日時**: 2026-08-08 22:21 JST
- **評価者**: Cursor Agent（review-comments-evaluate manual）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 依頼定型文・Codex connect・Codex no_issues・Copilot 5226250696 と同一内容の重複指摘（RC-73/74 済）を除き多数スキップ

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-75 | 3695636873 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 📋 仕様追加 | M | Functions の getCommunityByAccount PF 固定化の漏れ<br>sendLetter / Slack が enterprise を解決できない |

**継続未着手（再掲）**: なし（RC-73 対応済み）

**自動修正（手順 4a）**: 本 manual セッションでは RC-75 のみ新規。実装は別タスクで RC-74/75 対応済み。

### RC-75

- **識別子**: RC-75（GitHub id: 3695636873）
- **レビュワー**: Codex（chatgpt-codex-connector[bot]）。Copilot 5225683075 の 3 点目（sendLetter）と同一論点
- **指摘箇所**: `functions/default/src/stores/community.ts:217`
- **該当コード（レビュー時点の diff）**:

```diff
@@ -194,17 +194,42 @@ export const getCommunitiesByIds = async (communityIds: readonly string[]): Prom
 …（diff 先頭省略）
+/** @deprecated 名前は PF 専用。新規コードは getPfCommunityByAccount を使う */
+export const getCommunityByAccount = getPfCommunityByAccount
```

- **レビュワーのコメント（原文）**: **<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  サーバーの Enterprise コミュニティ参照を PF 固定にしないでください**

この別名変更により、既存の `getCommunityByAccount` 呼び出しはすべて `enterprise_id == null` 固定になりますが、`functions/default/src/letter.ts:174` の予約レター送信と `functions/default/src/slackbot.ts:56` の Enterprise Slack コマンドは未移行です。Enterprise 管理画面にはレター／Slack 設定タブが存在するため、Enterprise コミュニティでは予約レターが `Community not found` として送信されず、Slack の add/remove も常に拒否されます。レター側は community ID 等、Slack 側はコマンドの enterprise ID を使ってスコープ付きで取得してください。

- **コメント要約**: getCommunityByAccount が PF 専用 alias になった一方、予約レター送信と Enterprise Slack コマンドが未移行のため enterprise コミュニティで community not found になる。<br>letter は community 参照を enterprise スコープ付きに、Slack は enterprise ID 付き lookup へ切替が必要。
- **評価**: 🚨 必須修正
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 💾 データ, 🐛 実害
- **変更種別**: 仕様追加
- **想定工数**: M
- **判断理由**: #2234 方針と整合。sendLetter は letter ref から communityId を取得し getCommunity。Slack は getCommunity(communityId) + account 照合。

---

## 評価セッション（2026-08-08 22:37・shokujii-code-review）

- **評価日時**: 2026-08-08 22:37 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **対象**: `git diff origin/development...HEAD` ブランチ全体（179 ファイル、+9,488/−3,553）。functions/common・base stores/composable・enterprise・base/user UI を領域分割レビュー後に統合。
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **補足**: RC-73〜75 は本セッションの新規採番対象外（記録上 ✅ 対応済み）。RC-75 論点は HEAD で `letter.ts` / `slackbot.ts` が community ID 解決済みであることを再確認し、記録内容と整合。

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-76 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 💾 データ | 🔧 微修正 | M | preview ゲート前のコミュニティ所属クエリ |
| [x] | RC-77 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | subscribe 曖昧一致の reportClientError 漏れ |
| [x] | RC-78 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 空 ID の useUserStore |
| [x] | RC-79 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | useProfileLinkPolicy computed 冗長 |
| [x] | RC-80 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | useAutoLoadWhenEmpty immediate |
| [x] | RC-81 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 料理画像失敗キャッシュ未リセット |
| [x] | RC-82 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | communityManager デッドコード |
| [x] | RC-83 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | テナント整合リトライの force なし token |
| [x] | RC-84 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | M | 未ログイン時の遷移ごと 2 秒待機 |
| [x] | RC-85 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | usage パネル #f6f7fb |
| [x] | RC-86 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | UserProfilePage enterpriseId! |
| [x] | RC-87 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | vertical-nav render 副作用 |
| [x] | RC-88 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | EventList as キャスト |
| [x] | RC-89 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | EventsTabPanel void ?? 二重 next |
| [x] | RC-90 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | UserEventCard subsidy を common へ |
| [x] | RC-91 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | プレビューカード markup 重複 |

**自動修正（手順 3a/3b）**: 本ターンは記録のみ（実装は別依頼）

### RC-76

- **識別子**: RC-76（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/composable/useUserProfileCommunityLists.ts:20`
- **評価**: 🚨 必須修正
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📑 仕様書, 💾 データ
- **変更種別**: 微修正
- **想定工数**: M
- **レビュワーのコメント（原文）**: 🚨 **必須修正** [🔧微修正/M]: `useUserProfileFriendsStores` は `canInitTabStores`（preview Callable ゲート）で store 生成を遅延させているのに対し、`useUserProfileCommunityLists` はゲートを受け取らず setup 時点で `useCommunityListStore` → `reload()` が走る。`useAutoLoadWhenEmpty` の watch が computed を即時評価するため、preview 許可前に `getCountFromServer` / `getDocs` が実行される。RC-17 と同種の「ゲート前 Firestore 直読」漏れ。→ friends 側と同様 `canInitTabStores` を受け取りゲート通過後に store を生成（PF は常時 true）。
- **判断理由**: `enterprise/src/components/profile/UserProfilePage.vue:133` が無条件呼び出し。アクセス拒否対象プロフィールでも所属コミュニティクエリが到達しうる。

### RC-77

- **識別子**: RC-77（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/stores/community.ts:603`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📏 規約
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: community subscribe で `docs.length > 1` の曖昧一致時、console のみで `reportClientError` なし。`return` により `community` が null のまま永久ローディング。`resolveCommunityDocumentRef` は throw する非対称。→ `reportClientError` 追加、warn/error 出力は 1 本に集約。
- **判断理由**: データ異常時の監視不能と UX 停滞。`communityList.ts` では `reportClientError` 済みで不整合。

### RC-78

- **識別子**: RC-78（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/composable/useUserProfileAuthState.ts:38`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 🐛 実害
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: 空 `profileUserId` のまま `useUserStore('')` に到達すると `doc(db, 'users', '')` が同期 throw し、composable 内の空文字ガードより先に setup が落ちる。→ 空 ID 時は store を生成せず null 固定 ref を返す、または呼び出し側で空 ID を排除。
- **判断理由**: RC-32/33 は preview store 側のみ。`useUserStore` 経路は未ガード。

### RC-79

- **識別子**: RC-79（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/composable/useProfileLinkPolicy.ts:5`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📏 規約
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: computed がクロージャを返すだけで `toValue(isOwner)` を追跡外で評価。computed 層が無意味な中継。→ computed を外し `ProfileLinkPolicyFn` を直接返す。
- **判断理由**: 規約「不要な中継」に該当。挙動は同一のまま簡潔化可能。

### RC-80

- **識別子**: RC-80（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/composable/useAutoLoadWhenEmpty.ts:7`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 🐛 実害
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: `watch(deps, ...)` に `immediate: true` がなく、マウント時点で既に `shouldLoad()` が true のケース（store 再利用再訪等）で自動ロードが発火しない。→ `{ immediate: true }` を付与（load 側は冪等）。
- **判断理由**: 安全側に倒す 1 行修正。

### RC-81

- **識別子**: RC-81（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/composable/useProfilePreviewMedia.ts:24`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 👤 UX
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: `previewDataVersion` 変更時に `failedEventCoverIds` のみリセットされ `failedFoodMenuImageIds` が残る。再読込後も料理画像がデフォルトのまま。→ 両 Set をリセットし更新方法を統一。
- **判断理由**: 再読込後の表示不整合。

### RC-82

- **識別子**: RC-82（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `functions/default/src/enterprise/communityManager.ts:117`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📏 規約
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: `getCommunityByAccountInEnterprise(tokenEnterpriseId, communityAccount)` 取得後、`enterprise_id` null チェックと `tokenEnterpriseId !== enterpriseId` が到達不能なデッドコード。→ 117〜124 行削除し `assertActiveEnterpriseMember` 等は `tokenEnterpriseId` を直接使用。
- **判断理由**: 冗長チェック・誤解を招くエラーメッセージの除去。

### RC-83

- **識別子**: RC-83（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `enterprise/src/utils/ensureEnterpriseTenantConsistent.ts:110`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 🐛 実害
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: テナント整合リトライの attempt 2 以降が force なし `getIdTokenResult()` のためキャッシュ token を返すだけで実質デッドコード。→ attempt 2 以降も `getIdTokenResult(true)` にするか maxAttempts を 2 に縮める。
- **判断理由**: sleep のみ増える無効リトライ。

### RC-84

- **識別子**: RC-84（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `enterprise/src/utils/ensureEnterpriseTenantConsistent.ts:56`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 👤 UX
- **変更種別**: 微修正
- **想定工数**: M
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/M]: tenant キャッシュがログアウト後も残るため、未ログインユーザーがナビゲーションのたびに最大 2 秒待たされる（RC-68 は同一ナビ内二重待機のみ）。→ 2 秒グレースはページロード後初回のみに限定。
- **判断理由**: 遷移横断の UX ペナルティ。

### RC-85

- **識別子**: RC-85（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `enterprise/src/components/profile/EnterpriseSubsidyUsagePanel.vue:144`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 👤 UX
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: 背景 `#f6f7fb` 直指定。dark テーマで視認性が壊れる。→ `--v-theme-*` / surface 系変数へ。
- **判断理由**: チェックリスト「テーマカラー直指定禁止」。

### RC-86

- **識別子**: RC-86（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `enterprise/src/components/profile/UserProfilePage.vue:51`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📏 規約
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: `enterpriseId.value!` 非 null アサーション。→ `orders.vue` と同様 null 時 `{ kind: 'none' }` フォールバック。
- **判断理由**: `as`/`!` 回避規約。再 resolve 失敗時のクエリ漏れリスク。

### RC-87

- **識別子**: RC-87（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `enterprise/src/components/layouts/DefaultLayoutWithVerticalNav.vue:47`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📏 規約
- **変更種別**: リファクタ
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [📐リファクタ/S]: `<template v-if="ensureVerticalOverlayNavToggleRegistered(...)">` で render 中副作用。→ ref を非 reactive 変数にするか watchEffect 中継コンポーネントへ。
- **判断理由**: Vue render 純粋性・可読性。

### RC-88

- **識別子**: RC-88（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/components/EventList.vue:22`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📏 規約
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: `as EventListStore` 冗長。ファクトリ戻り値型は既に `EventListStore`。→ キャスト削除（RC-49 同種）。
- **判断理由**: `as` 禁止規約。

### RC-89

- **識別子**: RC-89（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/components/profile/UserProfileEventsTabPanel.vue:20`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 🐛 実害
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [🔧微修正/S]: `props.onLoadMore?.() ?? props.eventListStore?.next()` は `void` 戻り値のため右辺も常に評価され二重 next しうる。→ if/else 分岐または props 統一。
- **判断理由**: 両 props 注入時の潜在バグ。

### RC-90

- **識別子**: RC-90（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/components/UserEventCard.vue:52`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📏 規約
- **変更種別**: リファクタ
- **想定工数**: S
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [📐リファクタ/S]: `enterprise_subsidy` の net 計算をコンポーネント直書き。→ `common` の `computeOrderLineNet` に分岐集約 + vitest。
- **判断理由**: 金額ロジック分散の回避。

### RC-91

- **識別子**: RC-91（GitHub id: なし・エージェントレビュー）
- **レビュワー**: Cursor Agent（shokujii-code-review）
- **指摘箇所**: `base/src/components/profile/UserProfileCommunitiesPreviewCard.vue:69`
- **評価**: 🟡 修正提案
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📏 規約
- **変更種別**: リファクタ
- **想定工数**: M
- **レビュワーのコメント（原文）**: 🟡 **修正提案** [📐リファクタ/M]: コミュニティ/イベントプレビュータイル markup が link/static × セクションで 4〜2 重複。→ 子コンポーネント抽出または `<component :is>` で 1 定義化（任意対応）。
- **判断理由**: monolith 移設時の重複。修正漏れ温床。

---

## 評価セッション（2026-08-08 23:05・RC-76〜91 実装）

- **評価日時**: 2026-08-08 23:05 JST
- **ブランチ名**: dev/enterprise-mvp-v3
- **PR**: 未作成
- **種別**: 実装対応（計画 RC-76〜91）

### RC 一覧（サマリ）

| 対応 | RC | 評価 | ステータス | 要約 |
| --- | --- | --- | --- | --- |
| [x] | RC-76 | 🚨 必須修正 | ✅ 対応済み | canInitTabStores で community list store 遅延生成 |
| [x] | RC-77〜91 | 🟡 修正提案 | ✅ 対応済み | 計画どおり composable / functions / enterprise UI / common / タイル抽出 |

**自動修正（手順 3a/3b）**: 該当なし（評価セッション 22:37 の指摘を一括実装）

各 RC ブロックの **ステータス** を ✅ 対応済み に更新済み。

## 評価セッション（2026-08-12 20:48・review-comments-evaluate auto）

- **評価日時**: 2026-08-12 20:48 JST
- **PR**: #2223
- **REVIEW_REQUEST_SINCE**: 2026-08-12T11:35:55Z
- **partial**: true（Codex substantive なし。Copilot 1 件のみ）
- **手順 4a 自動修正**: RC-92（🚨 1 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | 要約 |
| --- | --- | --- | --- | --- | --- |
| [x] | RC-92 | 3766045327 | 🚨 必須修正 | ✅ 対応済み | manageCommunityCanView の tenant ガード厳格化 |

### RC-92

- **識別子**: RC-92（GitHub id: 3766045327）
- **レビュワー**: Copilot
- **指摘箇所**: enterprise/src/router/manageCommunityCanView.ts:36
- **評価**: 🚨 必須修正
- **ステータス**: ✅ 対応済み
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 🔒 セキュリティ
- **変更種別**: 微修正
- **想定工数**: S
- **レビュワーのコメント（原文）**: [must] tenant 判定が未完了（enterpriseId 未解決）でも managers 判定に進んで true/false が確定し得ます。また enterpriseId が解決済みでも community.enterprise_id == null の場合に tenant mismatch 判定がスキップされます。support 以外は enterpriseId 解決まで pending にし、解決後は enterprise_id が一致しない null/undefined 含むコミュニティを明確に拒否するのが安全です。
- **判断理由**: enterpriseId 未解決時は null を返し、community.enterprise_id !== enterpriseId で PF/null コミュニティを拒否。テスト 2 件追加。

## 評価セッション（2026-08-12 22:20・review-comments-evaluate auto）

- **評価日時**: 2026-08-12 22:20 JST
- **PR**: #2223
- **REVIEW_REQUEST_SINCE**: 2026-08-12T13:11:41Z
- **partial**: true（Codex substantive なし。Copilot 1 件）
- **手順 4a 自動修正**: なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | 要約 |
| --- | --- | --- | --- | --- | --- |
| [x] | RC-93 | 3766743215 | 👌 修正不要 | — | Auth displayName 同期は #2232 仕様どおり |

### RC-93

- **識別子**: RC-93（GitHub id: 3766743215）
- **レビュワー**: Copilot
- **指摘箇所**: functions/default/src/enterprise/members.ts:471
- **評価**: 👌 修正不要
- **ステータス**: —
- **PRスコープ**: 📌 スコープ内
- **ラベル**: 📑 仕様書
- **変更種別**: 確認のみ
- **想定工数**: —
- **レビュワーのコメント（原文）**: [must] #2232 の仕様と異なり updateEnterpriseMember が tenantAuth.updateUser displayName を実行している。管理者が氏名を修正するたび従業員側の表示名に影響する。
- **判断理由**: 05_認証 §4.5 と 04_詳細_全社管理者画面.md は updateEnterpriseMember で Auth displayName を display_name に同期し users.user_name は更新しないと明記。#2232 コミット 0231e363a も Auth 同期維持が意図。Copilot は users 非更新のみを見て Auth 同期を誤指摘。

---

## 評価セッション（2026-08-12 22:36・review-comments-evaluate）

- **評価日時**: 2026-08-12 22:36 JST
- **ブランチ名**: dev/enterprise-mvp-v3
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0
- **手順 4a 自動修正**: RC-94（🚨 1 件）、RC-95（🚨 1 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-94 | 3766778628 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | getCommunityData が scope 省略を null 固定<br>partner 1 引数呼び出しが PF のみ検索 |
| [x] | RC-95 | 3766778635 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📋 仕様追加 | M | CSV 同時作成で同一 account が二重作成<br>enterprise/community_accounts キー doc で原子的確保 |

### RC-94（GitHub id: 3766778628）

**レビュワー**: Codex

**指摘箇所**: `base/src/stores/communityList.ts:76`

**該当コード（レビュー時点の diff）**:

```diff
@@ -69,9 +69,18 @@ export const useCommunityListStore = (filters: QueryConstraint[] | null = null,
         next()
       }
 
-      const getCommunityData = async (communityAccount: string): Promise<DocumentData | null> =>
+      const getCommunityData = async (
+        communityAccount: string,
+        options?: { enterpriseId?: string },
+      ): Promise<DocumentData | null> => {
+        const enterpriseId = options?.enterpriseId ?? null
         const duplicatedCommunity = await getDocs(
           query(
             collection(db, 'communities'),
+            where('enterprise_id', '==', enterpriseId),
             where('community_account', '==', communityAccount),
             limit(1),
           ),
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  partner の既存コミュニティ検索を非スコープのまま保ってください**

Enterprise コミュニティに紐づく店舗で `partner/src/pages/community.vue` を開く場合、同ファイルの 54 行目と 124 行目は `enterpriseId` を指定せず `getCommunityData` を呼ぶため、ここで `null` に正規化すると PF コミュニティだけが検索されます。その結果、既存コミュニティが存在しないと誤判定されて新規作成画面になり、編集できないだけでなく同じスラッグの PF コミュニティを作成し得ます。既存の `useCommunityStore` に対する指摘とは別に、この変更された検索ヘルパーにも同じ未移行の partner 呼び出しが残っていることが新しい根拠です。scope 省略時は従来の非スコープ検索を維持するか、店舗から解決したスコープを明示してください。

**コメント要約**: `getCommunityData` が `options` 省略時に `enterprise_id == null` で検索するため、partner が enterprise 店舗コミュニティを見つけられない。
RC-63 で `useCommunityStore` は修正済みだが `communityList` 側が同種の欠陥。scope 省略時は enterprise_id フィルタなしの従来検索を維持すべき。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。RC-63（community store）と同根で partner の 1 引数呼び出しが PF のみヒットし誤新規作成に至る。`options?.enterpriseId !== undefined` のときのみ enterprise_id 条件を付与するよう修正。

---

### RC-95（GitHub id: 3766778635）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/stores/community.ts:385`

**該当コード（レビュー時点の diff）**:

```diff
@@ -335,6 +360,45 @@ export const saveCommunity = async (community: ShokujiiCommunity): Promise<void>
   await db.collection('communities').doc(community.id).withConverter(communityConverter).set(community, { merge: true })
 }
 
+/** エンタープライズ CSV 作成時、同一 enterprise 内の community_account が既に存在する */
+export class CommunityAccountAlreadyExistsInEnterpriseError extends Error {
+  constructor() {
+    super('Community account already exists in enterprise')
+    this.name = 'CommunityAccountAlreadyExistsInEnterpriseError'
+  }
+}
+
+/**
+ * エンタープライズ向けコミュニティ作成と manager 付与を 1 トランザクションで原子的に行う。
+ * 親 `managers` 配列は onCommunityMemberWritten が再集計する。
+ */
+export const createEnterpriseCommunityWithManager = async (
+  community: ShokujiiCommunity,
+  managerUserId: string,
+): Promise<void> => {
+  const enterpriseId = community.enterprise_id
+  if (enterpriseId == null || enterpriseId === '') {
+    throw new Error('enterprise_id is required')
+  }
+  const db = getFirestore()
+  await db.runTransaction(async (transaction) => {
+    const existing = await getCommunityByAccountInEnterprise(enterpriseId, community.community_account, transaction)
+    if (existing != null) {
+      throw new CommunityAccountAlreadyExistsInEnterpriseError()
+    }
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  コミュニティアカウントの一意キーを原子的に確保してください**

同じ enterprise に対して複数の CSV 作成リクエストが同じ `community_account` を同時に処理すると、両トランザクションのクエリが空を返し得ます。空のクエリでは競合対象となる既存ドキュメントがない一方、各処理は異なるランダムな `community.id` へ書き込むため、双方が成功して同一スラッグのコミュニティが複数作成され、以後のルート解決が曖昧になります。`enterpriseId/account` から決まる一意キー文書を同じトランザクションで読み書きするなど、同時作成が必ず競合する構成にしてください。

**コメント要約**: 同時 CSV 作成でクエリ重複チェックだけでは race が残り、同一 account の community が複数 doc に作成されうる。
04_詳細_全社管理者画面 §6 の enterprise 内 account 一意要件に反する。トランザクション内で決定的なキー doc を create して競合させる必要がある。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 指摘妥当。RC-73 で save+manager 原子的化済みだが、異なる random community.id への同時書き込み race は残る。`enterprises/{id}/community_accounts/{account}` を transaction.create し、legacy データ向けに query チェックも併用。vitest 3 ケースに更新。

---

## 評価セッション（2026-08-12 23:20・shokujii-code-review）

- **評価日時**: 2026-08-12 23:20 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`・ブランチ全体差分レビュー）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **レビュー範囲**: `git diff origin/development...HEAD`（93 コミット・189 ファイル）を base components / base stores + common / enterprise / functions + terraform / user + documents の 5 領域に分割して精査
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3a 自動修正**: RC-116（🚨 1 件）
- **手順 3b 自動修正**: RC-99・101・103・105・110・111・115・120・125・126・129・134・135・136（🟡 14 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-96 | なし・エージェントレビュー | 🚨 必須修正 | 📤 #2250 別Issue化 | 📤 スコープ外 | 📏 規約, 🐛 実害 | 🔧 微修正 | M | `vue-tsc` 2.0.16 が TS 5.8.3 で無反応終了し `build:types` が型を検査していない<br>型エラーを仕込んでも 0.4 秒で成功。development 由来 |
| [ ] | RC-97 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🏗️ 設計 | 📐 リファクタ | M | base の CancelPolicyDialog が `@/router/utils` の `getOrdersPath` に依存<br>RC-9 の props 注入方針と不整合（依存自体は既存） |
| [ ] | RC-98 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約, 💰 金銭 | 🔧 微修正 | S | 福利厚生 budget ローダー失敗が `console.warn` のみ<br>残り予算表示が黙って消え調査不能 |
| [x] | RC-99 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `data.user_message` に文字列 falsy チェック<br>空文字を明示除外して `!= null` 判定に変更 |
| [x] | RC-100 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約, 🐛 実害 | 🔧 微修正 | S | プレビューカード / タイルが resolver の `RouteLocationRaw` を `string \| undefined` 前提で扱う<br>#2250 で `RouteLocationRaw \| undefined` に揃えた |
| [x] | RC-101 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | EventPreviewTile の `communityId` / `eventId` が未使用<br>props と親の binding を削除 |
| [ ] | RC-102 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🏗️ 設計 | 📐 リファクタ | S | EventsTabPanel の「もっと読む」が `onLoadMore` / `eventListStore` の 2 系統<br>構造型 props で store 型に追随できない |
| [x] | RC-103 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `withDefaults` 済み props への `?.` + `?? true` が冗長<br>直接呼び出し + 戻り値型明示に変更 |
| [ ] | RC-104 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約, 📑 仕様書 | 🔧 微修正 | S | 月次 usage 表示廃止後の旧 loader 一式が未使用のまま<br>仕様書が `enterpriseCartMonthlyUsageLoader` を参照中 |
| [x] | RC-105 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `normalizeCartEnterpriseSubsidyBudget` の `as` キャスト<br>`'monthlyUsage' in value` の型ガードに変更 |
| [ ] | RC-106 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `isPreviewAccessGranted` が isProfileLoading / isInvalidProfile を再実装<br>既存 computed の合成にすべき |
| [ ] | RC-107 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | M | 新規 profile composable 4 件の戻り値型が未指定<br>`CommunityListStore` 由来の複合型を新規に定義する必要あり |
| [ ] | RC-108 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `friendUserOf` が composable とカードで重複実装<br>composable 側は未参照 |
| [ ] | RC-109 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約, 📑 仕様書 | 🔧 微修正 | S | `cart.monthly_usage_label` が未参照キーとして残存<br>仕様書 §4.2.9 が用語基準として参照中 |
| [x] | RC-110 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 🔧 微修正 | S | `enterprise_id ?? scope` が PF 確定の null を scope で上書き<br>`resolveEffectiveEnterpriseId` に切り出し + vitest 追加 |
| [x] | RC-111 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | event store options を doc ごとに再計算し既存 util を未使用<br>store 生成時 1 回 + `resolveEventStoreOptionsFromInjectedEnterpriseId` に統一 |
| [ ] | RC-112 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ, 📏 規約 | 🔧 微修正 | S | `getCommunityData` の `enterpriseId` 3 値セマンティクスが communityScope と逆転<br>誤用時に全テナント横断検索へ落ちる |
| [ ] | RC-113 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 重複チェッククエリだけ `withConverter` なしで生 `DocumentData` を返す |
| [ ] | RC-114 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害, 📏 規約 | 🔧 微修正 | S | letterList の lookup 例外が TaskExecutor に握りつぶされ永久ローディング<br>`reportClientError` もなし |
| [x] | RC-115 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | RC-33 対応後に残った空 ID の二重ガード<br>初期化側を削除し `load` 先頭に集約 |
| [x] | RC-116 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 🔧 微修正 | S | `enterprise_id: null` の user doc を書き戻すと `undefined` キーが混入し `set` が失敗<br>`omitUndefined` を common util 化して適用 + 回帰テスト |
| [ ] | RC-117 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | EP-22「直近 12 ヶ月」が未来月の扱いを規定していない<br>実装は未来月も履歴枠を消費（RC-124 と対） |
| [ ] | RC-118 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | enterprise の robots.txt が user 版 allow-list のコピー<br>`Allow: /c/` 等 enterprise に存在しない前提が混在 |
| [ ] | RC-119 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 新規レイアウトの `defineProps` が `PropType` オブジェクト形式<br>RC-120 と同種で型ベースに揃えるべき |
| [x] | RC-120 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `PropType` + `eslint-disable` の props 宣言<br>`VerticalOverlayNavToggleFn` 型エイリアス + 型ベース props に変更 |
| [ ] | RC-121 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | usage パネルの `catch {}` が `reportClientError` なしで握りつぶす<br>「対象外」と「取得失敗」も同一表示 |
| [ ] | RC-122 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `loading` / `error` の 2 ref でローディング表現<br>`null \| boolean` パターン未使用 |
| [ ] | RC-123 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | ⚡ パフォーマンス | 🔧 微修正 | S | `fetchEnterpriseUsageTabEligible` がフル fetch を呼びタブ判定と本体で二重読み |
| [ ] | RC-124 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💰 金銭 | 🔧 微修正 | S | 履歴が降順 12 件 slice のため未来月が枠を占有し過去実績が落ちる |
| [x] | RC-125 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `useEnterpriseCommunityMemberFlags` の戻り値型が未指定 |
| [x] | RC-126 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | レイアウト内に `/chat` をハードコード<br>`getChatPath()` に統一 |
| [ ] | RC-127 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🏗️ 設計 | 📐 リファクタ | M | enterprise の chat ページが user 側実装をほぼ全文コピー |
| [ ] | RC-128 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `loadEventForRouteGuard` が非 ZodError 時に同一呼び出しを無言リトライ<br>意図がコメントされずガード待ちが最大 16 秒に |
| [x] | RC-129 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `currentUserId as string` のキャスト<br>null チェック + `=== true` 比較に変更 |
| [x] | RC-130 | なし・エージェントレビュー | 🚨 必須修正 | 📤 #2248 別Issue化 | 📌 スコープ内 | 🐛 実害, 📋 仕様追加 | 📋 仕様追加 | M | レター通知メールのリンクが常に PF ホスト<br>エンプラ会員が開けない URL を送信。P1 は #2249 |
| [ ] | RC-131 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `finalizeEnterpriseSubsidyZeroPaymentOrder` は自己負担 0 円を検証済みで<br>`sumEnterpriseUserPaidAmounts` が常に 0（冗長計算） |
| [ ] | RC-132 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | `community_accounts` キー doc が converter / スキーマなしの生 write |
| [ ] | RC-133 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📋 仕様追加 | M | キー doc の解放処理がなくコミュニティ削除・account 変更後も予約が残る |
| [x] | RC-134 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | ⚡ パフォーマンス | 🔧 微修正 | S | `:profile-filter="{ kind: 'pf-null' }"` のインラインオブジェクトで watch が毎回再発火<br>定数に切り出し |
| [x] | RC-135 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | legacy tab リダイレクトが同一処理の 2 分岐<br>`tab === 'orders' \|\| tab === 'usage'` に統合 |
| [x] | RC-136 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | user の `getOrdersPath` が使われない `tab` 引数を受け取る<br>引数を削除し呼び出し側も統一 |

### RC-96（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/package.json:59`

**該当コード（レビュー時点）**:

```json
"vue-tsc": "2.0.16"
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/M]: `npm run build:types` が型検査を実行していない。`base/package.json` の `vue-tsc` 2.0.16 はルートの `typescript` 5.8.3 と非互換で、`./lib/tsc` を解決できず**何も出力せずに exit 0** で終わる。検証として意図的に型エラーを注入しても 0.4 秒で成功した。→ PR verify の型ゲートが実質無効なので、`vue-tsc` を TypeScript 5.8 対応版（2.2 系以降）へ更新し、型エラーを注入したときに失敗することを確認してほしい。

**コメント要約**: `build:types` が vue-tsc / TypeScript のバージョン非互換で無反応終了し、全 Vue アプリの型検査が効いていない。
本ブランチ由来ではなく development から存在する問題だが、RC-100 のような型不整合が検出されないまま入る。

**評価**: 🚨 必須修正

**ステータス**: 📤 #2250 別Issue化

**PRスコープ**: 📤 スコープ外

**ラベル**: 📏 規約, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 影響は大きいが development 由来のツールチェーン問題。#2223 スコープ外として #2250 に切り出し。development マージ前必須。

---

### RC-97（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/CancelPolicyDialog.vue:4`

**該当コード（レビュー時点の diff）**:

```diff
-import { getLogin, getUserPath } from '@/router/utils'
+import { getLogin, getOrdersPath } from '@/router/utils'
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: base コンポーネントが `@/router/utils` を直接 import している。RC-9 で合意した「base パネルへの path は props 注入（`profilePathResolvers.ts`）」方針と不整合で、base → app の依存反転が残る。→ `resolveOrdersPath` を props で受け取る形に寄せてほしい。

**コメント要約**: base の CancelPolicyDialog が app 側 `@/router/utils` に依存。依存自体は本ブランチ以前から存在し、今回は import する関数名のみ変更。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🏗️ 設計

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 妥当だが、cart shell からの props 伝搬（`cart.vue` → `CancelPolicyDialog`）を伴い自動修正の一意性がない。既存依存の解消であり本 PR の必須ではないため未着手で記録。

---

### RC-98（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/pages/cart.vue:156`

**該当コード（レビュー時点）**:

```ts
      console.warn('[cart] enterpriseSubsidyBudgetLoader failed', error)
      enterpriseSubsidyBudget.value = null
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 福利厚生 budget のロード失敗が `console.warn` のみで、残り予算の表示が黙って消える。enterprise 側の `enterpriseCartSubsidyBudgetLoader` は `reportClientError` を呼んでいるのに base 側の catch は呼んでいない。→ `reportClientError(error, { componentInfo: 'cart', severity: 'warn' })` を追加してほしい。

**コメント要約**: 金額表示に関わる catch が `console.warn` 止まりで、本番で残り予算が消えても検知できない。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約, 💰 金銭

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 修正方針は一意で工数 S だが、`base` の cart は既存 catch も `console.error` 統一（`reportClientError` 未導入）であり、1 箇所だけ差し込むと方針が混在する。cart 全体の error 報告方針とあわせて対応すべきと判断し未着手で記録。

---

### RC-99（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/pages/orders.vue:109`

**該当コード（レビュー時点の diff）**:

```diff
-      if (hasRefundIssues || data.user_message) {
-        notification.show(data.user_message ?? $t('user.canceled'), 'warning')
+      const userMessage = data.user_message != null && data.user_message !== '' ? data.user_message : null
+      if (hasRefundIssues || userMessage != null) {
+        notification.show(userMessage ?? $t('user.canceled'), 'warning')
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 文字列 `data.user_message` に falsy チェックを使っている。空文字と null が同一視され、規約の「文字列は `!= null` / `!== ''` で判定」に反する。→ 明示比較に変更してほしい。

**コメント要約**: 文字列への falsy チェック。空文字時の意図が読み取れない。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で修正方針が一意なため手順 3b で自動修正。空文字を `null` に正規化してから判定するよう変更。

---

### RC-100（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/profile/UserProfileCommunitiesPreviewCard.vue:28`

**該当コード（レビュー時点）**:

```ts
const communityLinkTo = (
  c: UserProfileCommunityPreviewItem,
  canLinkToDetail: ProfileLinkPolicyFn,
  resolveCommunityPath: ResolveCommunityPathFn,
): string | undefined =>
  canLinkToDetail(c.is_public, c.is_linkable) ? resolveCommunityPath(c.community_account) : undefined
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: resolver の型は `ResolveCommunityPathFn = (account: string) => RouteLocationRaw` なのに、ヘルパーの戻り値と `UserProfileCommunityPreviewTile` の `linkTo` prop は `string | undefined` に固定されている。オブジェクト形式（`{ path, query }`）を返す resolver を app 側から注入すると型が破綻する。RC-96 のため型検査で検出されない。→ `RouteLocationRaw | undefined` に揃えるか、resolver 型を `string` に狭めてほしい。`UserProfileEventsPreviewCard.vue:30` も同型。

**コメント要約**: resolver 型（`RouteLocationRaw`）と受け側（`string | undefined`）が不一致。現状 user / enterprise が string を返しているため動作しているだけ。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 評価時点では方針が二択だったため自動修正しなかった。#2250 の `build:types` 通過作業でプレビューカード / タイル / `UserEventCard` を `RouteLocationRaw` に広げて解消済み。

---

### RC-101（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/profile/UserProfileEventPreviewTile.vue:9`

**該当コード（レビュー時点の diff）**:

```diff
 defineProps<{
-  communityId: string
-  eventId: string
   linkTo: string | undefined
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `communityId` / `eventId` props がテンプレート・script のどこからも参照されていない。→ props と親 (`UserProfileEventsPreviewCard.vue`) の binding を削除してほしい。

**コメント要約**: 未使用 props。インターフェースを無用に広げている。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。props と親の binding を削除。

---

### RC-102（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/profile/UserProfileEventsTabPanel.vue:13`

**該当コード（レビュー時点）**:

```ts
  onLoadMore?: () => void
  eventListStore?: { next: () => void }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: 「もっと読む」の入口が `onLoadMore` と `eventListStore` の 2 系統ある。後者は `{ next: () => void }` という構造型で `EventListStore` の実型に追随できず、base が store 実体を握る形にもなっている。→ `onLoadMore` 単一に寄せ、app shell 側で store の `next` を渡してほしい。

**コメント要約**: base パネルが store 実体と callback の二重入口を持ち、「表示 + emit」に留まっていない。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🏗️ 設計

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: 妥当だが user / enterprise 両 shell の呼び出し側修正を伴い、既存呼び出しの互換確認が必要。自動修正の一意性がないため記録のみ。

---

### RC-103（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/profile/UserProfileFriendsPreviewCard.vue:36`

**該当コード（レビュー時点の diff）**:

```diff
-const canLink = (friend: UserProfileFriendPreviewItem) => props.canLinkFriendPreview?.(friend) ?? true
+const canLink = (friend: UserProfileFriendPreviewItem): boolean => props.canLinkFriendPreview(friend)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `withDefaults` でデフォルト関数を与えている prop に `?.` + `?? true` を付けており、型で保証されている値を再チェックしている。→ 直接呼び出しに変更してほしい。

**コメント要約**: 冗長な optional chaining / nullish 合体。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。戻り値型も明示。

---

### RC-104（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/composable/cartMonthlyUsage.ts:1`

**該当コード（レビュー時点）**:

```ts
export type CartMonthlyUsage = { used: number; limit: number }
export type CartMonthlyUsageLoader = (userId: string) => Promise<CartMonthlyUsage | null>
export function normalizeCartMonthlyUsage(value: unknown): CartMonthlyUsage | null {
  ...
  const { used, limit } = value as CartMonthlyUsage
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: カートの月次 usage 表示を budget 方式に置き換えた結果、旧 `CartMonthlyUsage` / `normalizeCartMonthlyUsage` / `pfCartMonthlyUsageLoader` と `enterprise/src/composable/enterpriseCartMonthlyUsage.ts` がテスト以外から参照されないデッドコードになっている。旧 `normalizeCartMonthlyUsage` には RC-105 で除去したのと同じ `as` キャストも残っている。→ 旧 API とそのテストを削除してほしい。

**コメント要約**: 置き換え前の loader 一式が未参照のまま残存。仕様書 04_詳細_マイページ・友人.md も旧名を参照している。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約, 📑 仕様書

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 削除自体は容易だが、enterprise 側 loader・テスト・仕様書記述の同時更新を伴い、`enterpriseCartMonthlyUsageLoader` を将来の利用状況表示で再利用する想定があるか仕様判断が必要。自動修正対象外として記録。

---

### RC-105（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/composable/cartMonthlyUsage.ts:34`

**該当コード（レビュー時点の diff）**:

```diff
-  if (typeof value !== 'object' || value === null) {
+  if (typeof value !== 'object' || value === null || !('monthlyUsage' in value)) {
     return null
   }
-  const { monthlyUsage } = value as CartEnterpriseSubsidyBudget
+  const { monthlyUsage } = value
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `unknown` から `as CartEnterpriseSubsidyBudget` でキャストしている。規約は「`as` 回避は型ガードで行う」。→ `'monthlyUsage' in value` の型ガードに置き換えてほしい。

**コメント要約**: `as` キャストによる型の押し込み。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。`in` 演算子の絞り込みで `as` を除去。

---

### RC-106（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/composable/useUserProfileAuthState.ts:89`

**該当コード（レビュー時点）**:

```ts
  const isPreviewAccessGranted = computed(() => {
    if (isEnterpriseMode) {
      return profileUserId !== '' && !previewNotFound.value && !previewAccessDenied.value && previewData.value != null
    }
    if (profileUserId === '') return false
    if (exists.value === null) return false
    if (exists.value === false || (user.value != null && user.value.is_deleted)) return false
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: `isPreviewAccessGranted` が同ファイルの `isProfileLoading` / `isInvalidProfile` と同じ条件を再実装しており、判定が二重管理になっている。→ 既存 computed の合成（`!isProfileLoading.value && !isInvalidProfile.value && ...`）で表現してほしい。

**コメント要約**: 認可判定ロジックの重複。片方だけ直すと閲覧可否がずれる。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: プロフィール閲覧可否に直結するため、合成に置き換える際は enterprise / PF 両モードの真理値表を検証する必要がある（セキュリティ影響確認が必要）。自動修正対象外として記録。

---

### RC-107（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/composable/useUserProfileCommunityLists.ts:12`

**該当コード（レビュー時点）**:

```ts
export const useUserProfileCommunityLists = (options: {
  profileUserId: string
  profileFilter: Ref<ProfileListFilter>
  tabs: Ref<UserProfileTabKey>
  canInitTabStores: ComputedRef<boolean>
}) => {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/M]: 新規追加した profile 系 composable（`useUserProfileCommunityLists` / `useUserProfileFriendsStores` / `useUserProfileEventLists` / `useUserProfileAuthState` の一部）に戻り値の型注釈がない。規約は「関数の戻り値の型が明示されているか」。→ 戻り値型を定義してほしい。

**コメント要約**: 公開 composable の戻り値型が推論任せ。RC-96 のため型崩れも検出されない。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: `CommunityListStore` 等の複合型を含む戻り値型を新規に設計する必要があり、工数 M・修正方針も一意でない。自動修正対象外として記録。

---

### RC-108（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/composable/useUserProfileFriendsStores.ts:89`

**該当コード（レビュー時点）**:

```ts
  const friendUserOf = (item: { user_id: string; user_name: string; user_image_url: string }) =>
    new User(item.user_id, { user_name: item.user_name, user_image_url: item.user_image_url })
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: composable が `friendUserOf` を export しているが、`UserProfileFriendsPreviewCard.vue:33` が同じ関数を独自に再定義しており、composable 側の export は未参照。→ どちらかに寄せてほしい。

**コメント要約**: 同一ロジックの二重定義。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: base コンポーネントが composable に依存するか（RC-102 の「表示 + emit に留める」方針との整合）で寄せ先が変わるため、修正方針が一意でない。自動修正対象外として記録。

---

### RC-109（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/locales/messages/ja.ts:134`

**該当コード（レビュー時点）**:

```ts
    monthly_usage_label: '今月の割引利用',
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: カートの月次 usage 表示廃止に伴い `cart.monthly_usage_label` が未参照キーになっている（参照は `documents/08_エンタープライズ/10_仕様/04_詳細_マイページ・友人.md:230` の用語基準のみ）。→ キー削除と仕様書の用語参照先の更新をセットで行ってほしい。

**コメント要約**: 未参照 i18n キーの残存。仕様書が用語の基準として参照している。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約, 📑 仕様書

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-104 と同じデッドコード整理で、仕様書の用語基準をどのキーに差し替えるか仕様判断が必要。自動修正対象外として記録。

---

### RC-110（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/community.ts:231`

**該当コード（レビュー時点の diff）**:

```diff
-  const resolvedEnterpriseId =
-    (target instanceof BokudeliCommunity ? (target.enterprise_id ?? undefined) : undefined) ?? scope?.enterpriseId
+  const resolvedEnterpriseId = resolveEffectiveEnterpriseId(
+    target instanceof BokudeliCommunity ? target.enterprise_id : undefined,
+    scope?.enterpriseId,
+  )
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `target.enterprise_id ?? undefined` を `?? scope?.enterpriseId` に繋げているため、**PF コミュニティであることが確定している `null`** が scope の enterprise_id で上書きされる。enterprise セッションから PF コミュニティの store を引くと enterprise スコープとして解決され、テナントを跨いだ参照になる。→ `null`（PF 確定）と `undefined`（未指定）を区別する関数に切り出してほしい。

**コメント要約**: `null` と `undefined` を区別しない nullish 連鎖でスコープ解決が誤る。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で方針が一意なため手順 3b で自動修正。`communityScope.ts` に `resolveEffectiveEnterpriseId` を追加し vitest 3 ケースを追加。

---

### RC-111（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/community.ts:584`

**該当コード（レビュー時点の diff）**:

```diff
             const stores = eventStores.value || new Map()
-            const eventStoreOptions =
-              resolvedEnterpriseId != null && resolvedEnterpriseId !== ''
-                ? buildEventStoreOptions(resolvedEnterpriseId)
-                : {}
             stores.set(eventId, useEventStore(eventId, eventStoreOptions) as EventStore)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `onSnapshot` コールバック内で event ごとに store options を組み立て直しており、同一 store 内で不変な値を毎ドキュメント再計算している。さらに同じ判定を行う既存 util `resolveEventStoreOptionsFromInjectedEnterpriseId` を使っていない。→ store 生成時に 1 回だけ解決し、既存 util に統一してほしい。

**コメント要約**: 不変な options の重複計算と既存 util の未使用（独自実装）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。store 定義先頭で 1 回解決し、`buildEventStoreOptions` の直接呼び出しを削除。

---

### RC-112（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/communityList.ts:72`

**該当コード（レビュー時点の diff）**:

```diff
+      const getCommunityData = async (
+        communityAccount: string,
+        options?: { enterpriseId?: string | null },
+      ): Promise<DocumentData | null> => {
+        const duplicatedCommunity = await getDocs(
+          query(
+            collection(db, 'communities'),
+            ...(options?.enterpriseId !== undefined
+              ? [where('enterprise_id', '==', options.enterpriseId ?? null)]
+              : []),
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `enterpriseId` の 3 値セマンティクスが `communityScope` 側と逆転している。ここでは `undefined` = 「全テナント横断検索」だが、`resolveEffectiveEnterpriseId`（RC-110）では `undefined` = 「scope に委ねる」・`null` = 「PF 確定」。呼び出し側が誤って省略すると、テナント分離のないアカウント重複チェックに落ちる。→ scope 型（`CommunityStoreScope`）を受け取る形に揃えるか、`{ scope: 'any' | 'pf' | enterpriseId }` のような明示的な引数にしてほしい。

**コメント要約**: 同じ `enterpriseId?: string | null` という形で意味が反転しており、誤用が静かにテナント横断検索になる。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ, 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-94 の修正意図（partner の非スコープ検索を保つ）と両立させる引数設計を決める必要があり、方針が一意でない。呼び出し側（partner / enterprise）の期待を仕様として確定してから対応すべきと判断。

---

### RC-113（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/communityList.ts:76`

**該当コード（レビュー時点）**:

```ts
        const duplicatedCommunity = await getDocs(
          query(collection(db, 'communities'), ...),
        )
        return duplicatedCommunity.docs[0].data()
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: この重複チェッククエリだけ `withConverter` を通さず生の `DocumentData` を返している（同ファイルの一覧取得は converter 付き）。zod バリデーションが外れ、呼び出し側は型のない値を扱う。→ `communityConverter` 付きの ref を使ってほしい。

**コメント要約**: converter なしのクエリ。規約の「withConverter 付き ref を使う」に反する。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: converter を通すと呼び出し側（partner の存在チェック）が `DocumentData` 前提で書かれている箇所の戻り値型変更を伴い、既存挙動（zod パース失敗時に例外）への影響確認が必要。RC-112 と同じ関数なので併せて対応すべきと判断。

---

### RC-114（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/letterList.ts:38`

**該当コード（レビュー時点の diff）**:

```diff
+    let _letterListRef: CollectionReference<BokudeliLetter> | null = null
+    const getLettersRef = async () => {
+      if (_letterListRef == null) {
+        const communityRef = await resolveCommunityDocumentRef(communityAccount, scope)
+        _letterListRef = collection(communityRef, 'letters').withConverter(letterConverter)
+      }
+      return _letterListRef
+    }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `getLettersRef` の `resolveCommunityDocumentRef` が失敗すると `paginationExecutor.addTask` 内で例外が握りつぶされ、`letterStores` が `null` のままになる（レター一覧が永久ローディング）。`reportClientError` も呼ばれないため調査もできない。→ task 内を try/catch し、失敗時に `reportClientError` + 空配列でローディング解除してほしい。

**コメント要約**: community 解決失敗が TaskExecutor に飲まれ、UI が永久ローディングかつ無記録。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 失敗時に空配列で確定させるか error 状態を持たせるか（`letterStores` の `null` = ローディングという既存規約との整合）で UI 仕様の判断が必要。自動修正対象外として記録。

---

### RC-115（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/userProfilePreview.ts:54`

**該当コード（レビュー時点の diff）**:

```diff
-    if (targetUserId !== '') {
-      load()
-    }
+    load()
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-33 の対応で `load()` 先頭に空 ID ガードを入れた結果、初期化側のガードが冗長になっている。→ 呼び出し側のガードを削除してほしい。

**コメント要約**: 同一条件の二重ガード。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。`load()` 内のガードに集約。

---

### RC-116（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/User.ts:66`

**該当コード（レビュー時点の diff）**:

```diff
+import { omitUndefined } from '../utils/object.js'
...
 const convertToDb = (user: User) => {
-  return {
+  // AppSchema で null → undefined に正規化した enterprise_id はキーが残るため落とす
+  return omitUndefined({
     ...user,
     updated_at: Date.now(),
-  }
+  })
 }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `UserAppSchema` の `enterprise_id` は `.transform((v) => v ?? undefined)` で `null` を `undefined` に正規化するが、zod はキー自体を残すため `User` インスタンスは `enterprise_id: undefined` を own property として持つ。`toFirestore()` はそれをそのまま返し、プロジェクトは `ignoreUndefinedProperties` を設定していないため、`enterprise_id: null` を持つ PF ユーザーの doc を書き戻すと `Unsupported field value: undefined` で `setDoc` が失敗する。backfill で全 user に `enterprise_id: null` を materialize する計画（`02_developmentマージ.md` §2.4）と組み合わせると、**全 PF ユーザーのプロフィール更新が落ちる**。→ `Enterprise.ts` / `EnterpriseMember.ts` と同様に `undefined` キーを除去してほしい。

**コメント要約**: `enterprise_id: null` → `undefined` 正規化でキーが残り、Firestore 書き込みが失敗する。backfill 後に全 PF ユーザーへ波及。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 一時 vitest で `toFirestore()` に `enterprise_id: undefined` が残ることを再現確認。`Enterprise.ts` の内製 `omitUndefined` を `common/src/utils/object.ts` に共通化して両者から利用し、`User.test.ts` に回帰テスト 2 件を追加（手順 3a で自動修正）。

---

### RC-117（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/08_エンタープライズ/10_仕様/04_詳細_マイページ・友人.md:78`

**該当コード（レビュー時点）**:

```markdown
| EP-22 | 過去月の表示範囲 | **直近 12 ヶ月**（`monthly_usage` に存在するキーのうち、降順。…） | MVP |
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: EP-22 は「直近 12 ヶ月」としか書いていないが、実装（`enterpriseMemberMonthlyUsageHistory.ts`）は未来月キーも履歴に含め、当月〜最新未来月に上限・残額を付与する。未来月が 12 件あると過去実績が 1 件も表示されない（RC-124）。→ 未来月を履歴に含めるか、含める場合の枠の扱いを EP-22 に明記してほしい。

**コメント要約**: 仕様が未来月の扱いを規定しておらず、実装の挙動（未来月優先）が仕様から読み取れない。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 記載追加自体は S だが、どちらを正とするか（未来月を表示するか）は仕様判断。RC-124 と一体で決める必要があるため自動修正対象外。

---

### RC-118（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/public/robots.txt:5`

**該当コード（レビュー時点の diff）**:

```diff
+User-agent: *
+Allow: /
+Allow: /c/
+Allow: /communitylist
+Disallow: /admin
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: user 版 robots.txt をそのままコピーしており、`Allow: /c/` `Allow: /communitylist` のように enterprise では公開クロールを想定しないパスの allow-list が混在している。enterprise サイトは `firebase.json` で全パスに `X-Robots-Tag: noindex` を付けているため実害はないが、記述の意図が読めない。→ enterprise 向けに（noindex 前提の最小構成へ）整理してほしい。

**コメント要約**: user 由来の allow-list コピー。noindex ヘッダで indexing は防げているが記述が実態と合わない。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: `noindex` を効かせるにはクロール自体は許可する必要があり、どこまで `Disallow` にするかは SEO / 運用方針の判断。自動修正対象外として記録。

---

### RC-119（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/components/layouts/DefaultLayoutWithVerticalNav.vue:1`

**該当コード（レビュー時点）**:

```ts
defineProps({
  navItems: {
    type: Array as PropType<VerticalNavItems>,
    required: true,
  },
})
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 新規追加した enterprise レイアウトの `defineProps` が `PropType` オブジェクト形式のままで、RC-120 で型ベースに直したのと同種の書き方が残っている。→ `defineProps<{ navItems: VerticalNavItems }>()` に揃えてほしい。

**コメント要約**: 型ベース props への統一漏れ（materio 由来のコピーだが enterprise 側の新規ファイル）。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: materio の `VerticalNavLayout` からの複製部分であり、テンプレート更新時の diff 追従性を優先して原文維持する判断もありうる（`base/materio` 変更禁止方針との整合）。方針が一意でないため自動修正せず記録。

---

### RC-120（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/components/layouts/RegisterVerticalOverlayNavToggle.vue:5`

**該当コード（レビュー時点の diff）**:

```diff
-const props = defineProps({
-  // eslint-disable-next-line no-unused-vars
-  toggle: { type: Function as PropType<(value: boolean) => void>, required: true },
-})
+const props = defineProps<{
+  toggle: VerticalOverlayNavToggleFn
+}>()
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `PropType` + `eslint-disable` で関数 prop を宣言している。→ 型エイリアスを定義して型ベース `defineProps` に置き換えれば `eslint-disable` も不要になる。

**コメント要約**: 関数 prop の宣言方法が旧式で、lint 抑制コメントを伴っている。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。`useVerticalOverlayNavClose.ts` に `VerticalOverlayNavToggleFn` を追加し型ベース props に変更、`eslint-disable` を削除。

---

### RC-121（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/components/profile/EnterpriseSubsidyUsagePanel.vue:18`

**該当コード（レビュー時点）**:

```ts
  } catch {
    error.value = true
    data.value = null
  } finally {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `catch {}` が例外を完全に握りつぶしており `reportClientError` を呼んでいない。加えて `fetchEnterpriseMemberMonthlyUsage` は内部で失敗時 `null` を返すため、「福利厚生未設定（EP-20 の対象外）」と「取得失敗」が同じ `load_failed` 表示になり切り分けできない。→ catch で `reportClientError` を呼び、対象外と失敗を区別してほしい。

**コメント要約**: 金額パネルの catch が無記録。未設定と失敗が同一 UI。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `reportClientError` 追加のみなら S だが、未設定と失敗の区別は `fetchEnterpriseMemberMonthlyUsage` の戻り値設計（`null` の多義性）変更を伴い仕様判断が必要。自動修正対象外として記録。

---

### RC-122（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/components/profile/EnterpriseSubsidyUsagePanel.vue:33`

**該当コード（レビュー時点）**:

```ts
const loading = ref(true)
const error = ref(false)
const data = ref<EnterpriseMemberMonthlyUsageView | null>(null)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: ローディング状態を `loading` / `error` の 2 つの ref で表現しており、規約の「ローディング中は `null | boolean` パターン」に沿っていない。3 状態（読込中・失敗・成功）が 2 つの独立フラグで表現され、片方だけ更新するバグを許す。→ 単一の状態表現に寄せてほしい。

**コメント要約**: ローディング表現の規約不一致。状態の組み合わせ爆発。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: RC-121 と同一ファイルの状態設計であり、未設定 / 失敗の区別（仕様判断）とセットで直すべき。単独の自動修正は避けて記録。

---

### RC-123（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/composable/enterpriseMemberMonthlyUsage.ts:23`

**該当コード（レビュー時点の diff）**:

```diff
+/** 利用状況タブ表示可否（monthly_limit_per_user が設定されているか） */
+export async function fetchEnterpriseUsageTabEligible(userId: string): Promise<boolean> {
+  const view = await fetchEnterpriseMemberMonthlyUsage(userId)
+  return view != null
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: タブ表示可否の判定でフル取得（`EnterpriseMember` + `Enterprise` の 2 read + 集計）を実行し、その後パネル側でも同じ取得を行うため、`/orders` 表示ごとに同じドキュメントを二重に読んでいる。→ 判定結果（または view 自体）を共有して 1 回の取得で済ませてほしい。

**コメント要約**: タブ判定と本体表示で同一 Firestore 読み込みが 2 回走る。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: ⚡ パフォーマンス

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 共有方法（store 化 / shell での一度取得と props 注入）が複数あり方針が一意でない。EP-19 の「クライアント直読み」方針の範囲で設計判断が必要なため記録のみ。

---

### RC-124（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/composable/enterpriseMemberMonthlyUsageHistory.ts:61`

**該当コード（レビュー時点の diff）**:

```diff
+  return Array.from(keys)
+    .sort(compareYearMonthDesc)
+    .slice(0, maxMonths)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 履歴を「降順で先頭 12 件」で切っているため、未来月キー（先付けのイベント分）が枠を占有し、EP-22 が意図する過去 12 ヶ月の実績が表示されなくなる。当月行は `ensureCurrentMonthInHistory` / `trimMonthlyUsageHistoryPreservingCurrentMonth` で救われるが、過去月は救済されない。→ 未来月を別枠にするか、過去 12 ヶ月を基準に選ぶようにしてほしい。

**コメント要約**: 降順 12 件 slice のため未来月が履歴枠を消費し、過去実績が落ちる。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-117 の仕様確定（未来月を表示するか・何件まで）が前提。仕様判断を伴うため自動修正対象外として記録。

---

### RC-125（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/composable/useEnterpriseCommunityStore.ts:22`

**該当コード（レビュー時点の diff）**:

```diff
-export function useEnterpriseCommunityMemberFlags(communityAccount: string) {
+export function useEnterpriseCommunityMemberFlags(communityAccount: string): {
+  isMember: Ref<boolean>
+  isManager: Ref<boolean>
+} {
   return useCommunityMemberFlags(communityAccount, buildEnterpriseCommunityScope())
 }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 新規 composable の戻り値型が未指定。規約の「関数の戻り値の型が明示されているか」に反する。→ 戻り値型を明示してほしい。

**コメント要約**: 戻り値型の明示漏れ。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 委譲先 `useCommunityMemberFlags` の戻り値が単純な 2 フラグで一意に書けるため手順 3b で自動修正。RC-107 と異なり複合 store 型を含まない。

---

### RC-126（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/layouts/default.vue:117`

**該当コード（レビュー時点の diff）**:

```diff
-      await router.push('/chat')
+      await router.push(getChatPath())
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `/chat` をハードコードしている。同じファイルで `@/router/utils` の path ヘルパーを使っている箇所があり、経路定義が二重管理になる。→ `getChatPath()` に統一してほしい。

**コメント要約**: ルーティングパスのハードコード。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。既存 `getChatPath()` に置換。

---

### RC-127（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/chat/index.vue:1`

**該当コード（レビュー時点）**:

```
$ diff user/src/pages/chat/index.vue enterprise/src/pages/chat/index.vue
40a41
>         unread-badge-color="primary"
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: enterprise の chat ページが user 版 92 行のほぼ全文コピーで、差分は `unread-badge-color="primary"` の 1 行のみ。今後 chat 側の修正が片方に取り残される。→ 共有部分を `base` のパネルに切り出し、色差分だけ props で渡してほしい。

**コメント要約**: user / enterprise でほぼ同一のページ実装が二重管理になっている。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🏗️ 設計

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: base 化はコンポーネント分割方針（v-card / パネル単位・shell 分離）に沿った設計判断とテストを伴い工数 M。エンプラ MVP のスコープ外の改修として記録のみ。

---

### RC-128（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/router/index.ts:27`

**該当コード（レビュー時点の diff）**:

```diff
+async function loadEventForRouteGuard(eventStore: EventStore): Promise<BokudeliEvent> {
+  try {
+    return await eventStore.getLoadedEvent(EVENT_GUARD_LOAD_TIMEOUT_MS)
+  } catch (first) {
+    if (first instanceof ZodError) {
+      throw first
+    }
+    return await eventStore.getLoadedEvent(EVENT_GUARD_LOAD_TIMEOUT_MS)
+  }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 非 `ZodError` のとき同じ呼び出しを 1 回だけ無言でリトライしている。なぜ 1 回リトライすると成功しうるのか（初回購読の競合か、認証確立待ちか）がコードから読み取れず、失敗もログに残らない。最悪ケースでガード待ちが 8 秒 × 2 = 16 秒になる。→ リトライの理由をコメントに明記し、1 回目の失敗を `reportClientError` 等で記録してほしい。

**コメント要約**: 意図不明の無言リトライ。タイムアウトが実質 2 倍になり、失敗理由も残らない。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**想定工数の補足**: コメント追記のみなら S。

**判断理由**: リトライを入れた元の意図（どの失敗を救う想定か）が差分から確定できず、コメント文言を推測で書くと誤ったコメントになる。実装者確認が必要なため自動修正せず記録。

---

### RC-129（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/router/index.ts:196`

**該当コード（レビュー時点の diff）**:

```diff
-      const isSupport = config?.isSupport(currentUserId as string) ?? false
+      const isSupport = currentUserId != null && config?.isSupport(currentUserId) === true
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `currentUserId as string` でキャストしている。`null` の可能性があるからキャストが必要になっているので、null チェックで解消すべき。→ 明示的な null チェックに変更してほしい。

**コメント要約**: 認可判定における `as` キャスト。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。`currentUserId != null` を前置し、`=== true` で厳密比較（挙動は従来と同一：null 時は false）。

---

### RC-130（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/letter.ts:200`

**該当コード（レビュー時点の diff）**:

```diff
       const communityData = {
         ...
-        community_url: getCommunityUrl(communityAccount),
+        community_url: getCommunityUrl(communityAccount),
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [📋仕様追加/M]: レター送信メールの `community_url` / `event_url` が `getCommunityUrl` / `getEventUrl` 経由で常に `EVENT_HOST`（PF ホスト）を使う。本ブランチで letter は enterprise コミュニティも対象になったため、エンプラ会員に PF ホストのリンクが届き、テナント分離により開けない URL になる。リポジトリ全体を検索しても `ENTERPRISE_HOST` 相当のパラメータは存在しない。→ enterprise ホストを解決してコミュニティの `enterprise_id` に応じて URL を切り替えてほしい。

**コメント要約**: エンプラ向けメールのリンクが PF ホスト固定で到達不能。enterprise ホストを解決する仕組み自体が未整備。

**評価**: 🚨 必須修正

**ステータス**: 📤 #2248 別Issue化

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 📋 仕様追加

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 推奨仕様確定後 #2248 P0 レター・communityMail、#2249 P1 維持メールへ切り出し。ENTERPRISE_HOST 単一 env は採用せず Firestore + ENTERPRISE_BASE_DOMAIN 方式。PF ホストへのフォールバック禁止。

---

### RC-131（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:316`

**該当コード（レビュー時点の diff）**:

```diff
   const eventMonth = formatYearMonth(event.event_start_datetime)
+  const userPaidTotal = sumEnterpriseUserPaidAmounts(orders)
   await adjustEnterpriseMemberMonthlyUsage(
     ...
+    userPaidTotal,
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: この関数は直前で `computeEnterpriseSubsidyTotalPayment(orders) !== 0` なら throw しており、`sumEnterpriseUserPaidAmounts(orders)` は定義上つねに 0 になる（両者は `menu_price - pay_enterprise_subsidy_amount` の合計で同値）。型で保証されている値を再計算していて、読み手には「自己負担が発生しうる」と誤読させる。→ `0` を渡すか、常に 0 である旨をコメントで示してほしい。

**コメント要約**: 自己負担 0 円検証済みの経路で自己負担合計を再計算している（冗長）。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `0` 直書きに変えると将来 `computeEnterpriseSubsidyTotalPayment` と `sumEnterpriseUserPaidAmounts` の定義が乖離した際に不整合が出るため、あえて再計算している設計意図もありうる。方針が一意でないため記録のみ。

---

### RC-132（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/stores/community.ts:382`

**該当コード（レビュー時点の diff）**:

```diff
+const getEnterpriseCommunityAccountRef = (
+  db: ReturnType<typeof getFirestore>,
+  enterpriseId: string,
+  communityAccount: string,
+) => db.collection('enterprises').doc(enterpriseId).collection('community_accounts').doc(communityAccount)
...
+    transaction.create(accountKeyRef, { community_id: community.id })
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 新設した `community_accounts` キー doc が `withConverter` なしの生オブジェクトで書かれており、zod スキーマも定義されていない。規約は「DocumentReference は withConverter 付きを使う」。→ `common/src/schemas` にキー doc のスキーマを追加し converter を通してほしい。

**コメント要約**: 一意性キー doc が converter / スキーマなしの生 write。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: スキーマ追加は `common/src/schemas` への新規定義（命名・DbSchema/AppSchema の方針決定）を伴い、`shokujii-common-schemas` の設計判断が必要。RC-95 の緊急修正としては converter なしでも安全（Admin SDK 専用・単一フィールド）なため、記録して後続対応とする。

---

### RC-133（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/stores/community.ts:401`

**該当コード（レビュー時点の diff）**:

```diff
+    transaction.create(accountKeyRef, { community_id: community.id })
```

**レビュワーのコメント（原文）**:

🚨→🟡 **修正提案** [📋仕様追加/M]: `community_accounts` キー doc を作成する経路はあるが、解放する経路がどこにもない（リポジトリ全体で参照は本ファイルとテストのみ）。コミュニティ削除や `community_account` 変更を実装した時点で、旧 account が永久に予約され再利用できなくなる。→ 削除・rename 時にキー doc を同一トランザクションで消す処理、または移行手順を決めてほしい。

**コメント要約**: 一意性キーのライフサイクルが片道（作成のみ）。将来の削除・rename 機能で account が枯渇する。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 現時点でコミュニティ削除・account 変更の機能自体が未実装のため即時実害はない。解放処理の設計は削除機能の仕様とセットで決める必要があり、自動修正対象外（仕様判断）として記録。

---

### RC-134（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/pages/orders.vue:37`

**該当コード（レビュー時点の diff）**:

```diff
+const profileFilter = { kind: 'pf-null' as const }
...
-  <Orders :profile-filter="{ kind: 'pf-null' }" ... />
+  <Orders :profile-filter="profileFilter" ... />
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: テンプレートでインラインオブジェクトを prop に渡しているため、再レンダリングごとに新しい参照になり、`profileFilter` を watch している base パネル側のストア初期化が不要に再実行されうる。→ 定数に切り出してほしい。

**コメント要約**: インラインオブジェクト prop による参照の同一性喪失。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: ⚡ パフォーマンス

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。`script setup` 直下の定数に切り出し。

---

### RC-135（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/pages/u/[userId].vue:37`

**該当コード（レビュー時点の diff）**:

```diff
-  if (tab === 'orders') {
-    return { path: getOrdersPath(), query: rest, replace: true }
-  }
-  if (tab === 'usage') {
+  if (tab === 'orders' || tab === 'usage') {
     return { path: getOrdersPath(), query: rest, replace: true }
   }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: legacy tab のリダイレクトが同一処理の 2 分岐に分かれている。→ 1 つの条件にまとめてほしい。

**コメント要約**: 同一結果を返す条件分岐の重複。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。`||` に統合（EP-26 のリダイレクト仕様は不変）。

---

### RC-136（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/router/utils.ts:8`

**該当コード（レビュー時点の diff）**:

```diff
-export const getOrdersPath = (tab?: 'usage') => (tab === 'usage' ? '/orders' : '/orders')
+export const getOrdersPath = () => '/orders'
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: user アプリには利用状況セクションがないため `tab` 引数は結果に影響せず、両分岐が同じ値を返している。→ 引数を削除し、呼び出し側も揃えてほしい。

**コメント要約**: 常に同じ値を返す引数。呼び出し側に「usage 指定がある」と誤解させる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。引数を削除し、`UserProfile.vue` のパス比較も `getOrdersPath()` に統一。

---

## 評価セッション（2026-08-13 13:32・shokujii-code-review）

- **評価日時**: 2026-08-13 13:32 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`・前回 2026-08-12 23:20 以降の差分レビュー）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **レビュー範囲**: 前回セルフレビュー（`fddde0fcb`）以降の 73 ファイル。主対象は #2248/#2249 メール URL ホスト解決、#2250 vue-tsc gate / `build:types` 通過、セルフレビュー追随の型修正
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **既存 RC 更新**: RC-100 を ✅ 対応済み（#2250 で `RouteLocationRaw` に揃え済み）
- **手順 3a 自動修正**: なし（🚨 0 件）
- **手順 3b 自動修正**: RC-138・RC-139（🟡 2 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-137 | なし・エージェントレビュー | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書, 🐛 実害 | 🔧 微修正 | S | eventStatusChangeMail がホスト未解決時に throw し onDocumentWritten が永続リトライする<br>AC-13 はバッチを ERROR ログ + 送信スキップ。letter.ts に揃える |
| [x] | RC-138 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | getEventUrlForEvent が resolveAppHostForCommunity を再実装していた<br>`getEventUrlForCommunity` へ委譲 + 失敗系 vitest を追加 |
| [x] | RC-139 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 未使用の `getUserUrlForHost` が残っていた<br>呼び出しが無いため削除 |

---

**識別子**: RC-137（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/eventStatusChangeMail.ts:68`

**該当コード（レビュー時点の diff）**:

```diff
+  const event_url = await getEventUrlForEvent(event)
+  if (event_url == null && isEnterpriseEvent(event)) {
+    logger.error('Enterprise host unresolved for event status change mail', {
+      eventId: event.id,
+      enterpriseId: event.enterprise_id,
+    })
+    throw new Error('enterprise host is not configured')
+  }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `createTemplateDataForOrderDeadline` がホスト未解決時に `throw` している。`onEventChanged`（`onDocumentWritten`）は catch せず `Promise.all` で呼び出すため、subdomain / custom_domain とも未設定の enterprise ではトリガーが永続リトライする。仕様 AC-13 はバッチ送信を「URL 省略 + ERROR ログ」、Callable を `failed-precondition` としており、letter.ts は ERROR ログして `return` している。→ letter と同様に送信をスキップし、throw しないでほしい。`sendApplyingMailToAdmin` は空 URL のまま送信しており、同じファイル内でも扱いが割れている。

**コメント要約**: ホスト未解決で throw すると Firestore トリガーがリトライし続ける。AC-13 / letter.ts に合わせ ERROR ログ + 送信スキップ。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: AC-13 の「URL 省略」を空文字送信と解釈するか送信スキップと解釈するかが letter.ts 実装と併せて判断を要する。📑 仕様書のため手順 3b の自動修正対象外。

---

**識別子**: RC-138（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/urls.ts:91`

**該当コード（レビュー時点の diff）**:

```diff
 export async function getEventUrlForEvent(event: EventHostSource): Promise<string | undefined> {
-  const enterpriseId = event.enterprise_id
-  if (enterpriseId == null || enterpriseId === '') {
-    return getEventUrl(event.community_account, event.id)
-  }
-  const enterprise = await getEnterpriseById(enterpriseId)
-  if (enterprise == null) {
-    return undefined
-  }
-  const host = resolveEnterpriseAppHost(enterprise)
-  if (host == null) {
-    return undefined
-  }
-  return common.getEventUrl(host, event.community_account, event.id)
-}
+  return getEventUrlForCommunity(event, event.id)
 }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `getEventUrlForEvent` が `resolveAppHostForCommunity` と同じ lookup を再実装している。失敗系（enterprise 未存在・ホスト未設定）のテストは `resolveAppHostForCommunity` にしか無く、実装が分岐すると AC-13（PF へ落とさない）が片方だけ壊れる。→ `getEventUrlForCommunity(event, event.id)` に委譲し、`getEventUrlForEvent` の失敗系 vitest を追加してほしい。

**コメント要約**: ホスト解決の二重実装。委譲して失敗系テストを `getEventUrlForEvent` にも足す。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で修正方針が一意なため手順 3b で自動修正。委譲後に enterprise 未存在 / ホスト未設定の vitest を追加し 10 件パス。

---

**識別子**: RC-139（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/urls.ts:107`

**該当コード（レビュー時点の diff）**:

```diff
-export function getUserUrlForHost(host: string, userId: string): string {
-  return common.getUserUrl(host, userId)
-}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `#2248` で追加された `getUserUrlForHost` がリポジトリ内に呼び出しが無い。P0 の community / event URL 解決にも使われておらずデッドコード。→ 未使用のため削除してほしい。

**コメント要約**: 未使用ヘルパー。呼び出しが無いため削除。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 📌 + S + 🔧 で一意なため手順 3b で自動修正。関数を削除した。

---

## 評価セッション（2026-08-13 13:32・review-comments-evaluate auto）

- **評価日時**: 2026-08-13 13:32 JST
- **ブランチ名**: dev/enterprise-mvp-v3
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-08-13T04:24:30Z
- **partial**: true（Codex substantive なし・connect 案内のみ。Copilot substantive 1 件）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼 5275943125、Codex 接続案内 5275953050）
- **新規 RC なし**: Copilot 5275951938 は RC-93（3766743215）と同一指摘（`updateEnterpriseMember` の Auth displayName 同期）。05_認証 §4.5 どおりの実装のため再採番しない
- **手順 4a 自動修正**: なし

### RC 一覧（サマリ）

（本セッションで新規 RC なし）

---

