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
| **管理画面（/manage）** | 約 4,750 行が `user` に集中（最大の移行候補） |
| **公開ページ** | `cart` / `mypage` / `members` は base 化済み。`c/.../index.vue` 等はまだ `user` が厚い |
| **依存の逆転** | `base` が `@/router/utils` を参照 → 各 app が path 関数を提供している |

### 移行パターン（既存事例）

`user/src/pages/c/[communityId]/e/[eventId]/members.vue` が `@shokujii/base/components/pages/.../members.vue` を import するだけの薄いラッパーになっている。manage も同様に、**base にトップレベルコンポーネントを置き、user の pages は薄いラッパーにする**。

`base/src/components/pages/@CAUTION.md` にあるとおり、`base/src/components/pages/` に page 相当のファイルを増やすのではなく、`base/src/components/manage/` 等にコンポーネント単位で配置する。

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

**横断リファクタ候補**: `community/member.vue` と `event/member.vue` は CSV 出力・EmailDialog・SNS リンク・管理者権限チェックが重複する。移行時に `ManageMemberActions.vue` 等へ分割を検討する。

#### 4.1.3 タブシェル・一覧ページ

| user のファイル | 行数（目安） | 移行先（案） |
|----------------|-------------|-------------|
| `pages/manage/community/[communityAccount]/[tab].vue` | 98 | `CommunityManageLayout.vue` |
| `pages/manage/event/[eventId]/[tab].vue` | 112 | `EventManageLayout.vue` |
| `pages/manage/community/index.vue` | 110 | `ManagedCommunityList.vue` |
| `pages/manage/event/index.vue` | 227 | `ManagedEventList.vue` |
| `pages/manage/event/[eventId]/invoice.vue` | 47 | PDF ダウンロードラッパー |
| `pages/manage/community/.../newevent.vue` | 28 | `EventEdit` ラッパー |

移行後の user 側イメージ:

```vue
<!-- user/src/pages/manage/event/[eventId]/[tab].vue -->
<script setup lang="ts">
import EventManageLayout from '@shokujii/base/components/manage/event/EventManageLayout.vue'
</script>
<template>
  <EventManageLayout />
</template>
```

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

---

## 6. 横断的な付随作業

| 項目 | 現状 | 対応 |
|------|------|------|
| **アセット** | `@/assets/images/slack/*`, `sns_instagram.png`, `flyer_logo.png`, `manage_top/*` | 共通化するものは `base/src/assets/` へ |
| **i18n** | `manage.*` の大半が `user/src/locales` | 機能文言 → base、マーケ文言 → user |
| **ルーターガード** | `user/router/index.ts` の manage 権限チェック | `useManageAccessGuard()` を base composable 化を検討 |
| **Channel.io** | manage 配下で表示 | user 固有のまま |

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
Phase 3: 公開ページの base 化（enterprise 要件確定後）
    ↓
【将来】path 生成の provide/inject 化（base の依存関係整理 §2.1）
```

**EventMemberOrder 対応と並行する場合**は `manage/event/member.vue` を Phase 1-B の最初に置く。

---

## 8. 工数感

- manage 関連: 約 4,750 行（user 側）
- うち PF 固有（manage TOP・ナビ・マーケ文言等）: 約 600 行 → user に残す
- **移行候補**: 約 4,000 行 → base へ

---

## 9. 参照ドキュメント

- `05_エンタープライズ_PF版_baseの依存関係整理.md` — 前提タスク（path 抽象化、base の依存の逆転）
- `05_エンタープライズ_PF版_userとenterpriseの共通化.md` — コピー + マージ方針、base への共通化の位置づけ
- `06_エンタープライズ_EventMemberOrder対応論点.md` — `manage/event/member.vue` 等への影響
- `base/README.md` — コンポーネント設計方針、依存関係の逆転について
- `base/src/components/pages/@CAUTION.md` — pages ディレクトリの暫定仕様
