# PF版 user から base への機能移行

enterprise パッケージ作成前に、user に残っている共通機能を base へ移行する計画を整理する。

`05_エンタープライズ_PF版_userとenterpriseの共通化.md` では **コピー + マージ** を採用しているが、共通ロジックは可能な限り `base` / `common` に寄せる方針も維持する。本ドキュメントはそのうち **user → base 方向**（機能の引き上げ）を扱う。

**関連ドキュメント（別方向の作業）**: `05_エンタープライズ_PF版_baseの依存関係整理.md` — base → user 方向の依存の逆転を解消する。

---

## 1. 実装方針

- user をコピーして enterprise を実装する前提
- base は user / enterprise / partner で共通利用する
- user をコピーすると、user に残った共通機能は二重メンテナンスになる
- 共通して実装すべき箇所は enterprise 着手前に base へ寄せる
- 特に https://shokujii.jp/manage 管理者画面が移行候補の中心

---

## 2. 現状サマリ

| 観点 | 状態 |
|------|------|
| **store / API** | ほぼすべて `base` / `common` にある（`user` に store なし） |
| **管理画面（/manage）** | Phase 1-A〜C・Phase 2 まで完了。**`community/events.vue` のみ** user に実装本体が残る（§10 参照）。コンポーネント命名整理 **完了**（§4.1.4・§10.10） |
| **公開ページ** | `cart` / `mypage` / `members` / `invites` は base 化済み。`c/[communityAccount]/index.vue` 等は **Phase 3 未着手** |
| **依存の逆転** | `base` が `@/router/utils` を参照 → 各 app が path 関数を提供している（provide/inject 化は将来） |

**実装済み・未対応の詳細は §10 のチェックリストを正とする。**

### 移行パターン（既存事例）

`user/src/pages/c/[communityAccount]/e/[eventId]/members.vue` が `@shokujii/base/components/pages/.../members.vue` を import するだけの薄いラッパーになっている。manage も同様に、**base にトップレベルコンポーネントを置き、user の pages は薄いラッパーにする**。

`base/src/components/pages/@CAUTION.md` にあるとおり、`base/src/components/pages/` に page 相当のファイルを増やすのではなく、`base/src/components/manage/` 等にコンポーネント単位で配置する。

**注**: 旧 `[communityId]` ルートは `[communityAccount]` に統一済み。本ドキュメント内の `[communityId]` 表記はパスパラメータ名の歴史的記載であり、現行 user の pages パスは `[communityAccount]` を指す。

---

## 3. 前提タスク

`05_エンタープライズ_PF版_baseの依存関係整理.md` §1.1 のとおり、`@/router/utils` の provide/inject 化は **見送り**、現行パターンを継続する。manage を base へ移行したコンポーネントも `@/router/utils` を参照するため、**各 app の `router/utils.ts` 更新は移行後も必要**（§1.1「base に path 関数が増えたとき」参照）。

推奨する全体順序:

```
1. user の共通機能（本ドキュメント：/manage 等）を base へ移行
     ※ base 追加時は user / enterprise / partner の router/utils を同時更新
   ↓
2. base/src/components/pages/ の user 固有ページ整理（base の依存関係整理 §2.2）
   ↓
3. UserAvatar / locales 等の横断対応（base の依存関係整理 §2.4 以降）
   ↓
【将来】path 生成の abstract 化（base の依存関係整理 §2.1）
```

---

## 4. 移行対象インベントリ

### 4.1 管理画面コンポーネント（最優先）

`/manage` 配下は enterprise でもほぼ同一機能が必要なため、移行の主戦場とする。

#### 4.1.1 すぐ移せる（薄いラッパー）

| user のファイル | 行数（目安） | base 側の既存資産 | 移行先（案） |
|----------------|-------------|-------------------|-------------|
| `components/manage/event/settings.vue` | 25 | `EventEdit.vue` | `base/src/components/manage/event/EventSettings.vue` |
| `components/manage/community/settings.vue` | 69 | `CommunityEdit.vue` | `base/src/components/manage/community/CommunitySettings.vue` |
| `pages/manage/newcommunity.vue` | 89 | `CommunityEdit`, `createNewCommunity` | `base/src/components/manage/community/NewCommunity.vue` |

#### 4.1.2 ビジネスロジックが厚い（enterprise でも必須）

| user のファイル | 行数（目安） | 優先度 | 理由 |
|----------------|-------------|--------|------|
| `components/manage/event/member.vue` | 313 | **最高** | EventMemberOrder 対応の中心 |
| `components/manage/community/member.vue` | 376 | **最高** | 管理者追加・CSV・メール。event/member と UI 重複 |
| `components/manage/event/overview.vue` | 387 | **高** | キャンセル・コピー・請求書案内 |
| `components/manage/community/CopyEventDialog.vue` | 623 | **高** | 単発/繰り返しコピー。複数画面から共用 |
| `components/manage/community/album.vue` | 442 | **高** | アルバム CRUD |
| `components/manage/community/events.vue` | 169 | **高** | コミュニティ内イベント一覧 |
| `components/manage/community/invoice.vue` | 155 | **中** | 請求書一覧 |
| `components/manage/event/letter.vue` | 167 | **中** | base の `LetterEdit` を利用 |
| `components/manage/community/letter.vue` | 237 | **中** | 同上 |
| `components/manage/event/flyer.vue` | 203 | **中** | base の `getFlyerPdf` を利用 |
| `components/manage/community/slackSetting.vue` | 194 | **中** | Slack 画像が `@/assets` 依存 |

**横断リファクタ候補**: `community/member.vue` と `event/member.vue` は CSV 出力・EmailDialog・SNS リンク・管理者権限チェックが重複する。移行時に `MemberSnsButtons` 等へ分割を検討する（命名は §4.1.4）。

#### 4.1.3 タブシェル・一覧ページ

| user のファイル | 行数（目安） | 移行先（案） |
|----------------|-------------|-------------|
| `pages/manage/community/[communityAccount]/[tab].vue` | 98 | `CommunityTabLayout.vue` |
| `pages/manage/event/[eventId]/[tab].vue` | 112 | `EventTabLayout.vue` |
| `pages/manage/community/index.vue` | 110 | `CommunityIndex.vue` |
| `pages/manage/event/index.vue` | 227 | `EventIndex.vue` |
| `pages/manage/event/[eventId]/invoice.vue` | 47 | `EventBillInvoicePdf.vue` |
| `pages/manage/community/.../newevent.vue` | 28 | `NewEvent.vue` |

移行後の user 側イメージ:

```vue
<!-- user/src/pages/manage/event/[eventId]/[tab].vue -->
<script setup lang="ts">
import EventTabLayout from '@shokujii/base/components/manage/event/EventTabLayout.vue'
</script>
<template>
  <EventTabLayout />
</template>
```

> **⚠ 動的 import パスの付け替え（必須対応）**
>
> 現状のタブシェルは、タブ本体を**テンプレートリテラルの動的 import**で読み込んでいる。
>
> ```ts
> // user/src/pages/manage/event/[eventId]/[tab].vue
> component: defineAsyncComponent(() => import(`@/components/manage/event/${tab}.vue`))
> // community 側も同様: import(`@/components/manage/community/${tab}.vue`)
> ```
>
> タブ本体を base へ移すと、この `@/components/manage/...` は **ビルド時に各 app の `@/`（= `user/src` 等）に解決される**ため、そのままでは base 内のコンポーネントを指せない。Vite の dynamic-import-vars はパッケージ跨ぎ・テンプレートリテラルでの解決規則が変わるため、**次のいずれかでタブ解決を明示化する**こと。
>
> 1. タブ名 → コンポーネントの **明示 import マップ**を base のシェル内に持つ（推奨）
>    ```ts
>    const tabComponents = {
>      overview: () => import('@shokujii/base/components/manage/event/EventOverview.vue'),
>      member: () => import('@shokujii/base/components/manage/event/EventMember.vue'),
>      // ...
>    }
>    ```
> 2. もしくはタブ本体を**静的 import**して `tab` で出し分ける。
>
> Phase 1-C の最重要論点。`[tab].vue` を base 化する PR では必ずこの付け替えを含めること。
>
> なお `[tab].vue` は base の `eventcreate/symbols.js` の `injectionKeyEventEditHostActive` を `provide` している。base 化後も **provide 側（シェル）と inject 側（settings タブ）の責務がずれないよう**注意する。

#### 4.1.4 manage コンポーネントの命名規則

Phase 1〜2 実装後、**dev/2051 で §10.10 の命名整理を実施済み**（`Manage` / `Managed` 接頭辞を削除。履歴は Plan C で再構成）。

**原則**

| # | ルール | 説明 |
|---|--------|------|
| 1 | **`Manage` / `Managed` をファイル名に付けない** | `base/src/components/manage/{community\|event}/` がスコープを表す |
| 2 | **`Community` / `Event` 接頭辞は維持** | ルートの `EventList.vue`（ウィジェット）等との識別、grep のしやすさ（`eventcreate/` と同様） |
| 3 | **接尾辞は役割で揃える** | 「ページであること」ではなく、コンポーネントが**何をするか**で命名する（下表） |
| 4 | **横断 UI は `manage/shared/`** | 現状 `manage/` 直下の `ManageMember*` を `shared/Member*` へ（任意） |

**役割別の接尾辞**

| 役割 | 接尾辞・パターン | 例 |
|------|------------------|-----|
| manage トップ一覧（旧 `pages/.../index.vue`） | `{Entity}Index` | `CommunityIndex`, `EventIndex` |
| タブシェル（旧 `pages/.../[tab].vue`） | `{Entity}TabLayout` | `CommunityTabLayout`, `EventTabLayout` |
| タブ本体 | `{Entity}{Tab名}`（接尾辞なし） | `CommunityMember`, `CommunityInvoice`, `EventOverview` |
| 単機能ビューア | `{ドメイン用語}{形式}` | `EventBillInvoicePdf`（PDF iframe 表示） |
| 作成フロー | 動詞句 | `NewCommunity`, `NewEvent` |
| Dialog | `{機能}Dialog` | `CopyEventDialog`（現状維持） |

**`EventIndex` について**: ルートの `EventList.vue` はコミュニティ内イベントを選ぶ**再利用ウィジェット**（`CopyEventDialog` 等から import）であり、manage のイベント一覧トップとは別物。`ManagedEventList` より **`EventIndex`** の方が衝突回避と意図の両方が明確。

**`EventBillInvoicePdf` について**: `CommunityInvoice.vue` はコミュニティ manage **タブ**（請求書払いイベント一覧 + PDF リンク）。`/manage/event/[eventId]/invoice` は **主催者請求書 PDF の iframe 表示**のみ。`getEventBillInvoicePdf` 等の既存ドメイン用語に合わせ **`EventBillInvoicePdf`** とする（汎用 `Page` 接尾辞は使わない）。

**composable**: `@shokujii/base/composable/` から import されるためディレクトリ文脈がない。**`useManageMemberEmail` は現状維持**可（スコープ明示）。リネームする場合は `useMemberEmailForManage` 等。

**未 base 化の `community/events.vue`**: base 化時はタブ他と揃え **`CommunityEvents.vue`** を推奨。

### 4.2 公開ページ（manage より優先度低）

| user のファイル | 状態 | 方針 |
|----------------|------|------|
| `pages/c/[communityId]/e/[eventId]/members.vue` | 済 | base ラッパー |
| `pages/cart.vue`, `pages/mypage.vue` | 済 | 同上 |
| `pages/c/[communityId]/index.vue` | 未 | `CommunityPublicPage.vue` 候補 |
| `pages/c/[communityId]/e/[eventId]/index.vue` | 未 | `EventPublicPage.vue` 候補 |
| `pages/communitylist/index.vue` | 未 | PF 固有の可能性（enterprise は企業内一覧に変わる） |
| `pages/index.vue` | 未 | PF トップ（enterprise では別デザイン確実） |

---

## 5. user に残すもの（PF 固有）

enterprise では文言・リンク・ナビが変わるため、base に入れない。

| ファイル | 理由 |
|---------|------|
| `pages/manage/index.vue`（約 451 行） | shokujii ブランディング、`shokujii.jp` 直リンク、料金・サポート訴求 |
| `navigation/manage.ts` | bit.ly / shokujii.studio.site 等の外部リンク |
| `components/ManageTopCard.vue` | manage TOP 専用 UI |
| `layouts/manage.vue` | Channel.io 表示制御、`Footer` / `UserProfile` はアプリ固有 |
| `locales/messages/ja.ts` の `manage.top.*` | PF マーケティング文言（数百行） |
| `router/index.ts` の manage 権限ガード | ロジックは base composable 化可能だが、適用は各 app |

**i18n の分割方針**: `manage.top` 等 PF 固有文言は user に残す。`manage.community.tabs.*` 等の機能文言は base の `locales` へ移す。

`base/src/plugins/i18n/index.ts` は `_.merge(base のメッセージ, app のメッセージ)` で統合し、**同一キーは app 側が base を上書き**する（base = 既定、app = 上書き）。よって機能文言を base に置き、PF 固有を user 側で上書き/追加する構成は成立する。

ただし `manage.top.*`（user）と `manage.community.*`（base）が**同じ `manage` ツリーに分散**すると、どのキーがどちらにあるか追いにくい。次のいずれかで分割境界を明確にすること。

- **方針 A（推奨）**: PF 固有のマーケ文言は `manageTop.*` 等の**別 namespace**に切り出して user に置く。`manage.*` は機能文言として base に集約する。
- **方針 B**: `manage` ツリーを維持する場合、「`manage.top` 配下は user、それ以外は base」という境界をこのドキュメントに明記し、レビュー時に逸脱を弾く。

---

## 6. 横断的な付随作業

| 項目 | 現状 | 対応 |
|------|------|------|
| **アセット** | §6.1 参照 | ブランド依存か共通かで分岐（§6.1） |
| **i18n** | `manage.*` の大半が `user/src/locales` | 機能文言 → base、マーケ文言 → user（§5 の分割方針） |
| **ルーターガード** | `user/router/index.ts` の manage 権限チェック | §6.2 で分解。共通ロジックは base composable 化 |
| **Channel.io** | manage 配下で表示 | user 固有のまま |

### 6.1 参照アセットの個別移行方針

移行対象が import している実アセットは次の通り。**ブランド依存のものは base 固定配置にすると enterprise で差し替えできない**ため、扱いを分けて判断する。

| アセット | 参照元 | 性質 | 方針（案） |
|----------|--------|------|------------|
| `@/assets/images/sns/sns_instagram.png` | event/member, community/member | 汎用 | `base/src/assets/` へ移して共通化 |
| `@/assets/images/slack/slack_logo.png`, `slack_image_01〜04.png` | community/slackSetting | 連携サービスロゴ（汎用寄り） | base へ共通化可。ただし Slack 連携自体が enterprise で使われるか要確認 |
| `@/assets/images/shokujii/flyer_logo.png` | event/flyer | **shokujii ブランド** | base 固定は不可。`defaultLogoUrl` を props/inject で渡すか、コミュニティ設定（Storage）から取得する設計に変更 |

`UserAvatar` のデフォルト画像と同じ論点（`05_..._baseの依存関係整理.md` §2.4）。ブランド依存アセットは「base に既定を置きつつ app/コミュニティ側で上書き可能」にする。

### 6.2 manage 権限ガードの分解

`user/src/router/index.ts` の manage 関連ガードは複数の責務が一体化している。base composable 化（`useManageAccessGuard()` 等）にあたり、出す/残すを切り分ける。

| ガードの責務 | enterprise でも必要 | 配置方針 |
|--------------|:-------------------:|----------|
| 削除済みイベントの 404 リダイレクト | ○ | **base composable へ** |
| コミュニティ管理者権限チェック（`community.managers.some(...)` + support バイパス） | ○ | **base composable へ** |
| manage 配下のログイン必須判定（`isLoginRequired`） | ○ | base composable 化を検討（ログイン path は app 依存のため注入） |
| Channel.io 表示制御 | △（PF 固有） | **user に残す**（§5） |
| メンテナンスモード・リダイレクト復帰等 | － | 本移行のスコープ外（既存のまま） |

composable 化しても**適用（`router.beforeEach` への登録）は各 app の `router/index.ts`** で行う（前提タスク §3 と同方針）。

---

## 7. 実施順序

```
Phase 1-A: settings / newcommunity 等の薄いラッパー
    ※ base 移行時は user / enterprise / partner の router/utils を同時更新（base の依存関係整理 §1.1）
    ↓
Phase 1-B: member / overview / CopyEventDialog（EventMemberOrder 対応と並行可）
    ↓
Phase 1-C: タブシェル・一覧ページ
    ↓
Phase 2: letter / album / invoice / flyer / slack
    ↓
Phase 2 follow-up: manage コンポーネント命名整理（§4.1.4・§10.10）。機能移行 PR マージ後でも可
    ↓
Phase 3: 公開ページの base 化（enterprise 要件確定後）
    ↓
【将来】path 生成の provide/inject 化（base の依存関係整理 §2.1）
```

**EventMemberOrder 対応と並行する場合**は `manage/event/member.vue` を Phase 1-B の最初に置く。

**コンポーネント内部の依存順**: `manage/event/overview.vue` は `manage/community/CopyEventDialog.vue` を import している。Phase 1-B では **CopyEventDialog → overview の順**で base 化しないと一時的にビルドが壊れる。同様に、各タブ本体を base へ移してからタブシェル（`[tab].vue`）の動的 import を付け替えること（§4.1.3）。

---

## 7.1 router/utils 関数の app 別整備（移行と同時に必須）

base へ移したコンポーネントは `@/router/utils` を**静的 import** するため、機能を使わない app でも**ビルド解決にシンボルが必要**（`05_..._baseの依存関係整理.md` §1.1）。各フェーズで base が新たに参照する関数を、**user / enterprise / admin の `router/utils.ts` に同時追加**する。`admin/src/router/utils.ts` は現状 7 関数のみで、manage 系の多くが未定義のため特に注意。

| 関数 | 主な参照元（移行対象） | user | admin 現状 | enterprise |
|------|------------------------|:----:|:----------:|:----------:|
| `getManageCommunityPath` | newcommunity / event letter / community events | ○ | **なし** | 要追加 |
| `getManageCommunitySettingsPath` | event・community の member / letter | ○ | **なし** | 要追加 |
| `getManageCommunityListPath` | 権限ガードのリダイレクト先 | ○ | **なし** | 要追加 |
| `getManagePath` | community/member | ○ | **なし** | 要追加 |
| `getEventCreatePath` | community/events | ○ | **なし** | 要追加 |
| `getEventBillInvoicePath` | community/invoice | ○ | **なし** | 要追加 |
| `getFlyerPath` | event/flyer | ○ | **なし** | 要追加 |
| `getManageEventPath` | community/events・letter | ○ | スタブ `() => ''` | 要追加 |
| `getManageCommunityAlbumPath` | EventEdit（既存） | ○ | ○ | ○ |
| `getEventPath` / `getUserPath` / `getCommunityPath` | 多数 | ○ | ○ | ○ |

- **admin**: 機能を描画しなくても import 解決のためスタブが要る。ただし `getManageEventPath = () => ''` のような**誤実装はコンパイルで検知できない**（リンク切れになる）。スタブで埋める場合はコメントで「未使用」を明示する。
- **enterprise**: user コピーで `router/utils.ts` ごと載るため、PF と同 URL なら追加対応は不要。URL 仕様を変える場合のみ各関数を上書きする。

---

## 8. 工数感

- manage 関連: 約 4,750 行（user 側）
- うち PF 固有（manage TOP・ナビ・マーケ文言等）: 約 600 行 → user に残す
- **移行候補**: 約 4,000 行 → base へ

---

## 8.1 各フェーズの受け入れ条件（回帰確認）

base 化は「user 側の pages を薄いラッパーにしても**従来どおり動く**」ことがゴール。各フェーズの PR で最低限、次を確認する（user で確認し、enterprise 作成後は enterprise でも再確認）。

- **共通（全フェーズ）**: 各 app（user / admin）で `npm -w <pkg> run build` が通る（admin の `router/utils.ts` スタブ漏れ・動的 import 解決漏れの検知）。lint・format（`/lint-and-format`）。
- **Phase 1-A（settings / newcommunity）**: コミュニティ作成 → 作成後の遷移、イベント設定の更新後リダイレクト。
- **Phase 1-B（member / overview / CopyEventDialog）**: 管理者追加・CSV 出力・メール送信・SNS リンク、イベントのキャンセル/コピー（単発・繰り返し）、請求書案内。
- **Phase 1-C（タブシェル・一覧）**: event/community のタブ遷移（URL 直打ち含む）、`navActiveLink`、管理者権限ガード（非管理者は manage 一覧へリダイレクト）、削除済みイベントの 404。
- **Phase 2（letter / album / invoice / flyer / slack）**: レター作成・送信、アルバム CRUD、請求書一覧/PDF、フライヤー PDF（ロゴ差し替えの確認）、Slack 設定。
- **i18n**: 文言が欠落（キー未解決の生表示）していないこと。特に base へ移したキーと user 残置キーの両方。

ロジックを伴う共通部品（CSV 生成・日付処理等）を base へ切り出す際は、`/vitest` で対象ロジックの単体テストを検討する。

---

## 10. 実装状況チェックリスト

**最終更新**: Phase 2 完了 + 命名整理 + §10 チェックリスト（Issue #2051 / ブランチ `dev/2051`）。

**凡例**

| 記号 | 意味 |
|------|------|
| [x] | 実装済み（base 本体 + user 薄ラッパーまたは pages 薄ラッパーまで完了） |
| [ ] | 未対応 |
| [—] | 意図的に user に残す（§5 PF 固有。base 化対象外） |

---

### 10.1 Phase 1-A（settings / newcommunity）

| 状態 | 項目 | base 移行先 / 備考 |
|:----:|------|-------------------|
| [x] | `manage/event/settings.vue` | `EventSettings.vue` |
| [x] | `manage/community/settings.vue` | `CommunitySettings.vue` |
| [x] | `pages/manage/newcommunity.vue` | `NewCommunity.vue` |

---

### 10.2 Phase 1-B（member / overview / CopyEventDialog）

| 状態 | 項目 | base 移行先 / 備考 |
|:----:|------|-------------------|
| [x] | `manage/event/member.vue` | `EventMember.vue` |
| [x] | `manage/community/member.vue` | `CommunityMember.vue` |
| [x] | `manage/event/overview.vue` | `EventOverview.vue` |
| [x] | `manage/community/CopyEventDialog.vue` | `CopyEventDialog.vue`（user は re-export 付き薄ラッパー） |
| [x] | 共通 UI（横断） | `MemberSnsButtons.vue` / `MemberEmailNotSetDialog.vue` |
| [x] | SNS アセット共通化 | `sns_instagram.png` → `base/src/assets/` |
| [x] | 関連 i18n | `copy_event` / `member` / `event` / `letter` 等 → base |

**横断リファクタ候補**（`ManageMemberActions.vue` 等への分割）: [ ] 未着手

---

### 10.3 Phase 1-C（タブシェル・一覧 pages）

| 状態 | 項目 | base 移行先 / 備考 |
|:----:|------|-------------------|
| [x] | `pages/manage/community/.../[tab].vue` | `CommunityTabLayout.vue` + user 薄ラッパー |
| [x] | `pages/manage/event/.../[tab].vue` | `EventTabLayout.vue` + user 薄ラッパー |
| [x] | `pages/manage/community/index.vue` | `CommunityIndex.vue` |
| [x] | `pages/manage/event/index.vue` | `EventIndex.vue` |
| [x] | `pages/manage/event/.../invoice.vue` | `EventBillInvoicePdf.vue` |
| [x] | `pages/manage/community/.../newevent.vue` | `NewEvent.vue` |
| [x] | タブ `tabComponents` 明示マップ | Phase 2 完了時点で letter/album/invoice/slack も base 直 import |
| [x] | `injectionKeyEventEditHostActive` provide | `EventTabLayout` 側で維持 |
| [x] | `manage.community.tabs` i18n | base へ移行済み |

---

### 10.4 Phase 2（letter / album / invoice / flyer / slack）

| 状態 | 項目 | base 移行先 / 備考 |
|:----:|------|-------------------|
| [x] | `manage/event/letter.vue` | `EventLetter.vue` |
| [x] | `manage/community/letter.vue` | `CommunityLetter.vue` |
| [x] | `manage/community/album.vue` | `CommunityAlbum.vue` |
| [x] | `manage/community/invoice.vue` | `CommunityInvoice.vue` |
| [x] | `manage/event/flyer.vue` | `EventFlyer.vue`（`flyerLogoUrl` prop。Layout は user 薄ラッパー経由） |
| [x] | `manage/community/slackSetting.vue` | `CommunitySlackSetting.vue` |
| [x] | Slack 画像アセット | `base/src/assets/images/slack/` へコピー済み |
| [x] | 関連 i18n | `manage.new_letter` / `manage.invoice.*` / `manage.flyer.*` / `manage.slack.*` / `manage.community.album.*` → base |
| [x] | admin `router/utils` スタブ | `getEventBillInvoicePath` / `getFlyerPath` 追加済み |

**Phase 2 スコープ外だが §4.1.2 に記載の残件**

| 状態 | 項目 | 備考 |
|:----:|------|------|
| [ ] | `manage/community/events.vue` | コミュニティ内イベント一覧。**user に実装本体が残る**。`CommunityTabLayout` の `events` タブのみ user import |

---

### 10.5 Phase 3（公開ページ・enterprise 要件確定後）

| 状態 | 項目 | 方針 / 備考 |
|:----:|------|------------|
| [x] | `pages/cart.vue` | base 薄ラッパー（Phase 3 より前に完了） |
| [x] | `pages/mypage.vue` | 同上 |
| [x] | `pages/c/.../members.vue` | base 薄ラッパー |
| [x] | `pages/c/.../invites.vue` | base 薄ラッパー |
| [ ] | `pages/c/[communityAccount]/index.vue` | `CommunityPublicPage.vue` 候補。**user に実装本体** |
| [ ] | `pages/c/[communityAccount]/e/[eventId]/index.vue` | `EventPublicPage.vue` 候補。**user に実装本体** |
| [ ] | `pages/communitylist/index.vue` | PF 固有の可能性。enterprise 要件待ち |
| [ ] | `pages/index.vue` | PF トップ。enterprise では別デザイン見込み |

---

### 10.6 §5 意図的に user に残すもの（base 化対象外）

| 状態 | 項目 | 備考 |
|:----:|------|------|
| [—] | `pages/manage/index.vue` | shokujii ブランディング・マーケ訴求 |
| [—] | `navigation/manage.ts` | 外部リンク PF 固有 |
| [—] | `components/ManageTopCard.vue` | manage TOP 専用 UI |
| [—] | `layouts/manage.vue` | Channel.io / Footer 等 |
| [—] | `locales` の `manage.top.*` | PF マーケ文言 |
| [—] | `router/index.ts` の manage ガード登録 | ロジック composable 化は §10.7 |

---

### 10.7 横断的付随作業（§6・§3 前提タスク）

| 状態 | 項目 | 備考 |
|:----:|------|------|
| [x] | `@/router/utils` 現行パターン維持 | provide/inject 化は [ ] **将来**（§7 末尾） |
| [x] | admin `getManagePath` スタブ | §7.1 記載。`CommunityMember` が参照するが **admin 未追加**（admin ビルドは通るがスタブ漏れとして残課題） |
| [x] | admin manage 系スタブ（Phase 1-C / 2 分） | `getManageCommunityPath` 等 + `getEventBillInvoicePath` / `getFlyerPath` |
| [ ] | manage 権限ガード composable 化 | §6.2 `useManageAccessGuard` 等。**未着手** |
| [ ] | `manage.top` → `manageTop.*` namespace 分割 | §5 方針 A。**未着手** |
| [ ] | `user/src/assets/images/slack/` 重複削除 | base 移行後の整理。**未着手**（動作上は base のみ参照） |
| [ ] | `base/src/components/pages/` 整理 | base の依存関係整理 §2.2。**未着手** |
| [ ] | UserAvatar / locales 横断対応 | base の依存関係整理 §2.4 以降。**未着手** |
| [x] | manage コンポーネント命名整理 | §4.1.4・§10.10。**dev/2051 で実施済み** |

---

### 10.8 受け入れ条件・検証（§8.1）

| 状態 | 項目 | 備考 |
|:----:|------|------|
| [x] | 自動: user / admin build | Phase 2 コミット群で確認済み |
| [x] | 自動: lint / format | 同上 |
| [ ] | 手動: Phase 1-A〜C 回帰 | コミット時点で未実施の記載あり |
| [ ] | 手動: Phase 2 回帰 | レター / アルバム / 請求書 / チラシ / Slack / タブ URL 直打ち |

---

### 10.9 dev/2051 で base に新規作成したファイル

`origin/development` との差分（`git diff --diff-filter=A $(git merge-base HEAD origin/development)...HEAD -- base/`）より。**28 ファイル**（**現行ファイル名**。推奨リネーム先は §10.10）。

#### composable

| ファイル | フェーズ |
|----------|--------|
| `base/src/composable/useManageMemberEmail.ts` | 1-B（member 横断で新規抽出） |

#### components/manage（横断）

| ファイル | フェーズ |
|----------|--------|
| `base/src/components/manage/MemberEmailNotSetDialog.vue` | 1-B |
| `base/src/components/manage/MemberSnsButtons.vue` | 1-B |

#### components/manage/community

| ファイル | フェーズ | user 移行元（参考） |
|----------|--------|---------------------|
| `base/src/components/manage/community/CommunitySettings.vue` | 1-A | `components/manage/community/settings.vue` |
| `base/src/components/manage/community/NewCommunity.vue` | 1-A | `pages/manage/newcommunity.vue` |
| `base/src/components/manage/community/CommunityMember.vue` | 1-B | `components/manage/community/member.vue` |
| `base/src/components/manage/community/CopyEventDialog.vue` | 1-B | `components/manage/community/CopyEventDialog.vue` |
| `base/src/components/manage/community/CommunityTabLayout.vue` | 1-C | `pages/manage/community/.../[tab].vue` |
| `base/src/components/manage/community/CommunityIndex.vue` | 1-C | `pages/manage/community/index.vue` |
| `base/src/components/manage/community/NewEvent.vue` | 1-C | `pages/manage/community/.../newevent.vue` |
| `base/src/components/manage/community/CommunityLetter.vue` | 2 | `components/manage/community/letter.vue` |
| `base/src/components/manage/community/CommunityAlbum.vue` | 2 | `components/manage/community/album.vue` |
| `base/src/components/manage/community/CommunityInvoice.vue` | 2 | `components/manage/community/invoice.vue` |
| `base/src/components/manage/community/CommunitySlackSetting.vue` | 2 | `components/manage/community/slackSetting.vue` |

#### components/manage/event

| ファイル | フェーズ | user 移行元（参考） |
|----------|--------|---------------------|
| `base/src/components/manage/event/EventSettings.vue` | 1-A | `components/manage/event/settings.vue` |
| `base/src/components/manage/event/EventMember.vue` | 1-B | `components/manage/event/member.vue` |
| `base/src/components/manage/event/EventOverview.vue` | 1-B | `components/manage/event/overview.vue` |
| `base/src/components/manage/event/EventTabLayout.vue` | 1-C | `pages/manage/event/.../[tab].vue` |
| `base/src/components/manage/event/EventIndex.vue` | 1-C | `pages/manage/event/index.vue` |
| `base/src/components/manage/event/EventBillInvoicePdf.vue` | 1-C | `pages/manage/event/.../invoice.vue` |
| `base/src/components/manage/event/EventLetter.vue` | 2 | `components/manage/event/letter.vue` |
| `base/src/components/manage/event/EventFlyer.vue` | 2 | `components/manage/event/flyer.vue` |

#### assets

| ファイル | フェーズ |
|----------|--------|
| `base/src/assets/images/sns/sns_instagram.png` | 1-B |
| `base/src/assets/images/slack/slack_logo.png` | 2 |
| `base/src/assets/images/slack/slack_image_01.png` | 2 |
| `base/src/assets/images/slack/slack_image_02.png` | 2 |
| `base/src/assets/images/slack/slack_image_03.png` | 2 |
| `base/src/assets/images/slack/slack_image_04.png` | 2 |

**Phase 2 スコープ外（user に実装本体が残る）**: `user/src/components/manage/community/events.vue` — base 側の新規ファイルはなし。base 化時は `CommunityEvents.vue`（§4.1.4）。

---

### 10.10 manage コンポーネント命名整理

§4.1.4 の原則に沿って **dev/2051 で実施済み**。履歴は soft reset + 17 コミット再構成（Plan C）で、各コミット作成時点から新名称を使用。

| 旧名称 | 新名称 | 備考 |
|--------|--------|------|
| `CommunityManageLayout.vue` | `CommunityTabLayout.vue` | `Manage` 二重解消 |
| `EventManageLayout.vue` | `EventTabLayout.vue` | 同上 |
| `ManagedCommunityList.vue` | `CommunityIndex.vue` | manage コミュニティ一覧トップ |
| `ManagedEventList.vue` | `EventIndex.vue` | `EventList.vue`（ウィジェット）と区別 |
| `ManagedNewEvent.vue` | `NewEvent.vue` | `NewCommunity.vue` と対 |
| `ManagedEventInvoice.vue` | `EventBillInvoicePdf.vue` | PDF iframe。`CommunityInvoice`（タブ一覧）と区別 |
| `ManageMemberSnsButtons.vue` | `MemberSnsButtons.vue` | `manage/` 直下に配置 |
| `ManageMemberEmailNotSetDialog.vue` | `MemberEmailNotSetDialog.vue` | 同上 |

**現状維持**: タブ本体、`NewCommunity`、`CopyEventDialog`、`useManageMemberEmail`（composable）。

---

## 9. 参照ドキュメント

- `05_エンタープライズ_PF版_baseの依存関係整理.md` — 前提タスク（path 抽象化、base の依存の逆転）
- `05_エンタープライズ_PF版_userとenterpriseの共通化.md` — コピー + マージ方針、base への共通化の位置づけ
- `06_エンタープライズ_EventMemberOrder対応論点.md` — `manage/event/member.vue` 等への影響
- `base/README.md` — コンポーネント設計方針、依存関係の逆転について
- `base/src/components/pages/@CAUTION.md` — pages ディレクトリの暫定仕様
