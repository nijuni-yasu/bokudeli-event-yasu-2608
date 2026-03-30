# Firestore データ移行手順（手作業・ローカル経由）

エージェントやスキルに `gcloud` を任せず、**エンジニアが自分の端末で**実施する前提。**export の実体を一度ローカルに保存**してから移行先へ載せる流れとする。

## 対象プロジェクト（例）

| 役割 | プロジェクト ID（例） |
|------|------------------------|
| **移行元（A）** | `bokudeli-event-yasu-test` |
| **移行先（B）** | `bokudeli-event-yasu-2603` |

- Aのバケット名：bokudeli-event-test-firestore-backups
- Bのバケット名：bokudeli-event-yasu-2603-firestore-imports
- 最新バックアップのフォルダ名：2026-03-29T17:00:07_99530
- ローカルのダウンロード先：~/Github/firestore-backups/

## ターミナルで移行元の「プロジェクトA」に設定する
gcloud config set project bokudeli-event-test
gcloud auth application-default set-quota-project bokudeli-event-test

## 設定確認
cat ~/.config/gcloud/application_default_credentials.json
gcloud config list

## 「プロジェクトA」のGCPコンソールへ
- GCPストレージを開く：https://console.cloud.google.com/storage/browser?forceOnBucketsSortingFiltering=true&hl=ja&project=bokudeli-event-test
- ストレージのバックアップのバケットを確認：bokudeli-event-test-firestore-backups 
- 最新のディレクトリのパスをコピーする：bokudeli-event-test-firestore-backups/2026-03-29T17:00:07_99530

## ターミナルで 「プロジェクトA」のフォルダをダウンロードする
gsutil -m cp -r \
  gs://bokudeli-event-test-firestore-backups/2026-03-29T17:00:07_99530 \
  ~/Github/firestore-backups/

## ターミナルで移行先の「プロジェクトB」に設定する
gcloud config set project bokudeli-event-yasu-2603
gcloud auth application-default set-quota-project bokudeli-event-yasu-2603

## 「プロジェクトB」にフォルダをアップロードする
gsutil -m cp -r \
  ~/Github/firestore-backups/2026-03-29T17:00:07_99530 \
  gs://bokudeli-event-yasu-2603-firestore-imports/

## 「プロジェクトB」のfirestoreの削除
- firebaseを開く：https://console.firebase.google.com/u/0/project/bokudeli-event-yasu-2603/firestore/databases/-default-/data?hl=ja
- firebaseのfirestoreにて全てのコレクションを削除する。
- GCP firestoreにて(default)を削除すると、5分ほど待つ必要がある
- 削除しないと、既存データが残って上書きされる。別プロジェクトだと2つのプロジェクトが混ざる。

## 「プロジェクトB」のfirestoreのデータを設定する
- firestore画面を開く：https://console.cloud.google.com/firestore/databases/-default-/import-export?hl=ja&project=bokudeli-event-yasu-2603
- バケットを選択してimportする

## indexをデプロイする
- indexとルールをデプロイし直す。Actoinsのfirestoreを発火する

------------------------------------------------------------------------------------------------


## 重要: マネージド export/import とローカル

Google の **マネージド** `gcloud firestore export` / `import` は、**Cloud Storage 上の `gs://...` を前提**にする。**ローカルパスだけで import を完結させることはできない。**

「ローカルに保存する」実務上の意味は次のとおり。

1. **A のバケットに export → 端末へダウンロード → B のバケットへアップロード → B で import**（本手順の正規ルート）
2. 検証のため、**ローカルにコピーを残す**（作業後の削除・暗号化は必須）

---

## ローカル保存を選ぶときのリスクと対策

GCS 直コピーと比べ、**本番相当データの端末残留**、誤操作、削除漏れのリスクが増える。最低限次を決めてから実施する。

- **端末**: 会社管理端末、ディスク暗号化（FileVault 等）、画面ロック
- **保存場所**: プロジェクト用の一時ディレクトリのみ。**クラウド同期フォルダ**（Dropbox 等）に置かない
- **作業後**: 検証・import 完了後、組織のデータ消去方針に従いローカルデータを削除する
- **アクセス**: 作業中だけ必要最小限のユーザーに限定

---

## 事前に揃えるもの

- `gcloud` CLI が入り、**オペレータアカウント**で A・B の両方（または段階ごと）にログインできる
- **A**: Firestore の **export 用 GCS バケット**（既存でも可）
- **B**: Firestore **import 用 GCS バケット**（ロケーションは B の Firestore と [Export and import data](https://firebase.google.com/docs/firestore/manage-data/export-import) の要件に整合）
- **B のバケット**に、公式手順どおり **B の Firestore サービスエージェント**（`service-<BのprojectNumber>@gcp-sa-firestore.iam.gserviceaccount.com`）へ **オブジェクト読み取り**（例: `roles/storage.objectViewer`）を付与済みであること
- **`firestore.rules` は import されない** → B に同等ルールをデプロイ済みまたは import 直後にデプロイ
- **複合インデックス**はリポジトリの `firestore.indexes.json` 等から B にデプロイ済み
- A が **名前付き DB** の場合、B でも **`--database`** を一致させる
- **カットオーバー**: どの export を正とするか、A の書き込み停止の要否
- **Authentication・Cloud Storage（アプリ用）・Secrets・外部サービス連携**は本手順だけでは移行されない（別タスク）

### バックアップ形式の確認

取得元が **マネージド export** の形式であること（PITR 専用・別製品のダンプだけでは `firestore import` できない場合がある）。不明なら GCS 上の階層で `overall_export_metadata` を含む一式か確認する。

---

## 変数の例（実行前に実値に置き換え）

```bash
# UTC のスラッグ（バケット名・プレフィックス用。末尾は小文字 z）
UTC_SLUG=2026-03-30-12-00-00z

PROJECT_A=bokudeli-event-yasu-test
PROJECT_B=bokudeli-event-yasu-2603

# A/B のバケット名は組織ルールに合わせる（GCS 全体で一意・63 文字以内・小文字推奨）
BUCKET_A=<test側のexport用バケット名>
BUCKET_B=<2603側のimport用バケット名>

EXPORT_PREFIX=firestore-export/${UTC_SLUG}
GS_URI_A="gs://${BUCKET_A}/${EXPORT_PREFIX}/"
GS_URI_B="gs://${BUCKET_B}/${EXPORT_PREFIX}/"

# ローカル（絶対パス推奨。同期フォルダ外）
LOCAL_DIR="${HOME}/tmp/firestore-migrate-${UTC_SLUG}"
```

---

## 手順概要

| 段 | 内容 |
|----|------|
| 1 | B のバケット・Firestore エージェント IAM |
| 2 | A で `firestore export` → `GS_URI_A` |
| 3 | ローカルへダウンロード |
| 4 | B のバケットへアップロード |
| 5 | `*overall_export_metadata` の親を特定し B で `firestore import` |
| 6 | 検証 |
| 7 | ローカル削除・GCS・IAM の片付け |

---

### 1. プロジェクト B の準備

```bash
gcloud config set project "${PROJECT_B}"
```

import 用バケット `BUCKET_B` を未作成なら作成する（`gcloud storage buckets create` の `--location` は `gcloud firestore databases list --project="${PROJECT_B}"` 等で Firestore と整合させる）。

B の Firestore サービスエージェントに、import 用バケットの読み取りを付与する。

```bash
PN_B=$(gcloud projects describe "${PROJECT_B}" --format='value(projectNumber)')
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_B}" \
  --project="${PROJECT_B}" \
  --member="serviceAccount:service-${PN_B}@gcp-sa-firestore.iam.gserviceaccount.com" \
  --role=roles/storage.objectViewer
```

---

### 2. プロジェクト A で export

カットオーバー方針に従い、必要なら **A への書き込み停止**のうえで実行する。

```bash
gcloud config set project "${PROJECT_A}"
gcloud firestore export "${GS_URI_A}" --database="(default)"
```

名前付き DB の場合は `--database=DB_ID` に置き換える。

完了後、メタデータが期待どおりのプレフィックスにあるか確認する。

```bash
gcloud storage ls --recursive "${GS_URI_A}" | grep overall_export_metadata
```

**import に渡すのは「単一 export 1 回分のルート」**である。複数日分の親フォルダを指定しない。

---

### 3. ローカルへダウンロード

```bash
mkdir -p "${LOCAL_DIR}"
gcloud config set project "${PROJECT_A}"
gcloud storage cp --recursive "${GS_URI_A}" "${LOCAL_DIR}/"
```

`gsutil -m cp -r "${GS_URI_A}" "${LOCAL_DIR}/"` でもよい。  
**容量と機密性**を確認し、ダウンロード中は端末の取り扱いに注意する。

**Cursor 等のエージェントが `gcloud` を実行する場合**、実行環境が `~/.config/gcloud` へ書き込めないと失敗することがある。本手順は**エンジニアのローカル端末**での実行を想定する。

---

### 4. プロジェクト B のバケットへアップロード

```bash
gcloud config set project "${PROJECT_B}"
gcloud storage cp --recursive "${LOCAL_DIR}/" "${GS_URI_B}"
```

**階層ずれ**: `cp --recursive` で**ソース・先の末尾スラッシュ**の組み合わせにより、B 側で **フォルダが 1 段余分にネスト**することがある。次節で必ず実パスを確認する。

---

### 5. import 用 `gs://` ルートの確定（必須）

**`GS_URI_B` を決め打ちで import に渡さない。** 実際に `overall_export_metadata` がある **親ディレクトリ**を使う。

```bash
gcloud storage ls --recursive "${GS_URI_B}" | grep overall_export_metadata
```

表示されたオブジェクトパスから **ファイル名を除いた `gs://.../`** を `GS_IMPORT_ROOT` に設定し、import する。

```bash
# GS_IMPORT_ROOT は上記で確定した実パスに置き換える
gcloud config set project "${PROJECT_B}"
gcloud firestore import "${GS_IMPORT_ROOT}" --database="(default)"
```

import を実行するアカウントに、B で **Firestore の import 権限**（組織に合わせて `roles/datastore.importExportAdmin` 等）があること。

---

### 6. 検証

- Firebase Console またはクエリで、主要コレクションの件数・サンプルドキュメントを確認する
- Import は既存ドキュメントと ID が重なる場合、期待と異なるマージ・上書きになることがある。**初回は B が空または検証専用**で試すことを推奨する

---

### 7. 片付け

**ローカル**

```bash
rm -rf "${LOCAL_DIR}"
```

組織方針があれば、単なる `rm` 以上の消去手順に従う。

**GCS・IAM（運用に応じて）**

- 一時バケットや一時プレフィックスのライフサイクル
- B の Firestore エージェントに付けた B バケット読み取りを、再 import しない方針なら縮小・削除を検討

本手順では **import が読むのは B のバケットのみ**とし、B の Firestore エージェントに **A のバケット**を読ませ続けない方針を維持する。

---

## 事前確認チェックリスト

- [ ] A の `gs://` パス（export のプレフィックス）を特定した
- [ ] import に渡す URI は **単一 export 1 回分のルート**である
- [ ] アップロード後、`overall_export_metadata` の **親の実パス**を `GS_IMPORT_ROOT` として決めた
- [ ] B に import 用バケットを用意し、Firestore エージェントに読み取りを付与した
- [ ] B の Firestore が空、または上書き・マージ結果を許容できる
- [ ] **カットオーバー方針**（どの export を正とするか、A の書き込み停止の要否）を決めた
- [ ] B で **セキュリティルール・インデックス**が必要な状態になっている（または import 直後にデプロイする）
- [ ] A / B とも **データベース ID**（default か名前付きか）を確認した
- [ ] **ローカル保存・削除**の担当と起票を決めた

---

## 注意事項

- 大規模データではダウンロード・アップロード・import に時間がかかる。メンテナンスウィンドウを検討する
- VPC Service Controls 等で端末からの横断アクセスが制限される場合は、組織手順に従う（`firestoreデータ移行手順_スキル.md` の「組織制約」参照）
