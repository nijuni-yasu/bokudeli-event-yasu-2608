# Node 20 → Node 24 バージョン更新

## 0. 目的

Firebase Functions の実行ランタイム `nodejs20` が Deprecated となり、**2026-10-30** に Decommission される。
本ドキュメントは、Shokujii モノレポを **Node 24 / nodejs24** へ移行するための変更対象と検証手順をまとめる。

関連 Issue: [#1983](https://github.com/nijuniinc/bokudeli-event-new/issues/1983)（B軸: Functions 実行環境の更新）。

> GitHub Actions の `checkout` / `setup-node` 更新（#2085, A軸）とは別問題。CI ランナーの Node 20 廃止と Functions ランタイムの nodejs20 廃止は期限・対象が異なる。

---

## 1. 背景・期限

公式スケジュール: [Runtime support | Cloud Run functions](https://cloud.google.com/functions/docs/runtime-support)

| ランタイム | Deprecation 開始 | Decommission 開始 | 状態（2026-06-17 時点） |
| :--------- | :--------------- | :---------------- | :---------------------- |
| nodejs20   | 2026-04-30       | **2026-10-30**    | Deprecated（ランタイムサポートなし・デプロイは可） |
| nodejs22   | 2027-04-30       | 2027-10-31        | GA |
| nodejs24   | 2028-04-30       | **2028-10-31**    | GA（**移行先**） |

### 1.1 各フェーズの意味

| フェーズ | 新規作成・再デプロイ | 既存関数の実行 | ランタイムサポート |
| :------- | :------------------- | :------------- | :----------------- |
| GA       | 可                   | 可             | あり               |
| Deprecated | 可                 | 可             | なし               |
| Decommissioned | 不可           | 停止される可能性 | なし           |

- **2026-10-30 以降** は nodejs20 への新規作成・更新ができず、既存関数も停止される可能性がある。

### 1.2 移行先を nodejs24 とする理由（22 ではなく 24）

| 観点 | nodejs22 | nodejs24 |
| :--- | :------- | :------- |
| Decommission（延命） | 2027-10-31 | **2028-10-31（+1年）** |
| Firebase での扱い | GA | **GA**（後述） |
| 世代 | 1st gen + Gen2 | **Gen2 のみ**（Shokujii は v2 なので問題なし） |
| ベースイメージ | google-22 | google-24（Ubuntu 24） |

- 延命メリット（22 比 +1年）と、Shokujii が Firebase Functions v2（Gen2）であり Gen2 限定制約に該当しないことから、**nodejs24 を採用**する。
- ネイティブモジュールが google-24 スタックに変わるため、後述の互換確認を 22 移行時より入念に行う。

### 1.3 nodejs24 は beta ではなく GA（補足）

- GCP では **2025-11-20 に nodejs24 が GA** へ昇格済み（[Cloud Run functions release notes](https://cloud.google.com/functions/docs/release-notes)）。
- firebase-tools は **v14.26.0（2025-11-21）** で `nodejs24` を追加したが、初版で `status: "beta"` と表記。これは「deploy 時に beta 扱いになる」表示バグ（[Issue #9500](https://github.com/firebase/firebase-tools/issues/9500)）で、メンテナが「visual bug（GCF はすでに GA）」と回答し [PR #9523](https://github.com/firebase/firebase-tools/pull/9523) で GA に修正済み。
- 本プロジェクトが使う **firebase-tools 15.15.0 では `nodejs24` は `status: "GA"`** に確定済み（[`.github/actions/deploy/action.yml`](../../.github/actions/deploy/action.yml) の既定値）。
- 留意点: Firebase 公式ドキュメント [Manage functions](https://firebase.google.com/docs/functions/manage-functions) の「Set Node.js version」節は記載が遅れており nodejs24 が未掲載だが、実体（GCP / firebase-tools）は GA。

> 注: firebase-tools の `types.ts` では nodejs22 の `decommissionDate` が `2028-10-31` と記載されているが、これは GCP 公式（2027-10-31）と食い違う firebase-tools 側の誤記の可能性が高い。実際のランタイム廃止は **GCP 公式スケジュールが基準**。

### 1.4 nodejs26 は時期尚早（採用しない）

| バージョン | リリース | 状態（2026-06-17 時点） | LTS 化 |
| :--------- | :------- | :---------------------- | :----- |
| Node 24（Krypton） | 2025-05-06 | LTS | 済 |
| Node 26 | 2026-05-05 | **Current**（LTS 前） | 2026-10 予定 |

- **Firebase / GCP が nodejs26 を未サポート**: GCP の [Runtime support](https://cloud.google.com/functions/docs/runtime-support) は nodejs24 が最新で nodejs26 は未掲載。firebase-tools（master / 15.15.0）の `types.ts` にも `nodejs26` の定義が存在せず、`engines.node: "26"` を指定してもデプロイできない。
- **Node 26 自体がまだ Current**: 本番は Active/Maintenance LTS のみ使うべきで、Node 26 の LTS 化は 2026-10 予定。
- 将来 nodejs26 を狙う場合でも、まず本対応で **nodejs24（Decommission 2028-10-31）** に上げておけば十分な猶予があり、(1) Node 26 の LTS 化、(2) GCP の nodejs26 GA、(3) firebase-tools での nodejs26 追加、が揃った時点で改めて検討するのが安全。

---

## 2. 現状（Node 20 依存箇所）

| 種別 | パス | 現在値 | 備考 |
| :--- | :--- | :----- | :--- |
| Functions ランタイム（正本） | `functions/default/package.json` `engines.node` | `"24"` | Firebase デプロイ時の実行ランタイム決定。**最重要** |
| ローカル / CI Node | `.node-version`（ルート） | `24.19.0` | CI 全 workflow が `node-version-file: ./.node-version` を参照 |
| firebase.json runtime | `firebase.json` `functions[]` | **未指定** | package.json の `engines` に依存 |
| TS node 設定 | `base/package.json` `@tsconfig/node24` + `user`/`partner`/`enterprise` の `tsconfig.node.json` | `@tsconfig/node24` | Vite 設定用 |
| 型定義 | `base/package.json` `@types/node` | `^24` | 任意（整合性） |
| CI 例外 | `.github/workflows/test_firestore_rules.yml` | `node-version-file: ./.node-version` | 2026-08 以前は `node-version: '20'` ハードコード |
| TS target | `tsconfig.base.json` | `ES2020` | 本移行とは切り離す（別タスク推奨） |
| ドキュメント | `AGENTS.md` / `CLAUDE.md`、`.github/copilot-instructions.md` | `Node 24` 表記 | 表記更新済み |

**スコープ外**: `manager/.node-version`（`16.14.2`）は legacy（運営向け管理画面）。本対応の対象外。

**前提（問題なし）**:

- `.github/actions/deploy/action.yml` の `firebase-tools@15.15.0` は nodejs24 を GA としてデプロイ可能
- firebase-tools 自体も v14.25.0 以降 Node 24 上での実行をサポート
- CI workflow は個別に Node バージョンをハードコードしておらず、ルート `.node-version` 更新で波及する（例外: `test_firestore_rules.yml` は 2026-08 以前 `node-version: '20'` だったが `.node-version` 参照に統一済み）

---

## 3. 変更対象チェックリスト

### 3.1 Functions ランタイム（必須・正本）

- [x] `functions/default/package.json` の `engines.node` を `"20"` → `"24"`

  ```json
  "engines": {
    "node": "24",
    "yarn": "Use npm instead"
  }
  ```

  Firebase はこの値でデプロイ先ランタイム（`nodejs24`）を決定する。

### 3.2 ローカル / CI Node（必須）

- [x] ルート `.node-version` を `20.19.1` → `24.19.0`（Node 24 LTS 最新パッチ。更新時は [Node.js 24 リリース](https://nodejs.org/en/blog/release/) を確認）

  波及先 workflow（いずれも `node-version-file: ./.node-version`）:

  - `.github/workflows/pr-verify.yml`
  - `.github/workflows/deploy_functions.yml`
  - `.github/workflows/deploy_user.yml`
  - `.github/workflows/deploy_partner.yml`
  - `.github/workflows/deploy_enterprise.yml`
  - `.github/workflows/deploy_terms.yml`
  - `.github/workflows/deploy_firestore.yml`
  - `.github/workflows/deploy_storage.yml`
  - `.github/workflows/test_firestore_rules.yml`

- [x] ローカルの Node バージョンマネージャ（nodenv / fnm 等）を Node 24 に切替

### 3.3 firebase.json（任意）

- [x] **方針: package.json の `engines` 運用を継続し、`firebase.json` には `runtime` を追記しない**（二重管理を避ける）

  CLI は `firebase.json` の `runtime` を package.json の `engines` より優先する。
  明示したい場合のみ `"runtime": "nodejs24"` を `functions[]` に追加する。

### 3.4 型定義・整合性（任意）

- [x] `base/package.json` の `@types/node` を `^20` → `^24`
- [x] `base/package.json` の `@tsconfig/node20` を `@tsconfig/node24` へ差し替え、`user`/`partner`/`enterprise` の `tsconfig.node.json` を追随
- [ ] `tsconfig.base.json` の `target`（現 `ES2020`）引き上げは **本移行とは切り離す**（影響範囲が広いため別タスク）

### 3.5 ドキュメント表記更新

- [x] `AGENTS.md` / `CLAUDE.md` の「Firebase Functions v2 (Node 20) + TypeScript」→ Node 24
- [x] `.github/copilot-instructions.md` ディレクトリ表の「Node 20」表記
- [x] `documents/firebaseプロジェクト/firebaseプロジェクト新規作成.md` の Node 表記

---

## 4. nodejs24 特有の互換確認（22 移行より入念に）

nodejs24 はベースイメージが **google-24（Ubuntu 24）** に変わるため、ネイティブモジュールの再検証が重要。

- [ ] **ネイティブ依存の Node 24 / google-24 互換**
  - `sharp@0.34.5`（画像処理・ネイティブバイナリ）
  - `@google-cloud/firestore@7.11.0` / `@google-cloud/storage@7.15.0`
  - `@adobe/pdfservices-node-sdk@4.1.0`
- [x] **`firebase-functions@7.3.2` の Node 24 動作確認**（#1933 と同 PR で更新。`HttpResponse` 型で `@types/express` バージョン差異を回避）
- [ ] firebase-tools のバージョンは **15.15.0 のままで可**（変更不要）

---

## 5. 検証手順

### 5.1 ローカルチェック（PR verify 相当）

`/lint-and-format` スキルに従い、以下を通す:

```sh
npm ci
npm run verify:functions-deploy
npm run test:verify-functions-deploy
npm run verify:vue-tsc-gate
npm -w common run build
npm -w terms run build
npm -w common run lint && npm -w base run lint && npm -w user run lint && npm -w partner run lint && npm -w enterprise run lint && npm -w terms run lint && npm -w functions/default run lint
npm -w common run format:check && npm -w base run format:check && npm -w user run format:check && npm -w partner run format:check && npm -w enterprise run format:check && npm -w terms run format:check && npm -w functions/default run format:check
npm -w base run build:types && npm -w user run build:types && npm -w partner run build:types && npm -w enterprise run build:types
npm -w functions/default run build
npm -w common run test && npm -w base run test && npm -w user run test && npm -w partner run test && npm -w enterprise run test && npm -w functions/default run test
```

### 5.2 エミュレータ動作確認

[functions/default/README.md](../../functions/default/README.md) に従う。

```sh
# functions/default をビルド
npm -w functions/default run build

# エミュレータ起動（.env / .secret.local を事前に準備）
firebase --project bokudeli-event-test emulators:start --only functions,firestore
```

確認項目:

| 種別 | 確認方法 |
| :--- | :------- |
| onCall | user アプリをエミュレータ接続して `httpsCallable` 呼び出し |
| onRequest | 起動ログの URL に curl 等でアクセス |
| onDocumentXXX | Emulator UI（http://127.0.0.1:4000）で Firestore ドキュメントを更新 |
| onSchedule | `firebase functions:shell` から直接呼び出し |

### 5.3 sandbox / development デプロイ検証

1. sandbox または development に `--only functions` でデプロイ
2. GitHub Actions の成否を監視し、失敗時はログを確認
3. 代表的な関数（Callable / HTTP / Firestore トリガー / Scheduled）の実行と Cloud Logging を確認
4. **ネイティブ処理（画像サムネイル生成・PDF 生成）を sandbox で実際に走らせて google-24 スタックでの動作を確認**（nodejs24 では特に重要）

前提:

- プロジェクトが Blaze プランであること
- firebase-tools が nodejs24（GA）対応版であること（CI は 15.15.0 で対応済み）

---

## 6. ロールバック方針

- `engines.node` と `.node-version` を 20 系に戻して再デプロイすれば復帰可能。
- ただし **2026-10-30 以降** は nodejs20 へのデプロイ自体が不可になるため、期限前に nodejs24 での安定稼働を確認しておくこと。
- nodejs24 で問題が出た場合の中間退避先として **nodejs22（GA・2027-10-31 まで）** も選択肢になる。

---

## 7. 参考リンク

- [Runtime support | Cloud Run functions](https://cloud.google.com/functions/docs/runtime-support)
- [Cloud Run functions release notes](https://cloud.google.com/functions/docs/release-notes)（nodejs24 GA: 2025-11-20）
- [Manage functions - Set Node.js version | Firebase](https://firebase.google.com/docs/functions/manage-functions)
- firebase-tools [Issue #9500](https://github.com/firebase/firebase-tools/issues/9500) / [PR #9523](https://github.com/firebase/firebase-tools/pull/9523)（nodejs24 GA 修正）
- Issue [#1983](https://github.com/nijuniinc/bokudeli-event-new/issues/1983)
