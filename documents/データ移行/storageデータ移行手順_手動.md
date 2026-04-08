# Storage データ移行手順（手作業・バケット間コピー）

エージェントやスキルに `gcloud` / `gsutil` を任せず、**エンジニアが自分の端末から**実施する前提。Firestore のマネージド export/import のような **Storage 専用の「公式インポート」はない**ため、**Cloud Storage 上で移行元バケットから移行先バケットへオブジェクトをコピー（または同期）する**流れとする。本手順は **GCS バケット間のみで完結**させ、**端末へのダウンロードは行わない**。コピー前に **移行先 B バケット内の既存オブジェクトを削除**し、古い階層や試行コピーの残骸と混ざらないようにする前提とする（**削除は取り消せない**。必要なら別バケットに退避してから実施する）。

## 対象プロジェクト（例）

| 役割 | プロジェクト ID（例） |
|------|------------------------|
| **移行元（A）** | `bokudeli-event-yasu-test` |
| **移行先（B）** | `bokudeli-event-yasu-2603` |

- **Firebase の既定バケット名**はプロジェクトごとに異なる。Firebase Console の **Storage**、または GCP の **Cloud Storage** で **実バケット名**を確認する（例: `<project-id>.appspot.com` や `<project-id>.firebasestorage.app` など）。

---

## 認証と権限（バケット間コピーの前提）

**同一の認証主体**（多くはオペレータの Google アカウント、またはサービスアカウント）に、**コピー元バケット A とコピー先バケット B の両方**で必要な権限が付いていること。A と B が**別プロジェクト**でも、**1 アカウントに両方のバケット（またはプロジェクト）で IAM を付与**するのが一般的である。

- **人間が PC で実行する場合**の例: `gcloud auth login` でログインし、`gcloud auth list` でアクティブなアカウントを確認する。
- **サービスアカウントで実行する場合**: `gcloud auth activate-service-account` 等でその SA を使い、SA に A の読み取り・B の書き込み（組織の最小権限に合わせる）を付与する。

`gcloud config set project` は**デフォルトプロジェクト**の指定であり、バケット URI を `gs://...` でフル指定するコピー自体の成否は **IAM 次第**である。分かりやすさのため **移行先 B のプロジェクト**に合わせておいてもよい。

```bash
gcloud auth login
gcloud config set project <PROJECT_B>
gcloud auth list
gcloud config list
```

## バケットの確認（Console）

- GCP ストレージ（A）: `https://console.cloud.google.com/storage/browser?hl=ja&project=<PROJECT_A>`
- GCP ストレージ（B）: `https://console.cloud.google.com/storage/browser?hl=ja&project=<PROJECT_B>`
- Firebase Storage（A）: `https://console.firebase.google.com/project/<PROJECT_A>/storage`
- Firebase Storage（B）: `https://console.firebase.google.com/project/<PROJECT_B>/storage`

**コピー元** `gs://<BUCKET_A>/` と **コピー先** `gs://<BUCKET_B>/`、必要なら **プレフィックス**（例: `communities/` のみ移行 等）を決める。

---

## 移行先 B のオブジェクトを削除する（コピー前・必須前提）

**B バケット内の既存データをすべて消す**（本番 B を使う場合はメンテナンス枠・書き込み停止と合わせて実施）。誤ったバケットを指定しないこと。

```bash
gcloud config set project <PROJECT_B>
gcloud config set project bokudeli-event-yasu-2603
# B バケット内の全オブジェクトを削除（バケット自体は残る）
gcloud storage rm -r "gs://<BUCKET_B>/**"
gcloud storage rm -r "gs://bokudeli-event-yasu-2603.appspot.com/**"
```

削除対象の確認の例:

```bash
gcloud storage ls --recursive "gs://<BUCKET_B>/"
```

Console からフォルダ単位で削除してもよい。**削除後、一覧が空または意図した状態か**確認してから次へ進む。

---

## バケット間コピー（本手順の本体）

**ソースは `gs://<BUCKET_A>/*` とし、バケット直下の中身だけを B のルートへ載せる。** `gs://<BUCKET_A>/`（末尾スラッシュのみ）からコピーすると、移行元バケット名など **余分な親フォルダが 1 段**付くことがある。

```bash
gcloud config set project <PROJECT_B>
gcloud storage cp --recursive "gs://<BUCKET_A>/*" "gs://<BUCKET_B>/"
```

具体例（バケット名は環境に合わせて置き換える）:

```bash
gcloud storage cp --recursive \
  "gs://bokudeli-event-test.appspot.com/*" \
  "gs://bokudeli-event-yasu-2603.appspot.com/"
```

`gsutil` を使う場合の例:

```bash
gsutil -m cp -r "gs://<BUCKET_A>/*" "gs://<BUCKET_B>/"
```

**差分同期**が必要なら `gsutil -m rsync -r` の利用を検討する（初回フルコピー後の追いつき等）。本手順の「B を空にしてからフルコピー」と併用する場合は、方針を決めてから使い分ける。組織の手順に合わせる。

---

## 「プロジェクト B」でセキュリティルールをデプロイする

**オブジェクトのコピーだけでは `storage.rules` は移行されない。** リポジトリの `storage.rules` を B にデプロイする（Firebase CLI、`firebase deploy --only storage`、または CI / GitHub Actions の既存フローに従う）。

---

## 検証の目安

- GCP Console または `gcloud storage ls --recursive "gs://<BUCKET_B>/"` で、主要プレフィックス（下記「アプリ側のオブジェクトキー規約」）にオブジェクトが存在するか確認する
- 認証済みクライアントから、代表ファイルのダウンロード・アップロードが期待どおりか確認する

---

------------------------------------------------------------------------------------------------

## 重要: Storage に Firestore 型のマネージド import はない

Firestore の `gcloud firestore import` のように、**バケット一式を「Storage として公式復元」するコマンドはない**。移行の本体は **GCS オブジェクトの複製（バケット間）**である。

---

## アプリ側のオブジェクトキー規約（Shokujii）

リポジトリでは `common/src/utils/storagePaths.ts` にパス生成が集約されている。移行後も **キー（パス）構造を一致**させること（コピーで余分な親フォルダが 1 段増えると、アプリが参照するパスとずれる）。

主なプレフィックスの例:

- `communities/{communityId}/community/cover` / `.../icon`
- `communities/{communityId}/events/{eventId}/cover`
- `communities/{communityId}/events/{eventId}/menus/{menuId}/image`
- `communities/{communityId}/events/{eventId}/tinymce/{uuid}`
- `partners/{partnerId}/shops/{shopId}/cover`
- `partners/{partnerId}/menus/{menuId}/image`
- `users/{userId}/avatar` および `users/{userId}/avatar_thumb_{small|medium|large}`

---

## Firestore 等に保存されている URL との整合

**Storage のファイルをコピーしただけでは不十分なことがある。**

- Firestore やアプリ設定に **フル URL**（トークン付き download URL、旧プロジェクトのドメイン等）が保存されている場合、**B では URL が無効**になりうる。別タスクとして **URL の再発行**や **DB の一括更新**、**アプリのベース URL 設定**（環境変数等）の見直しが必要になる。
- **相対パスや Storage パスのみ**を保存している設計なら、バケット名・ルール・クライアント設定を B に合わせれば整合しやすい。

**Firestore データ移行**との実行順序（先に DB か先に Storage か）は、**URL の保存形式**に依存する。カットオーバー前に方針を決める。

---

## 事前に揃えるもの

- `gcloud` CLI（および必要なら `gsutil`）が入り、**オペレータアカウント（または SA）**が **A・B 両バケット**に必要な権限を持つ
- **A / B の実バケット名**・**リージョン**（アプリ・組織要件と整合）
- コピーに必要な **IAM**（組織の最小権限に合わせる。例: A での読み取り、B での **オブジェクト削除と書き込み**）
- **`storage.rules`** を B にデプロイ済み、またはコピー直後にデプロイ
- 必要なら **CORS**・バケットの公開設定・**ライフサイクル**を B 側で揃える
- **Authentication・Firestore・Secrets・外部サービス連携**は本手順だけでは完結しない（別タスク）

---

## 変数の例（実行前に実値に置き換え）

```bash
PROJECT_A=<移行元プロジェクトID>
PROJECT_B=<移行先プロジェクトID>

# Firebase Console / gcloud storage buckets list で実名を確認
BUCKET_A=<A側のFirebase Storage用GCSバケット名>
BUCKET_B=<B側のFirebase Storage用GCSバケット名>

# バケット全体ではなくプレフィックスのみ移行する場合（末尾スラッシュに注意）
PREFIX=""
```

---

## 手順概要

| 段 | 内容 |
|----|------|
| 1 | B のバケット・IAM・（必要なら）CORS・ライフサイクル |
| 2 | 認証（例: `gcloud auth login`）と **A・B 両バケット**の権限確認 |
| 3 | **B バケット内オブジェクトの全削除**（コピー前・対象バケットを再確認） |
| 4 | A → B の **GCS 間コピー**（ソースは `gs://<BUCKET_A>/*`） |
| 5 | **オブジェクトキー（パス）**がアプリ想定と一致するか確認（階層ずれに注意） |
| 6 | B に **`storage.rules`** をデプロイ |
| 7 | アプリ・Functions の **バケット参照・環境変数**を B に合わせる |
| 8 | Firestore 等の **URL 整合**（必要なら別スクリプト・手作業） |
| 9 | 検証 |
| 10 | 一時 IAM の片付け |

---

### 1. コピー前後の確認（削除・階層ずれ）

- **削除後**: `gcloud storage ls "gs://<BUCKET_B>/"` で B が空に近い状態か確認する（意図しないバケットを消していないか）。
- **コピー後**: ソースを **`gs://<BUCKET_A>/*`** にしたうえで、`gcloud storage ls --recursive "gs://<BUCKET_B>/"` または Console で、**`assets/` `communities/` `partners/` `users/` 等がバケット直下**にあるか確認する。`gs://<BUCKET_A>/` だけをソースにすると、B 側に **移行元バケット名のフォルダが 1 段**付くことがある。

---

### 2. IAM（例・組織標準に置き換える）

バケット間コピーを **別のサービスアカウント**で行う場合は、その SA に A の読み取り・B の書き込みを付与する。オペレータのユーザーアカウントで実行する場合は、**同一アカウント**に両バケットで権限が足りているか事前に確認する。

---

### 3. 検証

- 主要プレフィックスのオブジェクト数・サンプルパスを目視する
- 代表ファイルについて、クライアントからの取得が **403 等にならないか**（ルール・認証・パスの一致）を確認する

---

### 4. 片付け

- 移行専用で広げた権限の縮小
- 一時バケットやプレフィックスのライフサイクル

---

## 事前確認チェックリスト

- [ ] A / B の **実バケット名**・リージョンを特定した
- [ ] 実行アカウント（または SA）が **A・B 両方のバケット**に必要な権限を持つ（B は **削除**を含む）
- [ ] **コピー前に B の削除対象**が正しいバケットであることを確認した
- [ ] コピー後の **オブジェクトキー**が `storagePaths` の想定と一致する（階層ずれなし・ソースは `/*`）
- [ ] B に **`storage.rules`** をデプロイする手順・タイミングが決まっている
- [ ] アプリ・バックエンドの **バケット参照**（環境変数等）を B に向ける方針が決まっている
- [ ] Firestore 等に **フル URL** が残っていないか確認し、残る場合は **更新方針**がある
- [ ] **カットオーバー**（書き込み停止の要否、Firestore 移行との順序）を決めた

---

## 注意事項

- **B の全削除は復元できない**。消す前にバケット名を再確認し、必要なら退避やスナップショット方針を決める
- 大容量では転送に時間がかかり、**操作課金・ネットワークコスト**に注意する。可能なら **同一リージョン**間のコピーを検討する
- **VPC Service Controls** や組織制約で端末からの `gsutil` / `gcloud storage` が使えない場合は、組織手順（GCP 上 VM、Transfer Service 等）に従う
- **Cursor 等のエージェントが `gcloud` を実行する場合**、実行環境が `~/.config/gcloud` へ書き込めないと失敗することがある。本手順は**エンジニアのローカル端末**での実行を想定する
