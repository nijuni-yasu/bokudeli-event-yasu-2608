# Firestore データ移行手順（手作業・ローカル経由）

エージェントやスキルに `gcloud` を任せず、**エンジニアが自分の端末で**実施する前提。**export の実体を一度ローカルに保存**してから移行先へ載せる流れとする。

## 対象プロジェクト（例）

| 役割 | プロジェクト ID（例） |
|------|------------------------|
| **移行元（A）** | `bokudeli-event-dev` |
| **移行先（B）** | `bokudeli-event-yasu-2604` |

- A のバケット名：`bokudeli-event-dev-firestore-backups`
- B のバケット名：`bokudeli-event-yasu-2604-firestore-imports`
- 最新バックアップのフォルダ名：`2026-06-21T17:00:09_95526`
- ローカルのダウンロード先：`~/Github/firestore-backups/`

> **注意**: 上記のバックアップフォルダ名は例である。作業前に A のバケット内で **最新の export フォルダ**を確認し、実値に置き換えること。`overall_export_metadata` を含む **単一 export 1 回分**のフォルダを選ぶ。

---

## 手順概要

| 段 | 内容 |
|----|------|
| 0 | 事前確認（IAM・バックアップフォルダの特定） |
| 1 | A プロジェクト設定 |
| 2 | A の export をローカルへダウンロード |
| 3 | B の import 用バケットへアップロード |
| 4 | B の Firestore 既存データ削除 |
| 5 | `overall_export_metadata` の親を特定し B で import |
| 6 | ルール・インデックスのデプロイ |
| 7 | メールアドレス削除（`0004_delete_emails_for_drytest.js`） |
| 8 | Storage 移行（[storageデータ移行手順_手動.md](./storageデータ移行手順_手動.md)） |
| 9 | 検証 |
| 10 | 片付け |

§7 で **0004 メール削除**を実行してから、§8 で [storageデータ移行手順_手動.md](./storageデータ移行手順_手動.md) に従い Storage を移行する（import 直後に本番メールが sandbox に残る時間を最小化するため）。

---

## 0. 事前確認

### B の import 用バケット・Firestore エージェント IAM

B の import 用バケット `bokudeli-event-yasu-2604-firestore-imports` が未作成なら作成する（ロケーションは B の Firestore と [Export and import data](https://firebase.google.com/docs/firestore/manage-data/export-import) の要件に整合させる）。

B の Firestore サービスエージェントに、import 用バケットの読み取りを付与する。

```bash
PROJECT_B=bokudeli-event-yasu-2604
BUCKET_B=bokudeli-event-yasu-2604-firestore-imports

gcloud config set project "${PROJECT_B}"

PN_B=$(gcloud projects describe "${PROJECT_B}" --format='value(projectNumber)')
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_B}" \
  --project="${PROJECT_B}" \
  --member="serviceAccount:service-${PN_B}@gcp-sa-firestore.iam.gserviceaccount.com" \
  --role=roles/storage.objectViewer
```

### A の最新バックアップを確認する

```bash
gcloud config set project bokudeli-event-dev
gcloud storage ls gs://bokudeli-event-dev-firestore-backups/
```

GCP コンソールでも確認できる。

- GCP ストレージ（A）: https://console.cloud.google.com/storage/browser?hl=ja&project=bokudeli-event-dev
- バケット: `bokudeli-event-dev-firestore-backups`
- 最新フォルダ例: `2026-06-21T17:00:09_95526`

メタデータの存在確認:

```bash
EXPORT_FOLDER=2026-06-21T17:00:09_95526  # 実値に置換

gcloud storage ls --recursive \
  "gs://bokudeli-event-dev-firestore-backups/${EXPORT_FOLDER}/" \
  | grep overall_export_metadata
```

### 本手順だけでは移行されないもの

- **Authentication**（Firebase Auth ユーザー）
- **Cloud Storage**（アプリ用バケットのオブジェクト）→ 別手順
- **Secret Manager・外部サービス連携**（Stripe / SendGrid 等）
- **`firestore.rules`・複合インデックス** → import 後にデプロイ

---

## 1. ターミナルで移行元の「プロジェクト A」に設定する

```bash
gcloud config set project bokudeli-event-dev
gcloud auth application-default set-quota-project bokudeli-event-dev
```

### 設定確認

```bash
gcloud auth list
gcloud config list
test -f ~/.config/gcloud/application_default_credentials.json && echo "ADC file exists"
```

---

## 2. 「プロジェクト A」の export をローカルへダウンロードする

```bash
EXPORT_FOLDER=2026-06-21T17:00:09_95526  # 実値に置換

mkdir -p ~/Github/firestore-backups/

gsutil -m cp -r \
  "gs://bokudeli-event-dev-firestore-backups/${EXPORT_FOLDER}" \
  ~/Github/firestore-backups/
```

`gcloud storage cp --recursive` でもよい。

```bash
gcloud storage cp --recursive \
  "gs://bokudeli-event-dev-firestore-backups/${EXPORT_FOLDER}" \
  ~/Github/firestore-backups/
```

**容量と機密性**（本番相当データ）を確認し、ダウンロード中は端末の取り扱いに注意する。作業後はローカルデータを削除する（[片付け](#10-片付け) 参照）。

---

## 3. ターミナルで移行先の「プロジェクト B」に設定し、アップロードする

```bash
gcloud config set project bokudeli-event-yasu-2604
gcloud auth application-default set-quota-project bokudeli-event-yasu-2604

EXPORT_FOLDER=2026-06-21T17:00:09_95526  # 実値に置換

gsutil -m cp -r \
  ~/Github/firestore-backups/${EXPORT_FOLDER} \
  gs://bokudeli-event-yasu-2604-firestore-imports/
```

**階層ずれ**: `cp --recursive` のソース・先の末尾スラッシュの組み合わせにより、B 側で **フォルダが 1 段余分にネスト**することがある。次の import 前に必ず実パスを確認する。

---

## 4. 「プロジェクト B」の Firestore 既存データを削除する

- Firebase Console: https://console.firebase.google.com/project/bokudeli-event-yasu-2604/firestore/databases/-default-/data?hl=ja
- Firestore にて **全コレクションを削除**する
- GCP Console で `(default)` データベース自体を削除した場合は、**再作成まで 5 分ほど待つ**

**削除しないと**、既存データが残って import 時にマージされ、別環境のデータが混ざる。

---

## 5. 「プロジェクト B」で Firestore import する

### import 用 `gs://` ルートの確定（必須）

**アップロード先を決め打ちで import に渡さない。** 実際に `overall_export_metadata` がある **親ディレクトリ**を使う。

```bash
gcloud storage ls --recursive \
  "gs://bokudeli-event-yasu-2604-firestore-imports/" \
  | grep overall_export_metadata
```

表示されたオブジェクトパスから **ファイル名を除いた `gs://.../`** を `GS_IMPORT_ROOT` に設定する。

例（階層が 1 段ネストしていない場合）:

```bash
GS_IMPORT_ROOT="gs://bokudeli-event-yasu-2604-firestore-imports/2026-06-21T17:00:09_95526/"
```

### import 実行

GCP Console から import してもよい。

- Import/Export 画面: https://console.cloud.google.com/firestore/databases/-default-/import-export?hl=ja&project=bokudeli-event-yasu-2604
- バケット `bokudeli-event-yasu-2604-firestore-imports` を選択する
- **Console**: Filename に `...overall_export_metadata` **ファイル**を指定する（[Firebase 公式](https://firebase.google.com/docs/firestore/manage-data/export-import#import_all_documents_from_an_export)）。親フォルダだけを選ぶと失敗することがある
- **CLI**: 親ディレクトリ `GS_IMPORT_ROOT` を指定する（上記で特定した `gs://.../`）

CLI の例:

```bash
gcloud config set project bokudeli-event-yasu-2604
gcloud firestore import "${GS_IMPORT_ROOT}" --database="(default)"
```

import を実行するアカウントに、B で **Firestore の import 権限**（組織に合わせて `roles/datastore.importExportAdmin` 等）があること。

---

## 6. ルール・インデックスをデプロイする

**`firestore.rules` と複合インデックスは import されない。** B にデプロイする。

```bash
firebase use bokudeli-event-yasu-2604
firebase deploy --only firestore:rules,firestore:indexes
```

または `bokudeli-event-yasu-2604` 向け GitHub Actions の Firestore デプロイワークフローを実行する。

---

## 7. メールアドレス削除（ドライテスト用）

本番データを個人 sandbox に載せたあと、**誤送信防止のため** `bokudeli-event-batch` の `0004_delete_emails_for_drytest.js` を実行する。**Storage 移行の前**に実施する（import 直後から sandbox に本番メールが残る時間を最小化するため）。

```bash
cd bokudeli-event-batch
yarn run util -- -m sandbox2604
```

確認プロンプトで **プロジェクト ID が `bokudeli-event-yasu-2604`** であること、**ファイル名が `0004_delete_emails_for_drytest.js`** であることを確認してから `y` を入力する。

> **注意（util の自動選択）**: [bokudeli-event-batch/index.js](../../bokudeli-event-batch/index.js) は `utils/` 内で **番号が最大のファイル**を実行する。`yarn run util` 実行前に `utils/` の一覧を確認し、0004 以外が選ばれる場合は **0004 より番号の大きい util を一時的に `utils/` 外へ退避**してから実行する。

スクリプトの安全ガード:

- `bokudeli-event-dev`（本番）では実行不可
- `-m production` / `-m development` では実行不可

0004 で削除・消去する主な対象:

| 対象 | 処理 |
|------|------|
| `users_personal_information` | `user_email`, `user_sns_google` フィールド削除 |
| `communities` | `community_email` 削除 |
| `events`（collectionGroup） | `community_bill_email`, `organizer_email`, `bill_email` 削除 |
| `partners > shops` | `shop_email`, `shop_email_sub1`〜`3` 削除 |
| `slackbots` + `channels` | ドキュメント全削除 |
| `pass_code` | 0004 **対象外**。0004 実行後も **必ず** `user_email` を削除する（下記参照） |

`pass_code` コレクションの `user_email` は 0004 の対象外である。**0004 実行後も必ず** Firebase Console 等で `pass_code` の `user_email` フィールドを削除する（本番相当 PII が sandbox に残らないようにする）。0004 への追加は bokudeli-event-batch 側で別 PR 対応を検討する。

---

## 8. Storage 移行

§7 のメール削除が完了したら、[storageデータ移行手順_手動.md](./storageデータ移行手順_手動.md) に従い、本番（A）の Storage オブジェクトを sandbox2604（B）へコピーする。

- Console で確認した **実バケット名**（例: `*.appspot.com` または `*.firebasestorage.app`）を使う
- B バケットを空にしてからコピー
- コピー後に `storage.rules` をデプロイ
- （任意）Facebook 画像移行 `0042`

---

## 9. 検証

- Firebase Console またはクエリで、主要コレクション（`communities`, `users`, `partners` 等）の件数・サンプルドキュメントを確認する
- Import は既存ドキュメントと ID が重なる場合、期待と異なるマージ・上書きになる。**B は import 前に空**にしておく
- 0004 実行後、代表ドキュメントに本番メールアドレスが残っていないことを確認する（`pass_code.user_email` を含む）

---

## 10. 片付け

### ローカル

```bash
EXPORT_FOLDER=2026-06-21T17:00:09_95526  # 手順中と同じ実値
rm -rf ~/Github/firestore-backups/${EXPORT_FOLDER}
```

組織方針があれば、単なる `rm` 以上の消去手順に従う。

### GCS・IAM（運用に応じて）

- 一時プレフィックスのライフサイクル設定
- B の Firestore エージェントに付けた import 用バケット読み取りを、再 import しない方針なら縮小・削除を検討

**import が読むのは B のバケットのみ**とし、B の Firestore エージェントに **A のバケット**を読ませ続けない。

---

## 重要: マネージド export/import とローカル

Google の **マネージド** `gcloud firestore export` / `import` は、**Cloud Storage 上の `gs://...` を前提**にする。**ローカルパスだけで import を完結させることはできない。**

「ローカルに保存する」実務上の意味は次のとおり。

1. **A のバケットに export → 端末へダウンロード → B のバケットへアップロード → B で import**（本手順の正規ルート）
2. 検証のため、**ローカルにコピーを残す**（作業後の削除・暗号化は必須）

GCS 上で A → B を直接コピーする方法は [firestoreデータ移行手順_スキル検討.md](./firestoreデータ移行手順_スキル検討.md) を参照。

---

## ローカル保存を選ぶときのリスクと対策

GCS 直コピーと比べ、**本番相当データの端末残留**、誤操作、削除漏れのリスクが増える。最低限次を決めてから実施する。

- **端末**: 会社管理端末、ディスク暗号化（FileVault 等）、画面ロック
- **保存場所**: `~/Github/firestore-backups/` 等、プロジェクト用の一時ディレクトリのみ。**クラウド同期フォルダ**（Dropbox 等）に置かない
- **作業後**: 検証・import 完了後、組織のデータ消去方針に従いローカルデータを削除する
- **アクセス**: 作業中だけ必要最小限のユーザーに限定

---

## 変数の例（実行前に実値に置き換え）

```bash
PROJECT_A=bokudeli-event-dev
PROJECT_B=bokudeli-event-yasu-2604

BUCKET_A=bokudeli-event-dev-firestore-backups
BUCKET_B=bokudeli-event-yasu-2604-firestore-imports

# A のバケット内で確認した最新 export フォルダ
EXPORT_FOLDER=2026-06-21T17:00:09_95526

GS_URI_A="gs://${BUCKET_A}/${EXPORT_FOLDER}/"
GS_URI_B="gs://${BUCKET_B}/${EXPORT_FOLDER}/"

LOCAL_DIR="${HOME}/Github/firestore-backups/${EXPORT_FOLDER}"
```

---

## 新規 export が必要な場合（任意）

既存の scheduled backup（`backupFirestore`、毎日 2:00 JST → `gs://bokudeli-event-dev-firestore-backups`）より **新しいスナップショット**が必要なときのみ実施する。本番への書き込み停止は通常不要だが、**export 時点より後の本番更新は B に入らない**点に注意する。

```bash
UTC_SLUG=2026-06-23-12-00-00z  # 作業日時（末尾は小文字 z）

gcloud config set project bokudeli-event-dev
gcloud firestore export \
  "gs://bokudeli-event-dev-firestore-backups/firestore-export/${UTC_SLUG}/" \
  --database="(default)"
```

完了後、`EXPORT_FOLDER` として上記プレフィックス（または出力されたフォルダ名）を手順 2 以降で使う。

---

## バックアップ形式の確認

取得元が **マネージド export** の形式であること（PITR 専用・別製品のダンプだけでは `firestore import` できない場合がある）。不明なら GCS 上の階層で `overall_export_metadata` を含む一式か確認する。

本番 `bokudeli-event-dev` の日次 backup は [backupFirestore.ts](../../functions/default/src/backupFirestore.ts) が `gs://bokudeli-event-dev-firestore-backups` へ export している。

---

## 事前確認チェックリスト

- [ ] A の `gs://` パス（export フォルダ `EXPORT_FOLDER`）を特定した
- [ ] import に渡す URI は **単一 export 1 回分のルート**である
- [ ] アップロード後、`overall_export_metadata` の **親の実パス**を `GS_IMPORT_ROOT` として決めた
- [ ] B に import 用バケット `bokudeli-event-yasu-2604-firestore-imports` を用意し、Firestore エージェントに読み取りを付与した
- [ ] B の Firestore が空（import 前に全削除済み）
- [ ] **カットオーバー方針**（どの export を正とするか）を決めた
- [ ] B で **セキュリティルール・インデックス**を import 直後にデプロイする手順が決まっている
- [ ] rules/indexes デプロイ **後・Storage 移行前**に **`0004_delete_emails_for_drytest.js`** を実行する（util 番号の罠に注意）
- [ ] 0004 後に **`pass_code.user_email`** を必ず削除する（0004 対象外のため）
- [ ] [Storage 移行](./storageデータ移行手順_手動.md) を §7 完了後に実施する
- [ ] **ローカル保存・削除**の担当と起票を決めた
- [ ] **Authentication** は別手順であることを理解した

---

## 注意事項

- 大規模データではダウンロード・アップロード・import に時間がかかる。メンテナンスウィンドウを検討する
- **本番（A）のデータを個人 sandbox（B）へコピーする**作業である。誤プロジェクトへの削除・import を防ぐため、各段階で `gcloud config list` を確認する
- VPC Service Controls 等で端末からの横断アクセスが制限される場合は、組織手順に従う（`firestoreデータ移行手順_スキル検討.md` の「組織制約」参照）
- **Cursor 等のエージェントが `gcloud` を実行する場合**、実行環境が `~/.config/gcloud` へ書き込めないと失敗することがある。本手順は**エンジニアのローカル端末**での実行を想定する
