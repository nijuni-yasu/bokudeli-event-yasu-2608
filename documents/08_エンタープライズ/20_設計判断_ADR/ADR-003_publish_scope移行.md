# ADR-003: publish_scope 導入と is_public 段階廃止

> **結論サマリ**: イベント公開区分の正本を PF/エンプラ共通の **`publish_scope`（`public` | `community` | `url`）** に一本化する。既存の `is_public`（boolean）は **parallel change（expand → migrate → contract）** で段階廃止する。一覧クエリは移行完了まで **`publish_scope` を必ず参照**する（`is_public` 派生だけでは `community` が漏れる）。
>
> **MVP（2026-06-27 確定）**: 本 ADR の**仕様は確定**（G2 ✅）だが、**コード反映（expand / migrate / contract）は Phase 2**（[01_MVP全体計画](../00_計画/01_MVP全体計画.md) WS-G G-6）。MVP 出荷時は **`is_public`（公開 / URL 限定）** を継続。PF 横断 Migrate は G-6 で PF 版と合わせて実施する。
>
> **`access_password`（パスワード保護）は Phase 2** に委譲する（§4）。G-8 で実装。

> **関連ドキュメント**
>
> - [ADR-002_IdP採用とゲスト方針.md](./ADR-002_IdP採用とゲスト方針.md)（`allow_guest`・PF 版露出フィルタ）
> - [00_計画/01_MVP全体計画.md](../00_計画/01_MVP全体計画.md)（WS-G G-5/G-6、ゲート G2）
> - [90_アーカイブ/v0.3_機能拡張/02_設計.md](../90_アーカイブ/v0.3_機能拡張/02_設計.md) §1（3 軸モデル全体・抽出元）
> - 仕様正本: [10_仕様/04_詳細_イベント管理.md](../10_仕様/04_詳細_イベント管理.md)

---

## 1. 背景

v0.1 ではイベント公開を `is_public`（boolean）と URL 限定で表現していた。v0.3 設計で以下が判明した。

1. **4 状態を boolean 1 つで表現できない** — 「コミュニティ限定だが一覧には出す（閲覧のみ）」「URL 限定 + パスワード」等が必要。
2. **`community` 値の追加** — 非メンバーは一覧・詳細閲覧可、注文のみ不可（賑やかし効果）。
3. **PF/エンプラ共通 enum** — テナント絞り込みは `enterprise_id` が担うため、enum 名は中立（`public` / `community` / `url`）で共通化できる。
4. **既存コードへの影響** — `is_public` はスキーマ・Functions・API・PF 版 `user/` 等 **30 ファイル超**が参照。Migrate は **PF/エンプラ横断**。MVP では触らず Phase 2（G-6）で一括移行する（[01_MVP全体計画](../00_計画/01_MVP全体計画.md) 2026-06-27）。

---

## 2. 決定（スキーマ・振る舞い）

### 2-1. 共通スキーマ

```ts
// 一覧での可視性（列挙）
publish_scope: 'public' | 'community' | 'url'

// アクセス制御の修飾（直交・任意）
allow_guest?: boolean     // 外部ゲスト可否（エンプラ）。既存どおり
access_password?: string  // Phase 2。ハッシュ保存 + Callable で付与（§5）
```

### 2-2. 一覧 / 注文マトリクス

| `publish_scope` | 一覧表示 | 注文（カート追加） | 旧 `is_public` | PF 版での意味 |
|:--|:--|:--|:--|:--|
| `public` | 表示（PF: 全体 / エンプラ: 同社全員） | 全員可 | `true` | 一般公開 |
| `community` | **表示**（非メンバーは閲覧のみ） | `CommunityMember` のみ可 | （新規） | コミュニティ限定 |
| `url` | 非表示 | URL を知る人のみ | `false` | URL 限定公開 |

- **パスワードは enum 値ではなく属性**（`access_password`）。基本は `url` に重ねるが `public` / `community` にも重ね可能（Phase 2）。
- **`allow_guest`** は上記に直交（例: `public` + `allow_guest`）。
- 「部署主催の全社オープン食事会」= 部署コミュニティ配下で `publish_scope: 'public'`。
- 「存在自体を隠す」= `url`。

### 2-3. エンプラ一覧クエリ（確定）

エンプラ版イベント一覧: `publish_scope IN ('public', 'community')`（`enterprise_id` フィルタと併用）。PF 版露出フィルタ（`enterprise_id == null`）は [ADR-002](./ADR-002_IdP採用とゲスト方針.md) / v0.3 §3-1 を参照。

---

## 3. 移行戦略（expand → migrate → contract）

**実施フェーズ: Phase 2（WS-G G-6）**。MVP 中は本節を**設計正本**として保持し、コードは `is_public` のまま運用する。

`is_public` は `common/src/schemas/Event.ts`・`Community.ts` の boolean。PF/エンプラを壊さない **並行変更** で移行する。

### 3-1. Expand

- `publish_scope`（+ 将来 `access_password` フィールド定義のみ）をスキーマに追加。
- **書き込み時**に `is_public = (publish_scope === 'public')` を**自動同期**し、既存 `is_public` 参照コードをそのまま動かす。
- 新規データは `publish_scope` を正として保存。

### 3-2. Migrate

- `is_public` 消費者を `publish_scope` 参照へ順次置換。
- **一覧クエリは必ず `publish_scope`**（`is_public` 派生だけだと `community` が一覧から漏れる）。
- Contract 前に各消費者の利用を「クエリ条件」か「表示判定」に分類（クエリ置換は複合インデックス追加が必要な場合あり）。

**移行対象（`is_public` 消費者 — G-6 で PF 横断を含め置換）**:

| 種別 | パス |
|:--|:--|
| スキーマ | `common/src/schemas/Event.ts`、`common/src/schemas/Community.ts` |
| Functions | `popularEventMail.ts`、`orderCompletionMail.ts`、`eventConclusionMail.ts`、`orderDeadlineMail.ts`、`eventCopy.ts`、`enterprise/community.ts`、`stores/event.ts`、`userProfile.ts`、`utils/userFriendsResolver.ts` |
| API | `common/src/apis/userFriends.ts`、`userProfile.ts` |
| PF 版 UI | `user/src/pages/index.vue`、`user/src/pages/communitylist/`、`user/src/components/profile/UserProfilePage.vue` 等 |
| base UI | `EventDetailCard.vue`、`CommunityEdit.vue`、`EventCard.vue` 等 |

### 3-3. Contract

- 全消費者の移行と既存データのバックフィル完了後、`is_public` を削除。
- バックフィル: `true → public` / `false → url`（`community` は新規作成時のみ）。

---

## 4. Phase 2 に委譲: `access_password`

パスワード保護は enum 追加だけでは済まない。**アクセス付与基盤**（Callable + access_grants 等）がセットで必要。

- Firestore Security Rules 単体ではパスワード検証不可（ハッシュ比較を Rules で安全に行えない）。
- 想定: Callable `verifyEventPassword(eventId, password)` → 成功時に `access_grants/{uid}` 等を作成 → Rules はその存在で read 許可。
- `access_password` はハッシュ保存。Rules でフィールド read 禁止も検討。

**MVP では実装しない。** Phase 2（G-8）で実装。3 軸モデル本体（`publish_scope` + `join_type` + `auto_join`）も MVP 外（G-5 / G-6）。秘匿イベント（URL + 合言葉）は Phase 2 まで `is_public: false`（URL 限定）で代替可能な範囲で運用する。

---

## 5. MVP と Phase 2 の境界（2026-06-27 確定）

| 区分 | MVP | Phase 2 |
|:--|:--|:--|
| イベント公開 | `is_public`（`true` = 公開、`false` = URL 限定） | `publish_scope`（`public` / `community` / `url`）＋ Migrate |
| コミュニティ参加 | PF 共有 UI の**即参加**（[10_コミュニティに参加・退会](../../03_参加者獲得/10_コミュニティに参加・退会.md)） | `join_type`（`approval` / `open`）。**PF 版と合わせて検討**（G-5） |
| 注文時コミュニティ加入 | なし（`EventMember` のみ） | `auto_join_on_event_order`（G-5） |
| コミュニティ種別ラベル | なし | `community_type`（G-5） |
| パスワード保護 | なし | `access_password`（G-8） |

MVP で提供しない体験の代表例: **部署限定ランチを一覧に出すが非メンバーは閲覧のみ**（`publish_scope: community`）、**参加申請制コミュニティ**（`join_type: approval`）。

---

## 6. ゲート・依存

| ゲート | 条件 |
|:--|:--|
| G2（v0.3 スキーマ確定） | 本 ADR の enum 定義 + expand 方針が合意済み — **✅ 仕様確定済** |
| G-7 着手（Phase 2） | G1（PoC）通過後（[30_リファクタ計画/01_Project分離なし_タスク.md](../30_リファクタ計画/01_Project分離なし_タスク.md)） |
| G-6 着手（Phase 2） | G-5 推奨完了後。PF 版一覧・インデックスと同時設計 |
| ダッシュボード一覧 | MVP: `is_public` ベース。Phase 2 後: `publish_scope` クエリへ（G-6 後に D-2 拡張可） |

---

## 変更履歴

| 日付 | 内容 |
|:--|:--|
| 2026-06-18 | 初版（v0.3/02 §1-3 から抽出。access_password は Phase 2） |
| 2026-06-27 | MVP/Phase 2 境界を §5 に追加。コード反映（expand/migrate/contract）を Phase 2（WS-G G-6）へ延期。Migrate 対象に PF 版 UI を明記 |
