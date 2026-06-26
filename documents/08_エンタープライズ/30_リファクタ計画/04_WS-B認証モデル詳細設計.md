# WS-B 認証モデル詳細設計（Identity Platform マルチテナンシー）

[01_MVP全体計画.md](../00_計画/01_MVP全体計画.md) WS-B（B-1〜B-6）の**実装者向け正本**。
仕様正本は [10_仕様/05_認証・テナント.md](../10_仕様/05_認証・テナント.md)、意思決定は [ADR-002_IdP採用とゲスト方針.md](../20_設計判断_ADR/ADR-002_IdP採用とゲスト方針.md) を参照。

> **実装開始条件**: #2071 / WS-M を `development` に着地後、`development` から短命ブランチを切って実装する。`dev/enterprise` には WS-B を積み増さない。

---

## 目的

従業員の認証を Identity Platform の tenant に移し、PF / ゲストはデフォルトプールに残す。
これにより次を満たす。

- PF 版と Enterprise 版で同一メールアドレスを共存可能にする
- 将来の企業別 SSO（テナント単位 SAML / OIDC）への道を開く
- 従業員データは tenant 境界でクローズドに保つ
- ゲスト参加はデフォルトプール固定のまま、将来 `allow_guest` 例外で開けられるようにする

---

## スコープ

### 含む

| ID | 内容 |
|:--|:--|
| B-1 | IdP / マルチテナンシー有効化、tenantId 疎通、Rules tenant 検証 |
| B-2 | `enterprise_id ↔ tenantId` 設計・移行方針 |
| B-3 | テナント onboarding（企業作成 = tenant + 初期管理者 + claims） |
| B-4 | auth / claims / メール検索のテナント化 |
| B-5 | クライアント tenantId 設定・ログイン UI・guard |
| B-6 | 同一メール衝突方針の正式化 |

### 含まない

- ゲスト参加本実装（WS-G / Phase 2）
- 企業別 SSO 設定 UI（Phase 2）
- PF 掲載クエリ B（`allow_guest && publish_scope === 'public'`）
- functions の `_base` / `_user` / `_enterprise` ディレクトリ再編（Phase 2）
- PF 版ログイン / 新規登録入口分離（A-4 / #2090）

---

## 着手前ゲート（G3）

WS-B 実装前に次を確定する。

| 論点 | 方針 |
|:--|:--|
| ロールバック境界 | sandbox は tenant / tenant user を作り直し可。本番は tenant 化後の Auth user 移行が重いため、tenant onboarding を本番投入前に完了させる |
| 方式併存 | 実装ブランチ内では既存 claims 方式と tenant 方式を段階併存。リリース境界では Enterprise 従業員ログインは tenant 方式へ寄せる |
| MAU 課金 | **確定（2026-06-27）**: MVP は月 50k MAU 無料枠内。超過見込み時は Shokujii 全体の利用・課金規模に見合い IdP 従量課金を許容（[07_デプロイ・運用](../10_仕様/07_デプロイ・運用.md) §9.1）。sandbox: B-1 PoC で有効化 / production: 本番 Enterprise 投入前 |
| PF / partner 影響 | PF / partner はデフォルトプール前提のまま。Enterprise lookup は `EnterpriseMember.user_email` に分離（05 §0.2） |
| Rules CI | ✅ `Test Firestore Rules / test` を branch protection の required check に登録済み（A-5） |

---

## 採用方針

### tenant と enterprise の対応

`enterprise_id : tenantId = 1 : 1` とする。

`enterprises/{enterpriseId}` に `tenant_id` を保存する。

```ts
enterprises/{enterpriseId}
  enterprise_id: string
  tenant_id: string
```

tenantId は Identity Platform 側の tenant ID を正とする。API で任意 ID を指定できる場合は `enterprise_id` と同値に寄せる。指定できない、または制約が強い場合は Firebase 発行 ID を保存する。

### 身元の置き場

| ユーザー種別 | Auth の所属 | 備考 |
|:--|:--|:--|
| PF ユーザー | デフォルトプール | 既存通り |
| Enterprise 従業員 | 企業 tenant | `enterprise_id` / `enterprise_role` / `user_type` claims を tenant 内 user に付与 |
| ゲスト | デフォルトプール | テナントに入れない。Phase 2 で `allow_guest` Rules 例外を設計 |

### 同一メール

IdP tenant 化後は、PF 版と Enterprise 版で同一メールアドレスを共存可とする。
Enterprise 内の重複判定は tenant / enterprise スコープに限定し、global な `getUserIdFromEmail(email)` を Enterprise 認証で使わない。

---

## 実装順

### 1. B-2: tenant 対応設計を確定

- `Enterprise` schema に `tenant_id` を追加
- 既存 enterprise への tenant 作成 / backfill 方針を決める
- `users_personal_information` と `EnterpriseMember` のメール保存方針を決める
- 同一メール共存の仕様を [05_認証・テナント.md](../10_仕様/05_認証・テナント.md) に反映する

### 2. B-1: sandbox PoC

- Identity Platform を有効化
- マルチテナンシーを有効化
- tenant を 1 個作成
- `authForTenant(tenantId).createUser()` を確認
- client `auth.tenantId = tenantId` → `signInWithCustomToken` を確認
- Firestore Rules で `request.auth.token.firebase.tenant` が参照できることを emulator で確認

### 3. B-3: onboarding tenant 化

対象: `functions/default/src/enterprise/onboarding.ts`

- `createEnterprise` で tenant を作成
- 作成した tenantId を `enterprises/{enterpriseId}.tenant_id` に保存
- 初期 admin を `authForTenant(tenantId).createUser()` で作成
- `authForTenant(tenantId).setCustomUserClaims()` で claims を設定
- `/enterprises/{enterpriseId}/members/{uid}`、`/users/{uid}`、`/users_personal_information/{uid}` を作成
- Auth 作成後の Firestore 失敗時、可能なら tenant user を削除してロールバックする

### 4. B-4: auth / claims / lookup tenant 化

対象:

- `functions/default/src/enterprise/auth.ts`
- `functions/default/src/enterprise/members.ts`
- `functions/default/src/enterprise/community.ts`
- `functions/default/src/stores/user.ts`

実装方針:

- `authForTenant(tenantId)` ヘルパを追加する
- `syncEnterpriseCustomClaims` を tenant-aware にする
- `requestEnterpriseEmailLogin` / `confirmEnterpriseEmailLogin` の email lookup を Enterprise スコープへ分離する
- `createEnterpriseMembers` は tenant 内 Auth user を作成する
- `createEnterpriseCommunities` の manager email lookup も Enterprise スコープにする

### 5. B-5: client tenant 化

対象:

- `enterprise/src` のログイン導線
- `base/src/firebase.ts` または enterprise 側 Firebase 初期化層
- `enterprise/src/composable/useEnterpriseTenantGuard.ts`

実装方針:

- `getEnterpriseByDomain` のレスポンスに `tenant_id` を含める
- Enterprise アプリ起動時に hostname から `enterprise_id` / `tenant_id` を解決する
- `signInWithCustomToken` 前に `auth.tenantId = tenantId` を設定する
- ログイン済み token の `firebase.tenant` / `enterprise_id` と resolved enterprise を照合する

### 6. B-6: 同一メール方針の仕様反映

- PF と Enterprise は同一メールで共存可
- Enterprise 間でも tenant が異なれば同一メールは共存可
- 同一 enterprise 内では同一メール重複不可
- ゲストはデフォルトプール固定で、tenant user にはしない

---

## email lookup 設計

現行の `getUserIdFromEmail(email)` は `/users_personal_information` を global 検索する。
IdP 後は同一メールが複数 uid に紐づくため、Enterprise 認証では使わない。

### 候補 A: `users_personal_information` に scope を持たせる

```ts
users_personal_information/{uid}
  user_email: string
  enterprise_id?: string | null
  tenant_id?: string | null
```

| 評価 | 内容 |
|:--|:--|
| メリット | 既存の email 逆引き場所を維持できる |
| デメリット | PF / Enterprise 混在 collection に index と移行が必要。PII collection に tenant 情報が増える |

### 候補 B: `EnterpriseMember` に email を持たせる

```ts
enterprises/{enterpriseId}/members/{uid}
  user_email: string
```

| 評価 | 内容 |
|:--|:--|
| メリット | Enterprise 内 lookup が自然。CSV / メンバー一覧 / manager email lookup が単純 |
| デメリット | 現行仕様「members に email を持たせない」を変更する。email 更新時の同期責務が増える |

### 推奨

**`EnterpriseMember.user_email` を採用**（2026-06-27 仕様確定。[05_認証・テナント](../10_仕様/05_認証・テナント.md) §0.2）。

理由:

- Enterprise 認証・CSV・manager 招待はすべて enterprise スコープで完結する
- 同一メール共存時に global query を避けられる
- `/users_personal_information` の Rules を本人 read のまま維持しやすい
- `getEnterpriseMembers` の email join が不要または軽くなる

---

## Auth ヘルパ設計

新規 helper:

```ts
// functions/default/src/utils/tenantAuth.ts
export async function getTenantIdForEnterprise(enterpriseId: string): Promise<string>

export function authForEnterpriseTenant(tenantId: string): TenantAwareAuth

export async function authForEnterprise(enterpriseId: string): Promise<TenantAwareAuth>
```

利用箇所:

| 用途 | 変更前 | 変更後 |
|:--|:--|:--|
| 初期 admin 作成 | `getAuth().createUser` | `authForTenant(tenantId).createUser` |
| CSV メンバー作成 | `getAuth().createUser` | `authForTenant(tenantId).createUser` |
| claims 設定 | `getAuth().setCustomUserClaims` | `authForTenant(tenantId).setCustomUserClaims` |
| login token | `getAuth().createCustomToken` | `authForTenant(tenantId).createCustomToken` |
| disable / enable | `getAuth().updateUser` | `authForTenant(tenantId).updateUser` |
| revoke | `getAuth().revokeRefreshTokens` | `authForTenant(tenantId).revokeRefreshTokens` |

---

## Rules 設計

WS-B では、既存の `enterprise_id` claim に加えて tenant claim を検証する。

```js
function tokenTenantId() {
  return request.auth.token.firebase.tenant;
}

function isSameEnterprise(data) {
  return request.auth != null
    && request.auth.token.enterprise_id == data.enterprise_id
    && tokenTenantId() == getEnterpriseTenantId(data.enterprise_id);
}
```

実際の Rules で `enterprises/{enterpriseId}` を参照できる箇所・回数に制約があるため、PoC で次を検証する。

- `request.auth.token.firebase.tenant` が emulator / 本番で同じ形か
- Rules 内で enterprise doc の `tenant_id` を参照するコストが許容できるか
- 参照コストを避けるため、claims に `tenant_id` を重複保持する必要があるか

### claims 方針

最低限（tenant 内 user）:

```ts
{
  enterprise_id: string
  enterprise_role: 'admin' | 'member'
  user_type: 'enterprise'
}
```

**`tenant_id` custom claim（条件付き）**: 原則 **`request.auth.token.firebase.tenant` を正**とする（[05_認証・テナント](../10_仕様/05_認証・テナント.md) §0.5）。Rules PoC（B-1）で `get(/enterprises/{id})` の参照コストが高い場合のみ、claims に `tenant_id` を追加し `firebase.tenant` と常に同値を維持する。

---

## 移行方針

### sandbox

- 既存 Enterprise Auth user は作り直し可
- tenant 作成 → enterprise doc に `tenant_id` 保存 → 初期 admin / CSV メンバー再作成
- backfill スクリプトよりも管理画面 / Callable の再実行でよい

### production

本番に Enterprise 従業員データを積む前に WS-B を投入する前提。
もし本番投入済みユーザーが存在する場合は、次のどちらかを選ぶ。

| 案 | 内容 |
|:--|:--|
| 再作成 | tenant 内 user を新規作成し、旧 project-level user を停止。uid が変わるため関連 doc の移行が必要 |
| import | Firebase Auth export / import で tenant へ移行。手順が重いが uid 維持可能性を検証する |

原則は **本番ユーザー蓄積前に WS-B を完了**し、重い移行を避ける。

---

## テスト計画

### Functions

- tenant A / tenant B に同一メール user を作成できる
- tenant A の OTP で tenant B へログインできない
- inactive member は tenant login できない
- `createEnterprise` が tenant + 初期 admin + claims + Firestore docs を作る
- `createEnterpriseMembers` が tenant 内 user を作る
- role 変更 / disable / enable が tenant 内 Auth に作用する

### Rules

- tenant A user が tenant A doc を read / write できる
- tenant A user が tenant B doc を read / write できない
- デフォルトプール PF user は Enterprise 従業員 doc を read できない
- `request.auth.token.firebase.tenant` なしの場合に従業員権限を得られない

### Frontend

- Enterprise 起動時に `tenant_id` を解決できる
- `auth.tenantId` 設定後に custom token login できる
- tenant mismatch 時に 404 相当 UI になる
- PF ログインは tenant 設定の影響を受けない

---

## 受け入れ条件

| ID | 条件 |
|:--|:--|
| B-1 | sandbox で tenant 作成・tenant login・Rules tenant 判定が通る |
| B-2 | `enterprise_id ↔ tenantId` の保存場所・移行方針・同一メール方針が仕様に反映される |
| B-3 | `createEnterprise` が tenant + 初期 admin を作成する |
| B-4 | Enterprise の Auth / claims / email lookup が tenant-aware になる |
| B-5 | Enterprise frontend が tenantId を設定してログインし、tenant mismatch を遮断する |
| B-6 | PF / Enterprise / Enterprise 間の同一メール共存方針がテストで確認される |

---

## 未決事項

| # | 論点 | 状態 |
|:--|:--|:--|
| Q-1 | tenantId を `enterprise_id` と同一にできるか | **PoC 待ち**（B-1）。不可なら Firebase 発行 ID を `tenant_id` に保存 |
| Q-2 | email lookup の保存先 | **確定**: `EnterpriseMember.user_email`（[05_認証・テナント](../10_仕様/05_認証・テナント.md) §0.2） |
| Q-3 | claims に `tenant_id` を持たせるか | **条件付き**: 原則 `firebase.tenant` を正。Rules PoC（B-1）で必要時のみ claim 追加（05 §0.5） |
| Q-4 | 本番に project-level enterprise user が存在する場合の移行 | 原則 WS-B 本番投入前にユーザー蓄積を避ける。存在時は import / 再作成を別途判断 |
| Q-5 | ゲスト用 secondary Firebase app の設計 | Phase 2。WS-B ではデフォルトプール固定方針のみ維持 |

> **仕様正本**: 製品仕様は [10_仕様/05_認証・テナント.md](../10_仕様/05_認証・テナント.md) §0。本書は実装手順・PoC・テストの詳細正本。

---

## 変更履歴

| 日付 | 内容 |
|:--|:--|
| 2026-06-20 | 初版（WS-B 認証モデル詳細設計。G3・B-1〜B-6 の実装順、tenant / email lookup / Rules / 移行方針を整理） |
| 2026-06-27 | Q-2 確定（EnterpriseMember.user_email）、Q-3 条件付き（firebase.tenant 正）。05_認証・テナント §0 へ仕様昇格 |
| 2026-06-27 | G3 通過（MAU 試算・IdP 前倒し決定。07 §9.1 参照） |
