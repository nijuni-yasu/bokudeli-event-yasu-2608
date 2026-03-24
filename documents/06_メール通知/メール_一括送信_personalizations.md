# メール_一括送信（personalizations）

SendGrid [v3 Mail Send API](https://sendgrid.kke.co.jp/docs/API_Reference/Web_API_v3/Mail/index.html) の `personalizations` を使い、**同一テンプレート・同一メッセージレベル設定**で宛先だけが異なる送信を **1 HTTP リクエスト**にまとめる。詳細なパラメータ一覧・制限の一次情報は公式ドキュメントを参照し、本書は **Shokujii（`functions/default`）での方針と対象**に絞る。

本書の章立て: **0.1 / 0.2** は背景、**1〜** が本編（目的・用語・制約・As-Is・To-Be 等）。

## 0.1 現状の課題

- **SendGrid への HTTP リクエストが宛先数にほぼ比例**する。全ユーザー配信・コミュニティ全員配信などでは、短時間に大量の `send` が発生する。
- **Cloud Functions の実行時間・タイムアウト**に対し、並列 `Promise.allSettled` による大量送信は、ワーカー負荷・ソケット数・完了待ちの観点でボトルネックになりやすい。
- **SendGrid 側のレート制限**やアカウントのスループットに触れやすく、429 や一時的エラーが出たときの挙動（リトライ・分割）を考える単位が「1 宛先」になり、運用上の見通しが悪い。
- **コスト・可観測性**: API 呼び出し回数が多いと、課金・ログ・障害時の影響範囲の把握がしづらい。

※ どの機能でどう実装しているかの事実関係は後述の **[4. 現状（As-Is）](#4-現状as-is)** を参照。

## 0.2 期待する効果

- **API 呼び出し回数の削減**（理論上、同一条件の宛先 N 件で **最大 N 回 → 最大 `ceil(N / 1000)` 回**）。SendGrid の設計に沿った送り方になる。
- **Functions の実行効率**: ネットワーク往復の回数削減により、同じ宛先規模でも完了までの時間短縮やタイムアウト余裕の改善が期待できる（同時並列度の設計次第）。
- **レート・運用**: 単位が「バッチ」になり、リトライや監視の設計がしやすくなる。
- **コスト**: SendGrid のプランに依存するが、課金やクォータが「リクエスト単位」の場合に有利になりうる。

※ バッチ 1 回の失敗で最大 1000 件分が巻き込まれる可能性があるため、**失敗時のログ・再試行方針**は **「5.3 エラー処理・ログ」** および **v1 実装方針（下記）** で明確にする。

---

## 1. 目的

- 上記の課題を踏まえ、**personalizations** により同一条件の送信を HTTP リクエスト単位でまとめる。
- 対象箇所の **`Promise.allSettled` + 1 宛先 1 `send`** を、可能な範囲で **共通ユーティリティ経由の一括送信**に置き換える。

---

## 2. 用語

| 用語 | 意味 |
|------|------|
| **personalization** | 1 通分の宛先（`to`）と、その宛先にだけ効かせる `dynamic_template_data` / `subject` などの単位 |
| **バッチ** | 1 回の `POST /v3/mail/send` に載せる personalization の集合（**最大 1000**） |
| **`send`（共通）** | `functions/default/src/utils/sendgrid.ts` の `send()` および `@sendgrid/mail` の `sgMail.send()` |

---

## 3. SendGrid 制約（要約）

一次情報: [v3 Mail Send API 概要（KKE）](https://sendgrid.kke.co.jp/docs/API_Reference/Web_API_v3/Mail/index.html)

| 項目 | 内容 |
|------|------|
| `personalizations` | 1 リクエストあたり **最低 1、最大 1000** |
| 宛先数 | `to` / `cc` / `bcc` を合算して **1000 以内**（personalizations をまたいだ総数） |
| ペイロード | 添付含め **30MB 以内** |
| `substitutions` | personalization あたり **最大 100 個**、合計 **10KB 以内** など（Dynamic Template 利用時は主に `dynamic_template_data` を利用） |
| `to.name` 等 | `;` `,` を含めない |

**実装時は** 宛先リストを **1000 件ずつに分割**し、分割単位ごとに 1 リクエスト送る。

---

## 4. 現状（As-Is）

### 4.1 パターン

- **A**: 宛先ごとに `MailDataRequired` を組み立て、`Promise.allSettled` で **並列に複数回 `send`**
- **B**: `sendgrid.ts` の `send()` 経由（単一または配列。配列は **別々のメールを複数**渡す用途で、personalizations の一括とは別）

### 4.2 対象ファイルと処理（`Promise.allSettled` 使用箇所）

| 機能 | ファイル | 関数・処理の目安 | 備考 |
|------|----------|------------------|------|
| イベント情報メール | `eventInformationMail.ts` | `sendEventInformationMail` | 全ユーザー向け、`templateId` + `dynamicTemplateData`（ユーザー名差分） |
| コミュニティレター | `letter.ts` | `sendLetter` | コミュニティ単位で全員へ `send()` × N |
| 新着イベント（コミュニティメンバー） | `orderCompletionMail.ts` | `sendNewEventNotificationToMembers` | メール一覧を `map` して `send` × N |
| 注文完了（主催者向け） | `orderCompletionMail.ts` | `sendOrderCompletionMailToOrganizers` | コミュニティメール複数宛先 |
| 注文締切（主催者） | `orderDeadlineMail.ts` | `sendOrderDeadlineMailToOrganizers` | イベント × コミュニティメール各宛先 |
| 注文締切（参加者） | `orderDeadlineMail.ts` | `sendOrderDeadlineMailToMembers` | イベント × メンバー各宛先 |
| 注文期限リマインド（コミュニティ） | `orderDeadlineMail.ts` | `sendOrderDeadlineReminderToCommunityMembers` | イベント × メンバー各宛先 |
| カート内通知 | `inCartNotification.ts` | `sendInCartNotificationToMember` / `sendInCartEventDeadlineNotificationToMember` | 通知単位で `send` × N |

### 4.3 本仕様の主な対象外（理由の例）

- **注文完了メール（参加者・1 名）**（`sendOrderCompletionMailToMember`）: 添付（ICS）付きで **1 イベント 1 ユーザー**が中心なら、一括化の優先度は低い（必要なら別途検討）。
- **ショップ向け注文締切**（`sendOrderDeadlineMailToShop`）: `to` に配列 + `cc` 等、既に 1 リクエストで送っている想定。personalizations 化は要件次第。

---

## 5. 目標（To-Be）

### v1 実装方針（決定）

| 項目 | v1 |
|------|-----|
| **リトライ** | **429（Too Many Requests）のみ**・**初回失敗後、最大 1 回まで再試行**（同一バッチあたり合計最大 2 回の API 呼び出し）・指数バックオフ・`Retry-After` ヘッダがあれば尊重。**5xx・ネットワーク切断・タイムアウトでは自動再送しない** |
| **重複送信** | **許容しない**方針。二重になりうる **5xx / 応答不明への同一ペイロード再送を行わない**（下記 **5.3.2**）。Event Webhook / Activity による検知は **v2 で任意** |
| **並列** | **逐次のみ**（バッチを `for` + `await`）。複数バッチの同時送信は **v2 で検討** |
| **失敗バッチ** | **自動再送キューは設けない**。ログ・戻り値に記録し、**手動対応**を前提とする |
| **`send()`** | **新関数**（例: `sendgridBulk`）を追加し、呼び出しは **機能単位で徐々に移行**する（既存 `send()` を一斉置換しない） |

**トレードオフ**: 5xx やタイムアウトで落ちたバッチは自動では届かない可能性がある。運用・手動・将来の v2（Webhook・ジョブ等）でカバーする。

### 5.1 共通の送信ユーティリティ

#### 5.1.1 責務の分離

| レイヤ | 責務 |
|--------|------|
| **呼び出し側（各機能）** | 宛先リストの収集、ビジネスロジック（誰に送るか）、`dynamicTemplateData` の組み立て、コンテキスト用 ID（`eventId` 等）の付与 |
| **共通ユーティリティ** | SendGrid 向けの正規化、**1000 件チャンク**、**1 バッチ = 1 回 `sgMail.send`**、ログ用の共通フィールド、**429 時のリトライ（v1 方針に従う）** |

既存の `send()`（`functions/default/src/utils/sendgrid.ts`）は **単一通**、または **配列は「別々のメール」**として扱うため、personalizations 一括用は **専用の公開関数**とし、既存 `send()` と責務を分ける。

#### 5.1.2 入力インターフェース（案）

**メッセージ共通（1 リクエスト内で共通・REST のメッセージレベル）**

- `from`（必須）
- `templateId`（必須・Dynamic Template 前提）
- `replyTo`（任意）
- `asm`（任意）
- `categories`（任意）
- 必要なら `mailSettings` / `trackingSettings`（メール種別の既存要件に合わせる）

**宛先ごと（personalization 1 件あたり）**

- `to`: メールアドレス（文字列）、または `{ email, name? }`（`name` に SendGrid 禁止文字 `;` `,` を含めない）
- `dynamicTemplateData`: その宛先専用（既存の `dynamicTemplateData` と同義）

**呼び出し側から渡すコンテキスト（ログ用・任意）**

- 例: `feature`（識別子）、`eventId`、`communityId`、`letterId` など。構造化ログにそのまま載せられる形を推奨。

**配置**: `functions/default/src/utils/sendgridBulk.ts`（新規）に `sendDynamicTemplateWithPersonalizations` のような名前で切り出し、`sendgrid.ts` は従来どおり、**循環参照と責務混在**を避ける。

#### 5.1.3 内部アルゴリズム

1. **入力検証**: `recipients` が空なら即終了（ログは info 等）。各 `to` は既存 `send()` の検証と同等にし、無効な宛先は **除外 + warn カウント**。
2. **チャンク分割**: `recipients` を **最大 1000 件**ずつに分割（`personalizations` 上限および宛先総数 1000 の制約に合わせる）。
3. **バッチ送信**: 各チャンクについて **1 つのメッセージオブジェクト**を組み立て、`sgMail.send(単一オブジェクト)` を **1 回**呼ぶ。
4. **逐次 vs 並列（v1）**:
   - **v1 は逐次のみ**（`for` + `await`）。デバッグ・重複回避方針と整合する。
   - **v2 以降**、負荷上必要なら **バッチ単位**の並列化を検討する。その際は **`Promise.all` は使わず `Promise.allSettled`** とし、同時実行数に上限を付ける（コードレビュー基準）。
5. **逐次バッチ時の失敗後の挙動**: バッチ *i* が失敗した場合（**429 のリトライ**を尽くしても失敗した場合、または **5xx 等で即失敗**した場合を含む）でも、**バッチ *i*+1 以降は原則として続行**する。失敗したバッチは戻り値の `errors` 等に集約し、**全体を打ち切らない**（部分到達を許容する）。全件を止める必要がある要件が出た場合は別途検討する。

#### 5.1.4 同一バッチにまとめてはいけない例

- **テンプレート ID** が異なる
- **`from` / `replyTo` / `asm`** が宛先集合で異なる（メッセージレベルで共通化できない）

これらは **別メッセージ（別 API 呼び出し）**に分ける。

### 5.2 Node SDK と REST の対応

- **REST**: `personalizations[]` に `to` と `dynamic_template_data` 等を載せる。
- **Node（`@sendgrid/mail`）**: 1 メッセージに `templateId` と `personalizations: [{ to, dynamicTemplateData }, ...]` を載せる形が REST の `personalizations` に相当する（プロパティ名は SDK の camelCase にマッピング）。**実装時は** 利用中の型定義（`MailDataRequired` 等）と公式サンプルを突き合わせ、**トップレベル `to` と `personalizations` の同時指定**が型・実行時どちらで許容されるかを確認する。
- 既存 `send()` の **配列引数**は「複数通の独立したメール」のため、一括 personalizations 用 API は **別関数**とし、呼び分けを明確にする。

### 5.3 エラー処理・ログ

#### 5.3.1 失敗の単位

- **HTTP 1 回 = 最大 1000 宛先**。失敗時はそのバッチ全体が未送信扱いになりやすい（SendGrid が受理した後の配信エラーは Event Webhook 等の別話）。
- レスポンスは **リクエスト単位**であり、**宛先ごとの成否は返らない**前提でログと運用を設計する。

#### 5.3.2 リトライ方針（v1・決定）

**方針**: **重複送信は許容しない**。そのため **自動リトライは HTTP 429 のみ**とし、**5xx・応答不明・ネットワークエラーでは同一ペイロードを再送しない**（受理済みか不明な状態での再送による二重配信を避ける）。

| 状況 | v1 の動き |
|------|-----------|
| **429** | **初回失敗後、最大 1 回まで再試行**（合計最大 2 回）。指数バックオフ・`Retry-After` ヘッダがあれば尊重。 |
| **5xx** | **自動再送しない**。失敗バッチとしてログ・戻り値に記録し、**手動対応**（必要なら別途・v2 でジョブ等）。 |
| **4xx（429 以外）** | **再送しない**（ペイロード不正・認証エラー等）。 |
| **ネットワーク切断・タイムアウト・応答なし** | **自動再送しない**（受理と未送信が区別できず二重のリスクがあるため）。 |

429 の再試行後も失敗したバッチ、および上記で失敗したバッチは **失敗バッチとしてログに残す**。**自動の再送キューは設けない**（**v1 実装方針**参照）。

#### 5.3.3 ログに含めるフィールド（案）

- **必須に近い**: `feature`（または `mailKind`）、`batchIndex`、`batchSize`、`totalBatches`、`recipientCountInBatch`
- **コンテキスト**: `eventId`、`communityId`、`letterId` など（呼び出し側が渡す `context`）
- **成功**: `statusCode`（202）、`x-message-id` が取れれば追跡用に記録
- **失敗**: `statusCode`、レスポンス `body`（必要に応じてマスク）、`error.message`、同一 `batchIndex` の **429 時の再試行回数**（0〜1。429 以外の失敗では 0）

**個人情報（メールアドレス）**: エラー時ログに **`to` の全件一覧をそのまま載せない**（既存 `functions/default/src/utils/sendgrid.ts` のエラーログと同様、必要なら **件数・先頭 N 件のみ・マスク**に留める）。GDPR・社内ポリシーに合わせて実装時に確定する。

#### 5.3.4 戻り値（案）

呼び出し側が集計しやすいように、例えば次を返す。

- `batchesAttempted` / `batchesSucceeded` / `batchesFailed`
- `totalRecipientsAccepted`（成功したバッチに含まれた宛先数の合計）
- `errors`: 失敗バッチの `{ batchIndex, recipientCount, reason }[]`

既存の「成功 N / 失敗 M」ログ（`letter.ts` 等）と **同程度の情報が出せる**ようにする。

---

## 6. 受け入れ条件（案）

- [ ] 対象機能で、同一テンプレート・同一メッセージ設定の **宛先 N 件**に対し、SendGrid への HTTP 回数が **`ceil(N / 1000)` 以下**になっている（中継・リトライ除く）。
- [ ] **1001 人以上**のリストでも、1000 件境界で分割されエラーにならない。
- [ ] 既存の **配信停止（`asm`）**、**Reply-To**、**テンプレート ID** など、メール種別ごとの要件が満たされている。
- [ ] ログで **送信試行・失敗**が追跡できる。
- [ ] 自動リトライが **HTTP 429 のみ**であり、**5xx・応答不明で同一ペイロードを再送しない**（**5.3.2**・**v1 実装方針**）。

---

## 7. 関連ドキュメント・実装

- 仕様メモ（本フォルダ）: `メール_コミュニティメンバー_新着イベント.md`、`メール_コミュニティメンバー_注文期限.md` など
- 実装スキル: `.cursor/skills/shokujii-functions-implementation`（メール・`Promise.allSettled` のパターン記載あり）

---

## 8. 未決事項・v2 以降の検討

**v1 で決定済み**の内容は **「v1 実装方針（決定）」** および **5.3.2** を参照。

- **429 の待ち時間**: 再試行は **1 回まで**で決定済み。指数バックオフの**初期秒数・係数**は本番のレート・ログを見て調整してよい
- **v2 以降**: 負荷次第で **バッチ並列**（`Promise.allSettled`・同時実行上限）、**Event Webhook / Activity** との連携、**失敗バッチの自動キュー・ジョブ再送**、**Idempotency 等による再送安全性の向上** などを検討する
