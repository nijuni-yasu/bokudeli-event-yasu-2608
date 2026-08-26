# event_status_accepting_order（主催者向け・予約承認通知）

飲食店が予約を承認（`applying_reservation` → `accepting_order`）した際、主催者・コミュニティマネージャーへ送る SendGrid Dynamic Template。

関連 Issue: [#2204](https://github.com/nijuniinc/bokudeli-event-new/issues/2204)

仕様の正本:

- [`メール既存仕様.md`](../06_メール通知/メール既存仕様.md) §2.1.3 予約承認・拒否通知
- 送信実装: `functions/default/src/eventStatusChangeMail.ts`

## 基本情報

| 項目 | 内容 |
| :-- | :-- |
| テンプレート名（SendGrid 上） | 既存テンプレ（`event_status_accepting_order` 等）を **Duplicate せず** 新バージョン追加 |
| テンプレート ID | `d-badaf130bf664cf3badb1ef2aab9f60c` |
| コード上の定数 | `EVENT_STATUS_ACCEPTING_ORDER_ID`（`eventStatusChangeMail.ts`） |
| アカウント | sandbox / 本番で **SendGrid アカウント・テンプレートを共有** |
| 差出人 | `DEFAULT_FROM`（shokujii 共通） |
| CC | `SUPPORT_MAIL`（承認・却下時） |
| 配信対象 | **PF + エンタープライズ**（`04_詳細_メール配信.md` §3.2.2 #11） |

## 今回追加する差し込み変数

| 変数 | 内容 | 例 |
| :-- | :-- | :-- |
| `shop_email_sub1` | 店舗メールアドレス（サブ1）。未設定時はコードから `''` | `shop-contact@example.com` |

**Reply-To** は Functions 側で `shop_email_sub1 ?? shop_email` を設定する（#2321）。テンプレ本文の表示は従来どおり。

既存変数（`shop_name`, `shop_email`, `shop_phone`, `shop_address` 等）は従来どおり `createShopTemplateDataForOrganizerMail` 経由で渡る。

## 本文追加箇所（SendGrid エディタ用）

店舗連絡先ブロックに **条件付き** で追加する（未設定店舗では行自体を出さない）。

```handlebars
{{#if shop_email_sub1}}
【お店のメールアドレス（追加）】
{{shop_email_sub1}}
{{/if}}
```

`shop_email`（ログインアカウント）とは別フィールド。サブ1 が未登録の店舗では何も表示されない。

## デプロイ順序（本番影響回避）

SendGrid は **Active 版のみ** が送信に使われる（version ID の API 指定は不可）。

1. **Functions デプロイ** — `shop_email_sub1` を `dynamicTemplateData` に追加（未設定は `''`）
2. SendGrid で **Inactive な新バージョン** を作成し、上記 Handlebars を追加
3. Preview / Test Send で確認
4. 問題なければ新バージョンを **Activate**

テンプレを先に Active にすると、コード未デプロイ期間に本番で空表示になる可能性があるため、**コード先行** とする。

## テストデータ（SendGrid Preview）

既存 test_data に以下を追加:

```json
{
  "shop_email_sub1": "shop-contact@example.com"
}
```

未設定パターン:

```json
{
  "shop_email_sub1": ""
}
```

## 備考

- `shop_email_sub2` / `shop_email_sub3` は **今回対象外**（#2204）
- 主催者向けの他ステータスメール（予約申請中・却下）にも同じ `dynamicTemplateData` 生成を使うが、テンプレ更新は **承認通知（本テンプレ）のみ** でよい
