# firestoreデータ移行手順

## 実施したいこと

GCP / Firebase の Firestore データを Cloud Storage にバックアップ（マネージド export）している。  
別の Firebase プロジェクトへ移行する。

- **プロジェクト A（例）**: `bokudeli-event-yasu-2510` — export データが置いてある側
- **プロジェクト B（例）**: `bokudeli-event-yasu-2603` — 移行先

## 方針: 越境 IAM を避ける

**避けたいこと**

- プロジェクト **B** の Firestore がインポート時に参照する GCS を、**プロジェクト A のバケット**にしない。
- 具体的には、**B の Firestore 用サービスアカウント**（や Import 処理が使う主体）に、**A のバケットへの恒久的な `storage.objectViewer` 等の越境権限を付けない**。

### GCS 直コピーとした理由

本手順では **A の `gs://` から B の `gs://` へコピー**し、ワークステーションへ export 実体を落とさない。

- **本番相当データをワークステーション上に残したくない**。
- 作業後の掃除のために **`rm -rf` 等の強い権限**を扱う運用や、**誤削除・データ残留**のリスクを避けたい。

**採用する流れ**

1. export 結果を **A のバケットから B のバケットへ GCS 上で直接コピー**する。**GCS 直コピーを唯一の正規ルート**とし、ローカルへのダウンロードやローカル中継は行わない（理由は上記「GCS 直コピーとした理由」）。
2. **B** で `gcloud firestore import` を実行し、**import 元 URI は常に `gs://（B のバケット）/...` のみ**とする。

こうすると、Import 本番時に必要な Storage 権限は **B プロジェクト内**に閉じやすい。

### 移行専用サービスアカウントと一時付与

プロジェクト越境の GCS コピーは、**個人ユーザーに広いプロジェクト権限を付けたまま**行わず、**移行専用のサービスアカウント（SA）**に **バケット単位で必要最小限**だけ付与して実施する。

- **移行専用 SA の作成**: いずれかのプロジェクト（多くは B または組織の運用方針に従う）に、コピー作業専用の SA を用意する。
- **付与の範囲（例・組織の最小権限に合わせて調整）**
  - **A の export バケット**: 当該 SA に **オブジェクトの一覧・読み取り**（例: バケットへの `roles/storage.objectViewer`）。プロジェクト全体の `Storage Admin` は避ける。
  - **B の受けバケット**: **コピーに必要な書き込み**のみ（新規プレフィックスへだけ `cp` するなら `roles/storage.objectCreator` で足りることが多い。`rsync` で更新・削除まで行う場合は要件に応じて狭いカスタムロールや `roles/storage.objectUser` 等を検討）。
  - 可能なら **IAM 条件でプレフィックスを限定**（組織ポリシーで許可される場合）。
- **コピー実行**: `gsutil` / `gcloud` は **移行専用 SA で認証**して実行する（キーを使う場合は**作業期間だけ**有効にし、漏えい対策を行う）。組織標準があれば **キーなし**（Workload Identity Federation 等）に寄せる。
- **import の実行主体**: `gcloud firestore import` は、組織の手順に従い **オペレータユーザー**または **別の最小権限**で実行してよい。実際に **B のバケットから export を読む**のは **Google 管理の Firestore サービスエージェント**であり、移行専用 SA とは別。B 側バケットには公式手順に従い **そのエージェントに読み取り**を付与する（恒久で広げすぎない）。

**作業終了後の権限削除**

- **コピー・import・検証が完了したら**、**A・B の各バケット IAM から移行専用 SA へのロールを削除**する（恒久的な越境アクセスを残さない）。
- **impersonation のために付与した**、オペレータ等が移行専用 SA をなりすませる **`roles/iam.serviceAccountTokenCreator`** は、**移行専用 SA リソース上の IAM バインディングから削除**する（付け忘れると最小権限・一時付与の方針と矛盾する）。
- 移行専用 SA 用に **発行したキーは無効化・削除**する。
- 今後の定期利用がなければ、**移行専用 SA 自体を無効化または削除**してもよい（先にバケット IAM を外す）。

**越境 IAM 回避との関係**: B の Firestore 用エージェントに **A のバケットを読ませ続けない**方針は変わらない。移行専用 SA は **コピー完了まで**だけ A・B のバケットにまたがる **一時的な主体**とする。

## 前提

- Storage 上のデータが **Firestore マネージド export**（`gcloud firestore export gs://...` 等）の成果物であること。形式が異なるバックアップだけでは `firestore import` できない場合がある。
- **B の Firestore データベースのロケーション**と、**import に使う B のバケットのロケーション**が要件を満たすこと（公式: [Export and import data](https://firebase.google.com/docs/firestore/manage-data/export-import)）。
- **Authentication・Cloud Storage（アプリ用）・Secrets・外部サービス連携**はこの手順だけでは移行されない。DB コピーのみを対象とする。

### バックアップ形式の実確認（実施前に決める）

次を満たすか、担当者が GCS 上のオブジェクト構成で確認する。

- 取得元が **PITR 専用・別製品のダンプ**など、マネージド export と異なる形式でないこと。
- 不明な場合は、公式ドキュメントの export 出力に近い階層（メタデータとデータが一式そろったプレフィックス）になっているか `gsutil ls -r` 等で目視する。

## カットオーバーとデータの鮮度（事前に決める）

- **どの時点の export を正とするか**（バケット上の日時付きプレフィックス等）を決める。
- **既存のバックアップをそのまま import する**場合、取得時点より後に A で更新されたデータは B に入らない。**許容するずれ**か、**A への書き込み停止後に最終 export を取ってからコピー**するか、を決める。
- import 後に A と B を完全に一致させる必要がある場合は、**差分・再同期**は別手順として設計する（本ドキュメントは一発コピー＋import を対象とする）。

## ルール・インデックス・データベース ID

- **`firestore.rules` は import されない**。プロジェクト B では、デプロイ済みのルールが A と同等か（または意図したポリシーか）を事前に確認する。
- **複合インデックス**はリポジトリの `firestore.indexes.json` 等から **B にデプロイ**する。import だけではインデックス定義は揃わないため、クエリ失敗を防ぐ。
- A が **名前付きデータベース**（`(default)` 以外）を使っている場合、B 側でも **同じ database ID に import する**など、参照先を揃える。

## 事前確認チェックリスト

- [ ] A の `gs://` パス（export のプレフィックス）を特定した
- [ ] **import に渡す URI は、単一の export 1 回分のルート**（複数日分の親フォルダを指定していない）
- [ ] **GCS コピー後**、`gcloud storage ls --recursive` 等で `*overall_export_metadata` の親パスを確認し、その **`gs://.../` を import に渡す**（変数の `GS_URI_B` とずれることがある。手順書「コピー直後の階層ずれ」参照）
- [ ] B に import 用バケットを用意する（または既存バケットのパスを決めた）
- [ ] B の Firestore が空、または上書き・マージ結果を許容できる
- [ ] **移行専用 SA** を用意し、A・B の **該当バケットにのみ**必要最小限の IAM を付与する方針で進められる（**GCS 直コピーのみ**。理由は方針セクション参照）
- [ ] **カットオーバー方針**（どの export を正とするか、A の書き込み停止の要否）を決めた
- [ ] B で **セキュリティルール・インデックス**が必要な状態になっている（または import 直後にデプロイする）
- [ ] A / B とも **データベース ID**（default か名前付きか）を確認した
- [ ] 組織で **VPC Service Controls** 等によりプロジェクト横断の `gsutil` が制限されていないか確認した（制限がある場合は Storage Transfer Service 等の別経路を検討）
- [ ] 作業完了後に **移行専用 SA** の A・B バケット IAM 削除・**オペレータへの TokenCreator 削除**・キー削除（および不要なら SA 無効化）を実施するか、起票済みである

## 手順（正規ルート: GCS 直コピー → B で import）

方針・移行専用 SA・一時付与・作業後削除は「方針: 越境 IAM を避ける」を参照。GCS 直コピーの理由は「GCS 直コピーとした理由」を参照。

プレースホルダ:

- `GS_URI_A`: A 側 **単一 export のルート**（例: `gs://a-backup-bucket/firestore-export/2025-03-01-10-59-00z/`）
- `GS_URI_B`: B 側のコピー先プレフィックス（例: `gs://b-import-bucket/firestore-migration/2025-03-01-10-59-00z/`）

**日時スラッグの末尾**: バケット名および GCS 上のパスに含める UTC スラッグは、**末尾を小文字の `z` に統一**する（GCS の名前は小文字のみが安全なため。**大文字の `Z` は使わない**）。意味としては UTC を表す。

1 日に複数回 export する場合は、**日付だけでなく時刻（必要なら秒）まで入れたプレフィックス**にし、衝突しないようにする。**UTC で揃える**と運用者間で解釈がずれにくい。時・分・秒はゼロ埋めしておくと一覧の文字列ソートと時系列が概ね一致しやすい。

`gcloud firestore import` に渡すのは、コピー後の **GCS 上で実際に存在する「単一 export のルート」** である。変数で決めた **`GS_URI_B` と実パスが一致するとは限らない**（下記「コピー直後の階層ずれ」）。**必ず**コピー後に `*overall_export_metadata` の所在を確認し、その **親ディレクトリ**（末尾 `/` 付きの `gs://.../`）を import に渡す。親ディレクトリに複数 export が並んでいる場合は、**日時付きサブフォルダなど 1 回分だけ**を指定する。

### コピー直後の階層ずれ（`gcloud storage cp --recursive` と末尾スラッシュ）

`gcloud storage cp --recursive` や `gsutil cp -r` で、**ソース・先の両方が「ディレクトリ」扱い**（例: URI がともに末尾 `/`）だと、**先側にソースの最終セグメント名と同じサブフォルダがもう 1 段できる**。その結果、Firestore のメタデータ `（日時など）.overall_export_metadata` は **`GS_URI_B` の直下ではなく、その内側のサブディレクトリ**に置かれる。

- **症状**: `gcloud firestore import "${GS_URI_B}"` が `Google Cloud Storage file does not exist: ...overall_export_metadata` で失敗する。
- **対処**: コピー後に一覧し、**メタデータが実在するディレクトリ**を import URI に使う。

確認例（プレースホルダは環境に合わせる）:

```bash
gcloud storage ls --recursive "${GS_URI_B}"
# またはメタデータだけ探す
gcloud storage ls --recursive "${GS_URI_B}" | grep overall_export_metadata
```

`grep` で得たオブジェクトパスから **ファイル名を除いた `gs://.../`**（メタデータの親）を `GS_IMPORT_ROOT` として、次を実行する。

```bash
gcloud firestore import "${GS_IMPORT_ROOT}" --database="(default)"
```

**コピー方法を変えて階層を抑えたい場合**は、試行環境で `gsutil rsync -r` や、コピー先プレフィックス（`GS_URI_B`）の切り方を調整し、**export 1 回分のルートが期待どおりの深さになるか**を事前に確認する（ツール・バージョンで挙動が変わり得るため、本番は上記の **一覧での実パス確認**を必須とする）。

### 1. プロジェクト B の準備

```bash
gcloud config set project <プロジェクトBのID>
```

- B に import 用バケットを作成（未作成の場合）。ロケーションは B の Firestore と整合させる。
- A のバケットとリージョンが大きく離れると、コピーに時間・転送コストが増える。**可能なら B 側受けバケットは Firestore と同系統のロケーション**に寄せる。

### 2. A の export を B のバケットへコピー（GCS 直コピー）

オペレータ端末は **メタデータの一覧・コマンド入力**に用い、export の実体は **常に GCS 上**で A → B に転送する。**認証は方針どおり移行専用 SA**（事前に A・B のバケットへ最小 IAM を付与済み）とする。**Sandbox や検証**で、オペレータユーザーが A・B 両方のバケットに十分な権限を持つ場合は、**同一のコピー手順を impersonation なしで実行してもよい**（本番・組織方針では最小権限＋移行専用 SA を優先する）。

まず構造確認:

```bash
gsutil ls "${GS_URI_A}"
# 必要なら gsutil ls -r で深さを確認
```

コピー例（チームで運用しやすい方法を一つに統一する）。

`cp`（ディレクトリごと。末尾スラッシュの有無で挙動が変わるため、試行環境で確認すること）:

```bash
gsutil -m cp -r "${GS_URI_A}" "${GS_URI_B}"
```

`gcloud storage` 例（パターン 1 と同じ形）:

```bash
gcloud storage cp --recursive "${GS_URI_A}" "${GS_URI_B}"
```

ツリー同期したい場合の例:

```bash
gsutil -m rsync -r "${GS_URI_A}" "${GS_URI_B}"
```

ワイルドカード `"${GS_URI_A}"*` はシェル・オブジェクト構成によって取りこぼしやすいので、**原則はディレクトリ指定の `cp -r` または `rsync -r`** を推奨する。

コピー後は **必ず**「コピー直後の階層ずれ」を踏まえ、GCS 上で `*overall_export_metadata` の親ディレクトリを特定する（上記参照）。

### 3. プロジェクト B で Firestore import

```bash
gcloud config set project <プロジェクトBのID>
# GS_IMPORT_ROOT: コピー後、GCS 上で overall_export_metadata の親となった gs://.../（上記「コピー直後の階層ずれ」）
gcloud firestore import "${GS_IMPORT_ROOT}" --database="(default)"
```

プレースホルダを **`GS_URI_B` のまま**渡さない。**一覧で確認した実パス**を渡す。名前付きデータベースの場合は `--database=DB_ID` に置き換える。

### 4. 検証

- Firebase Console またはクエリで、主要コレクションの件数・サンプルドキュメントを確認する。
- 問題があれば B 側のデータ復旧方針（別環境で試す、空 DB で初回実施する等）に従う。

### 5. 権限の片付け（検証完了後）

- **A・B の export / import 用バケット**の IAM から、**移行専用 SA** に付けたロールを **すべて削除**する。
- **impersonation 用**にオペレータ等へ付与した **移行専用 SA への `roles/iam.serviceAccountTokenCreator`** を、**当該 SA の IAM から削除**する（付与時と同じ `--member` を指定して `gcloud iam service-accounts remove-iam-policy-binding` を実行する等）。
- 移行専用 SA 用の **キーは無効化・削除**する。今後使わないなら **SA の無効化または削除**も検討する（バケット IAM を先に削除）。
- **B の Firestore サービスエージェント**に付けた import 用バケットの読み取りは、**再 import しない方針**なら不要になった時点で縮小・削除を検討する（運用方針に従う）。

## 実行例: パターン 1（bokudeli-event-yasu-2510 → bokudeli-event-yasu-2603）

**前提**: A で **これから** `firestore export` し、**GCS 直コピー**で B のバケットへ複製してから B で `firestore import` する。データベースは `(default)`。移行専用 SA は **B（2603）** に作成し、**キーは使わない**（オペレータの **impersonation** や組織の WIF 等）。

### 決め打ち（実行前の参照・Sandbox 想定・必要に応じて変更）

迷ったときの既定値。組織ポリシーや本番要件があれば優先する。

| 項目 | 決め打ち |
|------|----------|
| **`UTC_BUCKET_SLUG`** | **実行開始時刻の UTC** で確定する。形式は `YYYY-MM-DD-HH-MM-SSz` のゼロ埋め（例: `2025-03-28-06-00-00z`）。短くするなら `20250328-060000z` でもよい。 |
| **バケット名** | 下記「バケット名」のとおり。作成前に **GCS 全体で名前が空いているか**だけ確認。 |
| **`EXPORT_PREFIX` / `GS_URI_*`** | 変数例どおり `firestore-export/${UTC_BUCKET_SLUG}` を使う。 |
| **バケット `--location`** | **B の import 用バケットは B の Firestore ロケーションと整合**させる（import 要件）。A の export 用バケットは **可能なら B と同一リージョン**に寄せる（転送・運用が単純）。実値は次で確認してから `buckets create` に書く: `gcloud firestore databases list --project=bokudeli-event-yasu-2603`（必要なら 2510 も）。 |
| **カットオーバー** | **メンテナンス枠**を取る。本番相当データなら **export 直前に A への書き込み停止**、または「export 時点より後の更新は B に含まれない」を関係者で合意。差分再同期は本手順外。 |
| **B の Firestore** | **初回は B が空**（または検証専用プロジェクト）で試し、問題なければ本番 B で再実行する二段構えを推奨。 |
| **VPC Service Controls** | **問題ない前提**で進め、横断 `gcloud storage` / `gsutil` が弾かれたら **Storage Transfer Service** 等の **GCS 上の別経路**に切り替える（ローカル経由はしない）。 |
| **移行専用 SA の名前** | 下記手順の `firestore-migrate-export` でよい（組織の命名規則があれば従う）。 |
| **impersonation** | **GCS コピー中のみ** 移行専用 SA を impersonate。**`firestore import` の前に `unset`** し、import はオペレータの通常権限で実行する（下記手順どおり）。**検証・Sandbox**ではオペレータが A・B の Storage に十分権限を持つなら、移行専用 SA を使わず同一手順でコピーしてもよい（本番は最小権限を優先）。 |
| **import パス** | **`GS_URI_B` を決め打ちで import に使わない**。コピー後に `gcloud storage ls --recursive` 等で `*overall_export_metadata` の **親ディレクトリ**を `GS_IMPORT_ROOT` として渡す（「コピー直後の階層ずれ」参照）。 |
| **ルール・インデックス** | **import 前に B へ `firestore.rules` と複合インデックスをデプロイ**するのを既定とする（import 直後にアプリが触る場合に安全）。 |
| **Auth・Storage・Secrets** | 本手順は **Firestore DB のスナップショットのみ**。アプリの向き先変更・Secret は **別タスク**とする。 |
| **権限の片付け** | 検証完了後 **24 時間以内**を目安に、移行専用 SA の A・B バケット IAM 削除・**オペレータ等への TokenCreator 削除**・`gcloud config unset auth/impersonate_service_account` による impersonation 解除・（方針に応じて）Firestore エージェントの B バケット読み取り見直し。担当と起票を決める。 |

**実行時に手元で確定する値（自動では決められない）**

- 上記の **`UTC_BUCKET_SLUG`**（実行日時）
- **`--location`**（`gcloud firestore databases list` の結果）
- 移行専用 SA の **メール全文**（本手順では **`MIGRATE_SA_EMAIL`** として参照。形式は `SA名@プロジェクトID.iam.gserviceaccount.com`）
- B の **Firestore サービスエージェント**のメール（Console / `gcloud` で確認し、import 用バケット読み取りを付与）

### バケット名（日付日時スラッグ）

- **A（2510）の export 先バケット**: `bokudeli-event-yasu-2510-export-<日付日時>`
- **B（2603）の import 用バケット**: `bokudeli-event-yasu-2510-import-<日付日時>`（**A と B でプレフィックスが異なる**ため、同じ `<日付日時>` を使っても **別名のバケット**になる）
- **例**（`<日付日時>` を `2025-03-27-10-59-00z` とした場合。バケット名にコロンは使えないため `:` は使わない）  
  - A: `bokudeli-event-yasu-2510-export-2025-03-27-10-59-00z`  
  - B: `bokudeli-event-yasu-2510-import-2025-03-27-10-59-00z`  
- バケット名は **GCS 全体で一意**・**63 文字以内**・**小文字・数字・ハイフン**に合わせる。長くなりすぎる場合は `<日付日時>` を `20250327-105900z` のように短くしてよい。
- **ロケーション**は各プロジェクトの **Firestore DB と import 要件が満たせるリージョン**に合わせる（Console または `gcloud firestore databases list` 等で確認してから `buckets create` の `--location` を決める）。

### 変数の例（実行前に自分の値に置き換える）

```bash
# 例: UTC 基準のスラッグ（バケット名用。コロン不可）
UTC_BUCKET_SLUG=2025-03-27-10-59-00z
BUCKET_A=bokudeli-event-yasu-2510-export-${UTC_BUCKET_SLUG}
BUCKET_B=bokudeli-event-yasu-2510-import-${UTC_BUCKET_SLUG}
# export / copy / import で共通にするオブジェクト側のプレフィックス（単一 export のルートになるよう export 先と揃える）
EXPORT_PREFIX=firestore-export/${UTC_BUCKET_SLUG}
GS_URI_A="gs://${BUCKET_A}/${EXPORT_PREFIX}/"
GS_URI_B="gs://${BUCKET_B}/${EXPORT_PREFIX}/"
```

### 0. バケット作成

- **プロジェクト A** に `BUCKET_A`、**プロジェクト B** に `BUCKET_B` を作成する（未作成の場合）。

```bash
gcloud storage buckets create "gs://${BUCKET_A}" --project=bokudeli-event-yasu-2510 --location=<A側で選んだリージョン>
gcloud storage buckets create "gs://${BUCKET_B}" --project=bokudeli-event-yasu-2603 --location=<B側で選んだリージョン>
```

- **import 前に**、B の **Firestore サービスエージェント**に **BUCKET_B** のオブジェクト読み取りを付与する（公式手順）。プロジェクト番号は `gcloud projects describe bokudeli-event-yasu-2603 --format='value(projectNumber)'` で取得する。エージェントのメールは `service-<番号>@gcp-sa-firestore.iam.gserviceaccount.com` 形式。

```bash
PN_B=$(gcloud projects describe bokudeli-event-yasu-2603 --format='value(projectNumber)')
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_B}" \
  --project=bokudeli-event-yasu-2603 \
  --member="serviceAccount:service-${PN_B}@gcp-sa-firestore.iam.gserviceaccount.com" \
  --role=roles/storage.objectViewer
```

### 1. 移行専用 SA（プロジェクト B）と IAM（一時）

- B に SA を作成（名前は例）。

```bash
gcloud iam service-accounts create firestore-migrate-export \
  --project=bokudeli-event-yasu-2603 \
  --display-name="Firestore migrate 2510 to 2603"
# 作成後のメール全文を MIGRATE_SA_EMAIL にセットする（SA 名 @ プロジェクト ID の形式）
# 例: MIGRATE_SA_EMAIL=firestore-migrate-export@bokudeli-event-yasu-2603.iam.gserviceaccount.com
```

- **`MIGRATE_SA_EMAIL`** で指す移行専用 SA に、**BUCKET_A** では `roles/storage.objectViewer`、**BUCKET_B** では `roles/storage.objectCreator`（または `rsync` 要件に応じて狭いロール）を **バケット単位**で付与する。
- **B の Firestore サービスエージェント**に **BUCKET_B** の読み取り（**手順 0** の `gcloud storage buckets add-iam-policy-binding` で付与済みなら省略可）。
- オペレータが **`MIGRATE_SA_EMAIL` の SA を impersonate** して `gcloud storage` / `gsutil` を実行できるよう、**移行専用 SA の IAM** に `roles/iam.serviceAccountTokenCreator` をオペレータ（または実行用 SA）向けに付与する。

```bash
gcloud config set auth/impersonate_service_account "${MIGRATE_SA_EMAIL}"
```

（作業終了後に `gcloud config unset auth/impersonate_service_account` で解除する。**TokenCreator の IAM バインディングも手順 5 で削除**する。）

### 2. プロジェクト A で export

カットオーバー方針に従い、必要なら **書き込み停止**のうえで実行する。

```bash
gcloud config set project bokudeli-event-yasu-2510
gcloud firestore export "${GS_URI_A}" --database="(default)"
```

完了後、`gcloud storage ls --recursive "gs://${BUCKET_A}/${EXPORT_PREFIX}/"` または `gsutil ls -r "${GS_URI_A}"` で **単一 export のルート**（`import` に渡す 1 階層）を確認する。Firestore の出力構成により、**`GS_URI_A` をメタデータ一式のあるディレクトリに合わせて修正**する場合がある。

### 3. GCS 直コピー（A → B）

**impersonation を `MIGRATE_SA_EMAIL` にした状態で**（キーなし）。検証で移行専用 SA を使わない場合は、オペレータ認証のまま同じコマンドを実行する。

```bash
gcloud storage cp --recursive "${GS_URI_A}" "${GS_URI_B}"
```

`gsutil` を使う場合もよいが、認証まわりは環境に合わせて統一する。**末尾 `/` のディレクトリ同士の `cp --recursive` では、B 側にソース最終セグメント相当のサブフォルダが 1 段増えることがある**（手順冒頭「コピー直後の階層ずれ」）。

### 3b. import 用 URI の確定（必須）

コピー後、**実際に `*overall_export_metadata` がある階層**を特定する。

```bash
gcloud storage ls --recursive "gs://${BUCKET_B}/${EXPORT_PREFIX}/" | grep overall_export_metadata
```

表示されたオブジェクトの **親の `gs://.../`** を `GS_IMPORT_ROOT` とする（例: `.../firestore-export/SLUG/SLUG/` のように **SLUG が二重**になっている場合は **内側**を import に渡す）。

### 4. プロジェクト B で import

```bash
gcloud config unset auth/impersonate_service_account   # import はオペレータ権限で実行する場合
gcloud config set project bokudeli-event-yasu-2603
gcloud firestore import "${GS_IMPORT_ROOT}" --database="(default)"
```

**`GS_URI_B` をそのまま渡さない**こと。import 実行アカウントに **B** で必要な import ロールが付いていること。

### 5. 検証・片付け

- 検証後、「手順（正規ルート）の 5. 権限の片付け」に従い、**`MIGRATE_SA_EMAIL`** の A・B バケット IAM を削除する。
- **`MIGRATE_SA_EMAIL` の SA に対し**、オペレータ等へ付与した **`roles/iam.serviceAccountTokenCreator` を `remove-iam-policy-binding` で削除**する（付与時と同じ `--member` を指定）。
- `gcloud config unset auth/impersonate_service_account` で impersonation を解除する。不要なら SA 無効化。Firestore エージェントの B バケット読み取りは運用に応じて見直す。

## 権限の整理（参考）

| 主体 | 役割 | 必要になりやすい権限（例・バケット単位で最小化） |
|------|------|--------------------------------------------------|
| **移行専用 SA** | A → B の GCS 直コピー | **A のバケット**: 一覧・読み取り（例 `roles/storage.objectViewer`）。**B のバケット**: コピーに必要な書き込み（例 `roles/storage.objectCreator` または `rsync` 要件に応じた範囲） |
| **オペレータ等**（impersonation 時） | 移行専用 SA のなりすまし | **移行専用 SA リソース**に対する `roles/iam.serviceAccountTokenCreator`（**作業後に必ず削除**） |
| **import 実行主体**（人または SA） | `gcloud firestore import` の操作 | B プロジェクトで Firestore の import 操作（例: `roles/datastore.importExportAdmin` 等。組織の最小権限に合わせる） |
| **B の Firestore サービスエージェント**（Google 管理） | import 時に B 上の `gs://` を読む | **B の import 用バケット**への読み取り（例: `roles/storage.objectViewer`。メールは `service-<BのprojectNumber>@gcp-sa-firestore.iam.gserviceaccount.com`。パターン 1 の「0. バケット作成」に `gcloud` 例あり） |

**恒久運用で避ける**: B の Firestore 用エージェントに **A のバケット**への IAM を付与したままにすること。移行専用 SA に付けた **A・B バケットの一時 IAM を、作業後に削除しない**こと。

## 組織制約（該当時のみ）

- **VPC Service Controls** や組織ポリシーで、オペレータの `gsutil` による **プロジェクト横断コピー**がブロックされることがある。
- その場合は、組織が許可する範囲で **Storage Transfer Service**、承認済みの中継バケット、または組織手順に沿った転送手段に切り替える。**ローカルディスクを経由する回避は、本ドキュメントの方針（GCS 直コピー優先）に反するため採用しない。** 組織手順で GCS 上の別経路が必須のときのみ、その手順に従う。

## 注意事項

- Import は既存ドキュメントと ID が重なる場合、期待と異なるマージ・上書きになることがある。**初回は検証用プロジェクトまたは空に近い DB** で試すことを推奨する。
- 大規模データではコピーと import に時間がかかる。メンテナンスウィンドウを検討する。
- 手順の自動化・スキル化は別途、上記プレースホルダとチェックリストを入力にできる形で検討する。
- **Cursor 等のエージェントが `gcloud` を実行する場合**、実行環境が `~/.config/gcloud`（認証情報・ログ）へ書き込めないと失敗する。ローカル端末で実行するか、サンドボックスをオフにしたシェルで行う。
