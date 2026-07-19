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
