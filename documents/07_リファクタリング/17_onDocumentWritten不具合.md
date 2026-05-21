# onDocumentWritten が default で動かない事象のデバッグ計画

## 0. 目的

`functions/legacy`（v1: `functions.firestore.document(...).onWrite()`）の Firestore トリガーは動くのに、`functions/default`（v2: `onDocumentWritten`）の Firestore トリガーだけが実行されない事象を **再現性をもって切り分け、原因を特定する**ことを目的とする。

特に **承認時のメニュースナップショット**（`applying_reservation` → `accepting_order` で `onShopReservationChanged` → `savePartnerMenusToEventMenus`）が走らない事象が、別環境でも観測されている。本ドキュメントは sandbox / 検証環境での調査手順を主にまとめる。

> **対象**: `functions/default` の Firestore v2 トリガー全般（`onShopReservationChanged`, `onEventChanged`, `shopStatusChanged` など）。本番環境 `nijuniinc/bokudeli-event-new` でこのドキュメント手順を実行する場合も、コード変更は伴わず GCP コンソールと `gcloud` / Cloud Logging の確認のみで完結する。

---

## 1. 事象の整理

### 1.1 観測している症状

- 承認操作（飲食店側で `applying_reservation` → `accepting_order` に遷移）をしても、`functions/default` の `onShopReservationChanged` の **invocation ログが Cloud Logging に出てこない**。
- 同じイベント親ドキュメント（`communities/{communityId}/events/{eventId}`）に対する `functions/legacy` の `log_event_status`（v1 onWrite） は **正常に発火している**。
- `default` 側でも Callable（例: `updateEventMenus`）や Storage トリガー（例: `generateUserImageThumbnail`）は動いている。
- 結果として、**「画面表示は EventMenu パス前提」「Storage コピーは承認時に行われる前提」**の整合性が崩れ、`accepting_order` 後にメニュー画像が表示されない事象が発生し得る。

### 1.2 1 回目の sandbox ログ観測（`bokudeli-event-yasu-2603`, 2026-05-20 15:00〜15:37 UTC）

| Function | 種別 | 観測 |
|---|---|---|
| `log_event_status` | legacy v1 | 多数の `Function execution started` あり |
| `onShopReservationChanged` | default v2 | デプロイ Audit のみ。invocation 0 |
| `onEventChanged` | default v2 | invocation 0 |
| `updateEventMenus` | default Callable | 多数の成功ログあり |
| `generateUserImageThumbnail` | default Storage | 正常 |

→ `default` 全滅ではなく、**Firestore v2 トリガー（Eventarc 経由）だけが配信されていない**像。

### 1.3 関連コード（このリポジトリ）

- `functions/default/src/eventMenusSnapshot.ts` の `onShopReservationChanged`（`document: 'communities/{communityId}/events/{eventId}'`, `region: 'asia-northeast1'`, retry なし）
- `functions/default/src/eventStatusChangeMail.ts` の `onEventChanged`（同パス）
- `functions/default/src/shopOpen.ts` の `shopStatusChanged`
- `functions/default/src/index.ts` で動的 import → export
- `functions/legacy/src/event-logging.js` の `log_event_status`（v1, `.firestore.document('communities/{communityId}/events/{eventId}').onWrite`）
- `firebase.json` の `functions[]` に `default` / `legacy` / `shokujii-slackbot` / `shokujii-linebot` の **4 codebase が同居**
- `.github/workflows/deploy_functions.yml` は `--force --only functions` でまとめてデプロイ

### 1.4 2 回目の sandbox 調査（`bokudeli-event-yasu-2603`, 2026-05-21 06:00 JST 前後）— **原因確定**

ユーザーが sandbox 上で「開店・閉店の変更 / 予約申請 / 予約承認 / 予約キャンセル」を一通り操作し、メール送信されないことを確認したうえで `gcloud` で全レイヤを切り分けた結果、**原因は Firestore → Eventarc Pub/Sub 上流の publish が停止していること**であると確定した。

#### 1.4.1 各レイヤの状態（実コマンド出力ベース）

| レイヤ | コマンド／確認 | 結果 |
|---|---|---|
| Eventarc trigger 一覧 | `gcloud eventarc triggers list --project $PROJECT_ID --location $REGION` | `onshopreservationchanged-184908` / `oneventchanged-376612` / `shopstatuschanged-040532` / `communityadded-914255` / `generateuserimagethumbnail-095597` の **5 本すべて存在** |
| trigger 詳細 | `gcloud eventarc triggers describe onshopreservationchanged-184908` | `eventFilters.type = google.cloud.firestore.document.v1.written`、`database=(default)`、`document=communities/{communityId}/events/{eventId}`、`destination.cloudFunction=onShopReservationChanged`、`serviceAccount=257453827968-compute@developer.gserviceaccount.com`。`createTime=2026-03-27`、**`updateTime=2026-03-27` のまま 2 ヶ月以上変化なし** |
| Pub/Sub topic | `gcloud pubsub topics describe eventarc-asia-northeast1-onshopreservationchanged-184908-989` | 存在。`messageStoragePolicy.allowedPersistenceRegions=[asia-northeast1]`、`labels.goog-managed-by` なし |
| Pub/Sub subscription | `gcloud pubsub subscriptions describe eventarc-asia-northeast1-onshopreservationchanged-184908-sub-495` | **`state: ACTIVE`**、`pushConfig.pushEndpoint = https://onshopreservationchanged-urue4ffkja-an.a.run.app?__GCP_CloudEventsMode=CE_PUBSUB_BINDING`、`oidcToken.serviceAccountEmail=257453827968-compute@developer.gserviceaccount.com`、`ackDeadlineSeconds=600`、`messageRetentionDuration=86400s` |
| topic / sub の全数 | `gcloud pubsub topics list \| grep eventarc`、`gcloud pubsub subscriptions list \| grep eventarc` | 5 ペアすべて健在 |
| トピック / Cloud Run の resource-level IAM | `gcloud pubsub topics get-iam-policy ...`、`gcloud run services get-iam-policy ...` | **動く方（`communityadded`）も動かない方（`onshopreservationchanged`）も両方とも `etag: ACAB` のみで bindings 空**。差異なし（＝ resource-level IAM は原因ではない／プロジェクト IAM で賄われている） |
| Cloud Run service 状態 | `gcloud run services describe onshopreservationchanged` | `Ready=True`、`latestReadyRevisionName == latestCreatedRevisionName = onshopreservationchanged-00048-yaw`。**48 世代目まで再デプロイされても症状は不変** |
| Cloud Run の HTTP POST（動かない 3 関数） | `gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="<svc>" AND httpRequest.requestMethod="POST"' --freshness=24h` を `onshopreservationchanged` / `oneventchanged` / `shopstatuschanged` で実行 | **3 関数すべて 24h 以内に POST 0 件**。「空行」の正体は JSON 全文出力で確認したところ `cloudaudit.googleapis.com/system_event`（デプロイ完了監査ログ）であり、関数の invocation ログではない |
| Cloud Run の HTTP POST（Storage v2 比較） | `gcloud logging read ... service_name="generateuserimagethumbnail"` を `--freshness=7d` | **`POST 200` が直近で 10 件以上**（`__GCP_CloudEventsMode=GCS_NOTIFICATION`）。Eventarc → Pub/Sub → Cloud Run の **配送レール自体は健全** |
| v1 比較 | `log_event_status`（同じ `communities/{cid}/events/{eid}` パス） | 同期間に **23 回 fire 済**。＝ Firestore の書き込み自体は発生している |

#### 1.4.2 原因の確定

- **Eventarc trigger / Pub/Sub topic / Pub/Sub subscription / Cloud Run service は全て正しく存在し、ACTIVE / Ready**。設定上の不備は無い。
- **Storage v2 トリガー（`generateuserimagethumbnail`）は同プロジェクト・同レール（Eventarc → Pub/Sub → Cloud Run）で問題なく POST 200 を受けている** → Eventarc 配送経路自体は健全。
- それでも `firestore.document.v1.written` の 3 関数だけ **Cloud Run に POST が 1 件も届かない**。
- ＝ **Firestore がこれらのトピックに publish していない**。Storage 通知は GCS バケットの Notification Config として別経路で登録されているため健全。Firestore の v2 イベントだけが内部の Eventarc 統合経路で登録されており、**そのリスナー登録が「幽霊状態」**（Eventarc 上の trigger メタデータは残るが、Firestore 側は publish を止めている）。
- Eventarc trigger の `updateTime` が `2026-03-27` のまま変わっていないことから、**Firebase 再デプロイは Cloud Run revision を更新しても Eventarc trigger と Firestore リスナーを再登録しない**ことが裏付けられる。48 世代再デプロイしても直らないのはこのため。

> ユーザーが過去に別環境でも経験した「default の `onDocumentWritten` だけが動かない」事象と症状が完全に一致する。

#### 1.4.3 復旧結果（2026-05-21 15:48〜15:57 JST）

§4 Step 0 の手順で **完全復旧を確認**。所要時間は delete 開始から POST 200 確認まで約 15 分。

| タイミング (JST) | 操作 | 結果 |
|---|---|---|
| 15:48 | `firebase functions:delete onShopReservationChanged / onEventChanged / shopStatusChanged --force` | 3 関数とも `Successful delete operation.`。直後に `firebase functions:list` / `gcloud eventarc triggers list` / `gcloud pubsub topics list` で確認したところ、**Cloud Run service / Eventarc trigger / Pub/Sub topic & subscription が完全に消去**された |
| 15:48 | `gh workflow run deploy_functions.yml --repo nijuni-yasu/bokudeli-event-yasu-2603-2 --ref fix/2019 -f environment=development` | GitHub Actions run `26210265152` を発火 |
| 〜15:55 | Actions run 完了（過去実績で 3〜6 分） | `deploy_functions.yml` success |
| 15:56〜15:57 | sandbox UI で開店・閉店 / 予約申請 / 承認 / キャンセル等を操作 | — |
| 15:57 | `gcloud logging read ... httpRequest.requestMethod="POST" --freshness=10m` | **3 関数とも POST 200 を複数件記録**（下記詳細） |

実観測ログ（抜粋）:

```text
=== onshopreservationchanged ===
2026-05-21T06:57:17  200  https://onshopreservationchanged-...?__GCP_CloudEventsMode=CE_PUBSUB_BINDING
2026-05-21T06:56:14  200  ...
2026-05-21T06:56:14  200  ...
=== oneventchanged ===
2026-05-21T06:57:16  200  https://oneventchanged-...?__GCP_CloudEventsMode=CE_PUBSUB_BINDING
2026-05-21T06:56:14  200  ...
2026-05-21T06:56:14  200  ...
=== shopstatuschanged ===
2026-05-21T06:56:56  200  https://shopstatuschanged-...?__GCP_CloudEventsMode=CE_PUBSUB_BINDING
2026-05-21T06:56:35  200  ...
```

確定事項:

- `__GCP_CloudEventsMode=CE_PUBSUB_BINDING` の付いた POST が届いている → **Pub/Sub Push 経由**で正しく配送されている（Storage の `GCS_NOTIFICATION` ではない＝ Firestore イベント由来）
- 同パス（`communities/{cid}/events/{eid}`）に張られた 2 つの v2 トリガー（`onShopReservationChanged` / `onEventChanged`）が **両方とも個別に発火**。同パス共有による発火漏れも無し
- 別パス（`partners/{pid}/shops/{sid}`）の `shopStatusChanged` も復活
- すべて HTTP 200 = 関数本体は正常終了

> **結論**: H_NEW は **§4 Step 0（関数 delete → redeploy）で完全に復旧する**。原因は推測どおり「Firestore 側のリスナー登録の幽霊化」であり、コード変更は不要だった。本番で同症状が出ても同手順で復旧できる見込み（運用窓口と合意のうえで実施）。

### 1.5 影響

- 承認直後のメニュー固定（PartnerMenu → EventMenu スナップショット）が行われない。
- `documents/07_リファクタリング/16_EventMenu画像不具合.md` の方針（EventMenu パスに 1:1 で同期）が破綻する経路ができる。
- ステータス変更メール（`onEventChanged`）も発火しないため、店舗承認・却下に関するメール送信が止まる可能性がある。

---

## 2. 仮説と 2026-05-21 調査での検証結果

| # | 仮説 | 切り分け観点 | 2026-05-21 調査での結論 |
|---|---|---|---|
| H1 | **Eventarc トリガー不整合**（未作成 / 古い revision を指す / 無効化） | `gcloud eventarc triggers describe` | ❌ **棄却**: trigger は存在し、`eventFilters` / `destination` / `transport.pubsub` すべて正しい |
| H2 | **マルチ codebase デプロイの部分失敗**（`default` だけ更新漏れ） | `firebase functions:list` / Cloud Run revision | ❌ **棄却**: Cloud Run service は `gen 48` まで何度も再デプロイされ、`Ready=True`、最新 revision が 100% traffic |
| H3 | **IAM / Service Agent の権限不足** | topic / Cloud Run の `get-iam-policy` | ❌ **棄却**: 動く `communityadded` と動かない `onshopreservationchanged` で resource-level IAM は **同じく空（`etag: ACAB` のみ）**。差異なし＝原因ではない |
| H4 | **ロジックの早期 return** | Cloud Run の HTTP POST が来ているか | ❌ **棄却（前提が崩れた）**: そもそも Cloud Run に POST が 0 件届いていないため、関数本体は走っていない |
| H5 | **更新対象がイベント親ドキュメントではない** | v1 (`log_event_status`) が fire しているか | ❌ **棄却**: 同じパス `communities/{cid}/events/{eid}` で v1 が 23 回 fire している＝親 doc は更新されている |
| H6 | **index.ts での export 漏れ / 動的 import エラー** | デプロイログの `Loaded functions definitions` | ❌ **棄却**: そもそも Cloud Run service が `Ready` で 100% traffic を取っており、export 自体は成功している（FUNCTION_TARGET も正しく `onShopReservationChanged`） |
| H7 | **リージョン / Firestore データベース名の不一致** | trigger の `location` / `database` | ❌ **棄却**: 両者とも `asia-northeast1` / `(default)` |
| H8 | **`firebase-functions` / `firebase-admin` のバージョン不整合** | `package.json` と既知 Issue | △ **未確認** — H_NEW で根本原因が説明できているため後回し |
| H9 | **エラー発生で 1 回限り終了** | Cloud Logging の ERROR ログ | ❌ **棄却**: そもそも POST が来ていないので関数本体のエラーではない |
| H10 | **Pub/Sub トピックのバックログ / 配信遅延** | Pub/Sub サブスクのバックログ | ❌ **棄却**: 上流（Firestore → topic）に publish 自体が無いため、バックログも溜まらない（unack 0 件） |
| **H_NEW** | **Firestore → Eventarc Pub/Sub への publish が「幽霊状態」**（Eventarc trigger と Pub/Sub は健全だが、Firestore 側のリスナー登録が死んでいる） | Storage v2 が動くのに Firestore v2 だけ POST 0 件。Eventarc trigger の `updateTime` が 2 ヶ月以上不変。Firebase 再デプロイ 48 回でも復活せず | ✅ **確定（最有力）**。復旧は §4 Step 0（関数 delete → redeploy）で trigger と Firestore リスナーごと再作成 |

### 2.1 「H_NEW」を支える観測の論理

1. Storage v2 (`generateuserimagethumbnail`) が POST 200 を受けている  
   → **Eventarc → Pub/Sub → Cloud Run の配送経路は健全**
2. Firestore v2 (`onShopReservationChanged` / `onEventChanged` / `shopStatusChanged`) は **3 関数すべて POST 0 件**  
   → 違いはイベントの **発生源（GCS Notification Config か Firestore か）** のみ
3. 同パスの v1 (`log_event_status`) は 23 回 fire 済  
   → **Firestore の書き込み自体は存在する**
4. Eventarc trigger / Pub/Sub topic / subscription は全部 ACTIVE で push 先も正しい  
   → **Eventarc 側の登録は正常**
5. Eventarc trigger の `updateTime` が `2026-03-27` から不変、それでも復活していない  
   → **`firebase deploy` は Cloud Run revision しか更新せず、Firestore リスナーの再登録は行わない**

→ 残る切れ目は **Firestore → Eventarc Pub/Sub に publish する Firestore 内部リスナーの登録だけ**。  
そこが切れている状態のままなので、**Eventarc trigger を一度消して再作成しない限り復旧しない**。

---

## 3. デバッグ手順

### 3.1 前提（実行環境）

- `gcloud` / `gh` / Firebase Console にアクセスできるローカル環境。
- 対象は **sandbox（fork 系）** を優先する。本番（`nijuniinc/bokudeli-event-new`）に対してはコード変更や `firebase deploy` を行わず、**観測のみ**にとどめる。
- 環境変数として、

  ```bash
  export PROJECT_ID=bokudeli-event-yasu-2603       # 例: sandbox プロジェクト
  export REGION=asia-northeast1
  export EVENT_ID=<対象イベントの eventId>
  export COMMUNITY_ID=<対象イベントの communityId>
  ```

  を用意しておくと以降のコマンドが回しやすい。

### 3.2 Step 1: invocation の有無を **HTTP POST フィルタ**で確認する

#### 3.2.1 注意（2026-05-21 調査で得た学び）

- 単に `resource.type="cloud_run_revision" AND service_name=X` で取ると、**デプロイ完了の監査ログ（`cloudaudit.googleapis.com/system_event`）や `STARTUP TCP probe` 等のシステムログ**が大量に混ざる。これらは関数本体の invocation ではない。
- 正しくは **`httpRequest.requestMethod="POST"` で絞る**。Eventarc → Cloud Run の push はすべて POST で届くため、これがゼロなら invocation は本当にゼロ。

#### 3.2.2 動かない 3 関数を一括で確認

```bash
for svc in onshopreservationchanged oneventchanged shopstatuschanged; do
  echo "=== $svc ==="
  gcloud logging read \
    "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$svc\" AND httpRequest.requestMethod=\"POST\"" \
    --project "$PROJECT_ID" --freshness=24h --limit 5 \
    --format='value(timestamp,httpRequest.status,httpRequest.requestUrl)'
done
```

`=== <svc> ===` の下に何も出なければ **24h 以内に invocation 0 件**。

#### 3.2.3 Eventarc レール健全性チェック（**Storage v2 との対比**）

`generateuserimagethumbnail` は Storage トリガー（Eventarc 経由）で、**動いている方の対照**として極めて有用。

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="generateuserimagethumbnail" AND httpRequest.requestMethod="POST"' \
  --project "$PROJECT_ID" --freshness=7d --limit 10 \
  --format='value(timestamp,httpRequest.status,httpRequest.requestUrl)'
```

期待出力（実観測例）:

```text
2026-05-21T05:54:01...  200  https://generateuserimagethumbnail-urue4ffkja-an.a.run.app/?__GCP_CloudEventsMode=GCS_NOTIFICATION
...
```

| 動かない 3 関数 | `generateuserimagethumbnail` | 結論 |
|---|---|---|
| 0 件 | POST 200 あり | **Eventarc レールは健全。Firestore → Eventarc の publish だけ死んでいる**（H_NEW 確定）→ §4 Step 0 |
| 0 件 | 0 件 | Eventarc 全体が死んでいる。プロジェクトレベル設定問題 |
| POST 200 が来ている | - | **関数は呼ばれている**。コード内の早期 return か（§3.7 へ） |
| POST 4xx/5xx | - | **push は来ているが Cloud Run が失敗**。コード/認証/タイムアウト調査 |

#### 3.2.4 v1 比較（Firestore 書き込み自体は起きているか）

```bash
gcloud logging read \
  'resource.type="cloud_function" AND resource.labels.function_name="log_event_status"' \
  --project "$PROJECT_ID" --limit 20 --freshness=1h \
  --format='value(timestamp,severity,textPayload)'
```

v1 が fire していれば、**Firestore の書き込みは確実に起きている**。Firestore 自体が更新されない問題（クライアントのバグなど）は除外できる。

### 3.3 Step 2: 親ドキュメントを 1 フィールドだけ更新して反応を見る

メニュー保存だけだとサブコレクションの更新になるため、**親 doc** を触る必要がある（H5 の切り分け）。

Firebase Console の Firestore で対象イベント `communities/{COMMUNITY_ID}/events/{EVENT_ID}` を開き、

- `updated_at` または使っていない無害なフィールドを 1 回更新
- `event_status.value` を一度別ステータスにし、再度戻す（**ステータス変更ログ・メール送信などの副作用に注意**）

更新後 1〜2 分以内に Step 1 のクエリを再実行する。

| 結果 | 解釈 |
|---|---|
| `log_event_status` だけ増える | **H1/H2/H3** の典型。Step 3 へ |
| 両方とも増える | **H4/H5/H9**。Step 6 へ |
| どちらも増えない | Firestore そのものの更新が反映されていない（権限・接続先プロジェクトを再確認） |

> 親 doc 更新が業務上難しい場合は、admin の「イベント設定保存（基本情報）」など `event` ドキュメントを書き換える操作で代替する。

### 3.4 Step 3: Eventarc トリガーと Cloud Run revision の整合性を確認する（H1）

```bash
# Eventarc トリガー一覧
gcloud eventarc triggers list \
  --project "$PROJECT_ID" --location "$REGION" \
  --format='table(name,eventFilters.list(),destination.cloudRun.service,active)'

# 対象トリガーの詳細
gcloud eventarc triggers describe \
  $(gcloud eventarc triggers list --project "$PROJECT_ID" --location "$REGION" \
      --format='value(name)' | grep onshopreservationchanged) \
  --project "$PROJECT_ID" --location "$REGION"
```

確認ポイント:

- `eventFilters` に `type=google.cloud.firestore.document.v1.written`、`document` がコード上のパスと一致
- `database` が `(default)`
- `destination.cloudRun.service` が **現行 revision を持つ Cloud Run サービス**を指す
- `serviceAccount` がプロジェクトの compute SA（または専用 SA）
- `state: ACTIVE`

合わせて Cloud Run 側:

```bash
gcloud run services describe onshopreservationchanged \
  --project "$PROJECT_ID" --region "$REGION" \
  --format='value(status.url,status.latestReadyRevisionName,status.latestCreatedRevisionName)'
```

`latestReadyRevisionName` と `latestCreatedRevisionName` が **一致しない**場合は、最新 revision が Ready になっていない（H1 の典型）。

### 3.5 Step 4: マルチ codebase デプロイの状態を確認する（H2）

```bash
firebase functions:list --project "$PROJECT_ID"
```

または GCP「Cloud Run 関数」一覧で、

- `default` codebase の関数群（`onShopReservationChanged`, `onEventChanged`, `updateEventMenus` など）と
- `legacy` codebase の `log_event_status`

の **更新時刻**を比較する。`legacy` だけ新しく、`default` が古い → **H2** が濃厚。

CI のデプロイログ（`.github/workflows/deploy_functions.yml`）で:

- `npm -w functions/default run build` の終了コード
- `Deploy to Firebase` ステップでの `Functions deploy had errors` 警告
- `default` codebase 向けのエラーメッセージ

を確認する。失敗したワークフローは [Actions ページ](https://github.com/nijuni-yasu/bokudeli-event-yasu-2603-2/actions) からログ全文を取得できる。

### 3.6 Step 5: IAM / Eventarc Service Agent の確認（H3）

```bash
# プロジェクトの IAM
gcloud projects get-iam-policy "$PROJECT_ID" \
  --flatten='bindings[].members' \
  --format='value(bindings.role,bindings.members)' \
  | grep -E 'eventarc|run.invoker|firestore'
```

期待する権限（最低限）:

- `service-{PROJECT_NUMBER}@gcp-sa-eventarc.iam.gserviceaccount.com` に `roles/eventarc.serviceAgent`
- `service-{PROJECT_NUMBER}@gcp-sa-firestore.iam.gserviceaccount.com` に `roles/firestore.serviceAgent`（Firestore → Eventarc 配信）
- トリガーの実行サービスアカウント（多くは `{PROJECT_NUMBER}-compute@developer.gserviceaccount.com`）に `roles/run.invoker` と `roles/eventarc.eventReceiver`

抜けがある場合は GCP コンソールから付与し、Eventarc サブスクリプションが復旧するか Step 1 で再確認する。

> 権限変更は本番では即時影響が出るため、sandbox で再現させてから本番に適用する。

### 3.7 Step 6: 中身を踏んでいるかを WIP ログで確認する（H4 / H5）

invocation はあるが return している場合、最小の WIP ログを **検証ブランチに限定して**入れる。

`functions/default/src/eventMenusSnapshot.ts` の例（あくまで案）:

```ts
// 検証用ログ（マージ前に削除すること）
logger.info('onShopReservationChanged invoked', {
  beforeStatus,
  afterStatus,
  partnerId,
  communityId,
  eventId,
  hasStartDatetime: startDatetime != null,
})
```

挿入位置は `change.data` の null チェックの直後、ステータス判定の前。

WIP デプロイは `.claude/skills/github-sandbox-wip-deploy/SKILL.md` の手順に従う（lint・format → WIP コミット → `--force-with-lease` push → sandbox の Actions 発火）。確認後は必ず revert する。

### 3.8 Step 7: Eventarc Pub/Sub の存在 / バックログ確認（H10 / H_NEW）

> **注意（2026-05-21 調査で踏んだ罠）**:
> `gcloud pubsub topics list --filter='name ~ eventarc-asia-northeast1-(A|B|C)'` のような **`(...)` のグルーピングを含む regex** は gcloud のフィルタ構文で意図どおりに効かず、**実在するトピックでも 0 件**と返ってくることがある。
> 確実なのは **`--format='value(name)' | grep eventarc`** のような後段 grep か、**`gcloud pubsub topics describe` で名指し**するパターン。

#### 3.8.1 名指しで存在確認（最確実）

```bash
gcloud pubsub topics describe \
  eventarc-asia-northeast1-onshopreservationchanged-184908-989 \
  --project "$PROJECT_ID"

gcloud pubsub subscriptions describe \
  eventarc-asia-northeast1-onshopreservationchanged-184908-sub-495 \
  --project "$PROJECT_ID"
```

`NOT_FOUND` ならトピック/サブスクが本当に消えている。YAML が返れば健全。

> 上記の `*-184908-989` / `*-184908-sub-495` の数字は **このプロジェクトで観測された実値**。  
> 別環境では `gcloud eventarc triggers describe <trigger>` の `transport.pubsub.topic` / `.subscription` から取得すること。

#### 3.8.2 grep 経由で一覧化

```bash
gcloud pubsub topics list --project "$PROJECT_ID" \
  --format='value(name)' | grep eventarc

gcloud pubsub subscriptions list --project "$PROJECT_ID" \
  --format='value(name)' | grep eventarc
```

`communityadded` / `onshopreservationchanged` / `oneventchanged` / `shopstatuschanged` / `generateuserimagethumbnail` の **5 ペア**がすべて並んでいれば Pub/Sub レイヤは健全。

#### 3.8.3 バックログ・配信ステータス（Console が最も速い）

CLI は `gcloud monitoring time-series list` が gcloud によっては非実装（alpha/beta 移管）の場合があるため、**Cloud Console の Pub/Sub > サブスクの「METRICS」タブ**が最も実用的:

- `eventarc-asia-northeast1-onshopreservationchanged-184908-sub-495` の「Publish requests」「Unacked message count」「Ack message count」「Push attempts by response_code」を直近 24h で確認
- Publish が 0 なら **上流（Firestore）が publish していない**＝ H_NEW
- Publish > 0 で Push 4xx/5xx 多発なら **下流（Cloud Run 側）が失敗**＝早期 return / 認証 / タイムアウト

URL 例:

```text
https://console.cloud.google.com/cloudpubsub/subscription/detail/eventarc-asia-northeast1-onshopreservationchanged-184908-sub-495?project=$PROJECT_ID
```

### 3.9 Step 8: バージョン・依存関係の差を確認する（H8）

```bash
node -p "require('./functions/default/package.json').dependencies['firebase-functions']"
node -p "require('./functions/default/package.json').dependencies['firebase-admin']"
```

`firebase-functions` の v6 系（v2 API）/ Node 20 と、デプロイ先 Cloud Run のランタイム（前回ログでは `nodejs20_20260504_20_20_2_RC00`）の不整合がないか。Firebase の Release Notes と既知の Issue を参照する。

---

## 4. 復旧手順

### 4.0 Step 0: 関数 delete → redeploy（**最有力／H_NEW 確定時の本命**）

2026-05-21 調査で確定した **H_NEW（Firestore → Eventarc の publish が幽霊状態）** に対する根本対処。  
**`firebase deploy --only functions:default` を何度繰り返しても直らない**ことが確認済み（gen 48 まで再デプロイしても症状不変）。Eventarc trigger と Firestore リスナーを丸ごと作り直す必要がある。

#### 4.0.1 sandbox（fork 系）での手順

```bash
export PROJECT_ID=bokudeli-event-yasu-2603
export REGION=asia-northeast1

# 1) 3 関数を個別に削除（Cloud Run service / Eventarc trigger / Pub/Sub topic & subscription がまとめて消える）
firebase functions:delete onShopReservationChanged \
  --project "$PROJECT_ID" --region "$REGION" --force
firebase functions:delete onEventChanged \
  --project "$PROJECT_ID" --region "$REGION" --force
firebase functions:delete shopStatusChanged \
  --project "$PROJECT_ID" --region "$REGION" --force

# 2) GitHub Actions で deploy_functions.yml を発火（推奨）、または
#    ローカルから
firebase deploy --only functions:default --project "$PROJECT_ID"
```

#### 4.0.2 動作確認（redeploy 直後）

1. sandbox UI で **承認操作（`applying_reservation` → `accepting_order`）** を 1 回行う
2. §3.2.2 のコマンドを `--freshness=10m` で再実行し、**`POST 200` が記録されているか**を確認
3. メール（店舗承認・却下メール、shop 開閉店メール）が届くか確認

#### 4.0.3 本番への展開判断

- 本番でも同症状が出ている場合、上記 `firebase functions:delete` 系は **副作用が大きい**（短時間ながら関数が停止する）ため、運用窓口と合意してから実施
- 本ドキュメントの **コード変更は不要**。Cloud Run / Eventarc 側の状態を作り直すだけ

#### 4.0.4 Step 0 で直らない場合の追加打ち手

| 打ち手 | 内容 |
|---|---|
| **Eventarc trigger だけ手で消す** | `gcloud eventarc triggers delete onshopreservationchanged-184908 --location $REGION --quiet` 等で trigger だけ削除 → `firebase deploy` で再作成。`firebase functions:delete` を避けたい時用 |
| **Eventarc API の再有効化**（sandbox のみ） | `gcloud services disable eventarc.googleapis.com && gcloud services enable eventarc.googleapis.com` → 関数再デプロイ。Eventarc Service Agent を作り直すための強引な手段。**本番では実施しない** |
| **Firestore API の再有効化**（sandbox のみ） | 上と同じく `firestore.googleapis.com` を一度 disable → enable。データには影響しないが、すべての Firestore リスナーが切れるため運用窓口と合意 |

#### 4.0.5 実施記録（2026-05-21, `bokudeli-event-yasu-2603` sandbox）

| 時刻 (JST) | 操作 | コマンド / 結果 |
|---|---|---|
| 15:48 | 3 関数を削除 | `firebase functions:delete onShopReservationChanged / onEventChanged / shopStatusChanged --project bokudeli-event-yasu-2603 --region asia-northeast1 --force` → すべて `Successful delete operation.` |
| 15:48 | 削除確認 | `firebase functions:list` / `gcloud eventarc triggers list` / `gcloud pubsub topics list` のいずれでも 3 関数関連の表示なし＝ Cloud Run service / Eventarc trigger / Pub/Sub topic & subscription が完全削除 |
| 15:48 | 再デプロイ発火 | `gh workflow run deploy_functions.yml --repo nijuni-yasu/bokudeli-event-yasu-2603-2 --ref fix/2019 -f environment=development` → run `26210265152`（過去同 workflow は 3〜6 分で success） |
| 〜15:55 | デプロイ完了 | `gh run list ... deploy_functions.yml` で success |
| 15:56〜15:57 | sandbox UI で実操作 | 開店・閉店トグル / 予約申請 / 承認 / キャンセル |
| 15:57 | 動作確認 | `gcloud logging read ... httpRequest.requestMethod="POST" --freshness=10m` で 3 関数とも POST 200 を複数件確認（`__GCP_CloudEventsMode=CE_PUBSUB_BINDING`）→ **H_NEW 復旧確定** |

詳細ログは §1.4.3 を参照。

**学び**:

- 削除 → デプロイ → 動作確認まで **約 15 分**で完了。Pub/Sub のバックログ消化待ち等の遅延も無し
- `firebase functions:delete` は `--force` 付きで対話プロンプトを省略できる。**3 関数を 1 コマンドで連続実行**可能（過去のシェル履歴で確認）
- 再デプロイ後、Eventarc trigger の `updateTime` が新しくなり、Pub/Sub topic / subscription の末尾 UUID（旧: `-989` / `-715` / `-414`）も別の数字に変わる。これが「完全再作成された」シグナル
- **コード変更は一切不要**だった。原因は完全にインフラ（Firestore 側のリスナー登録）側の状態破損

### 4.1 Step 1: その他の結果別 fallback

§2 の仮説のうち H_NEW 以外に該当した場合の対応:

| 切り分け結果 | 復旧方針 |
|---|---|
| **H1**: Eventarc trigger が存在しない / 古い revision を指す | `firebase deploy --only functions:default` を再実行。改善しなければ Step 0 |
| **H2**: `default` codebase のデプロイ部分失敗 | CI ログから失敗原因（lint / build / quota）を特定。`gh run rerun` で再実行、または個別に `firebase deploy --only functions:default` |
| **H3**: IAM 不足 | 不足ロール（`eventarc.serviceAgent`, `firestore.serviceAgent`, `run.invoker` など）を付与。本番では IAM 変更を別 PR / 別運用フローで適用 |
| **H4**: 早期 return | §3.7 の WIP ログで確定後、判定条件のバグ修正 |
| **H5**: 親 doc が更新されていない | 呼び出し側で親 doc 更新を追加、またはトリガー対象をサブコレクション側に変更（影響範囲が大きいため要再設計） |
| **H6**: export 漏れ | `index.ts` の export 追加 → 再デプロイ |
| **H7**: リージョン / DB 不一致 | コードの `region` / `database` をプロジェクト構成と一致させる |
| **H8**: バージョン不整合 | `firebase-functions` / `firebase-admin` を再固定 → CI で `package-lock.json` を更新してデプロイ |
| **H9**: ERROR で終了 | Cloud Logging の ERROR を見て個別対応（多くは `getPartner` / `getEvent` 失敗、コピー失敗） |
| **H10**: Pub/Sub バックログ | 一時的なら待機。長時間続く場合は Step 0 |

---

## 5. 並行して取るべき暫定対応

調査・復旧までの間も「メニュー画像が出ない」事象を最小化するため、次の暫定対応を `documents/07_リファクタリング/16_EventMenu画像不具合.md` の方針に沿って維持しておく。

- `base/src/components/EventMenuImage.vue` の **404 → PartnerMenu フォールバック**は撤去しない（同ドキュメント §7.6 参照）。
- 主催者の「申請中のメニュー保存」を促す運用で `updateEventMenus` 経由のスナップショットを動かす（`savePartnerMenusToEventMenus` は同じ実体）。
- 承認後のフォローとして、運営から飲食店に「画像が反映されないケースでは主催者にメニュー再保存をお願いする」運用を一時的に許容する。

---

## 6. 再発防止メモ

### 6.1 コード側

- **v2 関数の最上段に常時 `logger.info`** を仕込む。「invocation が来ているのに早期 return しているのか」「そもそも invocation が無いのか」を即時に切り分けられるようにする。最低限の例:

  ```ts
  export const onShopReservationChanged = onDocumentWritten(
    { document: '...', region: '...' },
    async (event) => {
      logger.info('onShopReservationChanged invoked', {
        path: event.document,
        params: event.params,
        hasBefore: event.data?.before.exists,
        hasAfter: event.data?.after.exists,
      })
      // ...本処理
    },
  )
  ```

  → §3.2 で `httpRequest.requestMethod="POST"` の有無を見るだけで「Pub/Sub から push されているか」を判定できる現状でも、**コード側にも logger があれば「ペイロードが本当に届いているか」を二重に確認できる**。

### 6.2 監視・運用側

- **Cloud Monitoring アラート**を以下 2 軸で仕込む:
  1. **Cloud Run のリクエスト数が 0 のまま N 時間継続**したらアラート（`run.googleapis.com/request_count`、`service_name=onshopreservationchanged` 等、Storage 系を除く）
  2. **Pub/Sub サブスクの publish 数が 0 のまま N 時間継続**したらアラート（`pubsub.googleapis.com/topic/send_request_count`、`topic_id` で eventarc-... を絞り込み）

  → 単独だと「テスト操作が無かっただけ」と区別がつかないため、**v1 (`log_event_status`) が fire しているのに v2 が 0** という相関を検知できるとなお良い（要設計）。
- **Eventarc trigger の `updateTime` 監視**: 定期スケジュールで `gcloud eventarc triggers describe` を回し、`updateTime` が長期間（例 30 日）変わっていない trigger を検出して Slack に通知する。今回の事象では `updateTime: 2026-03-27` のまま放置されていたため、これが見えていれば早期発見できた。

### 6.3 デプロイ側

- **`legacy` から `default` への移行**（[01_legacy_to_default移行.md](./01_legacy_to_default移行.md)）の進捗と並行して、**移行後は v1 比較対象が消える**点を意識する。今回の調査では `log_event_status`（v1）が「Firestore は更新されている」ことの裏付けに使えた。`legacy` を消したあとは、v2 自体に二重の検知手段（コード logger + Cloud Monitoring）を入れておくことがより重要になる。
- **デプロイスキル（`.claude/skills/github-actions-deploy/SKILL.md`）に、デプロイ後の `httpRequest.requestMethod="POST"` 確認手順を追記**することを検討する。現状の WIP デプロイスキル（`github-sandbox-wip-deploy`）には動作確認パートが薄い。

### 6.4 ドキュメント側

- 本ドキュメントは「**症状再発時に最初に開くランブック**」として運用する。新しい症例（例: 本番でも同じ症状が出た、Step 0 で直らなかった等）が出たら §1.4 と §4 に時系列追記する。

---

## 7. デバッグ作業のチェックリスト

実作業時にコピーして使う。**2026-05-21 調査の確定フローに合わせて並べ替え済み**。

### 7.1 一次切り分け（5 分以内）

- [ ] 対象プロジェクト・対象イベントの `PROJECT_ID` / `COMMUNITY_ID` / `EVENT_ID` を確定
- [ ] sandbox UI で **承認 or 開閉店 or 予約申請 / キャンセル**を 1 回操作（v1 と v2 を同時に揺らす）
- [ ] §3.2.2 で **動かない 3 関数**の `httpRequest.requestMethod="POST"` を一括チェック → ほぼ確実に 0 件のはず
- [ ] §3.2.3 で **Storage v2（`generateuserimagethumbnail`）**の POST 履歴を確認 → 200 が並んでいれば Eventarc レール健全
- [ ] §3.2.4 で v1 (`log_event_status`) が fire しているかチェック → fire していれば Firestore 書き込みは生きている

→ ここまでで「**Firestore v2 の publish だけ死んでいる（H_NEW）**」が見える。

### 7.2 二次切り分け（Eventarc / Pub/Sub）

- [ ] §3.4 で `gcloud eventarc triggers describe <trigger>` → `eventFilters` / `transport.pubsub.topic` / `serviceAccount` を確認
- [ ] §3.8.1 で `gcloud pubsub topics describe` / `subscriptions describe` を **名指し**で実行 → ACTIVE で push 先正しいか
- [ ] §3.8.2 で `gcloud pubsub topics list | grep eventarc` で 5 ペア揃っているか
- [ ] §3.8.3 で Console の Pub/Sub > サブスクの「METRICS」タブで Publish 数 / Push 4xx,5xx を 24h 表示で確認

### 7.3 復旧

- [ ] §4 Step 0（**関数 delete → redeploy**）を sandbox で実行
- [ ] §4.0.2 の動作確認（承認操作 → §3.2.2 で POST 200 を確認 → メール到達確認）
- [ ] 直らない場合は §4.0.4（trigger 単独削除 / API 再有効化）を順に試す
- [ ] それでも直らない場合は §4.1 の H1〜H10 の fallback に進む

### 7.4 振り返り

- [ ] 結果（解決した手順、観察された出力）を §1.4 と §4 に時系列追記
- [ ] §6 の再発防止（コード側 logger / Cloud Monitoring アラート）の追加が必要か検討
- [ ] 暫定対応（`EventMenuImage.vue` の 404 → PartnerMenu フォールバック）は撤去しない（[16_EventMenu画像不具合.md](./16_EventMenu画像不具合.md) §7.6 参照）

### 7.5 1 回目の実施記録（2026-05-21, `bokudeli-event-yasu-2603` sandbox）

| フェーズ | 完了 | 備考 |
|---|---|---|
| §7.1 一次切り分け | ✅ | §1.4.1 の表参照。3 関数とも POST 0、Storage v2 は POST 200、v1 (`log_event_status`) は 23 回 fire → H_NEW 確定 |
| §7.2 二次切り分け | ✅ | Eventarc trigger / Pub/Sub topic & subscription が **健全だが publish が来ない**ことを確認。`updateTime: 2026-03-27` 不変も発見 |
| §7.3 復旧 | ✅ | §4.0.5 の手順で完了。15:48〜15:57 JST の約 15 分。Step 0 のみで復旧、§4.0.4 の追加打ち手は不要 |
| §7.4 振り返り | ⬜ §1.4.3 / §4.0.5 への追記は完了、§6 アラート整備は未着手 | 本番運用に向けて §6.2 の Cloud Monitoring アラートを別 Issue で検討 |

> 2 回目以降の症状再発時は **§7.1 → §7.2 → §7.3 を上記未チェックの空テンプレートでなぞる**運用とし、本節（§7.5）の下に「2 回目の実施記録」を時系列で追記していく。

---

## 8. 関連ドキュメント / ファイル

- [16_EventMenu画像不具合.md](./16_EventMenu画像不具合.md): 承認時メニュースナップショットの設計と暫定フォールバック
- [01_legacy_to_default移行.md](./01_legacy_to_default移行.md): legacy → default 移行の全体像
- `functions/default/src/eventMenusSnapshot.ts`: `onShopReservationChanged` / `savePartnerMenusToEventMenus`
- `functions/default/src/eventStatusChangeMail.ts`: `onEventChanged`
- `functions/default/src/shopOpen.ts`: `shopStatusChanged`
- `functions/legacy/src/event-logging.js`: `log_event_status`（v1 比較対象）
- `firebase.json`: 4 codebase 構成
- `.github/workflows/deploy_functions.yml`: マルチ codebase 一括デプロイ
- `.claude/skills/github-sandbox-wip-deploy/SKILL.md`: WIP ログ用 sandbox デプロイ手順
- `documents/実装メモ/sandboxデプロイのGitHub Actions.md`: sandbox 環境の前提
