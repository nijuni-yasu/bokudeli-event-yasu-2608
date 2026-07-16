# Loop Engineering 方針

## 関連

| 項目 | 参照先 |
|:-----|:-------|
| イシュー | [#2080 Loop Engineering 導入の検討と環境整備](https://github.com/nijuniinc/bokudeli-event-new/issues/2080) |
| エージェントガイド | `AGENTS.md`（`CLAUDE.md` は同一内容へのシンボリックリンク） |
| スキル正本 | `.agents/skills/` |
| 参考記事（概念） | [もうプロンプトを書くな──「Loop Engineering」という新しいパラダイムの正体](https://zenn.dev/acrosstudioblog/articles/38509c0473683a) |
| 参考記事（原典） | [Loop Engineering — Addy Osmani](https://addyo.substack.com/p/loop-engineering) |
| 参考記事（設計論） | [Loop Engineering入門 — Zenn (suwash)](https://zenn.dev/suwash/articles/loop-engineering_20260610) |
| 参考記事（実装） | [Loop EngineeringをClaudeで実践してみた — DevelopersIO](https://dev.classmethod.jp/articles/claude-loop-engineering-practice/) |

---

## 1. 概要

**Loop Engineering** とは、人間が都度プロンプトを書く代わりに、**エージェントが反復実行するループ（サイクル）を設計する**開発手法である。

```
目的を定義する
   ↓
AI が完了まで反復する
   ↓
検証ゲートが合格を判定する
   ↓
次のラウンドが自動的に始まる（または停止）
```

本ドキュメントは Shokujii プロジェクトにおける Loop Engineering の**導入方針・判断基準・段階計画**を定める。実装タスクの詳細は #2080 を参照する。

### 1.1 Harness と Loop の違い

| 観点 | Harness Engineering | Loop Engineering |
|:-----|:--------------------|:-----------------|
| 対象 | 単一エージェントの実行環境 | 複数エージェント＋スケジューラ |
| 起動 | 人間がプロンプトで起動 | 時刻・イベント・条件で自律起動 |
| 終了 | エージェントが完了を宣言 | **検証ゲート**が合格を判定 |
| 本プロジェクトでの例 | Stop フック（セルフレビュー）、`protect-files.sh` | （未整備）CI 赤信号の自動 triage 等 |

Harness は Loop の前提であり、置き換え関係ではない。

### 1.2 2 つの軸：ロードマップ段階 × 自律ティア

本ドキュメントには直交する 2 つの軸があるため、混同しないこと。

- **ロードマップ段階（時系列・第 4 章）**: プロジェクト全体として Loop 化をどの順で進めるか（段階 0 → 3）。
- **自律ティア（各ループの権限・第 9 章）**: 個々のループにどこまで自律実行を許すか（L1 → L3）。

```
           L1(報告のみ)  L2(検証付き修正)  L3(無人)
段階0:検証ゲート  —            —              —
段階1:半自動    ✅ここから    ✅              ✗
段階2:定期      ✅           ✅              △（denylist 確認後）
段階3:拡張      ✅           ✅              ✅（条件達成後のみ）
```

**不変ルール**: どのループも本番リポジトリでは必ず L1 から開始する（第 9 章）。

---

## 2. 現状評価（2026-06 時点）

Loop を構成する 6 モジュールと、本プロジェクトの整備状況。

| モジュール | 役割 | 現状 | 評価 |
|:-----------|:-----|:-----|:-----|
| **Worktrees** | エージェント並列分離 | `wt/tree-*` で git worktree を多数運用 | ✅ 整備済み |
| **Skills** | 仕様・手順の蓄積 | `.agents/skills` に独自＋技術別スキル、`AGENTS.md` 正本 | ✅ 整備済み |
| **Connectors** | MCP・CLI で外部接続 | Firebase MCP、`gh` CLI、Vercel MCP（認証のみ） | 🟡 一部 |
| **Memory** | ループ状態の永続化 | `documents/`、`AGENTS.md`、GitHub Projects | 🟡 ループ専用状態は未整備 |
| **Sub-agents** | 実装と検証の分離 | Cursor サブエージェント、review 系スキル | 🟡 Verifier 固定化は未整備 |
| **Automations** | 定期・イベント自動起動 | deploy ワークフローのみ | 🔴 未整備 |

### 2.1 最大のギャップ：検証ゲート

Loop の前提は **「検証可能なループ」** である。現状は以下の通り。

| 検証手段 | ローカル | CI（PR） |
|:---------|:---------|:---------|
| lint / format:check / 型 / vitest | git-create-pull-request / git-reflect-after-commit 前の lint-and-format | PR トリガー CI（`pr-verify.yml`） |
| セルフレビュー | Stop フック（`.agents/hooks/stop-gate-check.sh`） | shokujii-code-review 記録 |
| common build | lint-and-format 内 | デプロイ時のみ |
| vitest（common / functions / base） | 手動 | ❌ CI 未実行 |
| vue-tsc 型チェック | 手動 | ❌ CI 未実行 |

**方針**: Automations を回す前に、PR 駆動 CI で証拠ベースの合格判定を確立する（段階 0）。

---

## 3. 基本方針

### 3.1 優先順位

```
検証可能 > 自動化可能 > 拡張可能
```

受け入れ基準が数値・機械判定できないタスクは Loop 化しない。

### 3.2 原則

1. **いきなり全部を Loop 化しない** — 小さく検証可能なタスクから試す
2. **done は自己申告ではない** — テスト・lint・CI の証拠がない完了は認めない
3. **自動生成 PR は当面人間レビュー必須** — 理解の負債（Comprehension Debt）を防ぐ
4. **本番・機密操作は Loop の対象外** — `firebase deploy`、`.env`/`.secret` 編集、main 直 push 等
5. **プロジェクト規約を Verifier に必ず挟む** — `shokujii-code-review`、Firestore store 経由ルール等

### 3.3 各ループに必須の「目標契約」

Loop を新設・試行するときは、起動前に以下を明文化する（イシュー本文または Loop 用テンプレート）。

| 項目 | 内容例 |
|:-----|:-------|
| **目的・範囲** | 「Dependabot PR の lint/test 回帰を確認し、失敗時は修正案を PR に出す」 |
| **受け入れ基準** | lint 0 警告、vitest 全合格、型エラー 0 |
| **禁止領域** | 本番 deploy、セキュリティルール変更、スコープ外リファクタ |
| **停止条件** | 合格 / タイムアウト / ロールバック / 人間引き渡し |
| **Owner** | ループ結果とコストを追跡する責任者 1 名 |
| **最大ラウンド数** | 例: 3 ラウンド、または 30 分 |

---

## 4. 導入ロードマップ

### 段階 0: 検証ゲート整備（最優先）

**目的**: 無人ループの合格判定をリモート CI で成立させる。

| タスク | 内容 |
|:-------|:-----|
| PR CI 新設 | `pull_request` で lint + format:check + common build + vitest + vue-tsc |
| テスト拡充 | `user` / `partner` に vitest スクリプトを追加（最低限） |
| マージ条件 | CI 合格を PR マージの前提とする |

**完了条件**:

- [ ] PR 作成時に CI が自動実行される
- [ ] common / functions / base の vitest が CI で実行される
- [ ] CI 失敗時に原因がログから特定できる

### 段階 1: 半自動ループ

**目的**: 人間が起動し、エージェントが反復 → 人間が最終承認。

| 候補タスク | 向き | 理由 |
|:-----------|:-----|:-----|
| CI 赤信号の triage → 修正 PR | ✅ 最適 | 受け入れ基準が明確（CI 合格） |
| レビューコメント対応 | ✅ 向く | 既存 review 系スキル群が Verifier として使える |
| Dependabot PR の回帰確認 | ✅ 向く | 差分が小さく検証しやすい |

**使う部品**:

- Sub-agent: `ci-investigator`、review 系スキル（evaluate → reply → doc-update）
- Skills: `lint-and-format`、`git-create-pull-request`、`shokujii-code-review`
- Worktrees: 修正は別ブランチ・別 worktree で隔離

**停止条件**: CI 合格まで反復、または最大ラウンド数到達で人間に引き渡し。

### 段階 2: 定期ループ（Automations）

**目的**: 時刻・イベントで自律起動するループを追加。

| 候補タスク | トリガー | 備考 |
|:-----------|:---------|:-----|
| Dependabot / 依存更新の回帰 | PR 作成 / 定期 | 段階 1 の自動化 |
| Functions ログ巡回 → issue 起票 | 日次 schedule | Firebase MCP `functions_get_logs` + `git-create-issue` |
| レビュー待ち PR の stale 通知 | 週次 | 人間の判断が必要なら通知のみ |

**使う部品**:

- Automations: Cursor Automations または GitHub Actions `schedule`
- Connectors: Firebase MCP、`gh` CLI
- Memory: GitHub Projects（`shokujii-all-task`）を triage 受信トレイとして使う

### 段階 3: 拡張（慎重に）

段階 0〜2 で**失敗率・コスト・理解の負債**が許容範囲であることを確認したうえで検討する。

- 検証が安定したタスクのみ、自動マージ可否を議論
- 新 Loop 追加時は本ドキュメントの「Loop 化 Go/No-Go 判定」を必ず通す

---

## 5. Loop 化 Go/No-Go 判定

新しいタスクを Loop 化する前に、以下 4 問で判定する。

| # | 質問 | No なら |
|:--|:-----|:--------|
| 1 | 受け入れ基準を数値・機械判定できるか？ | Loop 不向き。手動 or 半自動 |
| 2 | 失敗時にロールバック手段があるか？ | スコープを縮小する |
| 3 | コンテキストを次ラウンドに引き継ぐ Memory があるか？ | Memory を先に整備 |
| 4 | Owner と最大ラウンド数を決められるか？ | 決めてから再検討 |

### 5.1 Loop に向いているタスク

- CI の赤信号修復
- lint / format / test 失敗の修正
- Dependabot PR の回帰確認
- ドキュメント同期（API・README と実装の乖離修正）
- レビューコメントの機械的対応（規約違反の修正等）

### 5.2 Loop に向いていないタスク

- 受け入れ基準のない大規模リファクタ
- 本番環境の権限操作・デプロイ
- Firestore / Storage セキュリティルールの変更
- 純粋な UI の美的判断
- ビジネス判断を伴う仕様変更

---

## 6. 本プロジェクト固有の制約

Loop 設計・実行時に必ず守る Shokujii 固有ルール。

| カテゴリ | ルール | 根拠 |
|:---------|:-------|:-----|
| Firestore | DB 操作は store 経由、`xxxRef` は withConverter 必須 | `AGENTS.md`、shokujii-firestore スキル |
| セキュリティ | `.env` / `.secret` / `.firebaserc` の編集禁止 | `protect-files.sh` フック |
| Git | main 直コミット禁止、コミットメッセージは日本語 | `AGENTS.md` |
| デプロイ | 本番 `nijuniinc/bokudeli-event-new` への自動 deploy 発火禁止 | github-actions-deploy スキル |
| レビュー | 自動生成コードは `shokujii-code-review` を通す | プロジェクト規約 |

---

## 7. 既存資産との対応表

Loop の部品として、すでに整備済みの資産を再利用する。

| Loop 部品 | 本プロジェクトの対応 |
|:----------|:---------------------|
| Harness（実行環境） | `.claude/settings.json` / `.cursor/hooks.json`（Stop フック `stop-gate.sh` → `stop-gate-check.sh`） |
| Skills | `.agents/skills/`（git-*、review-*、lint-and-format、shokujii-* 等） |
| Worktrees | `wt/tree-*` 並列作業 |
| Verifier | `shokujii-code-review`、`review-comments-evaluate`、Cursor `bugbot` / `security-review` |
| Connectors | Firebase MCP、`gh` CLI、`git-create-issue` / `git-create-pull-request` |
| Memory | `documents/`（本ドキュメント含む）、GitHub Projects、イシュー |
| コミット後フロー | `git-reflect-after-commit`（push → PR → sandbox デプロイ） |

---

## 8. リスクと対策

記事および現状分析で特定した 3 つの罠と、本プロジェクトでの対策。

| 罠 | 内容 | 対策 |
|:---|:-----|:-----|
| **検証の死角** | 「完了」が自己申告になり、ミスを量産 | 段階 0 の PR CI を最優先。証拠なき完了は認めない |
| **理解の負債** | 自動生成コードに疎遠になる | 自動 PR は人間レビュー必須。半年に 1 回レビュー基準を見直す |
| **認知的降伏** | AI の出力を無批判に受け入れる | Verifier を別モデル・別スキルで固定。Owner 制 |

---

## 9. 自律ティア（L1 / L2 / L3）

各ループには「どこまで自律実行を許すか」の段階がある。第 4 章のロードマップ段階とは別軸（第 1.2 節）。

| ティア | 内容 | 維持期間の目安 | 本プロジェクトでの例 |
|:-------|:-----|:---------------|:---------------------|
| **L1 報告のみ** | 状態を読み STATE.md を更新し、要対応を報告。コード変更なし。コスト最小 | 1〜2 週間 | CI 失敗・新着 issue・Functions ログの巡回報告 |
| **L2 検証付き修正** | worktree で修正し、Verifier 承認時のみ PR 作成。auto-merge はパス allowlist 限定。試行上限 3 回 | 安定後に L3 検討 | Dependabot PR の回帰修正、CI 赤信号修復 |
| **L3 無人運用** | denylist 外の変更のみ auto-commit まで自動。denylist 該当・大規模変更は人間キューへ昇格 | 条件達成後のみ | （当面は採用しない想定） |

### 9.1 昇格・降格ルール

- **新パターンは必ず L1 から開始**。L1 を 1〜2 週間運用し、false positive 率 < 30% を確認してから L2 へ。
- L1 をスキップして L2 以上を本番起動することは**禁止**。
- L2 → L3 は「Verifier 設置・denylist 設定・トークン予算設定・人間ゲート設置」が全て揃ってから。
- **昇格は慎重に、降格は即座に**。auto-merge 後の Revert が 2 週連続で発生したら当該ループを L2 に降格する。

---

## 10. STATE.md（外部メモリ）

モデルはセッション間で記憶を失う。ループの状態は**会話の外（リポジトリ内ファイル）**に置く。GitHub Projects（`shokujii-all-task`）は人間可視の triage 受信トレイとして併用し、機械が読み書きする一次状態は STATE.md とする。

### 10.1 配置と構成

ループ専用ディレクトリ（例: `documents/AIエージェント/loops/<loop名>/STATE.md`）に置く。

```markdown
<!-- STATE.md 構成例 -->
# Loop State
Last run: 2026-06-15T07:00+09:00
acting_on:            # Multi-loop 衝突検出用（処理中アイテムID）

## High Priority（対応待ち）
- #142 CI flaky test in auth_spec — 初検出 2026-06-12, 未対応

## Watch List（様子見）
- #138 dependency bump (lodash) — patch のみ, auto-merge 禁止

## human_inbox（人間判断待ち）

## Done（週次 pruning）
- #130 typo in README — 2026-06-11 解決
```

### 10.2 運用

- **週次レビューで pruning**: クローズ済みアイテムを削除し、state rot（解決済み参照の蓄積）を防ぐ。
- ループごとに状態ファイルを分離する（第 16 章 Multi-loop）。
- L1 運用ではこの STATE.md 更新と報告のみを行い、コードは変更しない。

---

## 11. Maker-Checker と検証設計

実装したエージェント自身に「これで大丈夫？」と聞かない。**実装者（Maker）と検証者（Checker）を構造的に分離**する。

### 11.1 設計原則

- **検証者に編集権限を与えない** — Cursor では `bugbot` / `security-review` サブエージェントを `readonly: true` で起動。「直しながら採点」を構造的に禁止。
- **検証者プロンプトに焼き込む文言**:
  - 「あなたはこのコードを書いていない」（確証バイアスの打ち消し）
  - 「テストを実際に走らせろ。diff がテストファイルを触っていたら FAIL」
- **可能なら別モデル**で検証する（例: 実装 Sonnet / 検証 Opus）。
- 検証者の既定姿勢は「承認」ではなく「拒否理由を探す」。

### 11.2 Verifier Theater 対策（必須）

テストの期待値だけをバグ出力に合わせて改ざんすると `vitest` は緑になる。素朴な「テスト通った？」判定は騙される。

- 検証入力に **CI のテスト出力・lint 結果を必須**で含める。
- **diff がテストファイル（`*.test.ts`）を変更していたら FAIL** とする。
- 本プロジェクトの規約チェック（`shokujii-code-review`、Firestore store 経由・withConverter 必須）を検証段に必ず挟む。

---

## 12. 停止条件・コスト管理

### 12.1 停止条件は最初に書く

「どう止めるか」をループ本体より先に決める。第 3.3 節の目標契約に加え、実装ノブを明示する。

| ノブ | 用途 |
|:-----|:-----|
| `MAX_ATTEMPTS=3` | 同一アイテムのリトライ上限（Infinite Fix Loop 対策） |
| `--max-turns` | 1 呼び出しのターン上限 |
| `--max-budget-usd` | 1 呼び出しのコスト上限 |
| `timeout-minutes`（Actions） | 常駐ループのタイムアウト |
| kill switch | S2 障害の反復・コスト対価値の逆転で完全停止 |

**pipefail の罠**: `npm test 2>&1 | claude -p ...` はテスト失敗の終了コードがパイプラインに伝播し、`set -e` でスクリプトが意図せず止まる。出力を変数にキャプチャしてから渡す。

```bash
test_output="$(npm test 2>&1 || true)"
printf '%s\n' "$test_output" | claude -p "..."
```

### 12.2 コストと課金（2026/6/15 変更）

本プロジェクトは Claude を使うため、起動経路で課金枠が変わる点に注意。

| 経路 | 課金 |
|:-----|:-----|
| ターミナルの対話 `/loop` / `/goal` | サブスク枠 |
| クラウドの `/schedule` ルーティン | サブスク枠（日次実行上限あり） |
| `claude -p`（headless）・Agent SDK・Claude Code GitHub Actions | **別枠の月次クレジット（メーター課金、2026/6/15〜）** |

- **常駐ループを非メーターで回すなら GitHub Actions より `/schedule` が有利**。
- 目安: Daily Triage L1（読むだけ）は 1 回 $0.01 未満、Maker-Checker は 1 サイクル $0.7 前後。
- 日次トークン上限を設定し、80% 到達で一時停止。安価モデルで triage → 要対応時のみ強力モデルでサブエージェント起動。

---

## 13. denylist ゲートと既存資産

suwash / classmethod が「L3 で必須」とする denylist ゲートを、本プロジェクトは**既に実装済み**である。新規構築ではなく既存資産の拡張で対応する。

| denylist 要件 | 本プロジェクトの既存実装 |
|:--------------|:-------------------------|
| 機密ファイルの編集ブロック | `.claude/hooks/protect-files.sh`（`.env` / `.secret` / `.firebaserc` / `.pem` / `.key`） |
| 危険操作のブロック | `.claude/settings.json` の `deny`（`firebase deploy*` / `gh pr merge*` / `git push --force` / `rm -rf*` 等） |
| 検証ハーネス | `.agents/hooks/stop-gate-check.sh`（Stop 時: セルフレビューのみ。lint は create-pr / reflect 前） |

- **denylist は全ループで共有**する。`.claude/settings.json` と `protect-files.sh` を正本とし、ループごとに個別 denylist を持たない。
- Stop フックは **セルフレビュー完了**まで検証する（正本 `.agents/hooks/stop-gate-check.sh`）。PR verify 相当は push 前の lint-and-format。
- denylist の正本は第 13 章にまとめる。

---

## 14. パターンカタログ

導入するループは、cadence・初期ティア・コストを台帳化して管理する。

| パターン | cadence | 初期ティア | コスト | 本プロジェクトでの対象 |
|:---------|:--------|:-----------|:-------|:----------------------|
| **Daily Triage** | 1 日〜2 時間 | L1 | 低 | CI 失敗・新着 issue・Functions ログ巡回の報告 |
| **Dependency Sweeper** | 6 時間〜1 日 | L2 | 中 | Dependabot PR の回帰確認 |
| **CI Sweeper** | 5〜15 分 | L2 | 非常に高 | （段階 0 完了後）PR CI 赤信号の修復 |
| **PR Babysitter** | 5〜15 分 | L1→L2 | 高 | レビュー待ち PR の CI・コメント監視 |
| **Changelog Drafter** | 日次 / タグトリガー | L1 | 低 | リリースノート草案（`v2.x` タグ起点） |
| **Post-Merge Cleanup** | 1 日〜6 時間 | L1 | 低 | マージ後ブランチ・worktree の後片付け |

**最初の本番ループは Daily Triage L1 が定石**（コスト最小・auto-merge リスクなし・状態管理の作法を学べる）。

---

## 15. 失敗モード一覧

無人ループは無人のままミスを犯す。代表的な失敗モードと対策。

| 症状 | 原因 | 対処 |
|:-----|:-----|:-----|
| 同一 PR を繰り返し修正し続ける | Verifier が弱い / 誤診断（Infinite Fix Loop） | リトライ上限 3 回。Verifier を強化 |
| CI が通らないのに承認される | Verifier がテスト実行を省略（Verifier Theater） | テスト/lint 出力を検証必須化。test 改変を FAIL |
| STATE.md にクローズ済みが増殖 | pruning なし（State Rot） | 週次 pruning。ループごとにファイル分離 |
| 変更意図がチームに理解されない | auto-merge 拡大・レビュー省略（Comprehension Debt） | 週次ダイジェスト義務化。medium-risk は人間ゲート |
| 「ループが何とかする」化 | 量的指標優先（Cognitive Surrender） | KPI を品質に紐付け。判断を人間に残す |
| 同一ファイルの衝突多発 | worktree 分離なし（Parallel Collision） | `isolation: worktree`、`acting_on` で衝突検出 |
| 無限リトライで通知も来ない | attempt cap なし（Escalation Failure） | attempt cap 3、escalation 時に通知 |
| 週途中で予算超過 | triage パスなし（Token Burn） | triage-first・空なら即終了・80% で停止 |
| 無関係なファイルが変更される | denylist なし（Over-Reach） | denylist 即設定（第 13 章） |

---

## 16. Multi-loop 協調

本プロジェクトは既に `wt/tree-1`〜`tree-15` の worktree を並列運用しているため、複数ループ同時運用時の協調が実務的に重要。

1. **ブランチ排他所有** — 1 ブランチにつき同時操作できるループは 1 つ。
2. **状態ファイルの分離** — 各ループ専用の STATE.md（例: `state-triage.md` / `state-pr-watcher.md`）。
3. **役割の分離** — Triage ループは L1 報告のみ。Action ループは独立実行。
4. **統一 denylist** — 全ループが `.claude/settings.json` / `protect-files.sh` を共有（第 13 章）。
5. **予算の合算管理** — 全ループのトークン消費を合算して日次上限を管理。

衝突検出は各ループが実行前に他ループの `acting_on` を確認して行う。重複時は後発がスキップしてログに記録。優先順位は CI 失敗 → アクティブ PR → 依存更新 → クリーンアップ → レポート。

---

## 17. レディネス評価（loop-audit）

導入前にリポジトリの Loop 準備度を客観評価できる。

```bash
npx @cobusgreyling/loop-audit . --suggest   # 改善提案付き
npx @cobusgreyling/loop-audit . --md > audit.md
```

スコアと自律ティアの対応の目安。

| スコア | ティア | 状態 |
|:-------|:-------|:-----|
| 38 未満 | L0 | 導入前。SKILL.md / STATE.md を先に整備 |
| 38 以上 + state file | L1 | 報告のみ運用が可能 |
| 58 以上 + triage skill | L2 | 検証付きの小規模自動修正が可能 |
| 78 以上 + verifier + state file | L3 | 明示ゲート付きで無人運用を検討可 |

本プロジェクトは Skills・denylist・Harness が整備済みのため、**STATE.md と PR CI（段階 0）を足せば L1 ゲートは通過見込み**。実値は audit 実行で確認する。

---

## 18. ワークフロー自動化の設計（仕様 → 実装 → レビュー）

現在手動で回している「仕様策定 → 実装 → レビュー収束」の一連の流れを Loop 化する際の設計。**1 本の巨大ループにはせず、人間判断ゲートで区切り、機械的に閉じる区間だけを入れ子ループで自律化する**。

### 18.1 全体像（3 区間 + 5 ゲート）

```
[区間A] 仕様策定（人間主導・L1）
  ゴール記述 → grill-me🧑GATE① → 検討 → 記述
     → α: 仕様レビュー ⇄ 修正（shokujii-code-review が緑まで）
  → issue 作成 → branch 作成 → 仕様コミット
        ▼ 🧑GATE②：仕様確定の承認
[区間B] 実装ループ（半自律・L2 候補）
  計画(Plan🧑GATE③) →
  ┌─ β(/goal): build → lint-and-format → 受け入れ基準+lint0/test0/型0 まで反復
  │      停止: ローカル緑 / MAX_ATTEMPTS=3 で人間へ
  └─ 分割コミット → ★push/PR/AI レビュー依頼
        ▼
[区間C] レビュー収束ループ（アシスト・L1〜L2）★繰り返しの本体
  ┌─ γ(/loop):
  │   sandbox deploy → 実機UIUX確認🧑GATE④
  │   ローカルレビュー → コメント作成 → コメント評価🧑GATE⑤（採否）
  │   修正(Plan🧑→Agent) → lint-and-format → fixup/squash/split → ★push/PR
  └─ 停止: blocking コメント 0 かつ CI 緑
        ▼ 🧑終端GATE：人間がマージ（auto-merge は当面 OFF）
```

### 18.2 人間ゲート（自動化しない）

| ゲート | 内容 | 理由 |
|:-------|:-----|:-----|
| ① grill-me | 設計インタビュー | 人間の意図抽出が目的。消すと intent debt が発生 |
| ② 仕様確定 | 仕様書の承認 | 実装ループの目標契約になる。固める前に B へ入れない |
| ③ 計画承認 | 実装・修正の Plan | スコープ逸脱の防止 |
| ④ 実機UIUX確認 | sandbox 動作確認 | 美的・UX 判断は数値化不可（第 5.2 節）。Playwright MCP は補助 |
| ⑤ コメント評価 | どの指摘を直すか | ビジネス判断を含む。review-comments-evaluate で構造化 |
| 終端 | マージ | auto-merge は段階 3 以降の議論（第 4・9 章） |

### 18.3 二重の検証層

`lint-and-format`（ローカル）と PR CI（リモート）を二重化し、Verifier Theater（第 11.2 節）を防ぐ。

```
Maker 自己チェック（ローカル）          Checker（独立検証）
─────────────────────────         ──────────────────────
build → shokujii-code-review（Stop フック）  →    PR CI: lint/format/test/型（段階 0）
lint-and-format（create-pr / reflect 前）       shokujii-code-review（規約・review doc / ledger）
```

- β / γ の停止条件に「**lint-and-format 緑**」を明記する（push / PR 前の lint-and-format）。
- ローカル緑は自己申告のため、必ずリモート CI（段階 0）と二重化する。

### 18.4 自律化の主戦場と第一歩

- 完全に検証で閉じるのは **区間 β（build → lint-and-format → 緑まで）のみ**。最初に `/goal` 化するならここ。

```
/goal docs/specs/<issue>.md の受け入れ条件を満たし、
      lint-and-format・vitest・vue-tsc がすべて緑になるまで実装する。
      テストファイル(*.test.ts)は変更しない。
```

- 区間 C は判断ゲート（③④⑤）を残したまま、**deploy → review 生成 → push の定型連結だけ**を自動化する（L1 アシスト）。
- ループ化の価値は「人間判断の除去」ではなく「**ゲート間の定型作業の連結と STATE 維持**」。

### 18.5 既存スキル → ループ部品の対応

新規実装は **オーケストレーター（loop.md）と STATE.md スキーマ**のみ。部品はほぼ既存。

| ループ部品 | 既存スキル |
|:-----------|:----------|
| 意図抽出ゲート | grill-me |
| Checker | shokujii-code-review, review-comments-evaluate |
| ローカル検証 | lint-and-format（create-pr / reflect 前）、Stop フック（セルフレビュー） |
| issue / branch / commit | git-create-issue, git-commit-workflow, git-commit-message, git-split-commit |
| push / PR / deploy | git-reflect-after-commit（→ git-create-pull-request, github-actions-deploy） |
| 修正統合 | git-commit-workflow（→ git-fixup, git-squash） |
| Memory | STATE.md（新規）＋ GitHub Projects |

### 18.6 このワークフロー特有のリスク

| リスク | 対策 |
|:-------|:-----|
| 仕様未確定のまま実装に入る | ゲート②を必須化 |
| レビュー収束ループの無限周回 | γ にラウンド上限（例 3 周）。超過で human_inbox へ |
| 実機確認を飛ばして緑誤判定 | ゲート④を STATE.md の human_gate に必須化。未確認は done にしない |
| 本番への誤デプロイ | git-reflect-after-commit の本番ブロックを維持（sandbox のみ） |
| 周回ごとの Maker-Checker 起動でコスト増 | triage-first（CI 緑なら即終了）。`/schedule` 非メーター枠優先（第 12.2 節） |

---

## 19. 次のアクション

#2080 の完了条件と本ドキュメントを同期させる。実行単位の作業台帳（Owner・状態欄付き）は [`02_導入チェックリスト.md`](./02_導入チェックリスト.md) で管理する。

1. **段階 0** — PR CI ワークフローの設計・追加（vitest を含める。第 13 章の穴を塞ぐ）
2. **レディネス評価** — `loop-audit`（第 17 章）でスコアを取得し L1 ゲート通過を確認
3. **STATE.md 整備** — 最初のループ（Daily Triage L1）用の状態ファイルを作成（第 10 章）
4. **段階 1 試行** — CI 赤信号 triage を Daily Triage L1 として手動起動で試し、目標契約テンプレート（第 3.3 節）を実地検証
5. **ワークフロー β 試行** — 仕様→実装フローの「build until green」区間（第 18.4 節）を 1 案件で `/goal` 化して検証
6. **スキル化検討** — 安定した Loop は `.agents/skills/` に手順として昇格（`/skill-propose` 参照）

---

## 改訂履歴

| 日付 | 内容 |
|:-----|:-----|
| 2026-06-15 | 初版作成（#2080 に基づく方針策定） |
| 2026-06-15 | 自律ティア・STATE.md・Maker-Checker・停止条件/コスト・denylist・パターンカタログ・失敗モード・Multi-loop・loop-audit を追記（Addy Osmani / suwash / classmethod の 3 記事を反映） |
| 2026-06-15 | 導入チェックリストを `02_導入チェックリスト.md` に切り出し（Owner・状態欄付き） |
| 2026-06-15 | 第 18 章「ワークフロー自動化の設計（仕様→実装→レビュー）」を追加（3 区間・5 人間ゲート・二重検証層・β を第一歩とする方針） |
