---
name: shokujii-code-review
description: Shokujiiプロジェクトのコーディング規約に従ってコードをレビューする。指摘は 🚨必須修正/🟡修正提案/👌修正不要（評価・不変）。対応後はステータスを ✅対応済み、別Issue化は 📤#NNNN別Issue化（review-comments-evaluate と共通。❌未対応は使わない）。RC 記録は review-<ブランチslug>.md に追記（review-doc-path 参照）。AGENTS.md に従い、ソース変更タスクの実装完了時は必ずセルフレビューとして実行（lint は PR/reflect 前）。🚨 と条件付き 🟡（S・🔧/📄・📌）は確認なしで自動修正（最大2周）。コード変更のレビュー依頼時にも使用。
---

# Shokujii コードレビュー

## 他スキルとの役割分担

| スキル | 役割 |
|--------|------|
| **本スキル** | 差分に対する**能動的**レビュー（チェックリスト・共通区分の指摘） |
| [/review-comments-evaluate](../review-comments-evaluate/SKILL.md) | **外部**レビュー（Copilot / Codex / kokufu）コメントの評価 + **自動修正**（手順 4a） |

同一ブランチの記録は **`documents/レビューコメント/review-<slug>.md` 1 ファイル**に集約し（slug = ブランチ名の `/` → `-`）、RC 番号は evaluate の続き番号ルールに従う。パス解決は [review-doc-path.md](../review-comments-evaluate/references/review-doc-path.md)。既存 `pr-*.md` はレガシーとしてそのまま。詳細は evaluate の [他スキルとの役割分担](../review-comments-evaluate/SKILL.md#他スキルとの役割分担) を参照。

## 実装完了時の自動実行（AGENTS.md）

ソース変更タスクの完了報告前、**必ず**本スキルでセルフレビューを実行する。lint / test は [`/lint-and-format`](../lint-and-format/SKILL.md) で **push / PR / reflect 前**に別途実行する。

| 条件 | 動作 |
|:-----|:-----|
| ソース変更タスクの完了報告前 | **本スキルを実行** |
| ユーザーが「レビュー不要」と明示 | スキップ |

## 手順 0: pending wake 記録（レビュー開始時・必須）

未 consume の wake が無い場合、レビュー開始直後に write する（`since` は ISO8601 UTC。Stop gate の比較基準）。

```bash
branch=$(git branch --show-current)
python3 .agents/scripts/self_review_wake.py list \
  --wake-file .agents/state/self-review-pending.json \
  --branch "${branch}"
# 未作成なら:
python3 .agents/scripts/self_review_wake.py write \
  --wake-file .agents/state/self-review-pending.json \
  --branch "$branch" \
  --since "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

既に unconsumed の wake がある場合はその `since` を本セッションの評価日時基準として使う。

## レビュー手順

1. 変更差分（または指定されたファイル）を読む（`git diff origin/development...HEAD` 等）
2. 下記チェックリストの各項目を順に確認する（詳細・NG/OK 例は [shokujii-code-review.md](shokujii-code-review.md)）
3. 問題があれば [フィードバック形式](#フィードバック形式) に従ってコメントを出力する（**1 指摘 = 1 ブロック**、共通区分を付ける）
4. **ドキュメントへの記録** — 下記を実行（ユーザーが「記録不要」と明示した場合のみ省略）

### 手順 3a: 🚨 必須修正の自動修正（AGENTS.md から起動された場合）

手順 3 で 🚨 が 1 件以上ある場合、完了報告前に次を実行する（**ユーザー確認不要**）。判定の詳細は [auto-fix-policy.md](../review-comments-evaluate/references/auto-fix-policy.md) を参照。

1. **自動修正対象外**（一覧を報告し、人間判断を待つ）:
   - 仕様判断が必要（仕様書に無い挙動・要件の解釈）
   - スコープ外の設計変更（本 PR / Issue の範囲を超える改修）
   - セキュリティで影響範囲の確認が必要
2. 上記以外の 🚨 を**確認なしで修正**する
3. 手順 3b を実行する（該当 🟡 がある場合）
4. 手順 1 から**再レビュー**する（同一タスク内・**最大 2 周**・3a/3b 合算）
5. 2 周後も自動修正できない 🚨 / 🟡 が残る場合は一覧を報告して完了報告する
6. レビュー記録ファイルがある場合、対応した RC の**ステータス**を **✅ 対応済み** に更新する（**評価**は変更しない）

### 手順 3b: 🟡 修正提案の条件付き自動修正

手順 3 で [auto-fix-policy.md](../review-comments-evaluate/references/auto-fix-policy.md) の **🟡 修正提案（条件付き自動修正対象）** を満たす指摘がある場合、3a の直後（🚨 が 0 件のときは 3a をスキップして 3b のみ）に実行する（**ユーザー確認不要**）。

**対象の目安**: 🟡 + 📌 スコープ内 + 工数 **S** + 種別 **🔧 微修正** / **📄 ドキュメントのみ** + 除外ラベルなし + 修正方針が一意。

1. 対象外の 🟡 は**自動修正しない**（完了報告に列挙）
2. 対象の 🟡 を**確認なしで修正**する
3. ソース変更時は [`/lint-and-format`](../lint-and-format/SKILL.md) を実行する（push 前準備。セルフレビュー完了報告の必須条件ではないが、修正後は推奨）
4. 対応した RC の**ステータス**を **✅ 対応済み** に更新する（**評価**は 🟡 のまま）

👌 修正不要は**自動修正しない**。手動待ちの 🟡 も完了報告に列挙する。

### 手順 4: ドキュメントへの記録

記録先の解決は [review-doc-path.md](../review-comments-evaluate/references/review-doc-path.md) に従う（`git branch --show-current` → `review-<slug>.md`）。記録対象外ブランチ（`release/` `sync/` 等）はスキップしてよい。

**RC が 1 件以上ある場合のみ**記録する（🚨 / 🟡 / 👌 で RC 採番した指摘）。**指摘 0 件**（RC 採番なし）のときは手順 4 をスキップし、[手順 5](#手順-5-pending-wake-の-consume必須) の consume のみ実行する。review doc への「指摘なし」セッションは**書かない**。

RC がある場合:

1. [review-comments-evaluate](../review-comments-evaluate/SKILL.md) の **手順 4**（保存先・同一ファイルの扱い・RC 記録ブロック）に従う
2. ファイルが無ければ `# ブランチ <name> レビュー記録` + **冒頭** `### RC 一覧（サマリ）` + 表ヘッダで新規作成する（[review-xxxx_template.md](../../../documents/レビューコメント/review-xxxx_template.md) 参照）
3. ファイル末尾に `## 評価セッション（<日時 JST>・shokujii-code-review）` を追記（見出しの日時は **JST ローカル**、`YYYY-MM-DD HH:mm` 形式）。メタデータに **評価日時**・**ブランチ名**・**PR**（未作成時は `未作成`）を含める。Outdated / レビュー非該当は「該当なし」でよい
4. **RC 採番**: 既存 `review-<slug>.md` の最終 RC の次から。指摘ごとに 1 RC
5. **並び順**: **`path` 昇順**、同一 `path` 内は**行番号昇順**
6. 各 RC は **RC 記録ブロック（13項目）**（evaluate 参照）。**評価**・**ステータス**は [共通区分](../review-comments-evaluate/SKILL.md#評価--ステータス共通区分プロジェクト共通) に従う。**PRスコープ**・**ラベル**（複数可）・**変更種別**・**想定工数**も evaluate と同一語彙で記載する
   - **レビュワー**: `Cursor Agent（shokujii-code-review）`
   - **識別子**: `RC-n（GitHub id: なし・エージェントレビュー）` 等
   - **指摘箇所**: `` `path:line` ``
   - **該当コード**: [該当コードの取得（共通）](../review-comments-evaluate/SKILL.md#該当コードの取得共通)（`git diff origin/development...HEAD -- <path>`）
   - **レビュワーのコメント（原文）**: 手順 3 のチャット指摘文をそのまま
7. **冒頭の通し `### RC 一覧（サマリ）` 表**（ファイル最上部）に本セッション分の RC **行**を追記する（**必須**。セッション内サマリ表と `[x]` / `[ ]` を一致させる）

### 手順 5: pending wake の consume（必須）

指摘 0 件（手順 4 スキップ）でも **必ず**実行する:

```bash
branch=$(git branch --show-current)
python3 .agents/scripts/self_review_wake.py consume \
  --wake-file .agents/state/self-review-pending.json \
  --branch "$branch"
```

consume はその時点の **review スコープ差分の fingerprint**（`reviewed_scope_fingerprint`）を wake に記録する。同一の未コミット差分が残る場合、Stop gate は再レビューなしで合格する（指摘 0 件で review doc 未作成の場合も **consumed + fingerprint 一致**で合格）。**review スコープに新しい変更**が入ったら手順 0 から再実行する。

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

## GitHub Pull Request でレビューするとき（GitHub Copilot 等）

このスキルに沿って **GitHub 上**で PR をレビューする場合（例: GitHub Copilot が本リポの規約ドキュメントを参照するとき）は、次を守ること。

- **Conversation タブに、複数ファイル分の指摘を 1 本のトップレベルコメントにまとめない**こと。
- **Files changed** で該当行に **インラインの review comment** を付け、**1 指摘につき 1 コメント**とすること。

本ファイルは主に **Cursor / Claude 等のエージェント**向けである。GitHub Copilot が常にこの節に従う保証はないが、プロジェクトの期待動作として記載する。リポジトリの `.github/copilot-instructions.md` や PR 依頼コメントとあわせて参照される想定。

---

## フィードバック形式

チャットでの指摘と、レビュー記録ファイル（`review-<slug>.md`）への RC 記録の **評価**・**ステータス** は、[/review-comments-evaluate](../review-comments-evaluate/SKILL.md) と同じ **共通区分** を使う（**❌ 未対応は使わない**）。

```
🚨 **必須修正** [🔧微修正/S]: [問題の説明] → [修正方法]
🟡 **修正提案** [📋仕様追加/M]: [問題の説明] → [改善案]
🟡 **修正提案** [🆕新機能/L]: [問題の説明] → [改善案]
🟡 **修正提案** [📐リファクタ/M]: [問題の説明] → [改善案]
👌 **修正不要**: [問題の説明] → [対応不要の理由]
```

- **🚨 必須修正**: マージ前に対応が必要（セキュリティ・データ不整合・バグ等）
- **🟡 修正提案**: 改善を検討してほしい（設計・可読性等）。マージ必須ではない
- **👌 修正不要**: 指摘はあるが対応不要（誤解・仕様どおり・過剰指摘等）

**変更種別・工数タグ（任意）**: 行頭または末尾に `[🔧微修正/S]` `[📋仕様追加/M]` `[🆕新機能/L]` `[📐リファクタ/M]` `[📄ドキュメントのみ/S]` のように付けてよい。**省略形は使わない**。[review-comments-evaluate の変更種別・想定工数](../review-comments-evaluate/SKILL.md#変更種別) の**正式語彙**（微修正 / リファクタ / 新機能 / 仕様追加 / ドキュメントのみ / 確認のみ / 該当なし）をそのまま用いる。👀 確認のみ・➖ 該当なしは工数 `—` のみでよい。省略時は evaluate / 記録時に付与する。

**対応完了後**のドキュメント記録では **ステータス** を **✅ 対応済み** に更新する（**評価**は 🚨 / 🟡 のまま維持）。本 PR では実装せず別 Issue へ切り出した場合は **ステータス** を **📤 #NNNN 別Issue化** に更新する（AGENTS.md「レビューコメント対応記録」参照）。

**優先度の補足**（任意）: 本文に `[must]` / `[P2]` / `[nits]` / `[fyi]` を付けてよい。**評価**の共通区分は上記に統一する。

記録の詳細は [手順 4](#手順-4-ドキュメントへの記録) および [review-comments-evaluate](../review-comments-evaluate/SKILL.md) を参照。

---

## 詳細基準・よくある間違いパターン

各ルールの詳細な説明・NG/OK のコード例は以下を参照：

[shokujii-code-review.md](shokujii-code-review.md)
