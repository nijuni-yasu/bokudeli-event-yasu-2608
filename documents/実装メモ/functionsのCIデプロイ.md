# functions の CI デプロイ

`functions/default`（default codebase）を GitHub Actions からデプロイする際の仕様。

## 方針

1. CI は `firebase --project <PROJECT_ID> deploy --only functions` の **1 コマンドのみ**。`--force` は使わず、自動再試行もしない
2. デプロイ対象の正本は `functions/default/src/index.ts` の export。**yml に関数名リストを書かない**
3. Firebase CLI が確認プロンプトで abort したら CI は赤で止め、**人が対処する**（誤削除・意図しない更新を CI が自動承認しない）

確認プロンプトによる abort は Firebase CLI が変更を適用する前に起きるため、その時点では **何もデプロイされていない**（cleanup policy エラーのみデプロイ後に発生する）。原因を解消して再実行すれば復旧する。

## なぜ CI で `--force` を使わないか

`--force` は functions デプロイ中の 5 種類の確認をまとめて yes にする単一フラグ。

| 確認 | `--force` あり | `--force` なし・非対話（CI） |
| :-- | :-- | :-- |
| failure policy（`retry: true` の新規エンドポイント） | 警告のみで続行 | abort |
| orphan（`index.ts` に無い既存関数）の削除 | **無確認で削除** | abort |
| minInstances 増加 | 続行 | abort |
| 危険なトリガー種別変更 | 適用 | 警告のみで**その関数をスキップ**（CI は緑） |
| Artifact Registry の cleanup policy 未設定 | 既定値で自動設定 | デプロイ後にエラー |

破壊的なのは orphan 削除のみ。旧 CI（`--only functions:<明示リスト>`）は、Firebase CLI がデプロイ計画を立てる際にフィルタ外の既存関数を削除候補から除外するため、`--force` でも既存関数は消えなかった（そのため旧 Gen1 関数などが残存していた）。一方 `--only functions`（codebase 全体）では **`index.ts` に無い全関数が削除候補**になるため、全体デプロイと `--force` は併用しない。

`--force` は **対象を絞った手動デプロイ**（`--only functions:<name>`）でのみ使う。

## CI の構成

| 項目 | 内容 |
| :-- | :-- |
| ワークフロー | [`.github/workflows/deploy_functions.yml`](../../.github/workflows/deploy_functions.yml)（1 ジョブ / timeout 30 分） |
| 起動条件 | `functions/**` `common/**` `firebase.json` `.github/workflows/deploy_functions.yml` `.github/actions/deploy/**` への push、または workflow_dispatch |
| デプロイ | `./.github/actions/deploy` に `args: '--only functions'` |
| 静的検証 | `npm run verify:functions-deploy` / `npm run test:verify-functions-deploy`（PR verify・[`/lint-and-format`](../../.agents/skills/lint-and-format/SKILL.md) で実行） |

`verify:functions-deploy`（[verify_functions_deploy_list.py](../../.agents/scripts/verify_functions_deploy_list.py)）の検証内容:

- `deploy_functions.yml` に `--force` / `strategy:` / `--only functions:<name>` が無い
- `./.github/actions/deploy` を使うステップが 1 件で、`args` が `--only functions` 完全一致
- `index.ts` の export が 1 件以上ある
- `firebase.json` の functions が `codebase: default` / `source: functions/default` 単一

## デプロイ成功時の注意（スキップと「CI 緑」）

CI ジョブが **success** でも、**全 Function が GCP に再アップロードされたわけではない**場合がある。ログの `Skipped` / 更新行の内訳を確認する。

### Firebase CLI の差分検出（`Skipped (No changes detected)`）

| 段階 | 挙動 |
| :-- | :-- |
| GitHub Actions | `workflow_dispatch` または paths 条件で **毎回** `firebase deploy --only functions` を実行する |
| Firebase CLI | `index.ts` の全 export についてデプロイ計画を立てる |
| 各 Function | ソースバンドル・Function 設定（memory 等）・deploy 時に生成する `.env`（`FUNCTIONS_ENV` 由来）に **CLI が差分と判断できる変更がなければ** `Skipped (No changes detected)` — Cloud Build も走らず GCP へ再アップロードしない |
| 差分あり | 該当 Function のみ `Successful update operation` 等で更新される |

**典型例**: [#2260](https://github.com/nijuniinc/bokudeli-event-new/issues/2260) のように `deploy_functions.yml` や verify スクリプト・ドキュメントだけを変え、`functions/default` の実装に触れていない PR では **全件 Skipped が正常**（Deploy to Firebase が数十秒で終わることもある）。

quota 429 対策として意図的に `--force` 常時再デプロイは廃止している（[デプロイ手順_v2.11 §429](../デプロイ手順/デプロイ手順_v2.11_260716.md)）。

### 「CI 緑」だけでは足りないケース

次は **abort ではなく success のまま**、意図した更新が GCP に入っていないことがある。

| 状況 | ログの目印 | 対処 |
| :-- | :-- | :-- |
| トリガー種別の危険な変更 | `Skipping updates for functions that may be unsafe to update` | 下表「デプロイ失敗時の対処」および [デプロイ手順_v2.11](../デプロイ手順/デプロイ手順_v2.11_260716.md) の unsafe migration 節 |
| GCP 側だけ壊れている（IAM ずれ・インスタンス再起動したい等）でローカルハッシュは同じ | 全件 `Skipped` のまま success | 該当 Function を `--only functions:<name>` で**手動デプロイ**（必要なら `--force`） |
| `FUNCTIONS_ENV`（GitHub vars）だけ変更 | 通常は `.env` 再生成で差分検出され **更新対象になる** | ログに更新行が出るか確認。出なければ手動デプロイ |
| sandbox で CI 設定だけ検証した | 全件 `Skipped` | 新 CI が abort せず完走したことの確認としては十分。実装反映は **functions コード変更後の deploy** で行う |

### 旧 CI との違い

| | 旧 CI（3 ジョブ + 明示 `--only` リスト + `--force`） | 新 CI（1 ジョブ + `--only functions`、`--force` なし） |
| :-- | :-- | :-- |
| 差分なし Function | リスト内は **毎回再デプロイ** | **Skipped**（再デプロイしない） |
| quota / 時間 | 重い | 軽い |
| 「毎回全部載せ直す」 | 暗黙に保証されていた | **保証しない**（差分ベース） |

全件をコード変更なしで載せ直したい運用は、対象 Function を絞った手動 `firebase deploy` に寄せる。

## デプロイ失敗時の対処

| ログのメッセージ | 原因 | 対処 |
| :-- | :-- | :-- |
| `do not exist in your local source code` | `index.ts` に無い関数が GCP 上に残存 | `functions:list` で確認 → `functions:delete` → 再実行 |
| `Pass the --force option to deploy functions with a failure policy` | `retry: true` の新規エンドポイント | 該当関数のみ手動で `deploy --only functions:<name> --force` を 1 回実行 → CI 再実行（以降は発生しない） |
| `Skipping updates for functions that may be unsafe to update`（CI は緑） | トリガー種別変更が未適用 | 警告対象の関数を手動で更新（新規作成 → 旧削除） |
| `could not set up cleanup policy` | cleanup policy 未設定リージョン | `functions:artifacts:setpolicy` を 1 回実行 |
| `Pass the --force option to deploy functions that increase the minimum bill` | minInstances 増加 | 意図を確認して手動デプロイ |

コマンド例と環境別の残存関数リストは [デプロイ手順_v2.11 のトラブルシュート](../デプロイ手順/デプロイ手順_v2.11_260716.md)を参照。

## 新規 Function 追加時

`index.ts` に import と export を追加するだけでよい（deploy yml への手書きは不要）。詳細は [`/shokujii-functions-implementation`](../../.agents/skills/shokujii-functions-implementation/SKILL.md) を参照。

## 変更履歴

| Issue | 内容 |
| :-- | :-- |
| [#2260](https://github.com/nijuniinc/bokudeli-event-new/issues/2260) | 3 ジョブ並列 + 関数名の明示リスト + `--force` 常時付与を廃止し、1 ジョブ + `--only functions`（`--force` なし）に統一 |
| （本 PR 追記） | 「Skipped (No changes detected)」と CI 緑時の注意を §デプロイ成功時の注意 に明文化 |
