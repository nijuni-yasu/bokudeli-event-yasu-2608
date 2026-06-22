# Storage データ移行手順（手作業・バケット間コピー）

エージェントやスキルに `gcloud` / `gsutil` を任せず、**エンジニアが自分の端末から**実施する前提。Firestore のマネージド export/import のような **Storage 専用の「公式インポート」はない**ため、**Cloud Storage 上で移行元バケットから移行先バケットへオブジェクトをコピー**する流れとする。本手順は **GCS バケット間のみで完結**させ、**端末へのダウンロードは行わない**。コピー前に **移行先 B バケット内の既存オブジェクトを削除**し、古い階層や試行コピーの残骸と混ざらないようにする前提とする（**削除は取り消せない**。必要なら別バケットに退避してから実施する）。

## 対象プロジェクト（例）

| 役割 | プロジェクト ID（例） |
|------|------------------------|
| **移行元（A）** | `bokudeli-event-dev` |
| **移行先（B）** | `bokudeli-event-yasu-2604` |

- A のバケット名（例）: `bokudeli-event-dev.appspot.com`
- B のバケット名（例）: `bokudeli-event-yasu-2604.appspot.com`

> **前提**: [firestoreデータ移行手順_手動.md](./firestoreデータ移行手順_手動.md) の §0〜§7（Firestore import + rules/indexes + **0004 メール削除**）を **先に完了**すること。
> **位置づけ**: 本手順は Firestore 手順の **§8 Storage 移行**に相当する。Storage 完了後は Firestore 手順 §9 検証・§10 片付けへ進む。

---

## 手順概要

| 段 | 内容 |
|----|------|
| 0 | 事前確認（バケット名・IAM・Firestore 移行済み） |
| 1 | B バケット内オブジェクトの全削除 |
| 2 | A → B の GCS 間コピー（ソースは `gs://.../*`） |
| 3 | オブジェクトキー（パス）の確認 |
| 4 | `storage.rules` デプロイ |
| 5 | （任意）Facebook 画像移行 `0042` |
| 6 | 検証 |

---

## 0. 事前確認

### 認証と権限

**同一の認証主体**（オペレータの Google アカウント、またはサービスアカウント）に、**コピー元バケット A とコピー先バケット B の両方**で必要な権限が付いていること。

- **A（本番）**: オブジェクトの **読み取りのみ**（本番バケットを削除・上書きしない）
- **B（sandbox2604）**: オブジェクトの **削除と書き込み**

```bash
gcloud auth login
gcloud config set project bokudeli-event-yasu-2604
gcloud auth list
gcloud config list
```

### バケットの確認（Console）

- GCP ストレージ（A）: https://console.cloud.google.com/storage/browser?hl=ja&project=bokudeli-event-dev
- GCP ストレージ（B）: https://console.cloud.google.com/storage/browser?hl=ja&project=bokudeli-event-yasu-2604
- Firebase Storage（A）: https://console.firebase.google.com/project/bokudeli-event-dev/storage
- Firebase Storage（B）: https://console.firebase.google.com/project/bokudeli-event-yasu-2604/storage

実バケット名を Console で確認する。2024-10-30 以降に作成された default bucket は `{project-id}.firebasestorage.app` 形式のことがある（[Firebase Storage FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)）。以降のコマンドでは [変数の例](#変数の例実行前に実値に置き換え) の `BUCKET_A` / `BUCKET_B` に **Console で確認した実値**を入れる。

```bash
gcloud storage buckets list --project=bokudeli-event-dev
gcloud storage buckets list --project=bokudeli-event-yasu-2604
```

### コピー対象外

本手順は **Firebase Storage の既定バケット**（アプリ用オブジェクト）のみを対象とする。

| バケット | 用途 | 本手順 |
|---------|------|--------|
| `{project-id}.appspot.com` または `{project-id}.firebasestorage.app` | コミュニティ画像・ユーザーアバター等 | **対象** |
| `{project-id}-firestore-backups` | Firestore export | [Firestore 手順](./firestoreデータ移行手順_手動.md) で扱う |
| `{project-id}-invoice` | 請求書 PDF | 対象外（請求書機能のテストが必要な場合のみ別途検討） |
| `{project-id}-terraform` 等 | インフラ | 対象外 |

### 本手順だけでは移行・更新されないもの

- **`storage.rules`** → コピー後にデプロイ
- **Authentication・Firestore・Secrets・外部サービス連携**
- **アプリの環境変数**（`VITE_STORAGE_BUCKET` 等）→ 2604 向けに既デプロイ済みなら変更不要

---

## 1. 「プロジェクト B」の Storage オブジェクトを削除する（コピー前・必須）

**B バケット内の既存データをすべて消す。** 誤ったバケットを指定しないこと。**本番 A のバケットは削除しない。**

```bash
gcloud config set project bokudeli-event-yasu-2604

BUCKET_A=bokudeli-event-dev.appspot.com  # Console で確認した実値
BUCKET_B=bokudeli-event-yasu-2604.appspot.com  # または *.firebasestorage.app

# バケット名を再確認してから実行
gcloud storage rm -r "gs://${BUCKET_B}/**"
```

削除後の確認:

```bash
gcloud storage ls "gs://${BUCKET_B}/"
```

Console からフォルダ単位で削除してもよい。**一覧が空または意図した状態か**確認してから次へ進む。

---

## 2. A → B のバケット間コピー（本手順の本体）

**ソースは `gs://<BUCKET_A>/*` とし、バケット直下の中身だけを B のルートへ載せる。** `gs://<BUCKET_A>/`（末尾スラッシュのみ）からコピーすると、移行元バケット名など **余分な親フォルダが 1 段**付くことがある。

```bash
gcloud config set project bokudeli-event-yasu-2604

BUCKET_A=bokudeli-event-dev.appspot.com  # Console で確認した実値
BUCKET_B=bokudeli-event-yasu-2604.appspot.com  # または *.firebasestorage.app

gcloud storage cp --recursive \
  "gs://${BUCKET_A}/*" \
  "gs://${BUCKET_B}/"
```

`gsutil` を使う場合（大容量向け）:

```bash
gsutil -m cp -r \
  "gs://${BUCKET_A}/*" \
  "gs://${BUCKET_B}/"
```

**差分同期**が必要なら `gsutil -m rsync -r` の利用を検討する。本手順の「B を空にしてからフルコピー」と併用する場合は、方針を決めてから使い分ける。

---

## 3. オブジェクトキー（パス）の確認

コピー後、**`communities/` `partners/` `users/` 等が B バケット直下**にあることを確認する。

```bash
gcloud storage ls "gs://${BUCKET_B}/"
gcloud storage ls --recursive "gs://${BUCKET_B}/" | head
```

`bokudeli-event-dev.appspot.com/` のような **移行元バケット名のフォルダが 1 段**付いている場合は、ソース指定を `/*` 付きに修正してコピーし直す。

---

## 4. 「プロジェクト B」でセキュリティルールをデプロイする

**オブジェクトのコピーだけでは `storage.rules` は移行されない。**

```bash
firebase use bokudeli-event-yasu-2604
firebase deploy --only storage
```

または `bokudeli-event-yasu-2604` 向け GitHub Actions の Storage デプロイワークフローを実行する。

---

## 5. Facebook ユーザー画像の移行（任意）

Firestore の `user_image_url` が Facebook 外部 URL のままの場合、Storage コピーだけでは表示が直らない。`bokudeli-event-batch/tasks/0042_migrate_facebook_user_image_urls.js` を **dry run から**実行する。

```bash
cd bokudeli-event-batch
MIGRATE_FACEBOOK_USER_IMAGE_DRY_RUN=1 yarn run task -- -m sandbox2604
# 問題なければ
MIGRATE_FACEBOOK_USER_IMAGE_DRY_RUN=false yarn run task -- -m sandbox2604
```

---

## 6. 検証

- GCP Console または `gcloud storage ls --recursive "gs://${BUCKET_B}/"` で、主要プレフィックス（下記「アプリ側のオブジェクトキー規約」）にオブジェクトが存在するか確認する
- 認証済みクライアントから、代表ファイルのダウンロードが **403 等にならないか**（ルール・認証・パスの一致）を確認する

---

## 重要: Storage に Firestore 型のマネージド import はない

Firestore の `gcloud firestore import` のように、**バケット一式を「Storage として公式復元」するコマンドはない**。移行の本体は **GCS オブジェクトの複製（バケット間）**である。

---

## アプリ側のオブジェクトキー規約（Shokujii）

リポジトリでは [storagePaths.ts](../../common/src/utils/storagePaths.ts) にパス生成が集約されている。移行後も **キー（パス）構造を一致**させること（コピーで余分な親フォルダが 1 段増えると、アプリが参照するパスとずれる）。

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

- Firestore やアプリ設定に **フル URL**（トークン付き download URL、旧プロジェクトのドメイン等）が保存されている場合、**B では URL が無効**になりうる。別タスクとして **URL の再発行**や **DB の一括更新**が必要になる。
- **相対パスや Storage パスのみ**を保存している設計なら、バケット名・ルール・クライアント設定を B に合わせれば整合しやすい。
- Facebook 外部 URL が残る場合は [§5](#5-facebook-ユーザー画像の移行任意) の `0042` を実行する。

---

## 全体フロー（Firestore 手順との関係）

```text
1. Firestore 移行（firestoreデータ移行手順_手動.md §0〜§7）
   → A DL/UL → B 削除 → import → firestore.rules + indexes → 0004 メール削除
2. Storage 移行（本手順 = Firestore §8）
   → B 削除 → A → B コピー → storage.rules → 0042 任意 → 検証
3. Firestore §9 検証 / §10 片付け
```

---

## 変数の例（実行前に実値に置き換え）

```bash
PROJECT_A=bokudeli-event-dev
PROJECT_B=bokudeli-event-yasu-2604

# Console / gcloud storage buckets list で確認した実バケット名
BUCKET_A=bokudeli-event-dev.appspot.com
BUCKET_B=bokudeli-event-yasu-2604.appspot.com
# B が 2024-10 以降の default bucket の場合は例:
# BUCKET_B=bokudeli-event-yasu-2604.firebasestorage.app
```

---

## 事前確認チェックリスト

- [ ] [Firestore 移行](./firestoreデータ移行手順_手動.md) の §7 **0004 メール削除**まで **完了済み**
- [ ] A / B の **実バケット名**を Console で確認した（`BUCKET_A` / `BUCKET_B` に実値を設定）
- [ ] 実行アカウントが A で **読み取り**、B で **削除・書き込み**できる
- [ ] **削除対象が B のバケットのみ**であることを再確認（本番 A を消さない）
- [ ] コピー後、`communities/` `partners/` `users/` が B バケット直下にある
- [ ] B に **`storage.rules`** をデプロイする手順が決まっている
- [ ] Storage 完了後に [Firestore 手順 §9 検証](./firestoreデータ移行手順_手動.md#9-検証) へ進む
- [ ] Facebook 外部 URL が残る場合は **0042**（本手順 §5）の実行を検討

---

## 注意事項

- **B の全削除は復元できない**。消す前にバケット名を再確認し、必要なら退避やスナップショット方針を決める
- **本番（A）のデータを個人 sandbox（B）へコピーする**作業である。誤プロジェクトへの削除を防ぐため、各段階で `gcloud config list` を確認する
- 大容量では転送に時間がかかり、**操作課金・ネットワークコスト**に注意する
- **VPC Service Controls** や組織制約で端末からの `gsutil` / `gcloud storage` が使えない場合は、組織手順（GCP 上 VM、Storage Transfer Service 等）に従う
- **Cursor 等のエージェントが `gcloud` を実行する場合**、実行環境が `~/.config/gcloud` へ書き込めないと失敗することがある。本手順は**エンジニアのローカル端末**での実行を想定する
