# branch protection と本番 push のガード

[`02_導入チェックリスト.md`](./02_導入チェックリスト.md) の **0-3（マージ条件 / branch protection）** の実装詳細と、**AI による本番系操作（`main` / `production` / リリースタグへの push）を防ぐためのガード設計**をまとめた実装メモ。

- 関連イシュー: [#2080 Loop Engineering 導入の検討と環境整備](https://github.com/nijuniinc/bokudeli-event-new/issues/2080)
- 関連: [`デプロイ手順.md`](../デプロイ手順/デプロイ手順.md) / [`01_Loop_Engineering_方針.md`](./01_Loop_Engineering_方針.md)（第 13 章 denylist）

---

## 1. 方針（3 層に分ける）

**採用方針: development は B 版（完全 PR 化）。`main` / `production` は PR 化せず push 可能者を限定する。** `development` はバージョン bump も含めて GitHub で硬く守り（bypass を使わない）、`main` / `production` は人間のリリース手順どおり直 push を残しつつ push 可能なアクターを絞る。AI による本番系操作はエージェント側で拒否する。守る対象・守り方・強さが層ごとに異なる。

| 層 | 対象 | 守り方 | 強さ |
|:---|:-----|:-------|:-----|
| ① GitHub branch protection | `development` | **PR 必須 + 必須ステータスチェック（bypass なし＝B 版）** | **硬い**（例外なし） |
| ② リリース手順 | `main` / `production` / タグ | 人間が直 push（PR 化しない）。**push 可能者を限定**（Restrict who can push） | 運用ルール + push 制限 |
| ③ エージェントガード | AI の本番系 push / `npm version` / `branch -f` | AGENTS.md + スキル + denylist + Hook | **中〜強**（多層・誤実行の最後の砦） |

### 前提：GitHub だけでは AI と人間を区別できない

AI もユーザーのシェル・認証（`gh` / SSH / PAT）を使うため、「人間だけ `production` に push 可」という branch protection は **同じ権限の AI には効かない**。本番系の AI 拒否は ③ のエージェント側多層防御が中心になる。

### main / production を PR 化しない理由

`main` / `production` は「リリース対象の `development` コミットへのポインタ同期（`git branch -f`）」であり、機能マージとは性質が違う。PR にすると次の問題が出るため **B 版の対象は `development` のみ**とする。

- GitHub の PR マージは必ず新コミットを作る（**fast-forward only 不可**）ため、`production` が `main` / タグと分岐し「タグの目印」モデルが崩れる。
- ロールバックは `git push origin production --force-with-lease` 前提。force push 禁止の保護と衝突し、緊急対応が重くなる。
- AI と人間を権限で区別できないため、PR 化しても AI 安全性はほぼ増えない（本体は ③ の denylist / スキル）。

→ `main` / `production` は **PR 化せず、push 可能者の限定 + 直 push 維持**とし、AI 禁止は ③ で担保する。

---

## 2. 運用イメージ

```mermaid
flowchart LR
  subgraph dev_flow [日常開発・リリース bump（すべて PR）]
    FB[feature ブランチ] -->|PR + PR verify| DEV[development]
    REL[release ブランチ<br/>npm version] -->|PR + PR verify| DEV
  end

  subgraph release [人間リリース]
    DEV -->|tag 付与 / branch -f| MP[main / production / tag]
    MP -->|限定者が直 push| PROD[本番デプロイ]
  end

  subgraph ai_guard [AI ガード]
    AI[エージェント] -.->|OK: feature / release push + PR| FB
    AI -.x|NG: 直 push| DEV
    AI -.x|NG| MP
    AI -.x|NG| PROD
  end
```

---

## 3. ① development の branch protection（GitHub 側・硬い防御 / B 版）

GitHub の Branch protection（または Rulesets）で **`development`** に次を有効にする。**B 版ではリリースのバージョン bump も PR 経由にするため、bypass は使わない**（development への直 push は人間・AI とも禁止）。

| 設定 | 推奨値 | 備考 |
|:-----|:-------|:-----|
| Require a pull request before merging | ✅ | feature / release → development をすべて PR 経由に強制 |
| Require status checks to pass | ✅ `verify`（UI 表示: `PR verify / verify`） | `pr-verify.yml` の **job 名 `verify`**。workflow 表示名 `PR verify` とは別 |
| Require branches to be up to date | 任意 | 厳格にするならコンフリクトを PR 側で解消 |
| Require approvals | 任意（0〜1） | 運用に合わせる |
| Restrict who can push | 任意 | PR 必須なら実質不要 |
| Do not allow bypassing the above settings | ✅（B 版） | bypass を作らない。リリースも PR 経由なので例外が要らない |

> **注（必須チェック名）**: GitHub UI の候補は「workflow 表示名 / job 名」の形式（例: `PR verify / verify`）で出るが、API 上の context は **job 名 `verify`**。0-1-10（実 PR 検証）で一度走らせ、UI に表示された名前をそのまま required status checks に登録する。

### `pr-verify.yml` の `production` トリガー

`.github/workflows/pr-verify.yml` は `pull_request` の対象に `development` と **`production`** の両方を含む。B 版では **`production` は PR 化しない**ため、`production` 向け PR トリガーは事実上デッドコードである。

| 選択肢 | 内容 |
|:-------|:-----|
| **現状維持（推奨）** | `production` を残す。将来 `production` を PR 化した場合にそのまま使える。害はない |
| **削除** | B 版方針に合わせ `development` のみに絞る。0-3 実装時に `pr-verify.yml` を修正 |

0-3 着手時に上記どちらかを決め、チェックリストまたは workflow に反映する。

### main / production の保護（PR 化しない）

`main` / `production` には **PR 必須を付けない**（§1「PR 化しない理由」のとおり、ポインタ同期・FF・ロールバックを壊さないため）。代わりに **Restrict who can push** で push 可能者をリリース担当（または専用 bot）に限定する。

| 設定 | `main` / `production` |
|:-----|:----------------------|
| Require a pull request before merging | ❌（付けない） |
| Restrict who can push | ✅ リリース担当のみ |
| Allow force pushes | `production` は **ロールバック用に限定許可**（担当者のみ）。`main` は任意 |

> ⚠️ force push を完全禁止にするとロールバック手順（`git push origin production --force-with-lease`）が使えなくなる。`production` は限定許可にしておく。

---

## 4. ② リリース手順の B 版（development を完全 PR 化）

現行の [`デプロイ手順.md`](../デプロイ手順/デプロイ手順.md) は、通常リリース・hotfix の両方で **`development` への直 push** がある。

- 通常リリース（手順 6）: `git push origin development main production v2.6.0`
- hotfix（手順 7）: `git switch development && git merge main && git push origin development`（B 版では同期ブランチ + PR に置換済み）

`development` を「PR 以外更新不可」にする B 版では、これらを **PR 経由**に置き換える。具体的な改訂手順は [`デプロイ手順.md`](../デプロイ手順/デプロイ手順.md) に反映済み。要点は次のとおり。

### B 版の要点

| 現行 | B 版 |
|:-----|:-----|
| `development` 上で `npm version minor`（commit + tag を生成） | **release ブランチ上で `npm version minor --no-git-tag-version`**。タグはこの時点で作らない |
| `development` を直 push | **release ブランチ → development の PR**（`PR verify` 通過）でマージ。development は直 push しない |
| `npm version` が付けたタグを push | **PR マージ後の確定コミットに `git tag` で付け直し**てから push |
| `main` / `production` / タグの push | 変更なし（PR 化しない。限定者が直 push） |

### タグの付け替えが必須な理由

`npm version` が release ブランチ上で付けたタグは、PR マージ（merge commit / squash）で **development 側のコミットハッシュが変わる**ため、消えるコミットを指してしまう。よって bump はタグなしで行い、**マージ後の `development` HEAD に `git tag` で付与**する。

### hotfix の development 反映も PR 化

hotfix は `main` ベースで作業し `main` に直接取り込む点は現行どおり（`main` は PR 化しない）。**変わるのは最後の「`development` へ反映」だけ**で、`git merge main` + 直 push を **同期ブランチ → development の PR** に置き換える。

---

## 5. ③ AI による本番系操作の禁止（多層ガード）

**前提**: リリース系コマンド（`npm version`、`git branch -f main|production`、保護ブランチ / タグへの push）は **人間のリリース作業専用**とし、エージェントは一律禁止する。hotfix 手順 4 の `npm version patch`（hotfix ブランチ上・`main` 行き）も同様。ユーザーが「本番リリースを実行して」と明示しても、エージェントは手順提示に留め自動実行しない。

**Hook / denylist の作用範囲**: Hook は **エージェントの Shell ツール実行のみ**に効く。人間がターミナルで直接打つ git コマンドは止めない（リリース手順は影響を受けない）。

**Claude / Cursor 両対応**: 検査ロジックは `.agents/hooks/protect-git-release-check.sh`（正本）に集約し、各環境はアダプタで呼ぶ。

| 環境 | 登録 | アダプタ | 入力 | ブロック方法 |
|:-----|:-----|:---------|:-----|:-------------|
| Claude Code | `.claude/settings.json` `hooks.PreToolUse`（`matcher: "Bash"`）+ `deny` バックストップ | `.claude/hooks/protect-git-release.sh` | `.tool_input.command` | exit 2 |
| Cursor | `.cursor/hooks.json` `beforeShellExecution` | `.cursor/hooks/protect-git-release.sh` | `.command` | `{"permission":"deny"}` を stdout |

`jq` 不在時は両アダプタとも fail-open（ソフトガードの AGENTS.md / スキルにフォールバック）。Cursor 側は `failClosed: false`。テスト: `.agents/hooks/test-protect-git-release.py`（正本 + 両アダプタを検証）。

### 5.1 既存の防御（流用する）

| 防御 | 場所 | 効果 |
|:-----|:-----|:-----|
| 本番リポへの workflow_dispatch 禁止 | `github-actions-deploy` スキル | `nijuniinc/bokudeli-event-new` への `gh workflow run` を拒否 |
| origin push は PR 用に限定 | `git-reflect-after-commit` スキル | 本番デプロイ発火は行わない |
| `main` 直接コミット禁止 | `AGENTS.md` Git ルール | 文言ベース（push まで明示は弱い） |
| 危険操作の deny | `.claude/settings.json` deny / `protect-files.sh` | `git push --force` / `firebase deploy*` / `gh pr merge*` 等を拒否（方針 第 13 章） |

### 5.2 追加するガード（優先度順）

| 優先 | ガード | 内容 |
|:-----|:-------|:-----|
| ① | **AGENTS.md に明示禁止** | エージェントは `development` / `main` / `production` / リリースタグへの**直 push**、`npm version`、`git branch -f main\|production` を禁止（development の更新は feature / release ブランチ + PR 経由のみ）。例外はユーザーが「本番リリースを実行して」と明示した場合のみ（それでも自動実行せず手順提示に留める） |
| ② | **スキルのホワイトリスト化** | `git-reflect-after-commit` の origin push を「`HEAD:<現在の feature / release / sync ブランチ>`」に限定。push 先 ref が **`development` / `main` / `production` と完全一致**、または **`v` + 数字で始まるタグ ref** の場合は拒否（ブランチ名の部分一致では判定しない。`sync/main-to-development` 等の正規 push は許可）。`github-sandbox-wip-deploy` は sandbox リモート限定を再確認 |
| ③ | **Shell Hook / denylist 拡張** | 検査ロジック正本 `.agents/hooks/protect-git-release-check.sh` を Claude（`.claude/settings.json` `deny` + PreToolUse Hook）と Cursor（`.cursor/hooks.json` `beforeShellExecution`）の両方から呼ぶ。スキルより強い最終ゲート。**ref は完全一致**で判定し、ブランチ名への部分一致は使わない |

#### deny / Hook の対象パターン（ref 完全一致）

部分一致（例: ブランチ名に `development` を含む）だと `sync/main-to-development` 等の正規 push を誤爆するため、**push 先 ref の末尾完全一致**で判定する。

```text
# 保護ブランチへの push（ref が main / production / development と完全一致）
git push <remote> HEAD:main
git push <remote> HEAD:production
git push <remote> HEAD:development
git push <remote> main production ...   # 複数 ref のうち保護 ref を含む

# リリースタグの push（ref が v + 数字で始まる）
git push <remote> v2.6.0
git push <remote> HEAD:v2.6.1

# 保護ブランチの強制移動（ブランチ名完全一致）
git branch -f main
git branch -f production

# リリース用バージョン bump（人間専用）
npm version minor
npm version patch
npm version major
```

**許可される例**（誤爆しない）: `git push origin HEAD:release/2.6.0`、`git push origin HEAD:sync/main-to-development`、`git push origin HEAD:hotfix/1910`

### 5.3 完全保証が必要な場合（任意）

AI 用の認証情報（PAT / トークン）を **push 不可・PR 作成のみ可**に分離すれば GitHub 側で物理的に止められる。運用コストが大きいため、まずは 5.2 ①②③ で十分なことが多い。

---

## 6. タスク（0-3 詳細）

`02_導入チェックリスト.md` の 0-3 を本メモに合わせて細分化したもの。確定後はチェックリスト側にも反映する。

| ID | タスク | 詳細 | Owner | 状態 |
|:---|:-------|:-----|:------|:-----|
| 0-3-1 | 保護作成（development / B 版） | `development` に branch protection（または Ruleset）を新規作成。**PR 必須・bypass なし**。`main` / `production` には PR 必須を付けない | - | ✅ DONE（2026-06-27。#2119 実施時に `development` protection 作成） |
| 0-3-2 | 必須チェック登録 | UI 候補 `PR verify / verify`（job 名 `verify`）を required status checks に登録（0-1-10 で実際に走らせてから） | - | ✅ DONE（2026-06-27。context `verify` 登録。#2119） |
| 0-3-2b | Rules CI 必須チェック（WS-A / A-5） | `firestore.rules` または `tests/firestore-rules/**` を変更する PR では **`Test Firestore Rules / test`** も green 必須。branch protection の required checks に `test` を追加する。`test_firestore_rules.yml` は PR では path filter なしで常時起動し、job 単位 `if:` で Rules 非変更時は skip（Success 報告）とする（workflow レベル path filter だと status が Pending のまま merge 不可になる） | - | ✅ DONE（2026-06-27。`development` protection に context `test` 追加。#2119） |
| 0-3-3 | main / production の push 制限 | `main` / `production` に **Restrict who can push**（リリース担当のみ）。`production` は force push を限定許可（ロールバック用） | - | Todo |
| 0-3-3b | `production` トリガー方針 | §3「`production` トリガー」を確認し、`pr-verify.yml` を現状維持 or `development` のみに修正 | - | ✅ DONE（現状維持） |
| 0-3-4 | リリース手順の B 版反映 | [`デプロイ手順.md`](../デプロイ手順/デプロイ手順.md) を B 版（release ブランチ + PR、タグ付け替え、hotfix の development 反映も PR）に改訂 | - | ✅ DONE |
| 0-3-5 | 実地確認（development） | CI 失敗 PR がマージブロックされること、release ブランチ PR 経由で development が更新できることを確認 | - | Todo |
| 0-3-6 | AI ガード明文化 | §5.2 ① AGENTS.md に `main`/`production`/タグ push・`npm version`・`branch -f`・`development` 直 push の AI 禁止を追記 | - | ✅ DONE |
| 0-3-7 | スキルのホワイトリスト化 | §5.2 ② `git-reflect-after-commit` の push 先を feature / release / sync ブランチ限定に強化。保護 ref（完全一致）/ タグ ref の push を拒否 | - | ✅ DONE |
| 0-3-8 | denylist / Hook 追加（Claude） | §5.2 ③ 検査正本 `.agents/hooks/protect-git-release-check.sh` + `.claude/hooks/protect-git-release.sh` + `.claude/settings.json` deny | - | ✅ DONE |
| 0-3-8c | Cursor Hook 追加 | `.cursor/hooks.json` `beforeShellExecution` + `.cursor/hooks/protect-git-release.sh`（正本を共有）。Cursor Agent の Shell 実行を機械ブロック | - | ✅ DONE |

---

## 7. 完了判定

| ID | 完了条件 | Owner | 状態 |
|:---|:---------|:------|:-----|
| 0-3-A | `development` への直 push（人間・AI とも）が PR 必須で原則ブロックされる | - | Todo |
| 0-3-B | CI（`PR verify / verify`）失敗の PR がマージできない | - | Todo |
| 0-3-C | リリース手順（§4 の採用案）が破綻せず実行できる | - | Todo |
| 0-3-D | AI が保護 ref / タグへ push しようとすると、スキル・denylist・Hook のいずれかで拒否される（Claude / Cursor 両対応）。`release/*` / `sync/*` 等の正規 feature 系 push は拒否されない | - | Doing（リポジトリ内ガード実装・テスト 11/11 パス・実機 Hook 確認待ち） |

---

## 付録: GitHub 設定手順（gh CLI）

リポジトリ外の GitHub 管理作業。**Admin 権限**と `gh auth login` 済みが前提。詳細は [`03_branch_protection.md`](./03_branch_protection.md) §3。

リポジトリ: `nijuniinc/bokudeli-event-new`

### 事前: 必須チェック名の確認（0-3-2）

1. 実 PR（`development` 向け）を1本作成し、`PR verify / verify` が GitHub Checks に表示されることを確認する（0-1-10）。
2. Settings → Branches → Branch protection rules → `development` → Required status checks に **UI に表示された名前**（通常 `PR verify / verify`）を登録する。

gh CLI で context 名だけ先に確認する例:

```bash
gh api repos/nijuniinc/bokudeli-event-new/commits/HEAD/check-runs \
  --jq '.check_runs[] | select(.name == "verify") | {name, status, conclusion}'
```

### 0-3-1 / 0-3-2: `development` の branch protection（B 版）

**PR 必須・bypass なし・必須チェック `verify`**。

GitHub UI 推奨（Settings → Branches → Add rule → `development`）:

| 設定 | 値 |
|:-----|:---|
| Require a pull request before merging | ✅ |
| Require status checks to pass | ✅ `PR verify / verify`（0-1-10 後に UI から選択） |
| Do not allow bypassing the above settings | ✅ |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

gh API 例（**0-1-10 完了後**、`verify` が Checks に存在することを確認してから実行）:

```bash
gh api -X PUT repos/nijuniinc/bokudeli-event-new/branches/development/protection \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":0}' \
  -f required_status_checks='{"strict":false,"checks":[{"context":"verify"}]}' \
  -f restrictions=null \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

> API の `context` は job 名 `verify`。UI 表示と異なる場合は [GitHub Docs](https://docs.github.com/en/rest/branches/branch-protection) を参照し、実際の check-run name に合わせる。

### 0-3-3: `main` / `production` の push 制限

**PR 必須は付けない**。Restrict who can push でリリース担当のみに限定する。

GitHub UI 推奨（Settings → Branches → Add rule → `main` / `production` それぞれ）:

| 設定 | `main` | `production` |
|:-----|:-------|:---------------|
| Require a pull request before merging | ❌ | ❌ |
| Restrict who can push | ✅ リリース担当チーム/ユーザー | ✅ 同上 |
| Allow force pushes | 任意 | ✅ **限定許可**（ロールバック用・担当者のみ） |

gh API 例（`USER_OR_TEAM` はリリース担当の GitHub ユーザー名または team slug に置換）:

```bash
for branch in main production; do
  gh api -X PUT "repos/nijuniinc/bokudeli-event-new/branches/${branch}/protection" \
    -f enforce_admins=false \
    -f required_pull_request_reviews='null' \
    -f required_status_checks='null' \
    -f restrictions='{"users":["USER_OR_TEAM"],"teams":[],"apps":[]}' \
    -f allow_force_pushes=$([ "$branch" = "production" ] && echo true || echo false) \
    -f allow_deletions=false
done
```

> Rulesets（Organization 設定）を使う場合は UI から同等ルールを作成してもよい。

### 0-3-5: 実地確認チェックリスト

| # | 確認項目 | 期待結果 |
|:--|:---------|:---------|
| 1 | `development` への直 push | 拒否される |
| 2 | CI 失敗の PR をマージ | マージボタンが無効 / ブロックされる |
| 3 | CI 成功の feature → `development` PR | マージできる |
| 4 | release ブランチ → `development` PR | マージでき、`development` が更新される |
| 5 | リリース担当以外が `production` に push | 拒否される（0-3-3 設定後） |
| 6 | Claude / Cursor の Agent で `git push origin production` を実行 | Hook がブロック（§5.2 ③） |
| 7 | Claude / Cursor の Agent で `git push origin HEAD:release/2.6.0` を実行 | ブロックされない |
| 8 | `python3 .agents/hooks/test-protect-git-release.py` | 全ケース PASS（正本 + 両アダプタ） |

---

## 改訂履歴

| 日付 | 内容 |
|:-----|:-----|
| 2026-06-15 | 初版作成。development の branch protection（PR 必須 + PR verify 必須）、リリース手順との衝突（bypass / 手順 PR 化 / 段階導入）、AI による本番系 push の多層ガード（AGENTS.md・スキル・denylist/Hook）を整理。0-3 を 0-3-1〜0-3-7 に細分化 |
| 2026-06-15 | **B 版（development 完全 PR 化）に確定**。bypass を使わずバージョン bump も PR 経由に統一。`main` / `production` は PR 化せず Restrict who can push で限定 + 直 push 維持（FF・ロールバックを壊さないため）。`デプロイ手順.md` を B 版に改訂。0-3 タスクを再編（0-3-1〜0-3-8） |
| 2026-06-15 | レビュー反映: 必須チェック名（job `verify` vs UI 表示）、`production` トリガー方針、deny/Hook の ref 完全一致（誤爆防止）、Hook はエージェントのみ・リリース系は人間専用、0-3-3b 追加 |
| 2026-06-15 | 実装: AGENTS.md AI 禁止ルール、`git-reflect-after-commit` push 先制限、`.claude/hooks/protect-git-release.sh` + settings.json deny。付録 gh CLI 手順書追加。0-3-6/7/8 DONE、0-3-3b 現状維持確定 |
| 2026-06-15 | Cursor 対応: 検査ロジックを `.agents/hooks/protect-git-release-check.sh` に正本化し Claude / Cursor をアダプタ化。`.cursor/hooks.json` `beforeShellExecution` + `.cursor/hooks/protect-git-release.sh` 追加。テスト `.agents/hooks/test-protect-git-release.py`（11/11 パス）。0-3-8c DONE |
