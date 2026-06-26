# enterprise_pass_code（エンタープライズ版 OTP メール）

エンタープライズ版ログイン（`requestEnterpriseEmailLogin`）で送信する 6 桁パスコードメールのテンプレート。

仕様の正本: [`04_エンタープライズ_詳細仕様_認証・アカウント管理.md`](../08_エンタープライズ/04_エンタープライズ_詳細仕様_認証・アカウント管理.md) §4.1

## 基本情報

| 項目 | 内容 |
| :-- | :-- |
| テンプレート名（SendGrid 上） | `enterprise_pass_code` |
| テンプレート ID | `d-df16d8a143e2488891841fb739ce36f3` |
| コード上の定数 | `ENTERPRISE_PASS_CODE_TEMPLATE_ID`（`functions/default/src/enterprise/auth.ts` にハードコード。PF版 `USER_PASS_CODE_TEMPLATE_ID` と同方式） |
| アカウント | sandbox / 本番で **SendGrid アカウント・テンプレートを共有**（環境別テンプレートは作らない） |
| 差出人 | PF版と同じ `DEFAULT_FROM` |

## 差し込み変数（dynamicTemplateData）

| 変数 | 内容 |
| :-- | :-- |
| `user_pass_code` | 6 桁パスコード（PF版テンプレートとキー名を統一） |
| `company_name` | 企業名（`/enterprises/{id}` の `company_name`） |

## 件名

```
【{{company_name}}】ログイン用パスコードのお知らせ
```

## 本文骨子

```
{{company_name}} の食事イベントサービス（shokujii）にログインするための
パスコードをお知らせします。

┌──────────────────┐
│   {{user_pass_code}}   │   ← 6桁を大きく表示
└──────────────────┘

このパスコードの有効期限は 24 時間です。
ログイン画面に戻り、上記のパスコードを入力してください。

※ このメールに心当たりがない場合は、本メールを破棄してください。
※ 本メールは送信専用です。返信いただいてもお答えできません。
```

## 備考

- 企業ブランディングは MVP では `company_name` のテキスト差し込みのみ。ロゴ画像の動的差し込みは将来対応
- 有効期限は PF版と同じ `PASS_CODE_DURATION`（24 時間）。将来エンプラのみ短縮する場合（`04_認証` 補足資料 A）はテンプレートの文言も更新すること
- 送信実装は PF版 `requestEmailLogin`（`functions/default/src/user.ts`）と同じ `send({ to, from: DEFAULT_FROM, templateId, dynamicTemplateData })` 形式
