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
