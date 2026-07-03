---
name: shokujii-functions-implementation
description: Shokujii プロジェクトにおける Firebase Functions の実装ルール。createModuleLogger・defineSecret・メール一括送信（Promise.allSettled）など、プロジェクト固有のパターンを守るためのスキル。新しい Callable Function の追加、Scheduled Function の実装、onRequest（Webhook・PDF 等）の実装、onDocumentWritten 等の Firestore トリガーの実装、メール送信を含む Function の作成、SendGrid や Stripe 等の外部 API を呼ぶ Function を書くときは必ず参照すること。「新しい Callable Function を追加して」「Scheduled Function を書いて」「メール送信の Function を実装して」「onCall で Firestore を読む Function を作って」など、functions/default を触る依頼時に使用する。
---

# Shokujii Functions Implementation

Firebase Functions v2 の実装時に守るべきプロジェクト固有ルール。functions/default で新規 Function を追加・修正する際に参照する。

## 必須ルール

### ログ出力

- **createModuleLogger を使う**: console.log / console.error は禁止。firebase-functions の logger を直接インポートしない
- **ログに接頭辞をつけない**: createModuleLogger 使用時は module フィールドが自動付与されるため、メッセージに letter | 等の接頭辞は不要

### シークレット

- **defineSecret で取得**: GitHub secrets は使わず、Google Cloud Secret Manager から defineSecret で取得する
- **secrets オプションを指定**: SendGrid・Stripe・Adobe PDF 等の API キーを使う Function には、onCall / onRequest / onSchedule の第1引数に secrets を指定する

### メール送信

- **一括送信は Promise.allSettled**: 複数件のメール送信は Promise.all ではなく Promise.allSettled を使い、失敗件数をログに記録する
- **1件送信は try/catch**: 1件のみの送信に Promise.allSettled や失敗集計ログは不要。try/catch で十分

### Callable の引数

- **オブジェクトを渡さない**: クラスインスタンスや複雑なオブジェクトを request.data に渡さない。ID のリストなど、JSON シリアライズ可能なプリミティブなデータのみ渡す

### 命名規則

- **関数名・ファイル名は lowerCamelCase**: functions v2 では snake_case が使えないため

### 日付・時刻

- **luxon を使う**: Date オブジェクトや new Date() は実行環境によって値が変わるため避ける。日付の固定値は common に定数として定義する

## 参照ファイル

**代表的な参考ファイル**:

- `functions/default/src/utils/logger.ts` - createModuleLogger の定義
- `functions/default/src/utils/sendgrid.ts` - SendGrid 利用パターン、defineSecret の使用例
- `functions/default/src/letter.ts` - Callable + メール一括送信の代表例
- `functions/default/src/stripe.ts` - defineSecret + secrets オプションの例
- `functions/default/src/pollingTask.ts` - Scheduled Function の代表例
- `functions/default/src/stripeWebhook.ts` - onRequest（Webhook、rawBody）の例

| 対象 | 参照 | 内容 |
|------|------|------|
| ログ・シークレット | [references/logger-and-secrets.md](references/logger-and-secrets.md) | createModuleLogger、defineSecret、secrets オプション |
| メール送信 | [references/mail-sending.md](references/mail-sending.md) | 一括送信と1件送信の使い分け、Promise.allSettled パターン |
| Callable パターン | [references/callable-patterns.md](references/callable-patterns.md) | 引数の型、バリデーション、HttpsError、secrets 指定 |
| Scheduled パターン | [references/scheduled-patterns.md](references/scheduled-patterns.md) | schedule 式、timeZone、secrets |
| onRequest パターン | [references/onrequest-patterns.md](references/onrequest-patterns.md) | Webhook、rawBody、CORS |

**詳細**: プロジェクトルートの `documents/実装メモ/functionsにおける store の使い方.md` に Firestore 操作の詳細がある。shokujii-firestore スキルも併せて参照すること。
onDocumentWritten 等の Firestore トリガーも createModuleLogger 等の共通ルールに従う。
新規 Function 追加時は `functions/default/src/index.ts` の Promise.all に import を追加し、export のオブジェクトに含めること。

### CI デプロイ（必須）

`functions/default/src/index.ts` で **Cloud Functions として export する**関数を追加・削除したら、同 PR で `.github/workflows/deploy_functions.yml` の `--only` リストも更新すること。更新漏れすると development / production では Trigger・Callable が未デプロイのままになる（コードはマージ済みでも GCP 上に存在しない）。

- **hybrid**: 決済・注文系（`addToCart`, `stripeWebhook` 等）
- **pf**: PF 本体（上記以外の一般 Function）
- **enterprise**: エンプラ Callable（`createEnterprise` 等）

export しない内部ヘルパー（他 Function から import するだけの関数）は対象外。整合性は `npm run verify:functions-deploy`（PR verify でも実行）で検証する。

## クイックチェックリスト

新規 Function 作成時:

- [ ] index.ts に import と export を追加したか
- [ ] `.github/workflows/deploy_functions.yml` の hybrid / pf / enterprise のいずれか `--only` リストに関数名を追加したか（export した Function のみ）
- [ ] createModuleLogger を使っているか（console.log / firebase-functions の logger 直接 import は NG）
- [ ] ログメッセージに接頭辞をつけていないか
- [ ] API キーを使う場合、defineSecret と secrets オプションを指定しているか
- [ ] メール一括送信に Promise.allSettled を使っているか
- [ ] メール1件送信に Promise.allSettled を使っていないか（try/catch で十分）
- [ ] Callable の引数にオブジェクトを渡していないか（ID リスト等のプリミティブのみ）
- [ ] 関数名・ファイル名を lowerCamelCase にしているか

## よくある誤り

**NG**: console.log や firebase-functions の logger を直接使う  
**OK**: createModuleLogger を使う

**NG**: メール一括送信に Promise.all を使う  
**OK**: Promise.allSettled を使い、失敗件数を logger.warn で記録する

**NG**: メール1件送信に Promise.allSettled を使う  
**OK**: try/catch で十分

**NG**: SendGrid を使う Function に secrets: SENDGRID_API_KEY を指定していない  
**OK**: onCall 等の第1引数に secrets: ['SENDGRID_API_KEY'] を指定する

**NG**: Callable に BokudeliEventMenu[] 等のオブジェクトを渡す  
**OK**: menuIds 等の ID リストを渡し、Function 内で store から取得する

**NG**: 新規 Function を追加したが index.ts に export を登録していない  
**OK**: index.ts の Promise.all に import を追加し、export のオブジェクトに含める

**NG**: index.ts に export を追加したが deploy_functions.yml の `--only` リストを更新していない  
**OK**: hybrid / pf / enterprise のいずれかに `functions:<関数名>` を追加する（PR verify の deploy list チェックが通ること）
