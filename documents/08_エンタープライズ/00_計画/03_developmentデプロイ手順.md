# エンプラ MVP development 投入プレイブック

`dev/enterprise` → `development` マージ後、**テスト環境（`bokudeli-event-test`）へエンプラを初回投入・更新する**ときの TODO 順。
手順の詳細は下記正本へ委譲する（本書は索引のみ）。

| 正本 | 内容 |
|:--|:--|
| [02_developmentマージ.md](./02_developmentマージ.md) | コードマージ前提（WS-M・PF 版影響ゼロ） |
| [07_デプロイ・運用.md](../10_仕様/07_デプロイ・運用.md) | インフラチェックリスト・ENV・CI・初回/通常デプロイ・確認・TS |
| [08_カスタムドメイン.md](../10_仕様/08_カスタムドメイン.md) | 環境対応表・DNS（hosting-site TXT）・Console 個別 FQDN（§6.1b） |
| [01_MVP全体計画.md](./01_MVP全体計画.md) | WS-M 進捗（M-1〜M-12） |

> **sandbox**（sandbox2510 等）の tabete.co 設定: [08 §6.1b](../10_仕様/08_カスタムドメイン.md)（Console wildcard 非対応時はテナント FQDN 個別）

> **スコープ**: development 環境のみ。本番（`production` / `bokudeli-event-dev` / shokujii.jp）は [07 §2](../10_仕様/07_デプロイ・運用.md) を `production` Environment で読み替える（別途 03 に本番節を追記予定）。

---

## 1. いつ使うか

- [02](./02_developmentマージ.md) の WS-M 着地に向け、`development` へマージした**直後**（または初回テスト環境構築時）
- エンプラの Hosting / Functions / ドメインを **`bokudeli-event-test`** に初めて載せるとき
- 2 回目以降のコード更新は [07 §6.4](../10_仕様/07_デプロイ・運用.md) の push 自動デプロイが主。本書 §2 の初回チェックは不要

---

## 2. 実行チェックリスト（development）

### 2.1 コード（マージ前）

[02 §5](./02_developmentマージ.md) / [01 WS-M](./01_MVP全体計画.md) を満たしてから `development` へマージする。

- [ ] #2071 本番ブロッカー RC 解消（RC-36 / 82 / 92 / 96 等）
- [ ] M-1〜M-5（T1〜T5）実装済み（テスト環境では backfill 前でもエンプラ単体検証は可能）
- [ ] `deploy_enterprise.yml` が `development` に存在（#2071 マージ後）

### 2.2 インフラ（マージ前・初回のみ）

詳細: [07 §2](../10_仕様/07_デプロイ・運用.md) + [08 §5](../10_仕様/08_カスタムドメイン.md)

- [ ] [07 §2.1〜2.2](../10_仕様/07_デプロイ・運用.md) — Hosting サイト・target・FIREBASERC・ENTERPRISE_ENV・`PROJECT_ID=bokudeli-event-test`・`FUNCTIONS_ENV`（`ENTERPRISE_BASE_DOMAIN=test.tabete.co`）
- [ ] [08 §5](../10_仕様/08_カスタムドメイン.md) — `*.test.tabete.co`・DNS・Auth
- [ ] Firestore インデックス / Rules / Functions（enterprise）— 初回デプロイ前または [07 §6.5](../10_仕様/07_デプロイ・運用.md) で実施

### 2.3 デプロイ（マージ後）

- [ ] [07 §6.5](../10_仕様/07_デプロイ・運用.md) — workflow 連続（firestore → storage → functions enterprise → enterprise）
- [ ] または [07 §6.6](../10_仕様/07_デプロイ・運用.md) — ローカル一式

### 2.4 テスト企業・確認

- [ ] [07 §11](../10_仕様/07_デプロイ・運用.md) — `createEnterprise`（`subdomain: company-a` → `company-a.test.tabete.co`）
- [ ] [07 §7](../10_仕様/07_デプロイ・運用.md) — デプロイ後確認（OTP ログイン・**PF 版 test.tabete.co 回帰**含む）
- [ ] 検証シナリオ: [Phase2 検証](../テスト/08_エンタープライズ_Phase2_検証シナリオ.md)

---

## 3. 環境対応（要約）

命名の正本: [08 §3](../10_仕様/08_カスタムドメイン.md)。

| 項目 | development（テスト） |
|:--|:--|
| Git ブランチ | `development` |
| GitHub Environment | `development` |
| Firebase プロジェクト | `bokudeli-event-test` |
| PF URL | https://test.tabete.co/ |
| エンプラ BASE | `test.tabete.co` |
| エンプラ URL 例 | `https://company-a.test.tabete.co` |
| enterprise Hosting サイト | `bokudeli-event-test-enterprise` |

Git ブランチ名 `development` ≠ Firebase `bokudeli-event-dev`（本番 ID）。

---

## 4. 通常更新（2 回目以降）

1. feature → PR → **`development` へマージ**（[デプロイ手順](../../デプロイ手順/デプロイ手順.md)）
2. `PR verify` green
3. push で [07 §6.4](../10_仕様/07_デプロイ・運用.md) の workflow が起動 — 変更パスに応じて Deploy enterprise / functions 等

---

## 変更履歴

| 日付 | 内容 |
|:--|:--|
| 2026-06-24 | 初版（development 環境デプロイ手順。環境対応表・初回/通常・確認・TS） |
| 2026-06-24 | ドメイン詳細を 08_カスタムドメイン.md へ分離 |
| 2026-06-24 | B 案: 詳細を 07 へ移し本書を WS-M 投入プレイブック（索引）に縮小 |
| 2026-06-24 | sandbox2510 向け 08 §6.1b へのリンクを正本一覧に追記 |
