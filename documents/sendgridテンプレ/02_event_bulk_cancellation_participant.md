# event_bulk_cancellation_participant（参加者向け・イベント一括中止・返金通知）

最小催行による自動中止や、将来の一括中止コア（`cancelEventBulkCore`）から、**ordered だった参加者**へ送る SendGrid Dynamic Template。

仕様の正本:

- [`08_イベントキャンセル_参加者あり_返金.md`](../02_主催者獲得と継続/08_イベントキャンセル_参加者あり_返金.md) §5.4.1 手順 8
- 送信実装: `functions/default/src/eventBulkCancellationMail.ts`

## 基本情報

| 項目 | 内容 |
| :-- | :-- |
| テンプレート名（SendGrid 上） | `event_bulk_cancellation_participant`（推奨） |
| テンプレート ID | `d-819d30069d304bb69235c4e207b7bd1c` |
| コード上の定数 | `EVENT_BULK_CANCELLATION_PARTICIPANT_TEMPLATE_ID`（`eventBulkCancellationMail.ts`） |
| コピー元（SendGrid Duplicate） | **注文完了（参加者）** `d-b94849438f2642a29973670f3d79809f` を推奨（店舗向け `d-9c498e754b91498b9ce0f2e83c219728` は不可） |
| アカウント | sandbox / 本番で **SendGrid アカウント・テンプレートを共有** |
| 差出人 | `DEFAULT_FROM`（shokujii 共通） |
| 送信方式 | `sendDynamicTemplateWithPersonalizations`（参加者ごとに同一 `dynamicTemplateData`） |
| 配信対象 | **PF（user）・エンタープライズとも送信**（`enterpriseMail` の skip 対象外） |

## 差し込み変数（dynamicTemplateData）

コードが渡すキーと **SendGrid 上の Handlebars 名を一致**させる。

| 変数 | 内容 | 例 |
| :-- | :-- | :-- |
| `community_name` | コミュニティ名 | `〇〇部ランチ会` |
| `event_name` | イベント名 | `4月の食事会` |
| `event_date` | 開催日（曜日付き・**整形済み文字列**） | `2026/4/15(火)` |
| `event_time` | 開催時間帯（**整形済み文字列**） | `12:00〜13:30` |
| `cancel_reason` | 中止理由（イベント `event_status.cancel_reason` と同一） | 最小催行時: `最小催行人数に達しなかったため自動中止` |
| `event_url` | イベント詳細 URL（PF / エンプラでホスト解決済み） | `https://…` |

**テンプレに含めない**（店舗向けテンプレ用。参加者向けでは未送信）: `shop_name`, `admin_url`, `organizer_*`, `event_address`

## 件名

```
【{{community_name}}】イベント中止のお知らせ（{{event_name}}）
```

## 本文骨子（SendGrid エディタ用）

レイアウトは注文完了メールと同系統（ロゴ・フッター・ボタンスタイル）を流用する。

```
{{community_name}} のイベント「{{event_name}}」は、
下記の理由により開催を中止することとなりました。

━━━━━━━━━━━━━━━━━━━━
■ イベント情報
━━━━━━━━━━━━━━━━━━━━
イベント名：{{event_name}}
開催日時　：{{event_date}} {{event_time}}

■ 中止理由
{{cancel_reason}}

━━━━━━━━━━━━━━━━━━━━
■ ご注文について
━━━━━━━━━━━━━━━━━━━━
本イベントへのご注文はキャンセルとなりました。

クレジットカード・Apple Pay・Google Pay・PayPay などで
事前にお支払いいただいた場合は、返金処理を行います。
カード会社等の都合により、ご利用明細への反映まで
数日〜数週間かかる場合があります。

当日払い・請求書払い等、事前決済以外の場合は
別途の返金手続きは発生しません。

福利厚生割引（企業負担）をご利用の場合は、
割引枠は自動的に戻ります。

━━━━━━━━━━━━━━━━━━━━

イベント詳細はこちら：
{{event_url}}

ご不明点は、イベントページまたは
shokujii サポート（support@nijuni.jp）まで
お問い合わせください。

※ 本メールは送信専用です。返信いただいてもお答えできません。
※ 心当たりのない場合は破棄してください。
```

### 文言の意図

| ブロック | 意図 |
| :-- | :-- |
| 中止理由 | `cancel_reason` をそのまま表示。最小催行以外（将来の手動一括中止等）にも流用可能 |
| 事前決済の返金 | `user_advance` / Stripe 返金に対応。既存仕様 [`メール既存仕様.md`](../06_メール通知/メール既存仕様.md) §3.2.3 に整合 |
| 当日払い・請求書 | `user_on_day` / `community_bill` は status のみ cancel（返金なし）のため明記 |
| 福利厚生割引 | `enterprise_subsidy` の usage 戻しを簡潔に記載 |
| サポート | テンプレに固定文として記載（`dynamicTemplateData` には含めない） |

## SendGrid 作成手順

1. Dynamic Templates → `d-b94849438f2642a29973670f3d79809f`（注文完了・参加者）を **Duplicate**
2. テンプレ名を `event_bulk_cancellation_participant` に変更
3. 件名・本文を上記骨子に差し替え（変数 6 つを Handlebars で配置）
4. **テストデータ**でプレビュー（下記）
5. 発行された Template ID を `eventBulkCancellationMail.ts` の `EVENT_BULK_CANCELLATION_PARTICIPANT_TEMPLATE_ID` に設定
6. `EVENT_CANCELLATION_TEMPLATE_ID`（店舗用）と **異なる ID** であることを確認（同一の間は参加者メールはスキップされる）
7. Functions デプロイ後、sandbox で最小催行中止 or 後処理再開を確認

## テストデータ（SendGrid Preview）

```json
{
  "community_name": "テストコミュニティ",
  "event_name": "4月ランチミートアップ",
  "event_date": "2026/4/15(火)",
  "event_time": "12:00〜13:30",
  "cancel_reason": "最小催行人数に達しなかったため自動中止",
  "event_url": "https://shokujii.jp/c/testcommunity/e/testevent"
}
```

## 備考

- 最小催行自動中止時の `cancel_reason` 定数: `MINIMUM_PARTICIPANTS_CANCEL_REASON` = `最小催行人数に達しなかったため自動中止`（`common/src/utils/minimumParticipants.ts`）
- 店舗向け中止メールは **別テンプレ**（`d-9c498e754b91498b9ce0f2e83c219728`）のまま。参加者向けと混同しない
- 参加者 0 人の一括中止では参加者メールは送らない（`includeParticipantMail: false`）
- テンプレ未作成（ID が店舗用プレースホルダのまま）の間は送信されず、後処理パイプラインが `participant_mails_sent_at` 未確定のまま **再開対象** となる
