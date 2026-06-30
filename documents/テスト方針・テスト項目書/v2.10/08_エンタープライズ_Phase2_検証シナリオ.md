# エンタープライズ Phase 2 検証シナリオ（認証・テナント分離）

正本: `documents/08_エンタープライズ/08_エンタープライズ_実装計画.md` Phase 2 検証

## 前提（sandbox）

1. Functions / enterprise Hosting をデプロイ済み
2. テスト企業の `custom_domain` に `<PROJECT_ID>-enterprise.web.app` を登録（`09_デプロイ手順` §4.7）
3. SendGrid テンプレート `enterprise_pass_code` を作成し、`ENTERPRISE_PASS_CODE_TEMPLATE_ID` を実 ID に更新
4. ローカル開発時は `VITE_ENTERPRISE_SUBDOMAIN` + `VITE_ENTERPRISE_BASE_DOMAIN` を設定

## 自動検証（ローカル / CI）

| 項目 | コマンド | 期待結果 |
| :-- | :-- | :-- |
| Functions 単体テスト | `npm -w functions/default run test` | 全件 pass（`enterpriseAuthHelpers.test.ts` 含む） |
| Firestore Rules | `npx firebase emulators:exec --only firestore "npm -w tests-firestore-rules run test"` | 4 ケース pass |
| enterprise 型チェック | `npm -w enterprise run build:types` | エラーなし |

## 手動検証（sandbox）

| # | 手順 | 期待結果 |
| :-- | :-- | :-- |
| 1 | サポートで `createEnterprise` | enterprise / initial_admin 作成成功 |
| 2 | `<PROJECT_ID>-enterprise.web.app` でアプリ起動 | 企業ロゴ・名称・theme_color 反映 |
| 3 | 許可ドメイン外メールでログイン試行 | 即時バリデーション or API エラー |
| 4 | 許可ドメインのメンバーで OTP ログイン | `signInWithCustomToken` 成功 |
| 5 | Firebase Auth の custom claims 確認 | `enterprise_id` / `enterprise_role` / `user_type: enterprise` |
| 6 | 1週間無操作（または `localStorage` の `enterprise:last_activity_at` を 8 日以上前に変更） | `session_timeout` 監査ログ + ログアウト + ログイン画面でタイムアウト文言 |
| 7 | Admin SDK でメンバー `is_active: false` + `revokeRefreshTokens` | 再ログイン不可 |
| 8 | 復活後に再ログイン | 成功 |

## App Check（Phase 2-5）

1. 第1段階: クライアント App Check 初期化のみ（`ENTERPRISE_APP_CHECK_ENFORCE=false`）
2. Console でメトリクス確認後、第2段階: `ENTERPRISE_APP_CHECK_ENFORCE=true` で Functions 再デプロイ
