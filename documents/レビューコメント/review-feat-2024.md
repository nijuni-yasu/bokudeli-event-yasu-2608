# ブランチ feat/2024 レビュー記録

外部レビュー（Copilot）の RC-1〜RC-10 はレガシー [`pr-2157.md`](./pr-2157.md) を参照。

## 評価セッション（2026-07-19 13:06・shokujii-code-review）

- **評価日時**: 2026-07-19 13:06 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: feat/2024
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2157
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| — | — | — | — | — | — | — | — | — | 指摘なし |

### レビュー対象

Scheduled Functions の `timeoutSeconds` を 3600 → 1800 に修正し、仕様書・検証記録の上限記述を Scheduled 向け（1800秒 / 80%=1440秒）に更新。

### チェックリスト照合結果

- `onSchedule` の Firebase 上限（1800秒）に合致しており、sandbox `deploy_functions` 失敗の直接原因を解消
- 仕様書 §5.6.3 と検証記録の記述が公式 quota と整合
- `createModuleLogger` 使用、store 直接操作なし、export リスト整合は前回 RC で対応済み
- Storage 全量コピーの実行時間超過リスクは仕様書 §5.6.3「要確認」として既知（本修正のスコープ外）

- 指摘なし（チェックリスト照合のみ）

---

## 評価セッション（2026-07-19 13:07・review-comments-evaluate）

- **評価日時**: 2026-07-19 13:07 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: feat/2024
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2157
- **REVIEW_REQUEST_SINCE**: 2026-07-19T03:59:11Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼定型文、Codex 接続案内、storage.admin 再掲＝RC-4/5 と同一指摘）
- **partial 評価**: Codex substantive レビューなし（接続案内のみ）。Copilot のみ評価
- **手順 4a 自動修正**: RC-11〜RC-13（🚨 3件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-11 | 3609783351 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭 | 🔧 微修正 | S | firestore_backups デフォルト ARCHIVE + daily 15日削除<br>早期削除課金リスク。STANDARD に変更 |
| [x] | RC-12 | 3609783369 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭 | 🔧 微修正 | S | weekly/ の 30日 COLDLINE 移行が保持12週と不整合<br>weekly の lifecycle 移行を削除 |
| [x] | RC-13 | 3609783384 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭 | 🔧 微修正 | S | storage weekly/ の COLDLINE 移行が保持8週と不整合<br>weekly の lifecycle 移行を削除 |

---

**識別子**: RC-11（GitHub id: 3609783351）

**レビュワー**: Copilot

**指摘箇所**: `terraform/storage.tf:32`

**該当コード（レビュー時点の diff）**:

```diff
-  storage_class               = "ARCHIVE"
+  storage_class               = "STANDARD"
```

**レビュワーのコメント（原文）**:

[must] `firestore_backups` バケットの `storage_class = "ARCHIVE"` のまま `daily/` を 15 日で削除する運用だと、ARCHIVE の最小保存期間（早期削除課金）に抵触してコストが大きくなり得ます。日次は短期保持なので、少なくともデフォルトの storage_class は `STANDARD` 等の短期向けクラスにし、必要なら tier ごとにライフサイクルで段階移行する設計に寄せたいです。

**コメント要約**: バケット既定 ARCHIVE のまま daily を 15 日で削除すると早期削除課金の恐れ。<br>日次 tier 向けに STANDARD 既定へ変更する必要がある。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: daily/ は 14 日保持で lifecycle 15 日削除。ARCHIVE 最小保存期間（365 日）と矛盾。monthly/ の COLDLINE 移行は lifecycle で維持し、既定クラスのみ STANDARD に変更。

---

**識別子**: RC-12（GitHub id: 3609783369）

**レビュワー**: Copilot

**指摘箇所**: `terraform/storage.tf:52`（修正前）

**該当コード（レビュー時点の diff）**:

```diff
-  lifecycle_rule { ... weekly/ → COLDLINE at 30 days ... }
（weekly/ の SetStorageClass ルールを削除）
```

**レビュワーのコメント（原文）**:

[must] `firestore_backups` の `weekly/` を 30 日で `COLDLINE` に移行していますが、Functions 側の保持は `FIRESTORE_RETENTION.weekly = 12`（= 約 84 日）なので、COLDLINE の最小保存期間（90 日）に満たず早期削除課金が発生しやすいです。保持本数・移行先クラス・移行タイミングをセットで見直して、課金前提でない構成に揃えたいです。

**コメント要約**: weekly 保持 12 本（約 84 日）に対し 30 日で COLDLINE 移行すると 90 日最小保存期間未満で削除されうる。<br>weekly prefix の COLDLINE lifecycle を削除し、monthly のみ移行する構成に変更。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 保持本数ベース削除（最大約 84 日）と COLDLINE 90 日最小保存期間が両立しない。仕様 §3.1.3 / §4.4 に合わせ monthly/ のみ Coldline 移行とし weekly は Standard 維持。

---

**識別子**: RC-13（GitHub id: 3609783384）

**レビュワー**: Copilot

**指摘箇所**: `terraform/storage.tf:99`（修正前）

**該当コード（レビュー時点の diff）**:

```diff
-  lifecycle_rule { ... weekly/ → COLDLINE at 30 days ... }
（storage_backups の weekly/ SetStorageClass ルールを削除）
```

**レビュワーのコメント（原文）**:

[must] `storage_backups` の `weekly/` を 30 日で `COLDLINE` に移行していますが、Functions 側の保持は `STORAGE_RETENTION.weekly = 8`（= 約 56 日）なので、COLDLINE の最小保存期間（90 日）に満たず早期削除課金が発生しやすいです。Firestore 側と同様、保持本数・移行先クラス・移行タイミングの整合を取ってください。

**コメント要約**: Storage weekly 保持 8 本（約 56 日）では COLDLINE 移行後 90 日未満で削除されうる。<br>firestore 側と同様 weekly の COLDLINE lifecycle を削除。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-12 と同型。保持 8 週は COLDLINE 最小保存期間を下回るため lifecycle 移行を削除。仕様 §3.2.3 を更新。

---

## 評価セッション（2026-07-19 13:20・review-comments-evaluate auto）

- **評価日時**: 2026-07-19 13:20 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: feat/2024
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2157
- **REVIEW_REQUEST_SINCE**: 2026-07-19T04:12:39Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0
- **partial 評価**: false（Codex + Copilot とも substantive レビューあり）
- **手順 4a 自動修正**: RC-15, RC-19, RC-21（🚨 3件・作業ツリー未コミット）。RC-14, RC-18, RC-20 は前コミットで対応済み

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-14 | 3609804639 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔧 運用 | 🔧 微修正 | S | Scheduled timeout 3600→1800（48181928f） |
| [x] | RC-15 | 3609804641 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 データ | 🔧 微修正 | S | export outputUriPrefix を実行ごとに一意 subfolder 化 |
| [ ] | RC-16 | 3609804644 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔧 運用 | 📄 ドキュメントのみ | S | 旧 `backupFirestore` を `functions:delete` で明示削除 |
| [x] | RC-17 | 3609804647 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 データ | 🆕 新機能 | M | Storage 部分バックアップを完了マーカー付きまで retention 対象外 |
| [x] | RC-18 | 3609804648 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭 | 🔧 微修正 | S | firestore_backups ARCHIVE→STANDARD（9a50ef281） |
| [x] | RC-19 | 3609804652 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 データ | 🔧 微修正 | S | legacy 直下 export を daily 保持本数で削除 |
| [x] | RC-20 | 3609804654 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭 | 🔧 微修正 | S | storage weekly COLDLINE lifecycle 削除（9a50ef281） |
| [x] | RC-21 | 3609813234, 3609813252 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📄 ドキュメント | 📄 ドキュメントのみ | S | terraform/README.md の ARCHIVE 記載を STANDARD に修正 |
| [x] | RC-22 | 3609813260 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭 | 📋 仕様追加 | M | export 1800秒 timeout + operation.promise 待ちのリスク（仕様 §5.6.3 要確認） |

---

**識別子**: RC-15（GitHub id: 3609804641）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/backup/firestoreExport.ts`

**レビュワーのコメント（原文）**:

Scheduled Function の `outputUriPrefix` が `gs://bucket/daily/` 固定だと、同一 tier 内で export フォルダ名が衝突しうる。実行ごとに一意 subfolder を付与すること。

**コメント要約**: tier prefix のみだと Admin API の export 先が衝突する可能性がある。<br>`buildFirestoreExportOutputUriPrefix` で `yyyy-MM-dd'T'HH:mm:ss` サブフォルダを付与。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: リトライ・並行実行時に同一 prefix へ書き込むと export が破損しうる。JST タイムスタンプ subfolder で一意化。

---

**識別子**: RC-19（GitHub id: 3609804652）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/backup/retention.ts`（legacy 直下 export 削除）

**レビュワーのコメント（原文）**:

既存 development / production の旧 `backupFirestore` export がバケット直下に残っているため、無条件全削除は本番データ喪失リスク。保持本数管理に組み込むこと。

**コメント要約**: legacy 直下 export をすべて削除せず、`FIRESTORE_RETENTION.daily` 本数で `selectPrefixesToDelete` 適用。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 移行期間中の legacy export は tier 外だが Firestore export メタデータを持つ。daily 保持上限（14 本）で削除対象を選別。

---

**識別子**: RC-17（GitHub id: 3609804647）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/backup/retention.ts`

**レビュワーのコメント（原文）**:

`storageBackup*` がタイムアウトや copy 失敗で途中終了した場合でも、既に作られた `daily/YYYY-MM-DD` プレフィックスが retention 対象になり、不完全バックアップが保持される。完了マーカー等で成功分のみカウントすべき。

**コメント要約**: Storage 部分コピー完了前の prefix を retention から除外する完了マーカー設計が必要。

**評価**: 🚨 必須修正

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 データ

**変更種別**: 🆕 新機能

**想定工数**: M

**判断理由**: copy 完了後に `_SUCCESS` 等のマーカー書き込み + retention 側フィルタが必要。仕様書への追記と storageCopy 改修がセット。手順 4a 対象外（設計判断）。

**ステータス（追記 2026-07-19）**: ✅ 対応済み — `storageCopy.ts` で `_inprogress` コピー + `_SUCCESS` マーカー、`retention.ts` で完了 run のみカウント・ incomplete 削除。仕様 §5.6.6 追記。

---

**識別子**: RC-22（GitHub id: 3609813260）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/backup/firestoreExport.ts`

**レビュワーのコメント（原文）**:

[ask] `timeoutSeconds: 1800` の Scheduled Function で `await operation.promise()` まで待つ構成だと、DB サイズ次第で export が 30 分を超えた場合に Function 側が timeout → retry で export が重複起動するリスクがある。

**コメント要約**: 大規模 DB では 1800 秒内に export 完了しない可能性。重複 export のコスト・競合リスク。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 仕様書 §5.6.3 で「Scheduled 1800 秒上限・大規模 DB は要確認」と既知。非同期起動 + 別途完了監視は別設計。reply で現状認識と監視方針を回答予定。

**ステータス（追記 2026-07-19）**: ✅ 対応済み — 本番 `bokudeli-event-dev` の Operations API 計測（直近 30 日次 export）。所要時間 55〜73 秒（上限 1800 秒・安全圏 1440 秒以内）。`operation.promise()` 待ち構成を維持。検証記録 §4.1 記入済み。

---

## 評価セッション（2026-07-19 14:10・shokujii-code-review）

- **評価日時**: 2026-07-19 14:10 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: feat/2024
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2157
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| — | — | — | — | — | — | — | — | — | 指摘なし |

### レビュー対象

RC-16（デプロイ手順 v2.12・`backupFirestore` 明示削除）と RC-17（Storage `_inprogress` / `_SUCCESS` 完了マーカー + retention フィルタ）の未コミット差分。

### チェックリスト照合結果

- `storageCopy.ts`: コピー先 `_inprogress`、成功時 `_SUCCESS` 書き込み、再実行時 run prefix クリア
- `retention.ts`: `_SUCCESS` のみ保持カウント、incomplete run 削除、legacy（マーカー無し直下配置）互換
- `createModuleLogger` 使用、`any` / store 直接操作なし
- 仕様 §5.6.6・v2.12 手順書と実装の整合

- 指摘なし（チェックリスト照合のみ）

---

## 評価セッション（2026-07-19 14:40・shokujii-code-review）

- **評価日時**: 2026-07-19 14:40 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: feat/2024
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2157
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3b 自動修正**: RC-23, RC-24（🟡 ドキュメント 2 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-23 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📄 ドキュメント | 📄 ドキュメントのみ | S | §9.2 のコスト試算が保持 17 本前の +¥3,100〜5,000 のまま |
| [x] | RC-24 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📄 ドキュメント | 📄 ドキュメントのみ | S | §5.6.5 試算例が 27 本前提の 1.35 TB のまま |

### レビュー対象

未コミット差分: `STORAGE_RETENTION` 週次 4・月次 6（合計 17 本）、仕様書・検証記録のコスト試算更新、`backup.test.ts` 期待値テスト。

### チェックリスト照合結果

- `STORAGE_RETENTION` と仕様 §9.3 / 検証記録 §3 の保持本数が一致（7+4+6=17）
- `retention.ts` は定数参照のため追加変更不要
- Terraform lifecycle（daily 8 日削除・monthly Coldline 30 日）と 6 ヶ月保持は整合
- `STORAGE_RETENTION` 回帰テスト追加済み
- `eslint-disable-next-line quotes` は luxon `toFormat` リテラル T の既知パターン（👌）
- RC-23 / RC-24 は 3b で同一セッション内修正済み

**識別子**: RC-23（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/09_運営向け機能/02_firestoreとstorageの自動バックアップ.md` §9.2

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: Storage 保持 17 本に短縮後も §9.2 のコスト試算行が「定常 +¥3,100〜5,000」のまま → 「+¥2,200〜3,800」に更新

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📄 ドキュメント

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

---

**識別子**: RC-24（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/09_運営向け機能/02_firestoreとstorageの自動バックアップ.md` §5.6.5

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 保持本数 17 本に更新後、試算例「50 GB → 1.35 TB」が旧 27 本前提のまま → 「850 GB」に更新

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📄 ドキュメント

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

---

## 評価セッション（2026-07-19 15:35・review-comments-evaluate）

- **評価日時**: 2026-07-19 15:35 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: feat/2024
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2157
- **REVIEW_REQUEST_SINCE**: 2026-07-19T06:20:09Z
- **partial**: false（Codex substantive なし・接続案内のみ）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼定型文 5014683946、Codex 接続案内 5014705508）
- **手順 4a 自動修正**: なし（RC-25 は Copilot 側コミット 001903a89 で対応済み）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-25 | 5014705243 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | README の IAM 表記が storage.admin のまま<br>objectAdmin に修正（Copilot コミット済み） |

**識別子**: RC-25（GitHub id: 5014705243）

**レビュワー**: Copilot

**指摘箇所**: `terraform/README.md:198`

**レビュワーのコメント（原文）**:

🚨 **[must]** `terraform/README.md:198` にて `roles/storage.admin` の記載が残っており、実装（`storage.tf` で `roles/storage.objectAdmin` 付与）と不一致でした。`roles/storage.objectAdmin` に修正しました（コミット: [terraform] #2024 README の Firestore SA IAM ロール表記を objectAdmin に修正）。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み（origin/feat/2024 の 001903a89）

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 実装と README の IAM 表記不一致は最小権限方針と整合。Copilot がリモートに直接修正済み。

---

**スキップ（RC 採番なし）**

- Copilot コメント内の「確認済み・対応済み」各項 — 既存 RC で対応済みの再確認
- **[ask] `firestoreExport.ts` timeout** — RC-22 と同一論点。検証記録 §4.1 実測記載済みのため 👌 修正不要

---

## 評価セッション（2026-07-19 15:41・shokujii-code-review）

- **評価日時**: 2026-07-19 15:41 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: feat/2024
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2157
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3b 自動修正**: RC-26（🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-26 | なし・エージェントレビュー | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | start_task が composer_mode を上書き消去<br>同一ターンの Ask 判定が失われる |

### レビュー対象

Ask モード self-review 無限ループ対策（案 A/B/C）: `composer_mode=chat` スキップ、`loop_count>=1` followup 停止、`[self-review]` followup ターン除外。`review-feat-2024.md` への evaluate 追記（RC-25）含む。

### チェックリスト照合結果

- `agent_usage_lib.py`: `persist_session_hook_meta` / `should_skip_self_review_gate` は usage report ack と同型で一貫
- `stop-gate-check.sh`: review スコープ判定後に skip 呼び出し（順序妥当）
- `test-agent-usage.py`: Ask / followup の 2 ケース追加済み
- 案 B（`loop_count>=1` で gate 通過）は Agent でも 2 ターン目以降レビュー強制を止める意図どおり（👌）
- Plan モードは今回スコープ外（Ask=`chat` のみ。👌）

**識別子**: RC-26（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/agent_usage_lib.py:502`

**該当コード（レビュー時点の diff）**:

```diff
+        task = {
+            "task_id": task_id,
+            "task_skill": skill,
+            ...
+        }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `record_task_start` で `persist_session_hook_meta` の直後に `start_task` が active task を丸ごと置換し、`composer_mode` が消える → 既存 task / payload から `composer_mode` と `skip_next_self_review_gate` をマージして引き継ぐ

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: スキル起動ターンでも Ask 判定を維持するため。3b で `start_task` にマージ処理を追加済み。
