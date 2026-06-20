---
name: git-create-pull-request
description: ブランチの変更差分を読み込み、pull_request_template.md の構造に沿って PR 本文を生成する。gh pr create/edit の前に origin へ push（履歴書き換え確認時のみ force-with-lease、diverge 時はユーザー確認）。その後、**必ず**固定文の gh pr comment で @copilot @codex にレビュー依頼し、手順 13 で wait-ai-pr-review へ委譲する（デフォルト ON）。マージ前の整理、force push や squash 後の更新など PR 全般。「PRつくって」「プルリクを作って」「PR本文を更新して」と依頼された時に使用する。
---

# PR 本文生成

## 前提

- gh CLI がインストール済みであること
- PR のマージ先は GitHub 上の development とする。git diff と git log の比較左辺はローカルブランチ development ではなくリモート追跡の origin/development を用いる。gh pr create の --base にはブランチ名として development を指定する（origin/ プレフィックスは付けない）。

## 適用場面

- **新規作成**: まだ PR が存在しない場合。生成した本文を gh pr create --base development で新規 PR 作成に使う
- **既存 PR の本文更新**: すでに PR があり、force push や squash などで内容が変わった場合。生成した本文で gh pr edit により既存 PR の本文を更新する

## 手順

1. gh pr view で現在のブランチに PR が紐づいているか確認する
   - PR あり → 既存 PR の本文更新を想定
   - PR なし → 新規作成を想定

2. 差分取得の直前に `git fetch origin development` を実行して origin/development を更新してよい。追跡ブランチが無い場合も同コマンドで作成される
3. `git diff origin/development...HEAD --stat` で変更ファイル一覧を取得する
4. `git diff origin/development...HEAD` で全差分を取得する
5. `git log origin/development...HEAD --oneline` でコミット一覧を取得する

6. `git branch --show-current` でブランチ名を取得し Issue 番号を特定する
7. `.github/pull_request_template.md` の各セクションを差分をもとに埋める
8. 生成した PR 本文を出力する

9. origin へ push（手順 10 の gh pr create/edit の前・必須）

   **スキップ条件**（いずれか）:

   - `git-reflect-after-commit` から委譲され、会話上 push 済みと分かる
   - 下記「同期済み」判定で push 不要

   **同期確認**（push 前）:

   ```bash
   ref=$(git branch --show-current)
   git fetch origin "$ref" 2>/dev/null || true
   ```

   | 状態 | 判定 | push |
   | ---- | ---- | ---- |
   | `origin/$ref` が無い | リモート未作成 | 通常 push |
   | `HEAD` = `origin/$ref` | 同期済み | **スキップ** |
   | `HEAD` が `origin/$ref` の子孫のみ（ahead） | 未 push のみ | 通常 push |
   | diverge / behind 混在（履歴書き換え未確認） | remote 更新の可能性 | **中断・ユーザー確認** |
   | 会話文脈で fixup/squash/amend/rebase 直後 | 履歴書き換え確認済み | **`--force-with-lease`** |
   | ユーザーが force push / force-with-lease を明示指示 | ユーザー承認済み | **`--force-with-lease`** |

   判定例:

   ```bash
   git rev-list --left-right --count "origin/$ref...HEAD" 2>/dev/null || echo "0 0"
   ```

   **push 先 ref の検証（厳守）** — [`git-reflect-after-commit` 手順 4](../git-reflect-after-commit/SKILL.md) と同一:

   - **拒否**（完全一致）: `development` / `main` / `production`、または `v` + 数字タグ
   - **許可**: 上記以外の作業ブランチ
   - 拒否時は push せず中断

   **`--force-with-lease` を実行してよい条件**（いずれか）:

   1. 当該会話内で fixup / squash / amend / rebase 等の履歴書き換えが完了している
   2. ユーザーが force push / `--force-with-lease` を明示指示した

   上記以外（diverge / behind / non-fast-forward で履歴書き換え未確認）は **push せず中断**し、リモート更新の可能性をユーザーに伝えて確認する。`-f` は勝手に使わない。

   **push コマンド**（`ref` は通常、現在ブランチ名）:

   ```bash
   # 履歴書き換え確認済み、またはユーザー明示承認後
   git push --force-with-lease origin "HEAD:$ref"

   # ahead のみ等（通常）
   git push origin "HEAD:$ref"
   ```

   通常 push が non-fast-forward で reject された場合も **自動再試行しない**。中断しユーザーに確認する。

   push 成功またはスキップ後に手順 10 以降へ進む。

10. 手順 1 の確認結果に応じて、実行方法を判断する
    - **新規作成**: PR が紐づいていない場合 → 本文を出力し、gh pr create 実行時は --base development を指定する。ユーザーに確認を取る
    - **既存 PR の本文更新**: PR が紐づいている場合 → 本文を出力し、gh pr edit で本文を更新する場合はユーザーに確認を取る。本文をファイルに保存した場合は gh pr edit --body-file を使用する

11.（任意）手順 10 の直後に **GitHub Copilot** と **Codex コネクタ**をレビュワーに追加する。ユーザーに確認を取り、`gh` で指定する
    - `gh pr create` の `--reviewer @copilot` は PR 作成 API のタイミングで失敗することがある。必ず **手順 10 で PR を作成・更新した後に** `gh pr edit --add-reviewer @copilot --add-reviewer 'chatgpt-codex-connector[bot]'` で追加する
    - `gh` は v2.88.0 以降が必要（`@copilot` 利用に必須）
    - zsh では `chatgpt-codex-connector[bot]` の **シングルクォート**必須（`[ ]` のグロブ展開を防ぐ）
    - 重複依頼にならないよう、既に付いていればスキップしてよい
    - レビュワー指定だけでは観点が伝わらないことがある。PR 本文の「レビューしてほしい観点」に shokujii コードレビュー方針へのリンクを必ず入れる
    - 依頼の到達性の核は**手順 12**の固定コメント。手順 11 は併用を推奨する任意

12.（必須）手順 10 で `gh pr create` または `gh pr edit` が完了したら、ユーザーへの確認や同意を待たず、**即座に**次の**固定文**のレビュー依頼コメントを `gh pr comment` で送る。手順 11 の有無に関わらず省略しない

    **手順 12 直前**に基準時刻と PR 番号を記録する（手順 13 の wait 委譲で使う）:

    ```bash
    REVIEW_REQUEST_SINCE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    PR_NUM=$(gh pr view --json number -q .number)
    ```

    直前に PR を新規作成した場合で `gh pr view` が失敗するときは、手順 10 で得た PR 番号を `PR_NUM` に使う。

    本文は `--body` に渡す（zsh では**シングルクォート**で全体を囲むと @ が安全）。**固定文は次の 1 行のみ**とする（インライン指摘を促すため。Copilot が常に従う保証は製品側次第）:

```
gh pr comment --body '@copilot @codex review 日本語でお願いします。Files changed で該当行にインラインの review comment を 1 指摘 1 コメントでお願いします。トップレベルに複数ファイル分をまとめないでください。'
```

    直前に PR を紐づいていないブランチの場合は `gh pr comment 番号` の形で番号を明示する。手順 10 を挟むたびに同文が積み上がるのは意図どおり。コメントを減らしたい運用に変える場合はスキル更新で別定義する

13.（デフォルト ON）手順 12 完了後、[`wait-ai-pr-review`](../wait-ai-pr-review/SKILL.md) へ **`PR_NUM`** と **`REVIEW_REQUEST_SINCE`** を渡して委譲する（バックグラウンド監視開始。完了時に `review-comments-evaluate` 自動起動）

    - 手順 10 が未実行（ユーザー未確認で PR 未作成・未更新）の場合は手順 13 も実行しない
    - 会話に「評価待ちなし」「evaluate しない」「review wait しない」があれば手順 13 をスキップ
    - `git-reflect-after-commit` から委譲された場合も本手順 13 で wait を起動する（reflect 側で二重起動しない）
    - wait 委譲時は **wait-ai-pr-review 手順 3 の Shell 要件**（`block_until_ms: 0` + `notify_on_output: ^AGENT_LOOP_WAKE_pr_review`）を省略しない
    - wait 委譲後、sentinel 受信時に [`review-comments-evaluate`](../review-comments-evaluate/SKILL.md) **auto モード**が起動し、`documents/レビューコメント/pr-<番号>.md` 追記まで自動完走する

---

## 各セクションの埋め方

### タイトル

変更内容を端的に表す日本語タイトルを生成する。Issue 番号は含めない。
フォーマット: `[タグ] 変更内容を端的に表す日本語タイトル`
タグは変更したディレクトリに対応するものを選ぶ。複数可。
使用可能なタグ: `[user]` `[partner]` `[enterprise]` `[base]` `[common]` `[functions]` `[doc]` `[ci]` `[terraform]` `[firebase]` `[ai]`

- [doc]: documents/ 内の更新のみ
- [ci]: .github/workflows/
- [terraform]: terraform/
- [firebase]: firebase.json、.firebaserc、firestore.rules、storage.rules、firestore.indexes.json
- [ai]: .cursor / .agents / .claude / CLAUDE.md / AGENTS.md / .github/copilot-instructions.md 等

### タグを付けない場合

変更がルートの package.json / package-lock.json 等、**パッケージタグ・ci・terraform・firebase・doc・ai のいずれにも当てはまらない**モノレポ横断設定のみのときは、PR タイトルから `[タグ]` を省略してよい。

フォーマット例：

```
変更内容を端的に表す日本語タイトル
```

Issue 番号は PR タイトルには含めず、本文の関連 Issue や closes で扱う。

### 概要

1〜2文でこのPRの目的と内容を説明する。

#### コミット一覧

`git log origin/development...HEAD --oneline` で取得したコミットタイトルをそのまま全件列挙する。
要約や改変はせず、コミットタイトルの文字列をそのままコピーする。

#### 関連情報

関連 Issue はブランチ名から取得する。例: feat/1826-5min → #1826、fix/1234-typo → #1234。ハイフン以降は無視する。複数の場合は #1234 #1235 のように並べる。
区分は以下から選ぶ: バグ修正 / 機能追加 / リファクタリング / 運用改善 / ドキュメント

### 変更内容

変更されたファイルと差分の内容をもとに、何をしたかを箇条書きで記述する。

記述例:

- stripe.ts: 注文期限チェックと expires_at を追加
- pollingTask.ts: 注文締切メールの送信タイミングを5分遅延
- documents/: 仕様書を廃案・将来実装に分割

### 影響範囲

#### 対象パッケージ

変更が含まれるパッケージのみを箇条書きで列挙する。
`user` `partner` `enterprise` `base` `common` `functions` から該当するものだけを記載する。
`documents/` のみの変更の場合は対象パッケージに含めず、タイトルの [doc] タグで表現する。
`firestore.indexes.json` / `firestore.rules` / `storage.rules` のみなど、アプリの各パッケージのソースを変更していない場合は、その旨を書き、タイトルにパッケージタグを付けないことがある。

#### Firebase / Backend

以下のいずれかが変更されている場合は「あり」と記述する。

- `common/src/schemas/` 以下のファイル → Firestore スキーマ変更
- `firestore.rules` / `storage.rules` → Security Rules 変更
- `functions/` 以下のファイル → Functions 変更

影響内容: 該当する場合、変更した Function 名や処理内容を簡潔に記載する。例: stripe.ts の createStripeCheckoutSession に注文期限チェックを追加。pollingTask の注文締切メール送信タイミングを5分遅延。

データマイグレーション（バッチ処理）: Firestore スキーマ変更がある場合のみ記載する。既存ドキュメントに新フィールドを追加する、既存データの形式を変更するなど、既存データの更新が必要な場合は「必要」と記述し、bokudeli-event-batch リポジトリでバッチ処理スクリプトを実装する旨を補足する。新規コレクション追加や optional フィールド追加のみで既存データの更新が不要な場合は「不要」と記述する。

### レビューしてほしい観点

次のレビュー基準ドキュメントを参照することを必ず1行目に記載する（URL はそのまま用いる）:

- `https://github.com/nijuniinc/bokudeli-event-new/blob/development/.agents/skills/shokujii-code-review/shokujii-code-review.md`

上記に加え、設計上の判断・迷いどころ・特に確認してほしいファイル・リスクを差分から抽出して箇条書きで記述する。人間用の要約に加え、**手順 12** では **@copilot @codex** 付きの PR コメントでレビュー依頼を必ず送る（依頼の到達性を上げる目的。インライン指摘の依頼文は手順 12 の固定文に含める）。
推定できない場合は「要確認」と記述して手動補完を促す。

### 確認済み事項

確認が完了していると推定される項目のみを箇条書きで列挙する。
確認が必要なものは「要確認: 〇〇」の形式で記載する。
Firestore 変更時・Functions 変更時のチェック項目は該当する場合のみ記載する。

### closes

ブランチ名から取得した Issue 番号を記入する。
複数 Issue がある場合は、PR の変更内容から該当するものを判断し、closes # を複数行に分けて記述する。

---

## 制約

- 日本語で記述する
- 推定できない箇所は空欄または「要確認」と記述し、手動で補完を促す
- gh pr create および gh pr edit を実行する場合は、ユーザーに確認を取ってから実行する
- 手順 10（gh pr create/edit）の前に手順 9 の origin push を省略しない（reflect から同期済みの場合を除く）
- origin push の `--force-with-lease` は履歴書き換え確認またはユーザー明示承認時のみ。diverge 時の自動 force は禁止。保護 ref への push は禁止
- 手順 10 を実行したときは**手順 12 を即座に実行する**（ユーザーへの確認不要。固定文の `gh pr comment` を省略しない）
- 手順 12 完了後は**手順 13**で wait を起動する（オプトアウト時を除く）。evaluate 本体は wait スキルが sentinel 受信後に実行する

## 運用上の推奨

- force push や squash でブランチ内容が変わった後は、既存 PR の本文を更新することを推奨する
- PR 本文更新だけでなく **手順 9 で origin に push** してからレビュー依頼する（未 push のまま Copilot が古い Files changed を見るのを防ぐ）
- PR 本文に shokujii のレビュー基準を書き、**手順 12**の固定 `gh pr comment` は必須。任意のうえで、`gh pr create` 後に `gh pr edit --add-reviewer @copilot --add-reviewer 'chatgpt-codex-connector[bot]'` で @copilot と Codex を足す、とすると本文・レビュワー欄・コメントの三経路で補完しやすい。`gh pr create` の `--reviewer @copilot` は失敗することがあるため使わない
