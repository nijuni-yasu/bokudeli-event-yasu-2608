# エンタープライズ EventMemberOrder 対応 論点

## このドキュメントの目的

`02_エンタープライズ_全体構成・アーキテクチャ.md` は旧 `EventOrder` 設計を前提に書かれている。現在は以下のリファクタリング・追加実装が進行中であり、エンプラ仕様もこれに合わせて更新が必要になる。

- `documents/07_リファクタリング/05_EventOrder→EventMemberOrder.md`（メニュー単位ドキュメント化、`stripes` 分離）
- `documents/01_マネタイズと決済/03_無料参加・割引参加_EventMemberOrder対応.md`（`pay_community_bill_off_amount` のメニュー単位化）

本ドキュメントでは、エンプラ仕様を EventMemberOrder ベースに書き換えるにあたって **事前に確定が必要な論点** をチェックリスト形式で整理する。各論点が決定したら、対象の仕様書（主に `02_エンタープライズ_全体構成・アーキテクチャ.md`）を更新する。

> **凡例**
> - `[ ]` 未決定 / `[x]` 決定済み
> - 各論点には「選択肢」と「推奨」を記載。決定欄は空にしてある（合意後に追記）

---

## 1. データ構造（コレクション・スキーマ）

### 1.1 [x] 旧 `orders` を前提とした記述の差し替え

- **現状の記述**: `02_全体構成・アーキテクチャ.md` 3.1 / 3.3 で `/communities/{cid}/events/{eid}/orders/{oid}` に `enterprise_id`, `discount_amount`, `user_paid_amount`, `is_guest_order` を追加するとされている
- **新設計**: `orders` は廃止され、`members/{userId}/member_orders/{orderId}` と `stripes/{stripeId}` に分割される
- **対応方針（前提）**: `orders` への追記項目を `members` / `member_orders` / `stripes` / `event` の 4 ドキュメントに振り直す
- **決定**: `orders` への追記項目を `members` / `member_orders` / `stripes` / `event` の 4 ドキュメントに振り直す

### 1.2 [x] 企業補助額フィールドの命名

- **論点**: 旧設計の `discount_amount` を新設計でどう命名するか
- **選択肢**:
  - A. `pay_enterprise_subsidy_amount`（`pay_community_bill_off_amount` と命名規則を揃える）
  - B. `discount_amount` のまま（短い・既存仕様書との連続性）
  - C. `enterprise_off_amount`（`off_amount` 系と揃える）
- **推奨**: **A**。`community_bill_settings.off_amount` → `pay_community_bill_off_amount` と同じパターンで、`event.enterprise_subsidy_settings` → `pay_enterprise_subsidy_amount` とする
- **影響範囲**: `EventMemberOrder.ts` / `EventStripe.ts` / Functions / フロントの計算ロジック / 監査ログのフィールド名
- **決定**: A（`pay_enterprise_subsidy_amount`）

### 1.3 [x] `user_paid_amount` を保持するか

- **論点**: `menu_price - pay_enterprise_subsidy_amount` で導出可能な値を別フィールドとして保存するか
- **選択肢**:
  - A. 保持しない（導出する）
  - B. 保持する（クエリ・集計時に便利）
- **推奨**: **A**。`pay_community_bill_off_amount` の設計と整合させる（あちらも `user_paid_amount` を持たない）
- **決定**: A（保持しない。`menu_price - pay_enterprise_subsidy_amount` で導出する）

### 1.4 [x] `is_guest` の配置先

- **論点**: 旧設計の `is_guest_order`（注文プロセス単位）を新設計でどこに置くか
- **選択肢**:
  - A. `members.is_guest`（イベント・ユーザー単位。1 ドキュメントで判定可能）
  - B. `member_orders.is_guest_order`（メニュー単位。同一ユーザー内で混在可能）
  - C. `users.user_type === 'guest'` で判定（イベント別に変えられない）
- **推奨**: **A**。同一ユーザーが「同じイベント内の異なるメニューでゲスト/メンバーを変える」ユースケースは想定されないため
- **決定**: A（`members.is_guest` に配置）

### 1.5 [x] `enterprise_id` の冗長化対象

- **論点**: 新設計で追加された `members` / `member_orders` / `stripes` に `enterprise_id` を持たせるか
- **選択肢**:
  - A. 全コレクションに持たせる（`collectionGroup` クエリで企業横断集計が容易）
  - B. `events` までに留める（`events` を join で引けば集計可能）
- **推奨**: **A**。Firestore の特性（JOIN なし、`collectionGroup` での `where` 必須）から、新設計の `community_id` の冗長化と同じ判断
- **影響範囲**: `02_全体構成.md` 3.4 「`enterprise_id` の冗長化」セクション、Security Rules、インデックス
- **決定**: A（`members` / `member_orders` / `stripes` 全コレクションに `enterprise_id` を持たせる）

### 1.6 [x] Event スキーマへの追記項目

- **論点**: `event_payment === 'enterprise_subsidy'` の場合、企業補助の計算根拠をどこに保持するか（→ 1.7 と連動）
- **選択肢**:
  - A. イベント作成時に企業設定をスナップショット → `event.enterprise_subsidy_settings` に保存
  - B. 都度 `/enterprises/{eid}` を参照（コピーしない）
- **推奨**: **A**（詳細は 2.1 で議論）
- **決定**: A（`event.enterprise_subsidy_settings` にスナップショット保存）

---

## 2. 企業補助設定（enterprise_subsidy_settings）

### 2.1 [x] 企業設定をイベントにスナップショットするか

- **論点**: 企業の割引設定（`discount_type` / `discount_value` / `monthly_limit_per_user`）が変更されたとき、過去・未来のイベントの計算をどう扱うか
- **選択肢**:
  - A. イベント作成時に **スナップショット** してイベントドキュメントに保存（`community_bill_settings` と同じパターン）
  - B. 注文時に **都度 `/enterprises/{eid}` を参照**
  - C. ハイブリッド（割引率はスナップショット、月額上限は最新値を参照）
- **推奨**: **A**。`community_bill_settings` と整合させ、過去注文の再計算リスクを排除する
- **決定**: A（イベント作成時に企業設定をスナップショットする）

### 2.2 [x] スナップショットする場合のスキーマ

- **論点**: `event.enterprise_subsidy_settings` の構造
- **案**:
  ```typescript
  interface EnterpriseSubsidySettings {
    type: 'fixed' | 'percentage'
    value: number                    // fixed: 円、percentage: %
    monthly_limit_per_user: number   // この時点での月額上限
  }
  ```
- **論点詳細**:
  - 月額上限もスナップショットするか、それとも常に最新値を見るか（→ 3.1 と連動）
  - `type` を `community_bill_settings` の `'free' | 'discount'` と統一できるか（できない：意味が異なる）
- **決定**: 上記の案の内容で **仮決定**。実装着手時に詳細を再確認する

### 2.3 [x] 企業設定変更時のイベントへの反映

- **論点**: 企業設定を変更したとき、まだ開催されていない（ステータスが `draft` / `published`）イベントのスナップショットを更新するか
- **選択肢**:
  - A. 既存イベントは触らない（運用で対応）
  - B. 未開催イベントのみ自動更新
  - C. 管理者画面で「設定変更を既存イベントに反映」ボタンを用意
- **推奨**: **A**（MVP）。Phase 2 で C を検討
- **決定**: **下書き保存（draft 保存）する際に、企業設定を再取得して保存する**。
  - イベント作成時の初期スナップショット + 下書き保存のたびに最新企業設定を再取得して上書きする運用とする
  - `published` 以降のイベントはスナップショット固定（変更しない）
  - これにより、A（運用で対応）と B（自動更新）の中間的な挙動を実現する

---

## 3. 月額上限（monthly_usage）のトランザクション設計

### 3.1 [x] 仮押さえ（in_cart）で `monthly_usage` を消費するか

- **論点**: カート追加時点で月額上限を消費するか、注文確定時点で消費するか
- **選択肢**:
  - A. **`addToCart` 時に消費**（カート追加時点で予約確保）
    - メリット：複数ユーザー同時カート時の上限超過を防げる
    - デメリット：カート放置で枠を使い続ける
  - B. **`confirmOrder` / `stripeWebhook` 時に消費**（確定時点で予約確保）
    - メリット：シンプル。カート放置の影響なし
    - デメリット：複数ユーザーが同時に確定するとレースコンディション
  - C. **`addToCart` で仮確保 + TTL で自動解放**
    - メリット：両者の良いとこ取り
    - デメリット：実装複雑（TTL Cloud Functions が必要）
- **推奨**: **B**（MVP）。`addToCart` は単純に `member_orders` を作成するだけにし、`confirmOrder` / `stripeWebhook` の Transaction 内で `monthly_usage` を加算する
- **決定**: B（`confirmOrder` / `stripeWebhook` 時に `monthly_usage` を消費）

### 3.2 [x] `addToCart` で N 個追加時、上限超過分の挙動

- **論点**: 例えば残枠 ¥1,000 の状態で「¥800 のメニュー × 2」を追加した場合の処理
- **選択肢**:
  - A. **全件 fail**（`HttpsError('failed-precondition')`）
  - B. **収まる分だけ補助、超過分は `pay_enterprise_subsidy_amount = undefined`**（自己負担）
  - C. **追加可能な個数まで自動制限**（クライアントへフィードバック）
- **推奨**: **B**。`addToCart` の段階で確定済みではないため、上限内の補助を最大化しつつ、超過分は自己負担として明示する
- **決定**: B（収まる分だけ補助、超過分は自己負担として `pay_enterprise_subsidy_amount = undefined`）

### 3.3 [x] `removeFromCart` / `cancelOrders` 時の `monthly_usage` 減算

- **論点**: ドキュメント削除・キャンセル時に `monthly_usage` を戻すか
- **依存**: 3.1 で「いつ消費するか」が決まる
- **選択肢**:
  - 3.1 = A の場合：`removeFromCart` でも減算が必要
  - 3.1 = B の場合：`cancelOrders` でのみ減算
- **推奨**: 3.1 = B 前提なら、`cancelOrders` の Transaction 内で `monthly_usage` を減算
- **決定**: 3.1 = B 前提。`cancelOrders` の Transaction 内で `monthly_usage` を減算する。`removeFromCart` では `monthly_usage` 操作は不要

### 3.4 [x] `monthly_usage` のキー（年月）の確定基準

- **論点**: 「6 月に 7 月開催のイベントを決済」した場合、どの月の枠を消費するか
- **選択肢**:
  - A. **イベント開催月**（既存仕様書の記述：「6 月に 7 月イベント決済 → 7 月分」）
  - B. 決済月
  - C. カート追加月
- **推奨**: **A**。利用者の実感に合致（「7 月の食事代」として認識される）
- **決定**: A（イベント開催月をキーとする。既存仕様書 3.2 で確定済み）

---

## 4. Security Rules

### 4.1 [x] `members` / `member_orders` の read 権限

- **論点**: `05_EventOrder→EventMemberOrder.md` では `members` / `member_orders` は `allow read: if true`（全ユーザー read）が前提。エンプラ版は「自社のみ可視」としたい
- **選択肢**:
  - A. **共通 rules で分岐**（`enterprise_id == null` なら全ユーザー、`enterprise_id != null` なら自社のみ）
  - B. **エンプラ向け別パスを切る**（例: `events/{eid}/enterprise_members/...`）
- **推奨**: **A**。コレクションを共有しつつ rules で分岐する。サンプル：
  ```javascript
  match /communities/{cid}/events/{eid}/members/{uid} {
    allow read: if resource.data.enterprise_id == null
                || resource.data.enterprise_id == request.auth.token.enterprise_id;
    allow write: if false;

    match /member_orders/{oid} {
      allow read: if resource.data.enterprise_id == null
                  || resource.data.enterprise_id == request.auth.token.enterprise_id;
      allow write: if false;
    }
  }
  ```
- **決定**: A（コレクションを共有しつつ rules で `enterprise_id` を分岐）

### 4.2 [x] `stripes` の read 権限

- **論点**: 新設計では `stripes` は本人のみ read（`request.auth.uid == resource.data.user_id`）。エンプラ版でこの方針を維持するか
- **選択肢**:
  - A. **本人のみ read**（新設計のまま）
  - B. **本人 + 全社管理者 read**（経費精算の確認用）
- **推奨**: **A**（MVP）。全社管理者は集計画面（`monthly_usage`）で十分。領収書の個別確認は Phase 2 で検討
- **決定**: A（本人のみ read。MVP）。Phase 2 で全社管理者の閲覧可否を再検討

### 4.3 [x] PF版コミュニティへのエンプラユーザーアクセス

- **論点**: エンプラユーザーが PF版コミュニティ（`enterprise_id == null`）にアクセスできるか
- **選択肢**:
  - A. アクセス可能（仕様書 3.3 の記述「`enterprise_id == null` なら従来通り」と整合）
  - B. アクセス不可（エンプラユーザーは自社内のみ）
- **推奨**: **A**。ゲスト参加機能（`allow_guest`）と合わせ、エンプラユーザーが社外イベントにも参加できる余地を残す
- **決定**: A（エンプラユーザーは PF版コミュニティへもアクセス可能）

---

## 5. 監査ログ

### 5.1 [x] `order_create` / `order_cancel` のログ粒度

- **論点**: 1 メニュー = 1 ドキュメントになったため、メニュー単位でログを書くと膨大になる
- **選択肢**:
  - A. **セッション単位**（`confirmOrder` / `stripeWebhook` / `cancelOrders` の 1 回 = 1 ログ）。`details` に `order_ids: string[]` を含める
  - B. **メニュー単位**（1 ドキュメント = 1 ログ）
- **推奨**: **A**。「ユーザーが体感する 1 操作」単位でログを残す
- **決定**: A（セッション単位。`details` に `order_ids: string[]` を含める）

### 5.2 [x] 新規ログ種別の追加

- **論点**: EventMemberOrder 化に伴い追加すべきログ種別
- **候補**:
  - `monthly_usage_exceeded`：月額上限超過時（3.2 = B の場合、自己負担に切り替わったことを記録）
  - `enterprise_subsidy_recalculated`：`confirmOrder` のサーバー側再計算で `failed-precondition` 発生時
  - `cart_add` / `cart_remove`：カート操作（運用上必要か要検討）
- **推奨**: 上記 2 種（`monthly_usage_exceeded`、`enterprise_subsidy_recalculated`）を MVP に追加。`cart_add` / `cart_remove` は不要
- **決定**: 上記 2 種（`monthly_usage_exceeded`、`enterprise_subsidy_recalculated`）を MVP に追加。`cart_add` / `cart_remove` は追加しない

### 5.3 [x] ログ書き込みのタイミング

- **論点**: `order_create` ログを `confirmOrder` / `stripeWebhook` のどちらで書くか
- **選択肢**:
  - A. 両方（決済方式で分岐）
  - B. `stripeWebhook` 完了時のみ（ストライプ経由）／`confirmOrder` 完了時のみ（無料・請求書）
- **推奨**: **B**。実際に `ordered` 状態になったタイミングで 1 度だけ書く
- **決定**: B（`stripeWebhook` 完了時 or `confirmOrder` 完了時に 1 度だけ書く。決済方式で書込み元を分岐）

### 5.4 [x] 監査ログ `target_type` の値（注文系）

- **論点**: 旧 `order` ドキュメント単位の語感で `member_order` と読める表現が残ると、スキーマ上の列挙値と齟齬が出る
- **決定**: 注文関連（`order_create` / `order_cancel` / `monthly_usage_exceeded` / `enterprise_subsidy_recalculated`）の `target_type` は **`order_session`** とする（単一 `member_orders` ドキュメントを指す `member_order` とは別）
- **正本**: `04_エンタープライズ_詳細仕様_監査ログ.md` 2.2（`target_type` の値）および 4.2 の使用例

---

## 6. API（Callable Functions）への影響

### 6.1 [x] `addToCart` のエンプラ向け処理追加

- **論点**: `addToCart` で `pay_enterprise_subsidy_amount` を計算・保存するロジックを追加するか
- **選択肢**:
  - A. **`event_payment` で分岐**（PF版: `community_bill` → `pay_community_bill_off_amount`、エンプラ: `enterprise_subsidy` → `pay_enterprise_subsidy_amount`。エンプラ版では `community_bill` は選択不可）
  - B. 個別 Callable を作る（例: `addToCartEnterprise`）
- **推奨**: **A**。同一 Callable 内で `event_payment` を見て分岐する。`computePaymentEnterpriseSubsidyAmount` ヘルパを `common/src/utils/` に追加
- **決定**: A（同一 `addToCart` 内で `event_payment` を見て分岐。`computePaymentEnterpriseSubsidyAmount` ヘルパを `common/src/utils/` に追加）

### 6.2 [x] `confirmOrder` / `createStripeCheckoutSession` の整合性検証

- **論点**: `pay_enterprise_subsidy_amount` のサーバー側再計算・整合検証を `community_bill` と同じパターンで行うか
- **推奨**: **行う**。`isPaymentEnterpriseSubsidyAmountConsistent` ヘルパを `common/src/utils/` に追加し、`confirmOrder` / `createStripeCheckoutSession` の冒頭で全 order を検証する
- **決定**: 推奨内容のとおり実施。`isPaymentEnterpriseSubsidyAmountConsistent` ヘルパを `common/src/utils/` に追加し、`confirmOrder` / `createStripeCheckoutSession` の冒頭で全 order を検証する

### 6.3 [x] `cancelOrders` での `monthly_usage` 戻し

- **論点**: 3.3 の決定に従って実装
- **論点詳細**:
  - 部分キャンセル時は、当該 order の `pay_enterprise_subsidy_amount` 分だけ `monthly_usage` から減算
  - キー（年月）はイベント開催月（3.4）
- **決定**: 3.3 の決定に従って実装する。`cancelOrders` の Transaction 内で、当該 order の `pay_enterprise_subsidy_amount` 分だけイベント開催月の `monthly_usage` から減算する

---

## 7. 仕様書間の整合性・命名

### 7.1 [x] リリース順序の確定

- **論点**: 以下のリリース順序を確定する
  1. `05_EventOrder→EventMemberOrder.md`（リファクタリング本体）
  2. `03_無料参加・割引参加_EventMemberOrder対応.md`（`pay_community_bill_off_amount` の対応）
  3. エンプラ版（`02_エンタープライズ_全体構成・アーキテクチャ.md` 等の更新後実装）
- **推奨**: 上記順序。エンプラ版は 1, 2 が本番反映された後に着手
- **決定**: 上記順序のとおり。エンプラ版は 1, 2 が本番反映された後に着手する

### 7.2 [x] エンプラ仕様書の冒頭に依存関係を明記

- **論点**: `02_エンタープライズ_全体構成・アーキテクチャ.md` の冒頭に「本ドキュメントは `05_EventOrder→EventMemberOrder.md` および `03_無料参加・割引参加_EventMemberOrder対応.md` に準拠した EventMemberOrder 設計を前提とする」旨を追記する
- **決定**: 明記する。`02_エンタープライズ_全体構成・アーキテクチャ.md` の冒頭に依存仕様書を追記する

### 7.3 [x] 命名規則の統一

- **論点**: `pay_community_bill_off_amount` と並列の `pay_enterprise_subsidy_amount` で命名統一する（→ 1.2 と連動）
- **決定**: `pay_community_bill_off_amount` と並列の `pay_enterprise_subsidy_amount` で命名統一する

---

## 8. 周辺機能への影響

### 8.1 [x] `validateReservationRequest` への追加

- **論点**: `common/src/utils/validateReservationRequest.ts` に `enterprise_subsidy` 用のバリデーション（月額上限・ゲスト参加可否など）を追加するか
- **選択肢**:
  - A. 追加する（予約申請段階で上限チェック）
  - B. 追加しない（`addToCart` / `confirmOrder` でチェック）
- **推奨**: **B**（MVP）。予約申請と注文は別フローのため、注文時のチェックで十分
- **決定**: B（`validateReservationRequest` には追加せず、`addToCart` / `confirmOrder` でチェックする）

### 8.2 [x] `eventMembers.ts` トリガーへの影響

- **論点**: ゲスト参加者を `Event.members` 配列に含めるか
- **選択肢**:
  - A. 含める（参加人数として正しくカウント）
  - B. 含めない（社員のみカウント）
- **推奨**: **A**。定員チェック・レター送信対象としてゲストも対象に含める
- **決定**: A（ゲスト参加者も `Event.members` 配列に含める）

### 8.3 [x] メール配信（`eventInformationMail` 等）への影響

- **論点**: エンプラユーザー向けにメール配信内容を変えるか
- **選択肢**:
  - A. 配信しない（仕様書 6.3 に記載のとおり、`user_type === 'enterprise'` で除外）
  - B. 配信する（PF版と同じ）
  - C. 一部のみ配信（リマインドのみ等）
- **推奨**: **A**（既存仕様書 6.3 に従う）。ただし、注文確定メール・キャンセルメールなど「業務上必要なもの」は除外対象としない
- **決定**: A（配信しない。ただし、注文確定メール・キャンセルメールなど「業務上必要なもの」は除外対象としない）

---

## 9. インデックス（`firestore.indexes.json`）

### 9.1 [x] エンプラ向け新規インデックス

- **論点**: `collectionGroup('member_orders')` で企業横断集計するためのインデックス追加
- **必要なインデックス候補**:
  - `enterprise_id` + `status` + `updated_at`（企業全体の注文一覧）
  - `enterprise_id` + `user_id` + `updated_at`（企業内特定ユーザーの注文一覧）
  - `enterprise_id` + `event_id` + `status`（企業内特定イベントの集計）
- **推奨**: 上記 3 件を追加。Phase 2 で実利用パターンを見て調整
- **決定**: 上記 3 件を追加。Phase 2 で実利用パターンを見て調整する

---

## 10. 決定後に更新する仕様書

論点が決定したら、以下のドキュメントを更新する。

| 優先度 | ドキュメント | 主な更新内容 |
|:--|:--|:--|
| 高 | `documents/08_エンタープライズ/02_エンタープライズ_全体構成・アーキテクチャ.md` | 3.1 / 3.3 / 3.4 / 5 / 6.1 / 7 セクション全般。`orders` → `members` + `member_orders` + `stripes` への書き換え、`enterprise_subsidy_settings` の追加、Security Rules パターン更新、監査ログ粒度の明記 |
| 高 | `documents/08_エンタープライズ/01_エンタープライズ_仕様概要.md`（必要に応じて） | データ構造変更により仕様概要に影響がある場合 |
| 中 | `documents/08_エンタープライズ/04_割引・決済.md`（存在する場合） | 月額上限のトランザクション設計、`pay_enterprise_subsidy_amount` の計算ロジック詳細 |
| 中 | `documents/08_エンタープライズ/05_エンタープライズ_PF版_共通新機能.md` | enterprise_subsidy の monthly_usage 戻し（イベント中止機能の依存）の詳細化 |
| 低 | `documents/07_リファクタリング/05_EventOrder→EventMemberOrder.md` | エンプラ向け Security Rules 拡張パターンの参照リンク追加（必要に応じて） |

---

## 11. 進め方

1. 本ドキュメントの論点を関係者でレビュー
2. 各論点の決定内容を本ドキュメントに追記（`[ ]` → `[x]` に変更）
3. 決定内容を反映して 10. の対象ドキュメントを更新
4. 更新した仕様書をベースに実装着手
