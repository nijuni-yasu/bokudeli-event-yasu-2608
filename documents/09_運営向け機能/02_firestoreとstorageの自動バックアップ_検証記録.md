# Firestore / Storage 自動バックアップ — 検証記録

実装計画フェーズ 0（[02_firestoreとstorageの自動バックアップ.md](./02_firestoreとstorageの自動バックアップ.md) 5.5.3〜5.5.5）の記録用。

**実施者:** AI エージェント（Cursor）  
**対象プロジェクト ID:** `bokudeli-event-dev`（本番 Firebase）  
**実施日:** 2026-07-19

---

## 1. Storage 容量（5.5.3 / 5.5.5）

```bash
gcloud config set project <PROJECT_ID>
gcloud storage du -s "gs://<DEFAULT_BUCKET>/**"
```

| 項目 | 結果 |
|:--|:--|
| 既定バケット名 | `bokudeli-event-dev.appspot.com` |
| 合計サイズ | **24.1 GB**（25,828,699,976 bytes） |
| オブジェクト数（任意） | **45,512** |

---

## 2. ベンチマークコピー（5.5.3）

```bash
time gcloud storage cp -r "gs://<DEFAULT_BUCKET>/*" "gs://<TEST_BACKUP_BUCKET>/benchmark-$(date +%Y%m%d)/"
```

**本番計測（2026-07-19）**

```bash
/usr/bin/time -p gcloud storage cp -r \
  "gs://bokudeli-event-dev.appspot.com/*" \
  "gs://bokudeli-event-dev-backup-260716/benchmark-20260719/"
```

| 項目 | 結果 |
|:--|:--|
| コピー元 | `gs://bokudeli-event-dev.appspot.com/*` |
| コピー先（検証用） | `gs://bokudeli-event-dev-backup-260716/benchmark-20260719/` |
| 所要時間（秒） | **72 秒**（`real 72.35`、平均スループット 485 MiB/s） |
| Functions 上限 1800 秒（Scheduled）の 80%（1440 秒）以内 | **はい** |
| 採用方式 | **Functions**（現容量・現オブジェクト数では余裕あり） |
| 備考 | `gcloud storage cp` は CLI 並列転送のため、Functions 実装（`storageCopy.ts`、並列 10・オブジェクト単位 copy）より**速い側**の目安。デプロイ後は Scheduler 手動実行で Function 実行時間も確認推奨 |

---

## 3. コスト試算（5.5.5 / 仕様 5.6.5.1）

```
概算保管量 ≒ バケットサイズ × 17（日次7 + 週次4 + 月次6）
月間読取 ≒ バケットサイズ × 30日
```

| 項目 | 結果 |
|:--|:--|
| ベースライン（2026 年 6 月請求） | プロジェクト合計 **¥2,283**（Storage ¥203 / Firestore ¥528 / Functions ¥169 / その他 ¥1,381） |
| 概算保管量（Storage バックアップ上限） | **410 GB**（24.1 GB × 17） |
| Firestore export 保管（上限） | **6.4 GB**（127 MB × 50） |
| 追加月額（定常・現実的） | **+¥2,200〜3,000** |
| 追加月額（定常・上限） | **+¥3,000〜3,800** |
| 導入後合計月額（6 月比） | **¥4,500〜6,100**（**約 2.0〜2.7 倍**） |
| 予算内 | **はい**（本番適用可。Storage 保持 17 本。50 GB 超・予算超過時に再試算） |

詳細は [仕様書 5.6.5.1 / 6.4](./02_firestoreとstorageの自動バックアップ.md) を参照。

---

## 4. export とクリーンアップ競合（5.5.4 / §5.6.4）

| 項目 | 結果 |
|:--|:--|
| export 完了〜`overall_export_metadata` 出現 | 分 |
| dry-run cleanup で当日分が削除対象外 | はい / いいえ |
| operation 完了待ちを実装に採用 | はい（`firestoreExport.ts`） |

### 4.1 Firestore export 所要時間（RC-22 / §5.6.3・§5.6.4）

Scheduled Function（1800 秒上限）内に export が完了するか。`operation.promise()` 待ちのため **Function 実行時間 ≒ export 全体時間**。

**判定基準**

| 閾値 | 意味 |
|:--|:--|
| 1800 秒 | Scheduled Function 上限 |
| 1440 秒（80%） | 安全圏 |
| 1440 秒超 | 設計見直しを検討 |

**計測手順**（`gcloud auth login` 後に実行）

```bash
PROJECT_ID=bokudeli-event-dev   # 本番 Firebase プロジェクト
gcloud config set project "${PROJECT_ID}"

# DB 概要
gcloud firestore databases describe --database='(default)' \
  --format='yaml(name,locationId,type,pointInTimeRecoveryEnablement)'

# 直近完了 export の start/end（operations API）
gcloud firestore operations list --project="${PROJECT_ID}" \
  --filter='done=true AND metadata.operationType:EXPORT_DOCUMENTS' \
  --limit=5 \
  --format='table(name,metadata.startTime,metadata.endTime,done)'

# 個別 operation の詳細（上記 name の末尾 ID を指定）
# gcloud firestore operations describe "operations/ASA..." --project="${PROJECT_ID}"
```

**手動トリガー**（新 `firestoreExportDaily` デプロイ後）: Cloud Scheduler で `firebase-schedule-firestoreExportDaily-*` を「今すぐ実行」。  
**本番未デプロイ時**: 既存 `backupFirestore` が起動した export の operations 時間でも DB サイズに対する export 時間の目安になる（旧 Function は完了待ちしないが、export 自体の所要時間は同じ）。

| 項目 | 結果 |
|:--|:--|
| 対象プロジェクト | `bokudeli-event-dev`（本番 Firebase） |
| 計測方法 | Firestore Operations API（`backupFirestore` 日次 export、`ExportDocumentsMetadata`） |
| 計測日 | 2026-07-19 |
| export 開始〜完了（秒） | **直近（2026-07-18）: 61 秒**。直近 30 回: 最大 **73 秒**、平均 **55 秒** |
| 1800 秒以内 | **はい** |
| 1440 秒（80%）以内 | **はい** |
| 判定 | **Functions 継続 OK**（`operation.promise()` 待ちを維持） |
| 備考 | DB 約 223k docs / 127 MB export。PITR は未有効（計測時点）。新 `firestoreExportDaily` 未デプロイだが同一 DB の export 時間として有効。DB 成長時は再計測 |

**Copilot reply 用（記入例）**

> `backupFirestore` 日次 export（Operations API）の計測で export 所要時間は **約 55〜73 秒**（上限 1800 秒、安全圏 1440 秒）。現時点では Functions 内 `operation.promise()` 待ちを維持。DB 成長に伴い再計測する。

---

## 5. デプロイ後確認（フェーズ 6）

### 5.1 Terraform import（既存バケットがある場合）

legacy export 等で **同名バケットが既に存在**する場合、`terraform plan` で `google_storage_bucket.*` が **create** になるときは apply 前に import する。

```bash
cd terraform
terraform import google_storage_bucket.firestore_backups <PROJECT_ID>-firestore-backups
terraform import google_storage_bucket.storage_backups <PROJECT_ID>-storage-backups
```

import 後に再度 `terraform plan` し、lifecycle / IAM の差分のみになることを確認してから `apply` する。

### 5.2 チェックリスト

- [ ] Terraform apply（バケット・IAM・PITR）。PITR は development で先行確認
- [ ] Functions deploy（7 Scheduled Functions）
- [ ] legacy `scheduled_firestore_export` が存在しない
- [ ] `BACKUP_RETENTION_DRY_RUN=true` で 1 日運用（legacy 直下 prefix が削除対象に含まれるか Console で確認）
- [ ] dry-run OFF 後、保持削除が動作
- [ ] Cloud Monitoring / Log-based Alert 設定（8 章）

---

## 6. 記録履歴

| 日付 | 内容 |
|:--|:--|
| 2026-06-03 | テンプレート作成。実装 PR と同時に追加 |
| 2026-06-03 | 5.1 Terraform import 手順を追加 |
| 2026-07-19 | §4.1 RC-22 export 所要時間計測テンプレートを追加 |
| 2026-07-19 | §4.1 RC-22 本番計測記入（直近 61 秒、最大 73 秒 / 30 日） |
| 2026-07-19 | §1 Storage 容量計測（24.1 GB / 45,512 objects） |
| 2026-07-19 | §2 ベンチマークコピー計測（72 秒、gcloud cp） |
| 2026-07-19 | §3 コスト試算記入（6 月 ¥2,283 ベース） |
| 2026-07-19 | §3 Storage 保持 17 本に短縮反映（週次4・月次6） |
