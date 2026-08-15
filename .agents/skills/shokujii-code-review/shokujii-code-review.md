---
name: shokujii-code-review
description: Shokujiiプロジェクトのコーディング規約に従ってコードをレビューする。指摘は 🚨必須修正/🟡修正提案/👌修正不要（評価・不変）。対応後はステータスを ✅対応済み、別Issue化は 📤#NNNN別Issue化（review-comments-evaluate と共通）。RC 記録は review-<ブランチslug>.md（review-doc-path 参照）。コード変更のレビュー依頼時に使用する。
---

# Shokujii コードレビュー

過去のレビューコメント（kokufu）から抽出したプロジェクト固有のルール集。
コードレビュー時はこのチェックリストに沿って確認すること。

---

## チェックリスト

### TypeScript・型安全性

- [ ] `any` を使用していないか
- [ ] `as` によるキャストを使用していないか（型推論で解決できるはず）
- [ ] `common` の schema・API 以外で新規 Zod スキーマを定義していないか（`ZodError` の捕捉のみ可）。`as` 回避は型ガードで行う
- [ ] `@ts-ignore` を使用していないか
- [ ] 関数の戻り値の型が明示されているか
- [ ] `optional` と `nullable` を適切に使い分けているか
- [ ] `tsconfig` の strict 設定を緩める変更をしていないか
- [ ] 型検査を実質的に無効化する変更をしていないか（`build:types` の対象外指定追加・`**/*.test.ts` 除外・`verify:vue-tsc-gate` の迂回・`skipLibCheck` の拡大等）
- [ ] 引数・戻り値を `unknown` にして呼び出し側の型検査を消していないか
- [ ] 必須の識別子を `optional` + 既定値フォールバック（`app?: string` + `?? 'user'` 等）にしていないか（渡し漏れが型で検出できず、別テナント・別 app に集計される）

### 比較・falsy チェック

- [ ] 数値に falsy チェック (`!`, `||`, `if (num)`) を使っていないか（`0` に誤反応する）
- [ ] 文字列に falsy チェックを使っていないか（`!= null` または `!== ''` を使う）
- [ ] boolean 以外の値に `!` を使っていないか（`!= null` に変更する）
- [ ] `null` と `undefined` を区別して比較しているか（`== null` で両方を捕捉する）
- [ ] 権限チェック関数が `Promise<boolean>` 等を返す場合、呼び出し側で `await` しているか（await 漏れは常に truthy 判定になり認可バイパスに直結する）

### Vue リアクティビティ

- [ ] `watch` の多用をしていないか（`computed` で代替できる場合は `computed` を使う）
- [ ] リアクティブ変数 (`.value`) を関数内で直接使っていないか
- [ ] `isProcessing`、`isCompleted` 等の一時フラグを不必要にリアクティブにしていないか
- [ ] `v-if` と `v-show` を適切に使い分けているか（機能を殺す場合は `v-if`）
- [ ] `defineEmits` を最新の型構文で書いているか（例: `defineEmits<{ save: [menu: BokudeliPartnerMenu] }>()`）
- [ ] `defineProps` を型ベースで書いているか（`PropType` オブジェクト形式 + `eslint-disable` は不可。関数 props は型エイリアスを定義し、既定値は `withDefaults` で与える）
- [ ] `props` と `model` を同時に定義していないか
- [ ] イベントハンドラ・ライフサイクルフックから呼ぶ非同期処理に `try/catch` があるか（unhandled rejection や UI 不整合を防ぐ）
- [ ] 初期値の時点で既に条件を満たしうる `watch` に `immediate: true` を付けているか（初回に発火せず読み込みが始まらない）
- [ ] 子が `watch` / store 初期化の依存に使う prop（例: `profileFilter`）に、テンプレートでオブジェクト・配列リテラルを直接渡していないか（毎レンダー新参照になり子の副作用が再実行される。`computed` や setup 定数に切り出す。Vuetify の `:rules` / `:items` 等の慣用表現は対象外）
- [ ] render / computed の評価中に副作用（イベント登録・store 生成等）を行っていないか
- [ ] リアクティブ依存を持たない `computed` で値を中継していないか（依存が追跡されず更新されない。定数化するか依存を `computed` 内で参照する）
- [ ] `base/src` 配下の `.ts` composable 等で `ref` / `computed` 等を auto-import 任せにせず明示的に import しているか（`base/tsconfig.json` の `build:types` は app 側の auto-import 設定を持たない。各 app の `.vue` は `unplugin-auto-import` 前提で対象外）

### Vue コンポーネント設計

- [ ] `base` のコンポーネント内にルーティングパスをハードコードしていないか（`emit` を使ってコンポーネントを汎化する）
- [ ] 各 app のレイアウト・コンポーネントで `/chat` 等のパスを文字列リテラルで書いていないか（`router/utils` の `getXxxPath()` を使う）
- [ ] `base` のコンポーネント内にビジネスロジックを持ち込んでいないか
- [ ] ローディング状態は「画面全体に影響するデータが読み込まれているか」で判断しているか
- [ ] `getLoadedXXX` を使う場合、「そのデータが画面全体に影響する」ことを確認しているか
- [ ] ローディング中を表現する変数は `null | boolean` パターンを使っているか（`null` = ローディング中）
- [ ] 複数の非同期処理が競合しうる箇所で `isLoading` を個別に持っていないか（先祖返りを防ぐため一つにまとめる）
- [ ] `catch` 節でローディング状態を解除しているか（例外時に `null` のままだと永久ローディングになる）
- [ ] 「対象外・未設定」と「取得失敗」を同一表示にしていないか（原因が切り分けられない）
- [ ] テーマカラーを直接指定していないか（Vuetify Theme を使う）
- [ ] `base/src/components/pages/` は deprecated であることを認識しているか（**新規は `components/<domain>/` のパネル + 各 app shell 組み立て**。`orders.vue` は #2208 時点の例外で pages/ に配置済み。以降の新規画面は domain パネル + shell を優先）
- [ ] 複数 app（`user` / `enterprise` / `partner`）で共有する画面を **monolith（1 ファイル丸ごと base 化）** していないか（**v-card / タブパネル単位**で `base` に置き、**タブ shell・認可・app 差分は各 app の shell** に残す）
- [ ] マイページ（`UserProfilePage`）等の新規 base 化は `base/src/components/profile/` 配下の `*PreviewCard` / `*TabPanel` + composable とし、`base/src/components/profile/UserProfilePage.vue` のような **ページ monolith を新設していないか**
- [ ] base コンポーネントへの path / filter / 認可差分は **`profilePathResolvers.ts` 型 + props 注入**（`resolveUserPath` / `resolveEventPath` / `resolveOrdersPath` / `profileFilter` / `canLinkToDetail` 等）で渡しているか（profile に限らず、base 内 `@/router/utils` 依存を新規追加していないか）
- [ ] 注入する resolver の引数（数・順序・オブジェクト形式）と戻り値型が `profilePathResolvers.ts` の型定義と一致しているか（位置引数と object 引数の取り違えは query が欠落しても型で気づけないことがある）
- [ ] app shell が store 初期化・タブ URL 同期・enterprise Callable ゲート等の **組み立て責務**を担い、base パネルは **表示 + emit** に留まっているか
- [ ] app 間で差分がわずかな画面を全文コピーしていないか（共通部分は base のパネルに置き、差分だけ各 app の shell に残す）
- [ ] ハードコードされた UI 文字列を `i18n` に移行しているか（**`ja.ts` のみ**。英語 locale は作らない）
- [ ] `base` のコンポーネントが参照する i18n キーを `base/src/locales/messages/ja.ts` に置いているか（app 側の `ja.ts` だけに置くと、キーを持たない別 app で生キーがそのまま画面に出る）
- [ ] 同一コンポーネント内で `t()` と `$t()` を混在させていないか
- [ ] `src/locales/messages/en.ts` 等の **英語 locale を新規追加していないか**（本プロジェクトは日本語のみ）
- [ ] 英語用の UI 文字列だけを別ファイルに分けていないか（未使用の `en.ts` 残骸を作らない）
- [ ] 削除等の破壊的操作に確認モーダルを挟んでいるか（誤操作防止の UX）
- [ ] `var` を使っていないか（`const` / `let` を使う）

#### base 共通化（パネル分割）— 詳細

**方針（H-4 確定）**: 画面を base に **丸ごと移さない**。1 v-card / 1 タブパネル程度の UI 単位を `base` に置き、**各 app の shell（例: `user/src/components/profile/UserProfilePage.vue`）で組み立てる**。

| レイヤ | 置き場所 | 例 |
|:--|:--|:--|
| preview v-card / タブパネル | `base/src/components/profile/` | `UserProfileEventsPreviewCard.vue`, `UserProfileFriendsTabPanel.vue` |
| 認可・tab sync・store 束ね | `base/src/composable/` | `useUserProfileAuthState`, `useUserProfileTabSync` |
| タブ・Bio・app 差分・props 注入 | `user` / `enterprise` shell | `profileFilter`, `hide-sns`, Callable ゲート |

**先例**: manage パネル（`CommunityEventsPanel.vue`）、注文履歴（`orders.vue` + `profileFilter` 注入）。

**レビュー時の 🚨 例**: `base/src/components/profile/UserProfilePage.vue` を新設・復活させ、user/enterprise を薄ラッパーにした PR → monolith 方針違反。

### ルーティング・ナビゲーションガード

- [ ] ガードの判定関数が「未確定」を `boolean` に丸めていないか（`boolean | null` で未確定を表し、timeout で 404 / エラーへ分岐する）
- [ ] 未確定・未解決の状態を「許可」側に倒していないか（テナント未解決のまま通すのは認可バイパス）
- [ ] `beforeEach` 内の待機処理を pending Promise で共有しているか（同じ待機が多重実行されると待ち時間が倍増する）
- [ ] 非同期処理の完了後に `router.replace` / ダイアログ表示を行う場合、開始時の path / query と一致するか確認しているか（route 変更後に発火する stale な遷移を防ぐ）
- [ ] リトライを入れる場合、回数・条件・意図をコメントで明示しているか（無言のリトライはガード待ちを数秒〜十数秒に伸ばす）

### セキュリティ

- [ ] `v-html` に DB・ユーザー入力由来の動的データ（TinyMCE 等のリッチテキスト含む）を渡す場合、サニタイズ（DOMPurify 等）しているか（`$t()` 等の静的文字列のみの場合は対象外）
- [ ] `target="_blank"` を使う外部リンクに `rel="noopener noreferrer"` を付けているか（`window.open`・`v-html` 内リンク・`ja.ts` の文言内リンクも対象）
- [ ] Auth ユーザー作成 → Firestore 保存のような複数ステップの作成処理で、後続ステップが失敗した場合に先行して作成済みのリソースをロールバック・補償削除しているか（残すと再登録不能や認可バイパスにつながる）
- [ ] 外部 URL のホスト名検証を `startsWith` のみで行っていないか（`https://good.com.attacker.example` のようになりすませる。URL をパースして `protocol === 'https:'` と hostname を厳密比較する）
- [ ] 運用ドキュメント・レビュー記録に実ユーザーの UID・メールアドレス等の PII や認証情報ファイルの中身を平文で残していないか（プレースホルダー化する）

### アクセシビリティ（Phase 1 対象外）

> **現フェーズではコードレビューでの a11y 指摘は行わない**（ユーザー規模・優先度の都合）。
> `aria-label` / `alt` / キーボード操作 / ARIA ロール等は通常 PR では確認しない。
> **例外**: 個別仕様書（`documents/`）に a11y 要件が明記されている場合のみ、その PR スコープ内で確認する。

### Materio / UI テンプレート

- [ ] `base/materio/`（`@core` / `@layouts`）を変更していないか
- [ ] Materio のレイアウト・スタイル調整を `user/src/styles/` 等の override で行っているか
- [ ] materio 配下にプロジェクト固有の util / コンポーネントを追加していないか（`base/src/` 等を使う）

### Firestore / Store パターン

- [ ] DB への操作は必ず store 関数を経由しているか（直接 `update`、`setDoc` 等を呼ばない）
- [ ] `withConverter` を付けた reference を使っているか（付けない ref の使用は NG）
- [ ] `toFirestore` を store の `FirestoreDataConverter` 外で直接呼んでいないか
- [ ] `withConverter` を削除していないか（削除すると zod バリデーションが外れる）
- [ ] `updateXXX` 系の関数は全フィールドを書き戻す方針になっているか（Partial マージ禁止）
- [ ] `withConverter` + `set` で既存ドキュメントを更新する際、先に `get` して既存データを引き継いでいるか（`toFirestore` は全フィールドを書き込むため、既存フィールドが失われる）
- [ ] Transaction 内で読み込む場合、Transaction 外で同じドキュメントを読んでいないか
- [ ] Transaction 内で **すべての read が write より前** に実行されているか（Firestore は write 後の read を拒否する。`addMember` 等の read+write を内包するメソッドにも注意）
- [ ] レースコンディションが発生しうる箇所に Transaction を使っているか
- [ ] communityId と eventId の両方が分かるのに `getEvent` を使っていないか（`getEventInCommunity` を使う。`getEvent` は eventId のみ分かる Tier C 向け）
- [ ] ループ内で Firestore の read/write や外部 API 呼び出しを逐次 `await` していないか（`Promise.all`・バッチ処理・並列度を制限した実行を検討する）
- [ ] カウンタや上限チェック等の不変条件を read-then-write で更新していないか（`FieldValue.increment` または Transaction で原子性を担保する）
- [ ] 新規の複合クエリ（`where` 複数条件・`orderBy` 併用・`array-contains` 等）に対応する `firestore.indexes.json` の追加漏れ・重複がないか
- [ ] 存在確認・重複チェックのクエリに `limit()` を付けているか（1 件確認は `limit(1)`、曖昧一致の検知が要る解決処理は `limit(2)`）
- [ ] 複数一致しうる検索で `docs[0]` 固定にしていないか（曖昧一致を握りつぶさずエラーにする）
- [ ] store ID を決める要素（クエリ filters・`pageSize` 等）を複数箇所に手書きコピーしていないか（1 箇所でもずれると別 store になり `reload` が効かなくなる。定数・ファクトリに集約する）
- [ ] zod パースエラー・lookup 失敗等、握りつぶすと調査不能になる catch 節で `reportClientError` を呼んでいるか（store に限らず composable・コンポーネントの catch も対象）

### community_id / community_account の使い分け

- [ ] `useCommunityStore(string)` には `community_account`（URL スラッグ）を渡しているか
- [ ] Callable / Firestore パス / Storage には `community_id`（Firestore ドキュメント ID）を渡しているか
- [ ] URL 生成（`getCommunityPath`, `getEventPath` 等）には `community_account` を渡しているか
- [ ] 同一コンポーネント内で prop 名 `communityId` と `communityAccount` を混在させていないか（用途が異なる場合は JSDoc で区別する）

### 認証・ユーザー ID の確定待ち

- [ ] `onMounted` / `watch` の条件に Firestore 由来の `loginUser` だけを使っていないか（確定が遅れるため `firebaseUser.uid` をフォールバックに併用する）
- [ ] 空文字の ID で store 生成・Callable 呼び出しをしていないか（`useUserStore('')` は throw し、preview Callable は失敗する）
- [ ] 空 ID のガードを複数箇所に散らしていないか（`load` 先頭等の 1 箇所に集約する）

### マルチテナント（enterprise / PF）スコープ

Enterprise 版は PF（`enterprise_id == null`）と同じコレクションを共有し、`community_account` は **enterprise 単位でしか一意でない**。スコープ漏れは他テナントのデータ露出・誤取得に直結する。

- [ ] `base` のコンポーネントが `useCommunityStore` / `useEventStore` / `useEventListStore` を直接呼んでいないか（`useAppCommunityStore` / `useAppEventStore` / `useCreateAppCommunityEventListStore` 経由で inject スコープを通す。これらの App ラッパー自身が内部で呼ぶのは正しい。**例外**: inject 不可の非同期ハンドラで ID トークン claim 等からスコープを解決する既存パターン（`cart.vue` の `resolveEventStoreOptions` + `useEventStore`）は維持可。新規は setup で `useCreateAppXxxStore()` のクロージャを使う）
- [ ] コミュニティ・イベントの検索やレター等の派生クエリに `enterprise_id` 条件が付いているか（`community_account` だけの検索は PF と enterprise が混在する）
- [ ] `collectionGroup` クエリに `enterprise_id` を付与しているか
- [ ] community ドキュメントの `enterprise_id` が `undefined`（未 materialize）のとき scope に委ね、`null`（PF 確定）を scope で上書きしていないか（`resolveEffectiveEnterpriseId`。`null` は PF 確定なので scope へフォールバックしない）
- [ ] partner 等スコープ未注入の呼び出し元が残る lookup ヘルパー（例: `communityList.getCommunityData`）で、`options?.enterpriseId === undefined` のとき `enterprise_id == null` に固定していないか（省略時はフィルタなし＝全テナント横断。PF 確定は `{ enterpriseId: null }` を明示。`CommunityStoreScope` 型で揃えるのが望ましい — RC-112 参照）
- [ ] `functions/default` で PF 固定のヘルパー（`getCommunityByAccount` 等）を enterprise 経路から呼んでいないか
- [ ] `community_account` の重複チェック・新規作成をテナント込みで原子的に確保しているか（同時作成で同一 account が二重に作られない）
- [ ] 認可ゲート（enterprise preview Callable 等）の判定前に、対象ドキュメントの Firestore 購読・クエリを開始していないか

### Firestore Security Rules

- [ ] `firestore.rules` の create/update で、新規・機微フィールドの書き込み可能な値を制約しているか（`hasOnly`、他フィールドや `request.auth` との一致検証等）
- [ ] 新規コレクション・クエリで `enterprise_id` / `community_id` のテナント分離が必要な場合、`isSameEnterprise` / `docEnterpriseId` 等の既存ヘルパーに揃えているか（`enterprise_id` が null のドキュメントの扱いも含む）
- [ ] `firestore.rules` を変更した場合、`tests/firestore-rules` 側のテストも追加・更新しているか

### Firebase Functions

- [ ] `console.log` / `console.error` を使っていないか（`createModuleLogger` を使う）
- [ ] `import { logger } from 'firebase-functions'` を直接使っていないか（`createModuleLogger` を使う）
- [ ] ログメッセージに `letter |` 等の接頭辞をつけていないか（`createModuleLogger` 使用時は不要）
- [ ] メールの一括送信に `Promise.all` を使っていないか（SendGrid personalizations の `sendDynamicTemplateWithPersonalizations`（`utils/sendgridBulk.ts`）によるバッチ送信とし、バッチ単位の失敗と受付件数をログに記録する）
- [ ] メールの1件送信に `Promise.allSettled` や失敗集計ログを使っていないか（`try/catch` で十分）
- [ ] Callable Functions の引数にオブジェクト（クラスインスタンス等）を渡していないか（ID のリストを渡す）
- [ ] `secrets` の指定が必要な Function（SendGrid 等）に `{ secrets: ['SENDGRID_API_KEY'] }` が付いているか
- [ ] Firestore トリガー（`onDocumentWritten` 等）は 1 回の操作で複数ドキュメントが変化すると複数回発火する前提で、メール送信等の副作用が重複しないか（Transaction 等で未処理を原子的に確保する。送信成功前に sent 確定フラグだけ立てない）
- [ ] トリガー / Function 内で catch した例外をログのみにせず再 throw し、Cloud Functions の自動リトライに乗せているか（意図的に握りつぶす場合は理由をコメントに明記する）
- [ ] メール・通知本文の URL を `EVENT_HOST` 固定のヘルパー（`getEventUrl` / `getCommunityUrl` 等）で組み立てていないか（community / event からは `getCommunityUrlForCommunity` / `getEventUrlForCommunity` / `getEventUrlForEvent` / `getManageCommunityUrlForCommunity` 等の enterprise 解決版を使う）
- [ ] ホスト解決ロジックを各ファイルで再実装していないか（`utils/urls.ts` の `resolveAppHostForCommunity` 系へ委譲する）
- [ ] Firestore トリガー内で Callable 用の `HttpsError` を throw していないか（トリガーには呼び出し元がおらず、エラーコードが意味を持たない）

### 決済 (Stripe)

- [ ] Webhook は `req.body` ではなく `req.rawBody` を使い `stripe.webhooks.constructEvent` で署名検証しているか
- [ ] Webhook・決済確定処理が再送・重複配信されても二重処理にならないか（処理済み判定によるべき等性）
- [ ] Stripe の Charges API / Sources API / Card Element 等の非推奨 API を新規に使っていないか（Checkout Sessions・PaymentIntents・Setup Intents を使う）

### CI / Functions デプロイ

- [ ] `functions/default/src/index.ts` の export 追加・削除がある場合、index.ts の import / export が同 PR で更新されているか（deploy yml への手書きは不要）
- [ ] 更新漏れは 🚨 必須修正（マージ後も Function が未デプロイでサイレント障害になる）
- [ ] export しない内部ヘルパー（他 Function から import するだけの関数）は対象外
- [ ] 後方非互換なスキーマ変更・新規 Callable を含む PR で、複数 CI ワークフロー（`deploy_functions` / `deploy_user` / `deploy_partner` 等）間のデプロイ順序を明記・保証しているか
- [ ] 型検査に必要な生成物（`auto-imports.d.ts` 等）を `.gitignore` に入れていないか（ローカルでは通っても CI の Typecheck が未解決シンボルで落ちる）

### 日付・時刻処理

- [ ] `Date` オブジェクトを直接使っていないか（`luxon` を使う）
- [ ] `new Date()` で UNIX タイムを生成していないか（実行環境によって値が変わる）
- [ ] 日付の固定値は `CUTOFF_UNIX_TIME_XXXX` のように `common` に定数として定義しているか
- [ ] `common` の `DEFAULT_TIME_ZONE` をアプリ層（`user` / `partner` / `enterprise` / `base`）で直接 import していないか（海外対応時の置換コストを下げるため、タイムゾーンへの参照は `common` 内部に閉じる。`functions/default` 内の既存利用は段階移行中で、**新規追加**は `common` 側に zone を閉じた util を追加して呼び出す）
- [ ] タイムゾーン依存の計算ロジックを call site で組み立てていないか（必要なら `common` 側に zone を閉じた util / ドメイン関数を追加して呼び出す）
- [ ] `$d(..., 'date'|'time'|'datetime'|'datetime_weekday_short')` 等の vue-i18n datetimeFormats を新規追加していないか（`common/src/utils/datetime.ts` の `convertToXxx` 系を使う）
- [ ] 日付・時刻の表示フォーマットを call site で独自実装していないか（`convertToDate` / `convertToTimeString` / `convertToDatetime` / `convertToDatetimeWeekdayShort` 等を使う）

### スキーマ設計 (Zod / common)

- [ ] 新規フィールドを `optional` にしていないか（新規追加フィールドは基本 `required`）
- [ ] ソート用のフィールドを文字列型で定義していないか（数値型が正しい）
- [ ] 独自の日付文字列変換を実装していないか（`luxon` または `zod` の `transform` を使う）
- [ ] 親ドキュメントが既に持っている情報を子ドキュメントに重複させていないか
- [ ] DbSchema の日付・時刻フィールドに `TimestampSchema` を使っているか
- [ ] AppSchema の日付・時刻フィールドに `EpochMillisSchema` を使っているか
- [ ] 既存データに影響する変更の場合、`bokudeli-event-batch` 側での migration / backfill 対応（または少なくとも言及）があるか
- [ ] DbSchema で `nullable()` を安易に使っていないか（明示的に `null` が必要な特殊ケースを除き避ける方針。optional 文字列は `NonEmptyStringSchema` を検討する）

### Composable / Store の役割分担

- [ ] 計算ロジックは composable より store で行うようになっているか
- [ ] Composable 内の Store は引数で受け取らず Composable 内で再取得しているか
- [ ] Store に不要なビジネスロジックを持ち込んでいないか
- [ ] `inject()` を内部で使う composable（`useAppCommunityStore` / `useAppEventStore` 等）を computed getter・watch コールバック・非同期ハンドラから呼んでいないか（setup で `useCreateAppXxxStore()` を一度呼び、返却クロージャを使う）
- [ ] Pinia store の購読開始等の副作用を `defineStore` の setup 内で制御していないか（同一 ID の store は再利用され setup は初回のみ実行されるため、2 回目以降のオプションは無視される。副作用は store 取得の出口で毎回判定する）

### テスト (Vitest)

- [ ] `documents/テスト方針・テスト項目書/テスト方針.md` の基準（ビジネスロジック・純粋関数・バグ修正）に該当する新規・変更ロジックに vitest テストを追加しているか
- [ ] Transaction・レースコンディションを含む store 関数を新規追加・変更した場合、優先してテストを追加しているか
- [ ] `vi.stubGlobal`（`localStorage` 等）を使った場合、`afterEach` で `vi.unstubAllGlobals()` して他テストへ影響を残していないか

### コード品質・可読性

- [ ] 早期リターンをエラーハンドリング以外で多用していないか（並列処理は `else` で書く）
- [ ] 「並列の処理（値の代入など）」を早期リターンで書いていないか
- [ ] 不要な変数への代入を中継していないか
- [ ] 冗長なチェックを追加していないか（型で保証されているものを再チェックしない）
- [ ] 不要な `if` のネストを避け `&&` で一行にまとめているか
- [ ] 自明なコメントを書いていないか
- [ ] 誤ったコメントを書いていないか
- [ ] `common` に定義されている util 関数を使わず独自実装していないか
- [ ] インターフェースが統一されている関数群を個別に try-catch で囲んでいないか
- [ ] Store は常に存在するため `storeXXX &&` のような null チェックをしていないか
- [ ] マジックナンバー・インデックス固定（例: 配列の `[0]` で固定）をしていないか（別途定数に切り出す）
- [ ] 将来流用できる部分を最初から汎用化しているか
- [ ] 置換・刷新後に旧実装（ローダー・composable）・未使用 props・未使用 export が残っていないか
- [ ] 未参照になった `ja.ts` の i18n キーを削除しているか

### コミット・PR

- [ ] 1つの PR に複数の責務を混在させていないか
- [ ] 無関係な修正を同じコミットに含めていないか
- [ ] 動作的に大きな変更を別 PR または別 Issue に分けているか

### アセット管理

- [ ] 画像・バナー等のアセットをコード内にハードコードしていないか（Firestore / Storage で管理する）
- [ ] 固定パスに上書きするアセット（ロゴ等）の表示 URL に、リロードを跨いで有効なバージョン（`updated_at` 等）を付けているか（Storage パスが同一だと URL が変わらずブラウザキャッシュが残る。セッション内カウンタはリロードで破綻する）
- [ ] 新規追加する画像アセットのファイルサイズを確認しているか（背景画像等は圧縮する）

---

## フィードバック形式

[/review-comments-evaluate](../../review-comments-evaluate/SKILL.md) と同一の **評価 + ステータス**（**❌ 未対応は使わない**）。手順・レビュー記録ファイルへの記録は [SKILL.md](SKILL.md) および [review-doc-path.md](../review-comments-evaluate/references/review-doc-path.md) を参照。

### 評価（重要度・不変）

- 🚨 **必須修正**: マージ前に対応が必要（セキュリティ・データ不整合・バグ等）
- 🟡 **修正提案**: 改善を検討してほしい（設計・可読性等）。マージ必須ではない
- 👌 **修正不要**: 指摘はあるが対応不要（誤解・仕様どおり・過剰指摘等）

### ステータス（対応進捗・可変）

- **未着手**: コード修正・確認が残る
- ✅ **対応済み**: コード・PR で解消済み（**評価**は維持）
- 📤 **#NNNN 別Issue化**: 本 PR では実装せず別 Issue に切り出し済み
- **`—`**: **評価** が 👌 修正不要のとき

---

## よくある間違いパターン（過去レビューより）

### NG: 数値・文字列への falsy チェック

```typescript
// NG
if (!price) { ... }
if (updateUserId.trim() === '') { ... }

// OK
if (price == null) { ... }
if (updateUserId !== '') { ... }
```

### NG: Transaction 外でのドキュメント読み込みを Transaction 内で再利用

```typescript
// NG: Transaction 外で取得した event を Transaction 内で使う
const event = await getEventInCommunity(community_id, event_id)
await runTransaction(db, async (t) => {
  // event は Transaction で保護されていない
  if (event?.is_public) { ... }
})

// OK: Transaction 内で読み込む
await runTransaction(db, async (t) => {
  const event = await getEventInCommunity(community_id, event_id, t)
  if (event?.is_public) { ... }
})
```

### NG: communityId が分かっているのに getEvent を使う

```typescript
// NG: communityId が分かっているのに collectionGroup の getEvent
const event = await getEvent(event_id)
if (event == null || event.community_id !== community_id) { ... }

// OK
const event = await getEventInCommunity(community_id, event_id, transaction)
if (event == null) { ... }
```

### NG: Transaction 内で write の後に read を実行する

Firestore のトランザクションは「すべての read → すべての write」の順序を厳守する必要がある。write 後の read は `FAILED_PRECONDITION` で拒否される。read+write を内包するメソッド（`addMember` 等）を Transaction 内で呼ぶ場合は特に注意。

```typescript
// NG: saveOrder（write）の後に addMember 内で transaction.get（read）が走る
await db.runTransaction(async (transaction) => {
  const orders = await getOrdersByIds(..., transaction) // read
  for (const order of orders) {
    saveOrder(..., order, transaction) // write
  }
  await community.addMember(uid, transaction) // 内部で transaction.get → read！エラー
})

// OK-1: read を全て先に実行する（addMember 内の read も含めて先に済ませる）
await db.runTransaction(async (transaction) => {
  const orders = await getOrdersByIds(..., transaction) // read
  const memberRef = db.collection('communities').doc(id).collection('members').doc(uid)
  const memberSnap = await transaction.get(memberRef) // read（addMember の read を先出し）
  for (const order of orders) {
    saveOrder(..., order, transaction) // write
  }
  transaction.set(memberRef, memberData) // write（addMember の write を後出し）
})

// OK-2: アトミック性が不要なら addMember をトランザクション外で呼ぶ
await db.runTransaction(async (transaction) => {
  const orders = await getOrdersByIds(..., transaction) // read
  for (const order of orders) {
    saveOrder(..., order, transaction) // write
  }
})
await community.addMember(uid) // トランザクション外
```

### NG: `watch` を使ったリアクティビティ

```typescript
// NG: watch で計算結果を別の ref に書き込む
watch(someRef, (val) => {
  result.value = calc(val)
})

// OK: computed で代替する
const result = computed(() => calc(someRef.value))
```

### NG: `withConverter` + `set` で既存データを取得せずに上書き

```typescript
// NG: 既存データを確認せず set → DB 上の他フィールドが消える
const ref = db.collection('items').doc(id).withConverter(converter)
const data = new Item(id, { name: 'new' })
await ref.set(data) // 既存の price, category 等が消える

// OK: 既存データを取得してから set
const snapshot = await ref.get()
const data = snapshot.data() ?? new Item(id, { name: 'new' })
data.name = 'new'
await ref.set(data)
```

### NG: save 関数の呼び出し側が get を忘れる

```typescript
// NG: get せずに新規インスタンスで saveUser → 既存フィールドが欠落
const user = new ShokujiiUser(userId, { user_name: 'new name' })
await saveUser(user) // merge: true でも toFirestore が返さないフィールドは維持されない

// OK: get してから変更して save
const user = await getUser(userId)
user.user_name = 'new name'
await saveUser(user)
```

### NG: `withConverter` なしの ref

```typescript
// NG
const ref = doc(db, 'letters', id)
await updateDoc(ref, data)

// OK
const ref = doc(db, 'letters', id).withConverter(letterConverter)
// store 関数を経由して操作する
await letterStore.update(ref, data)
```

### NG: Callable に オブジェクトを渡す

```typescript
// NG: BokudeliEventMenu[] をそのまま渡す（JSON シリアライズで機能が落ちる）
await updateEventMenus({ menus: menuObjects })

// OK: ID リストを渡す
await updateEventMenus({ menuIds: menuObjects.map((m) => m.menu_id) })
```

### NG: Functions で console や logger を直接使う

```typescript
// NG: console を使う
console.log('letter | sendLetter called')

// NG: firebase-functions の logger を直接インポートする
import { logger } from 'firebase-functions'
logger.info('sendLetter called')

// OK: createModuleLogger を使う（Cloud Logging で module フィールドによるフィルタリングが可能になる）
import { createModuleLogger } from './utils/logger.js'
const logger = createModuleLogger('letter')
logger.info('sendLetter called')
// createModuleLogger 使用時はログに接頭辞（"letter |" 等）をつけない
```

### NG: メール一括送信に Promise.all を使う

```typescript
// NG: 1件の失敗で全体が中断する
await Promise.all(
  emails.map(async (to) => {
    await sgMail.send({ to, from: DEFAULT_FROM, templateId, dynamicTemplateData })
  }),
)

// OK: 失敗しても他の送信は継続し、結果を集計する
const results = await Promise.allSettled(
  emails.map(async (to) => {
    return sgMail.send({ to, from: DEFAULT_FROM, templateId, dynamicTemplateData })
  }),
)

const failedCount = results.filter((r) => r.status === 'rejected').length
if (failedCount > 0) {
  logger.warn('Failed to send mail', {
    successCount: results.filter((r) => r.status === 'fulfilled').length,
    failedCount,
    totalEmails: emails.length,
  })
}
```

### NG: Date オブジェクトの直接使用

```typescript
// NG: 実行環境によって UNIX タイムの値が変わる
const now = new Date().getTime()

// OK: luxon を使う
import { DateTime } from 'luxon'
const now = DateTime.now().toMillis()
```

### NG: アプリ層で `DEFAULT_TIME_ZONE` を直接参照する

海外対応時にタイムゾーン参照が散らばっていると置換コストが膨らむ。
`DEFAULT_TIME_ZONE` は `common` 内部に閉じ、アプリ層（`user` / `partner` / `enterprise` / `base`）は zone を内部に閉じた util を呼ぶ。
`functions/default` 内の既存利用（課金スナップショット・JSON-LD 等）は段階移行中。**新規追加**は `common` 側に util を足してから呼び出す。

```typescript
// NG: アプリ層で zone 参照（DEFAULT_TIME_ZONE）を露出させる
import { DateTime } from 'luxon'
import { DEFAULT_TIME_ZONE } from '@shokujii/common/utils/datetime.js'

const day = DateTime.fromMillis(ms, { zone: DEFAULT_TIME_ZONE }).day

// OK: zone を内部に閉じた util を使う（必要なら common に追加する）
import { getDayOfMonth } from '@shokujii/common/utils/datetime.js'

const day = getDayOfMonth(ms)
```

### NG: アプリ層で日付計算を組み立てる

`common` の定数 / zone / format を call site で結線するとローカライズや仕様変更の影響が広がる。
ドメイン的に意味のある計算は `common` に集約し、call site は 1 行で呼ぶ。

```typescript
// NG: 定数と zone と format を call site で結線する
import { DateTime } from 'luxon'
import { DEFAULT_TIME_ZONE } from '@shokujii/common/utils/datetime.js'
import { EVENT_RESERVATION_LEAD_TIME_DAYS } from '@shokujii/common/constants/eventReservation.js'

const min = DateTime.now()
  .setZone(DEFAULT_TIME_ZONE)
  .startOf('day')
  .plus({ days: EVENT_RESERVATION_LEAD_TIME_DAYS })
  .toFormat('yyyy-MM-dd')

// OK: ドメイン関数として common に集約し、call site は 1 行
import { getReservationLeadTimeMinDateString } from '@shokujii/common/utils/reservationLeadTime.js'

const min = getReservationLeadTimeMinDateString(Date.now())
```

### NG: 英語 locale ファイル（`en.ts`）の追加

本プロジェクトは **日本語 UI のみ**。`user/src/locales/messages/en.ts` のような部分英語ファイルは、メンテ負荷だけ増やし、実際には `locale: 'ja'` で使われない。

```typescript
// NG: 英語 locale の新規追加
// user/src/locales/messages/en.ts
export default { user: { friend_sort_last_met_at: 'Last met' } }
```

```typescript
// OK: 日本語のみ（base / user / partner の ja.ts）
// user/src/locales/messages/ja.ts
friend_sort_last_met_at: '最後に会った順',
```

### NG: vue-i18n の `$d` で日付・時刻をフォーマットする

vue-i18n の datetimeFormats は廃止済み。新規実装では `common` の Luxon ベース util を使う。

```vue
// NG: vue-i18n datetimeFormats に依存する
{{ $d(event.event_start_datetime, 'datetime_weekday_short') }}

// OK: common の convertToXxx を使う
import { convertToDatetimeWeekdayShort } from '@shokujii/common/utils/datetime.js'

{{ convertToDatetimeWeekdayShort(event.event_start_datetime) }}
```

### NG: 日付・時刻フィールドのスキーマの使い分け

```typescript
// NG: DbSchema で EpochMillisSchema を使う → Firestore に number で保存され、created_at 等と型が揃わない
deleted_at: EpochMillisSchema.optional()

// NG: AppSchema で TimestampSchema を使う → アプリ側で Timestamp オブジェクトになり、比較・表示が煩雑
deleted_at: TimestampSchema.optional()

// OK: DbSchema には TimestampSchema、AppSchema には EpochMillisSchema
// DbSchema
deleted_at: TimestampSchema.optional()
// AppSchema
deleted_at: EpochMillisSchema.optional()
```

### NG: ローディング状態を特定ドキュメントの読み込みで判断する

```typescript
// NG: shop が読み込めているかで画面全体をブロックする
const isLoading = computed(() => shop.value == null)

// OK: 表示に必要なデータが読み込まれているかで判断する
// shop は isOwner の判定にのみ使う
// isOwner: null | boolean（null = ローディング中）
const isOwner = computed<null | boolean>(() => {
  if (shop.value == null) return null
  return shop.value.owner_id === currentUser.value?.uid
})
```

### NG: 複数の isLoading が競合する

```typescript
// NG: Basic と Detail を同時に押されると先祖返りを起こす
const isLoadingBasic = ref(false)
const isLoadingDetail = ref(false)

// OK: isLoading を一つにまとめる
const isLoading = ref(false)
```

### NG: `v-html` にユーザー入力をそのまま渡す

```vue
<!-- NG: TinyMCE 等のリッチテキストをサニタイズせず v-html で描画 -->
<div v-html="event.event_desc" />
```

```vue
<!-- OK: サニタイズしてから描画する -->
<div v-html="sanitizeHtml(event.event_desc)" />
```

`$t('...')` 等、開発者が管理する静的文字列のみを渡す場合はサニタイズ不要。

### NG: 1 回の操作で複数ドキュメントが変化する前提を欠いたトリガー処理

```typescript
// NG: 一括更新で複数行が同時に ordered になり、onDocumentWritten が複数回発火して
// 注文完了メールが重複送信される
export const onOrderWritten = onDocumentWritten('.../member_orders/{orderId}', async (event) => {
  if (event.data?.after.data()?.status === 'ordered') {
    await sendOrderCompleteMail(...) // 発火のたびに送られる
  }
})

// NG: 送信成功前に sent 確定フラグだけ立てる（送信 API 失敗時、次回は送信済み扱いで通知が永久欠落する）
export const onOrderWritten = onDocumentWritten('.../member_orders/{orderId}', async (event) => {
  const order = event.data?.after.data()
  if (order?.status !== 'ordered' || order.mail_sent_at != null) return
  await markMailSent(orderRef) // 送信前に sent を立てる
  await sendOrderCompleteMail(...) // ここで失敗すると再送されない
})

// NG: Transaction 内 return 後も外側送信が続く（mail_sending_at を入口ガードに含めない）
export const onOrderWritten = onDocumentWritten('.../member_orders/{orderId}', async (event) => {
  const order = event.data?.after.data()
  if (order?.status !== 'ordered' || order.mail_sent_at != null) return
  await db.runTransaction(async (t) => {
    const snap = await t.get(orderRef)
    if (snap.data()?.mail_sent_at != null) return // Transaction 内 return では外側は止まらない
    t.update(orderRef, { mail_sending_at: FieldValue.serverTimestamp() })
  })
  await sendOrderCompleteMail(...) // 上記 Transaction で return してもここは実行される
  await markMailSent(orderRef)
})

// OK: Transaction で送信枠を原子的に確保し、確保できた場合のみ送信（mail_sending_at も入口ガード対象）
export const onOrderWritten = onDocumentWritten('.../member_orders/{orderId}', async (event) => {
  const order = event.data?.after.data()
  if (order?.status !== 'ordered' || order.mail_sent_at != null || order.mail_sending_at != null) return
  const shouldSend = await db.runTransaction(async (t) => {
    const snap = await t.get(orderRef)
    const data = snap.data()
    if (data?.mail_sent_at != null || data?.mail_sending_at != null) return false
    t.update(orderRef, { mail_sending_at: FieldValue.serverTimestamp() })
    return true
  })
  if (!shouldSend) return
  await sendOrderCompleteMail(...)
  await markMailSent(orderRef) // 送信成功後に sent 確定
})

// OK（本番パターン）: member_orders 単位の onDocumentWritten ではなく、確定処理の入口で 1 回だけ副作用
// → functions/default/src/orderConfirmedSideEffects.ts 参照
```

### NG: ループ内で Firestore read/write を逐次 await する

```typescript
// NG: メンバー数に比例して直列に await する（タイムアウト・コスト増）
for (const memberId of memberIds) {
  const membership = await getChatMembership(roomId, memberId)
}

// OK: 並列化する（必要なら並列度を制限する）
const memberships = await Promise.all(memberIds.map((memberId) => getChatMembership(roomId, memberId)))
```

### NG: カウンタ・上限チェックを read-then-write で行う

```typescript
// NG: 同時実行で increment が失われたり、上限チェックが古い値のまま通過する
const room = await getChatRoom(roomId)
if (room.unread_count < 99) {
  await saveChatRoom({ ...room, unread_count: room.unread_count + 1 })
}

// OK: FieldValue.increment で原子的に更新し、上限は Transaction 内で判定する
await db.runTransaction(async (t) => {
  const snapshot = await t.get(roomRef)
  if ((snapshot.data()?.unread_count ?? 0) >= 99) return
  t.update(roomRef, { unread_count: FieldValue.increment(1) })
})
```

### NG: Firestore Rules で新規・機微フィールドの書き込みを制約しない

```
// NG: community 作成時に enterprise_id を任意の値で自由に設定できる
match /communities/{communityId} {
  allow create: if request.auth != null
}

// OK: 書き込み可能な値を明示的に制約する
match /communities/{communityId} {
  allow create: if request.auth != null
    && request.resource.data.enterprise_id == null
}
```

### NG: `target="_blank"` に `rel="noopener noreferrer"` がない

```vue
<!-- NG: 開いた先のページから window.opener 経由で元ページを操作できてしまう -->
<a href="https://example.com" target="_blank">外部サイト</a>

<!-- OK -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">外部サイト</a>
```

`window.open(url, '_blank')` や `v-html` で描画するリンク、`ja.ts` の文言内リンクも対象。

### NG: Stripe Webhook で署名検証・べき等性を省略する

```typescript
// NG: パース済み body を使う（署名検証が機能しない）＋ 冪等チェックなし
export const stripeWebhook = onRequest(async (req, res) => {
  const event = JSON.parse(req.body)
  await handlePaymentIntentSucceeded(event.data.object)
  res.sendStatus(200)
})

// NG: Transaction 内で処理済み確定後に外側で副作用（失敗時 Stripe 再送は already_processed で 200、副作用欠落）
export const stripeWebhook = onRequest(async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], webhookSecret)
  const txResult = await db.runTransaction(async (transaction) => {
    if (await getStripeByPaymentIntent(..., transaction) != null) return 'already_processed'
    saveStripe(...) // 処理済み確定
    return 'processed'
  })
  if (txResult === 'already_processed') {
    res.sendStatus(200)
    return
  }
  await handlePaymentIntentSucceeded(event.data.object) // ここ失敗すると再送不可
  res.sendStatus(200)
})

// OK: Transaction 内は in-flight 確保（重複実行防止）のみ。注文確定等の永続化と副作用は成功後に整合
export const stripeWebhook = onRequest(async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], webhookSecret)
  const txResult = await db.runTransaction(async (transaction) => {
    if (await getStripeByPaymentIntent(..., transaction) != null) return 'already_processed'
    // 注文 ordered 化 + saveStripe を同一 transaction 内で原子的に実行（副作用は含めない）
    return 'processed'
  })
  if (txResult === 'already_processed') {
    res.sendStatus(200)
    return
  }
  await applyOrderConfirmedSideEffects(...) // メール等。失敗時は Stripe 再送で再実行可能にする設計とセット
  res.sendStatus(200)
})

// 本番: functions/default/src/stripeWebhook.ts（副作用完了後 200。長時間処理は #2075 Cloud Tasks 分離予定）
```

### NG: Promise を返す権限チェック関数の await 漏れ

```typescript
// NG: hasRole() が Promise<boolean> を返すため、常に truthy と判定される
if (hasRole(uid, 'manager')) {
  await issueInviteUrl(communityId)
}

// OK
if (await hasRole(uid, 'manager')) {
  await issueInviteUrl(communityId)
}
```

### NG: トリガー内の例外をログのみで握りつぶす

```typescript
// NG: 例外を再 throw しないため Cloud Functions の自動リトライが働かず、
// Firestore とチャットの同期が取れないまま放置される
export const syncEventChatMember = onDocumentWritten(path, async (event) => {
  try {
    await addChatMember(...)
  } catch (e) {
    logger.error('failed to sync chat member', { error: e })
  }
})

// OK: 再 throw して自動リトライに乗せる
export const syncEventChatMember = onDocumentWritten(path, async (event) => {
  try {
    await addChatMember(...)
  } catch (e) {
    logger.error('failed to sync chat member', { error: e })
    throw e
  }
})
```

### NG: 複数ステップの作成処理でロールバックがない

```typescript
// NG: Firestore 保存に失敗すると Auth ユーザーだけが残り、
// email-already-exists で再登録できなくなる
export const registerUser = onCall(async (request) => {
  const authUser = await admin.auth().createUser({ email })
  await saveUser(new ShokujiiUser(authUser.uid, { ... })) // ここで失敗すると孤児化
})

// OK: 失敗時は作成済みリソースを補償削除する
export const registerUser = onCall(async (request) => {
  const authUser = await admin.auth().createUser({ email })
  try {
    await saveUser(new ShokujiiUser(authUser.uid, { ... }))
  } catch (e) {
    await admin.auth().deleteUser(authUser.uid)
    throw e
  }
})
```

### NG: 外部 URL のホスト名検証を startsWith のみで行う

```typescript
// NG: startsWith は https://lh3.googleusercontent.com.attacker.example にもマッチする
if (url.startsWith('https://lh3.googleusercontent.com')) {
  // 信頼済みとして扱う
}

// OK: URL をパースして protocol と hostname を厳密比較する
const parsed = new URL(url)
if (parsed.protocol === 'https:' && parsed.hostname === 'lh3.googleusercontent.com') {
  // 信頼済みとして扱う
}
```

### NG: DbSchema で nullable() を安易に使う

```typescript
// NG: 明示的に null を保存する特殊な理由がないのに nullable() にする
const XxxDbSchema = z.object({
  memo: z.string().nullable(),
})

// OK: optional 文字列は NonEmptyStringSchema で「フィールドなし」を表現する
const XxxDbSchema = z.object({
  memo: NonEmptyStringSchema.optional(),
})
```

日付範囲の「開始日時のみ設定可能」等、明示的に `null` が必要な特殊ケースは `TimestampSchema.nullable()` のように使ってよい（例: `PartnerMenu.ts`）。

### NG: ページ丸ごと base 化（monolith）

```vue
<!-- NG: 1,500 行超の UserProfilePage を base に置き、user/enterprise は props だけ渡す薄ラッパー -->
<!-- base/src/components/profile/UserProfilePage.vue（monolith） -->
<script setup lang="ts">
import { getUserPath } from '@/router/utils' <!-- base 内 @/ 依存も NG -->
// ... タブ・store・認可・全 v-window-item が 1 ファイルに集中
</script>
```

```vue
<!-- OK: base は v-card / タブパネル単位。shell が組み立て -->
<!-- user/src/components/profile/UserProfilePage.vue（shell） -->
<script setup lang="ts">
import UserProfileEventsPreviewCard from '@shokujii/base/components/profile/UserProfileEventsPreviewCard.vue'
import UserProfileEventsTabPanel from '@shokujii/base/components/profile/UserProfileEventsTabPanel.vue'
import { useUserProfileAuthState } from '@shokujii/base/composable/useUserProfileAuthState.js'
import { getEventPath, getUserPath } from '@/router/utils'
</script>
<template>
  <UserBioPanel ... />
  <v-tabs v-model="tabs">...</v-tabs>
  <v-window v-model="tabs">
    <v-window-item :value="TAB_PROFILE">
      <UserProfileEventsPreviewCard
        :resolve-event-path="getEventPath"
        :can-link-to-detail="canLinkToDetail"
        @show-more="goToTab(TAB_EVENTS)"
      />
    </v-window-item>
    <v-window-item :value="TAB_EVENTS">
      <UserProfileEventsTabPanel :resolve-event-path="getEventPath" ... />
    </v-window-item>
  </v-window>
</template>
```

```typescript
// OK: path / 認可ポリシーは型 + props（base/src/types/profilePathResolvers.ts）
export type ResolveEventPathFn = (communityAccount: string, eventId: string) => RouteLocationRaw
export type ProfileLinkPolicyFn = (isPublic: boolean, isLinkable?: boolean) => boolean
```

### NG: 注入する resolver のシグネチャが型定義と食い違う

`ResolveOrdersPathFn` は object 引数。位置引数で実装すると `communityAccount` が渡らず query が壊れる。

```typescript
// NG: 位置引数 2 個で実装（呼び出し側は object を 1 個渡すため query が欠落する）
export const getOrdersPathAfterOrder = (eventId: string, communityAccount: string) =>
  `/orders?eventId=${eventId}&communityAccount=${communityAccount}`

// OK: 型定義（object 引数）に合わせる
export const getOrdersPathAfterOrder = ({
  eventId,
  communityAccount,
}: {
  eventId: string
  communityAccount: string
}) => ({
  path: '/orders',
  query: { eventId, communityAccount },
})
```

### NG: base で app スコープを通さず store を取得する（テナント漏れ）

```typescript
// NG: community_account だけで検索 → PF と enterprise の同名アカウントが混在する
const communityStore = useCommunityStore(props.communityAccount)
const eventListStore = useEventListStore(
  [where('community_account', '==', props.communityAccount), orderBy('event_start_datetime', 'desc')],
  PAGE_SIZE,
)

// OK: inject スコープ付きの App 版を使う（enterprise_id 条件はラッパーが付与する）
const communityStore = useAppCommunityStore(props.communityAccount)
const createEventListStore = useCreateAppCommunityEventListStore()
const eventListStore = createEventListStore(props.communityAccount, PAGE_SIZE)
```

**例外（既存）**: inject 不可の非同期ハンドラでは ID トークン claim から `EventStoreOptions` を解決し `useEventStore` を直接呼ぶ（`base/src/components/pages/cart.vue` の `resolveEventStoreOptions`）。新規は setup で `useCreateAppEventStore()` のクロージャを使う。

### NG: `enterprise_id` の 3 値セマンティクスを文脈ごとに混同する

`enterprise_id` の解釈は **文脈で 3 系統**ある。混同すると inject ラッパーを誤判定したり、partner の非スコープ検索を壊す。

| 文脈 | `undefined` | `null` | 非空 string |
|:--|:--|:--|:--|
| inject スコープ付き store / App ラッパー（`resolveCommunityEnterpriseIdForQuery`） | scope 省略 → PF（`enterprise_id == null`） | PF 確定 | enterprise |
| community ドキュメント + scope（`resolveEffectiveEnterpriseId`） | 未 materialize → scope に委ねる | PF 確定（scope で上書き不可） | enterprise |
| スコープ未注入の lookup ヘルパー（`getCommunityData` 等） | フィルタなし（全テナント横断） | PF 確定 | enterprise |

```typescript
// OK: inject スコープから PF / enterprise を決める App ラッパー（communityScope.test.ts もこの契約）
const enterpriseId = scopeFromApp?.()?.enterpriseId ?? null
return useEventListStore(
  [where('enterprise_id', '==', enterpriseId), where('community_account', '==', communityAccount), ...],
  pageSize,
)

// NG: partner 等が enterpriseId を渡さず呼ぶ lookup で undefined を null 固定する
const getCommunityData = async (communityAccount: string, options?: { enterpriseId?: string | null }) => {
  const enterpriseId = options?.enterpriseId ?? null // 省略 = PF 固定 → partner が enterprise を見失う
  await getDocs(query(..., where('enterprise_id', '==', enterpriseId), ...))
}

// OK: 省略時は enterprise_id 条件を付けない（RC-94）。PF 確定は明示的に null
...(options?.enterpriseId !== undefined ? [where('enterprise_id', '==', options.enterpriseId ?? null)] : [])
```

### NG: `inject()` 依存の composable を setup 外から呼ぶ

`useAppCommunityStore` / `useAppEventStore` は内部で `inject()` するため、computed getter や非同期ハンドラから呼ぶと **inject コンテキスト外**になり、enterprise スコープが静かに PF へ戻る。

```typescript
// NG: computed / 非同期ハンドラの中で呼ぶ
const existingMenus = computed(() => useAppEventStore(props.eventId).menus)
const onSave = async () => {
  await useAppEventStore(props.eventId).save(draft)
}

// OK: setup で factory を一度作り、返却クロージャを使う
const createEventStore = useCreateAppEventStore()
const existingMenus = computed(() => createEventStore(props.eventId).menus)
const onSave = async () => {
  await createEventStore(props.eventId).save(draft)
}
```

### NG: Pinia store の初回生成時オプションで副作用を制御する

同一 ID の store は再利用され `defineStore` の setup は初回のみ実行される。setup 内で購読を開始すると、後から別オプションで取得しても反映されない。逆に一度 `autoSubscribe: false` で生成されると、通常呼び出しでも購読が始まらず `getLoadedUser()` が永久に解決しない。

```typescript
// NG: setup 内（初回のみ実行）で購読を開始する
export const useUserStore = (userId: string, options?: UseUserStoreOptions) => {
  const store = defineStore(`/users/${userId}`, () => {
    if (options?.autoSubscribe !== false) {
      subscribe() // 2 回目以降の呼び出しでは評価されない
    }
    return { ... }
  })
  return store()
}

// OK: 取得の出口で毎回判定する（subscribe は idempotent にしておく）
export const useUserStore = (userId: string, options?: UseUserStoreOptions) => {
  const store = defineStore(`/users/${userId}`, () => { ... })
  const storeInstance = store()
  if (options?.autoSubscribe !== false) {
    storeInstance.subscribe()
  }
  return storeInstance
}
```

### NG: `loginUser` だけで UID 確定を判断する

`loginUser`（Firestore 由来）は Auth 確定より遅れて解決する。Checkout 戻りやカート初期化で「まだ null」のまま処理が終わってしまう。

```typescript
// NG: loginUser が解決する前に onMounted が終わり、予算・replay が欠落する
onMounted(async () => {
  if (loginUser.value == null) return
  await loadBudget(loginUser.value.user_id)
})

// OK: firebaseUser.uid をフォールバックに併用する
const currentUserId = computed(() => loginUser.value?.user_id ?? firebaseUser.value?.uid ?? '')
watch(currentUserId, async (userId) => {
  if (userId === '') return // 空 ID で store 生成 / Callable を呼ばない
  await loadBudget(userId)
}, { immediate: true })
```

### NG: 存在確認・重複チェックのクエリに `limit` がない

```typescript
// NG: 一致する全件を読み込んでから件数判定し、docs[0] を固定採用する
const matched = await getDocs(query(collection(db, 'communities'), ...constraints))
return matched.docs[0].data()

// OK: 曖昧一致の検知に必要な 2 件だけ読む
const matched = await getDocs(query(collection(db, 'communities'), ...constraints, limit(2)))
if (matched.docs.length > 1) {
  throw new Error(`Community "${communityAccount}" is ambiguous for the given scope.`)
}
```

### NG: 固定 Storage パスのキャッシュバストにセッション内カウンタを使う

ロゴ等を同じ Storage パスへ上書きすると `company_logo_url` が変化せず、ブラウザキャッシュのまま古い画像が残る。世代カウンタはリロードで 1 に戻り、同じ URL を再利用してしまう。

```typescript
// NG: セッション内カウンタ（リロードすると v=1 に戻り古いキャッシュを再利用する）
let logoRenderGeneration = 0
const src = `${url}?v=${++logoRenderGeneration}`

// OK: 永続するバージョン（Enterprise.updated_at）をキーにする
const src = withEnterpriseLogoCacheBust(url, enterprise.updated_at)
```

### NG: ガードの「未確定」を boolean に丸める

```typescript
// NG: tenant 未解決や community 未取得を false / true に丸める
export function canView(snapshot: Snapshot): boolean {
  return snapshot.community?.managers.some((m) => m.id === snapshot.currentUserId) ?? true
}

// OK: 未確定は null。呼び出し側が timeout で 404 / エラーへ分岐する
export function evaluateManageCommunityCanView(snapshot: ManageCommunityGuardSnapshot): boolean | null {
  if (snapshot.enterpriseId == null || snapshot.enterpriseId === '') {
    return null // tenant 未解決を「許可」に倒さない
  }
  if (snapshot.community != null && snapshot.community.enterprise_id !== snapshot.enterpriseId) {
    return false
  }
  if (snapshot.community != null && snapshot.currentUserId != null) {
    return snapshot.community.managers.some((managerRef) => managerRef.id === snapshot.currentUserId)
  }
  return null
}
```

### NG: await 後に route を確認せず遷移する

```typescript
// NG: fetch 中にユーザーが別ページへ移動していても replace が発火する
const eligible = await fetchEligible()
router.replace(eligible ? usagePath : ordersPath)

// OK: 開始時の path と一致するときだけ遷移する
const requestPath = route.fullPath
const eligible = await fetchEligible()
if (route.fullPath !== requestPath) return
router.replace(eligible ? usagePath : ordersPath)
```

### NG: `defineProps` を `PropType` オブジェクト形式で書く

```typescript
// NG: PropType + eslint-disable
const props = defineProps({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  toggleVerticalOverlayNavActive: {
    type: Function as PropType<(value: boolean) => void>,
    required: true,
  },
})

// OK: 型エイリアス + 型ベース props（既定値は withDefaults）
export type VerticalOverlayNavToggleFn = (value: boolean) => void

const props = withDefaults(
  defineProps<{ toggleVerticalOverlayNavActive: VerticalOverlayNavToggleFn; isOverlayNavActive?: boolean }>(),
  { isOverlayNavActive: false },
)
```

### NG: メール本文の URL を EVENT_HOST 固定で組み立てる

Enterprise 会員には subdomain / custom_domain のホストで届けないと、リンク先で認証が通らない。

```typescript
// NG: PF ホスト固定。enterprise 会員が開けない URL になる
const event_url = getEventUrl(community.community_account, event.id)

// OK: community.enterprise_id からホストを解決する
const event_url = await getEventUrlForCommunity(community, event.id)
// event から直接引く場合は getEventUrlForEvent(event)
// community URL は getCommunityUrlForCommunity / 管理画面は getManageCommunityUrlForCommunity
```

ホスト解決を各ファイルで再実装せず、`functions/default/src/utils/urls.ts` の `resolveAppHostForCommunity` 系へ委譲する。
