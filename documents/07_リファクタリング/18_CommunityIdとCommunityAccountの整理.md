# CommunityId と CommunityAccount の整理

## 概要

コードベース全体を調査した結果、`community_id`（Firestore ドキュメント ID）と `community_account`（URL スラッグ）の**値の取り違えは限定的**だが、**変数名・ルート名・prop 名が逆になっている箇所が多数**あり、将来の修正でバグを誘発しやすい状態にある。

本ドキュメントは調査結果に基づく整理タスク計画とする。

**参照**: [01_仕様概要](../00_仕様概要/01_仕様概要.md) 2.1 コミュニティ、`useCommunityStore`（`base/src/stores/community.ts`）

---

## 用語の正しい使い分け

| 名前 | 意味 | 主な用途 |
| :-- | :-- | :-- |
| `community_id` / `communityId` | Firestore ドキュメント ID（`communities/{id}`） | DB パス、Storage パス、Callable API、権限チェック |
| `community_account` / `communityAccount` | URL スラッグ（変更されうる） | `/c/{account}`、`/manage/community/{account}`、`useCommunityStore(string)` の検索キー |

```
communityAccount (URL スラッグ)
  ├─ /c/{account}
  ├─ /manage/community/{account}
  ├─ useCommunityStore(string) の検索キー
  └─ where('community_account', '==', ...)

communityId (Firestore ドキュメント ID)
  ├─ communities/{id}/events/{eventId}
  ├─ Storage: communities/{id}/...
  ├─ getCommunity(id) / Callable API
  └─ Event.community_id フィールド
```

**正しい使い分けの例**

- Firestore / Storage / Callable（DB 操作）→ `community_id`
- 公開 URL / ルーティング / `useCommunityStore(string)` → `community_account`
- `EmailDialog` のように letter store 用に `communityAccount`、API 用に `communityId` を**両方**渡す

---

## 調査サマリ

| 区分 | 内容 |
| :-- | :-- |
| 実バグ候補 | `functions/default/src/utils/mail.ts` の `community_id \|\| community_account` フォールバック |
| 命名混乱（現状動作） | 公開ルート `[communityId]` が実体は account、`CommunityMembershipButton` の prop 名、`useCommunityMemberFlags` の引数名 等 |
| 既に正しい | 管理画面ルート `[communityAccount]`、Stripe / レター / キャンセル等の Callable、`EmailDialog` の props 分離 |
| コード内で自覚済み | `user/src/pages/c/[communityId]/invites.vue` のコメント（Phase 2 で解消） |

---

## Phase 1: 実バグ候補の修正

**目的**: `community_account` を Firestore ドキュメント ID として誤用する可能性を排除する。

**PR**: 1 PR（`[functions]`）

### タスク

- [x] `functions/default/src/utils/mail.ts` の `getCommunityEmailsForEvent` を修正
  - [x] `event.community_id || event.community_account` フォールバックを削除し、`event.community_id` のみを使用
  - [x] kokufu レビュー（PR #1437 付近）の指摘どおり、`community_id` が空の場合は早期 return またはログ警告とする
- [x] 該当 Function のメール送信テスト（手動または既存テスト）で送信先が取得できることを確認

### 検証

- [x] `npm -w functions/default run build` が通ること
- [ ] イベント関連メール（主催者・コミュマネ向け）で送信先が空にならないこと（手動確認）

---

## Phase 2: 公開ルート `[communityId]` → `[communityAccount]` へのリネーム

**目的**: 最大の混乱源であるルートパラメータ名を実体に合わせる。

**PR**: 1 PR（`[user][base]`）。リダイレクト互換が必要なら router で旧パスを維持するか検討。

### タスク

- [x] `user` ルートファイルのリネーム
  - [x] `user/src/pages/c/[communityId]/` → `user/src/pages/c/[communityAccount]/`
  - [x] 各ページ内の `params.communityId` を `params.communityAccount` に変更
  - [x] `user/typed-router.d.ts` の型定義を更新
- [x] `base` 共有コンポーネントのパス・props 整理
  - [x] `base/src/components/pages/c/[communityId]/` → `[communityAccount]/` にリネーム
  - [x] `members.vue` の prop `communityId` → `communityAccount`
  - [x] `invites.vue` は既に prop `communityAccount` を使用（ディレクトリ名のみ修正）
- [x] `user/src/pages/c/[communityId]/invites.vue` の「communityId は間違い」コメントを削除（修正後は不要）
- [x] 旧 URL `/c/:communityId` へのアクセスがある場合、互換リダイレクトの要否を検討（通常はパスセグメントの値のみでルート名はクライアント内部のため影響小）

### 検証

- [ ] `/c/{account}` コミュニティページ・イベントページ・メンバー一覧・招待 URL が動作すること（手動確認）
- [x] `npm -w user run build -- -m development` が通ること

---

## Phase 3: コンポーネント・composable の prop / 引数名整理

**目的**: 同じ名前 `communityId` がコンポーネントごとに異なる意味を持つ状態を解消する。

**PR**: 1 PR（`[base][user]`）。Phase 2 とまとめてもよい。

### タスク

- [x] `CommunityMembershipButton.vue`
  - [x] prop `communityId` → `communityAccount` にリネーム
  - [x] 呼び出し元を更新
    - [x] `base/src/components/CommunityBioPanel.vue`（`:community-account="community.community_account"`）
    - [x] `base/src/components/EventDetailsCard.vue`（同上）
- [x] `useCommunityMemberFlags.ts`
  - [x] 引数 `communityId` → `communityAccount` にリネーム
  - [x] JSDoc を「コミュニティアカウント（URL スラッグ）」に修正
  - [x] 呼び出し元を更新
    - [x] `user/src/pages/c/[communityAccount]/index.vue`
    - [x] `user/src/pages/c/[communityAccount]/e/[eventId]/index.vue`
- [x] `CommunityContactDialog.vue` の prop `communityId` は **Firestore ID のまま維持**（Callable `communityContact` 用）。MembershipButton との混同を JSDoc で明記
- [x] `EventDetailsCard.vue` で MembershipButton と ContactDialog が異なる識別子を渡していることをコメントまたは prop 名で区別できるようにする

### 検証

- [ ] コミュニティ参加・退会ボタンが動作すること（手動確認）
- [ ] お問い合わせダイアログから `communityContact` が正しい `community_id` で送信されること（手動確認）

---

## Phase 4: ユーティリティ・その他の命名整理

**目的**: 残りの misleading な引数名・変数名を修正する。

**PR**: 1 PR（`[admin][base]` 等）。Phase 3 とまとめてもよい。

### タスク

- [x] `admin/src/navigation/utils.ts`
  - [x] `getUserEventUrl(communityId, ...)` の引数名を `communityAccount` に変更
  - [x] 呼び出し元 `admin/src/pages/events/create.vue` を確認（値は `event.community_account` で正しい）
- [x] `base/src/composable/useCommunityMemberFlags.ts` 以外で `useCommunityStore(string)` に渡す変数が `communityId` と名付けられている箇所を `communityAccount` にリネーム（Phase 2・3 完了後の残差確認）
- [x] `useCommunityStore` の Pinia store ID（`/communities/${communityAccount}`）について、コメントを「識別子は account。Firestore path は `_communityRef.id`」と明確化（任意）

### 検証

- [ ] admin イベント作成画面からユーザー向けイベント URL リンクが正しい `/c/{account}/e/{eventId}` になること（手動確認）

---

## Phase 5: ドキュメント・レビュー観点の更新（任意）

**目的**: 再発防止のため仕様・レビュー観点に追記する。

### タスク

- [x] `.agents/skills/shokujii-code-review/shokujii-code-review.md` にチェック項目を追加（任意）
  - [x] `useCommunityStore(string)` には `community_account` を渡すこと
  - [x] Callable / Firestore パスには `community_id` を渡すこと
  - [x] URL 生成（`getCommunityPath` 等）には `community_account` を渡すこと
  - [x] prop 名 `communityId` と `communityAccount` を混在させないこと
- [x] 本ドキュメントの Phase 1〜4 完了後にチェックボックスを更新

---

## 対象外・修正不要と判断した箇所

以下は調査時点で**値の使い分けが正しい**ため、本計画の必須タスクには含めない。

| 箇所 | 理由 |
| :-- | :-- |
| `user/src/pages/manage/community/[communityAccount]/` | ルート名・変数名とも正しい |
| `getInvitationUrlForCommunityManager({ communityId })` | Firestore ID を渡しており正しい |
| `acceptInvitationForCommunityManager({ communityAccount })` | URL スラッグで lookup しており正しい |
| `EmailDialog`（`communityAccount` + `communityId`） | 用途ごとに分離済み |
| Stripe / cancelOrders / copyCommunityCoverToEvent 等 | API は `community_id`（doc ID）を使用 |
| `functions/shokujii-slackbot` の `account-id` 形式 | 意図的に両方を検証している |
| `manager/`（Legacy） | Deprecated。新規修正対象外 |

---

## 依存関係

```
Phase 1: mail.ts フォールバック削除（独立して先行可能）
    ↓
Phase 2: 公開ルート [communityId] リネーム
    ↓
Phase 3: コンポーネント・composable の prop / 引数名
    ↓
Phase 4: ユーティリティ等の残差
    ↓
Phase 5: レビュー観点更新（任意）
```

Phase 1 は他 Phase と独立して先行可能。Phase 2〜4 は PR を分割しても、Phase 2 → 3 の順序を推奨する。
