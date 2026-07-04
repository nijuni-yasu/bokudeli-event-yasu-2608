# Firestore / Storage 自動バックアップ — 検証記録

実装計画フェーズ 0（[02_firestoreとstorageの自動バックアップ.md](./02_firestoreとstorageの自動バックアップ.md) 5.5.3〜5.5.5）の記録用。

**実施者:** _______________  
**対象プロジェクト ID:** _______________  
**実施日:** _______________

---

## 1. Storage 容量（5.5.3 / 5.5.5）

```bash
gcloud config set project <PROJECT_ID>
gcloud storage du -s "gs://<DEFAULT_BUCKET>/**"
```

| 項目 | 結果 |
|:--|:--|
| 既定バケット名 | |
| 合計サイズ | GB |
| オブジェクト数（任意） | |

---

## 2. ベンチマークコピー（5.5.3）

```bash
time gcloud storage cp -r "gs://<DEFAULT_BUCKET>/*" "gs://<TEST_BACKUP_BUCKET>/benchmark-$(date +%Y%m%d)/"
```

| 項目 | 結果 |
|:--|:--|
| 所要時間（秒） | |
| Functions 上限 3600 秒の 80%（2880 秒）以内 | はい / いいえ |
| 採用方式 | Functions / Cloud Run Job / Transfer Service |

---

## 3. コスト試算（5.5.5）

```
概算保管量 ≒ バケットサイズ × 27（日次7 + 週次8 + 月次12）
月間読取 ≒ バケットサイズ × 30日
```

| 項目 | 結果 |
|:--|:--|
| 概算保管量 | TB / GB |
| 概算月額（Standard） | 円 |
| 予算内 | はい / いいえ |

---

## 4. export とクリーンアップ競合（5.5.4）

| 項目 | 結果 |
|:--|:--|
| export 完了〜`overall_export_metadata` 出現 | 分 |
| dry-run cleanup で当日分が削除対象外 | はい / いいえ |
| operation 完了待ちを実装に採用 | はい（`firestoreExport.ts`） |

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
