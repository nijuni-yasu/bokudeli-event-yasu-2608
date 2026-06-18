# エンタープライズ開発前の PF版リファクタリング

エンタープライズ版（enterprise パッケージ）を作成する前に、プラットフォーム版の user と base の依存関係を整理する。`05_エンタープライズ_プラットフォーム版共通タスク.md` の「共通リファクタリング」に記載の内容を詳細化する。


# 1. 概要

`base/README.md` では、`@/utils/router` への依存が「依存関係の逆転」として明記されている。実際には `@/router/utils` を参照しており、base が user/partner のルーティング構造に依存している状態である。

**理想**: base は本来 common のみに依存すべき。base が user 固有の構造に依存している箇所は解消する。

**現時点の方針**: §2.1 の `@/router/utils` 依存解消（provide/inject 等）は **リファクタリング工数が高いため見送り**、現行の `@/router/utils` パターンを **継続する**。各 app が `router/utils.ts` を用意して path を提供する運用（いわゆる「お世話」）を受け入れる。enterprise 開発の着手を阻害しない。

---

# 1.1 現状の `@/router/utils` 運用

## 仕組み

`base` の `@/router/utils` は、Vite ビルド時に **各 app の `src` に解決**される（`@` → `user/src` / `partner/src` / `enterprise/src`）。

```
base のコンポーネント
  import { getXxxPath } from '@/router/utils'
           ↓（ビルド時）
user/src/router/utils.ts      … PF 版の path 実装
enterprise/src/router/utils.ts … エンプラ版の path 実装（user コピーから開始）
partner/src/router/utils.ts    … partner 用の実装 or ダミー
```

## user と enterprise で path 仕様が違ってもよいか

**問題ない。** 各 app の `router/utils.ts` が独立しているため、同じ関数名でも返す path 文字列は app ごとに変えられる。

ただし次を満たすこと。

| 条件 | 理由 |
|------|------|
| その app の **vue-router に実ルートがある** | path だけ変えてルート未定義だと 404 |
| base 内の **path 直書き** も合わせる | 例: `CommunityMembershipButton.vue` の `path: '/login'` は `router/utils` 非経由 |
| **完全 URL** | enterprise の `getUrlFromPath` はアクセス中テナントのホスト（`resolveTenantHost`）から組み立てる。user/partner は単一ドメインで `VITE_ORIGIN_HOST` 依存 |

## base に path 関数が増えたとき

**理解は正しい。** base（または base へ移行した manage コンポーネント）が新たに `@/router/utils` から関数を import したら、**利用する各 app の `router/utils.ts` にもその関数の実装を追加する**必要がある。

- **user**: 本番用の path を実装
- **enterprise**: エンプラの path 仕様に合わせて実装（PF と同じでもよい）
- **partner**: 機能を使わなくても **import 解決のためスタブ** が必要な場合がある（現状 `getManageEventPath = () => ''` など）

TypeScript は「関数が存在するか」までは見るが、**空文字など誤った実装はコンパイルで検知できない**。partner のダミー実装のように、ビルドは通るがリンクが壊れる状態になり得る。

## enterprise 作成時

user をコピーすれば `router/utils.ts` も一緒についてくるため、**§2.1 を解消しなくても enterprise はビルド・起動できる**。URL 構造を PF 版と揃える初期段階では、追加対応なしで進められる。

---

# 2. リファクタリング対象の分類

## 2.1 【最優先・将来対応】`@/router/utils` への依存（依存の逆転）

**ステータス**: **現状維持**（§1.1 参照）。provide/inject 等への移行は将来のリファクタ候補とする。

**問題**: base のコンポーネントが `@/router/utils` を import しており、user/partner/enterprise が router/utils を提供する必要がある。

| ファイル | 使用している関数 |
|----------|------------------|
| `base/src/components/CommunityBioPanel.vue` | `getUserPath` |
| `base/src/components/CommunityContactDialog.vue` | `getUserPath`, `getUrlFromPath` |
| `base/src/components/EventMemberCard.vue` | `getUserPath` |
| `base/src/components/EventDetailsCard.vue` | `getCommunityPath`, `getLogin` |
| `base/src/components/UserBioPanel.vue` | `getProfile` |
| `base/src/components/EventMemberList.vue` | `getUserPath` |
| `base/src/components/EventEdit.vue` | `getCommunityPath` |
| `base/src/components/LetterTable.vue` | `getManageEventPath` |
| `base/src/components/pages/cart.vue` | `getCommunityPath`, `getEventPath`, `getUserPath`, `getProfile` |
| `base/src/components/pages/mypage.vue` | `getUserPath` |
| `base/src/components/pages/c/[communityId]/e/[eventId]/members.vue` | `getEventPath` |

**影響**:
- `partner/src/router/utils.ts` に「本来 partner が持つべきでない」ダミー実装が存在（コメント参照）
- enterprise でも同様の router/utils を用意する必要が生じる

**将来の対応案**（工数に余裕ができた段階で検討）:
1. **props で URL 生成関数を注入**: 各コンポーネントに `getUserPath`, `getCommunityPath` 等を props で渡す
2. **provide/inject**: アプリ起動時に path 生成関数を provide し、base 側で inject
3. **common に path 定義を置く**: パス形式のみ common で定義し、base はそれを使用（ドメインは別途注入）

**現状継続時の運用**（§1.1）:
- base で `@/router/utils` から新関数を import したら、**user / enterprise / partner** の `router/utils.ts` を同時に更新する
- user → enterprise マージ時に `router/utils.ts` の差分漏れに注意する
- partner では未使用関数もスタブで埋める（`partner/src/router/utils.ts` 参照）

---

## 2.2 【優先】`base/src/components/pages/` の user 固有ページ

**問題**: user のページ構造が base に含まれており、`@CAUTION.md` で「編集不可・将来的に削除」と明記されている。

| ファイル | 内容 |
|----------|------|
| `base/src/components/pages/mypage.vue` | `/u/{userId}` へのリダイレクト（user 固有） |
| `base/src/components/pages/cart.vue` | カート画面（user 固有） |
| `base/src/components/pages/c/[communityId]/e/[eventId]/members.vue` | イベント参加者一覧 |
| `base/src/components/pages/c/[communityId]/invites.vue` | 招待一覧 |

**対応案**: コンポーネント単位に分離し、user 側の pages で組み立てる。base には「カートの中身表示」「参加者一覧」などの UI コンポーネントのみ残す。

---

## 2.3 【優先】`base/src/plugins/router/index.ts` の `@/router` 依存

**問題**: base の router プラグインが `@/router/*.ts` を glob で読み込み、各アプリの router 構造に依存している。

**対応案**: 各アプリが router を自前で作成し、base のプラグインは router インスタンスを受け取るだけにする。または、`setupRouter` の登録を各アプリの main.ts で行い、base は router の作成のみ担当する。

---

## 2.4 【中】`UserAvatar.vue` の `@/assets` 依存

**問題**: デフォルトアバターを `@/assets/images/avatars/default_profile.jpeg` から import している。

**影響**: user と partner の両方に同じアセットが必要。enterprise にも必要になる。

**対応案**:
1. デフォルトアバターを base 内の assets に配置し、`@shokujii/base/assets/...` のように import
2. または、`defaultAvatarUrl` を props で渡す

---

## 2.5 【中】`CommunityMembershipButton.vue` の `/login` ハードコード

**問題**: ログインへの遷移が `path: '/login'` で固定されている。

**影響**: enterprise はログイン URL が異なる可能性がある。

**対応案**: `getLoginPath` のような関数を inject するか、props で渡す。

---

## 2.6 【中】`base/src/locales/messages/ja.ts` の shokujii.jp ハードコード

**問題**: プラットフォーム版の URL が直書きされている。

| 内容 | URL |
|------|-----|
| コミュニティ一覧 | `https://shokujii.jp/communitylist` |
| TOPページ | `https://shokujii.jp` |
| マイページ | `https://shokujii.jp/mypage` |

**影響**: enterprise では別ドメインになるため、そのままでは不適切。

**対応案**: 環境変数や i18n のパラメータでベース URL を注入する。

---

## 2.7 【低】`@core` / `@layouts` への依存

**問題**: base の一部が `@core/utils/validators`, `@layouts` を参照している。

| ファイル | 参照 |
|----------|------|
| `base/src/components/eventcreate/EventDetailCard.vue` | `@core/utils/validators` |
| `base/src/composable/validators.ts` | `@core/utils/helpers`, `@core/utils/validators` |
| `base/src/components/layouts/DefaultLayoutWith*.vue` | `@layouts` |
| `base/src/plugins/layouts.ts` | `@layouts` |

**補足**: `@core` と `@layouts` は base の materio 内にもあり、user/partner の `@/` エイリアス経由で解決されている。Materio 由来のため、現状は許容しつつ、将来的な分離を検討する。

---

## 2.8 【参考】`base/src/stores/orderList.ts` の storeId

**問題**: `storeId` が `user/${userId}` 形式で user 向けに固定されている。

**補足**: partner では `partner/all` など別の storeId を使用。現状は storeId を引数で渡す設計のため、大きな問題にはなっていない。

---

# 3. リファクタリングの優先順位と依存関係

```
【見送り】@/router/utils の依存解消 → 現状維持（§1.1）
   ↓
1. user の共通機能（/manage 等）を base へ移行 → `05_エンタープライズ_PF版_userをbaseに機能移行.md`
     ※ 移行後も base 内は @/router/utils を参照。各 app の router/utils 更新は継続
   ↓
2. base/src/components/pages/ の user 固有ページを user へ移行
   ↓
3. UserAvatar の @/assets 依存解消
   ↓
4. CommunityMembershipButton の /login ハードコード解消
   ↓
5. locales の shokujii.jp ハードコード解消
   ↓
6. router プラグインの @/router 依存の見直し（必要に応じて）
   ↓
【将来】@/router/utils の provide/inject 化（§2.1 将来対応案）
```

---

# 4. enterprise 作成前の最低限の対応

`@/router/utils` を継続する前提では、provide/inject 化は **必須ではない**。user コピーで `router/utils.ts` ごと enterprise に載せれば着手できる。

enterprise 作成・並行開発で **やっておくとよいこと**:

1. **`router/utils.ts` の同期運用**: base 変更時に user / enterprise / partner の utils をセットで更新するルールを決める（§1.1）
2. **UserAvatar のデフォルト画像**: base 内に配置するか、props で渡す（§2.4）。user コピー時にアセット重複は許容可
3. **locales のベース URL**: 環境変数やパラメータで差し替え可能にする（§2.6）。enterprise 別ドメイン時に必要

path 生成の abstract 化（旧 §4 第 1 項）は、マージ負荷や app 数が増えて `@/router/utils` のお世話が辛くなった段階で §2.1 の将来対応案を実施する。

---

# 5. 参照ドキュメント

- `05_エンタープライズ_PF版_userをbaseに機能移行.md` — user に残る共通機能（特に /manage）を base へ移行する計画
- `base/README.md` — `@/utils/router` の扱い、依存関係の逆転について
- `base/src/components/pages/@CAUTION.md` — pages の暫定仕様と今後の方針
- `partner/src/router/utils.ts` — base 依存のため partner に置かれた router/utils のコメント
