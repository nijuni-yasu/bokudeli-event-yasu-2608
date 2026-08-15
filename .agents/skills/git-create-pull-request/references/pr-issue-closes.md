# PR の関連 Issue / closes 解決（正本）

[`git-create-pull-request`](../SKILL.md) 手順 6 で PR 本文の **関連 Issue** と **closes** を決めるルール。コミットメッセージ用の [issue-resolution.md](../../git-commit-message/references/issue-resolution.md) を補完する（重複記述しない）。

## 固定値

- リポジトリ: `nijuniinc/bokudeli-event-new`

## 目的

- ブランチ名に Issue 番号が無い PR（例: `dev/enterprise-mvp-v4`）でも **closes の漏れ・過不足**を防ぐ
- コミットに `#` が付いていても **部分対応のみ**の Issue を `closes` に入れない
- **MERGED / CLOSED** の Issue を誤って `closes` しない

## 手順（PR 本文生成前）

### 1. 候補番号を列挙する

次のソースから `#NNNN` を収集し、**重複除去**する（昇順でよい）。

| 優先 | ソース | 取得例 |
|:----:|--------|--------|
| 1 | 会話でユーザーが明示した `#` | — |
| 2 | `git log origin/development...HEAD --format=%s` | 各コミットタイトルの `#2254` 等 |
| 3 | ブランチ名の数字 | `fix/2101-foo` → `2101`（**候補のみ**） |
| 4 | 既存 PR の `closingIssuesReferences` / 本文の `closes #` | `gh pr view --json closingIssuesReferences,body` |
| 5 | 差分・仕様書内の Issue 参照 | `git diff origin/development...HEAD` および `documents/` 変更内の `#2252` 等 |

**除外（候補に入れない）**:

- コミットメッセージ内の **メールテンプレ番号**（例: `コミュニティ作成メール #12` の `#12`）— GitHub Issue 番号と混同しない。直前が「メール」「テンプレ」「AC-」等の文脈なら除外
- 明らかに PR 番号・Run 番号・行番号

```bash
git log origin/development...HEAD --format=%s | grep -oE '#[0-9]+' | tr -d '#' | sort -nu
```

### 2. 各候補を検証する

```bash
gh issue view <N> --repo nijuniinc/bokudeli-event-new --json number,title,body,state
```

| state | closes 候補 | 関連 Issue（Refs） |
|-------|-------------|-------------------|
| OPEN | 内容判定後 | 可 |
| CLOSED（未マージ PR 用に残存） | 原則 **不可** | 可（注記） |
| **MERGED** | **不可** | 可（注記「既にマージ済み」） |

Issue が存在しない番号は候補から削除する。

### 3. closes と Refs に分類する

**`closes #NNNN`（マージで自動クローズ）** — 次を **すべて**満たす:

1. `state: OPEN`
2. PR の変更が Issue の **主目的を完了**している（コミット 1 件のフォローアップだけ、別 PR で切り出した残タスク、review doc のみ更新、は **不可**）
3. 判断に迷う場合は **Refs のみ**に降格し、本文に「要確認: #NNNN を closes に含めるか」を 1 行書く

**`Refs #NNNN`（関連 Issue のみ）** — 次のいずれか:

- 部分対応・フォローアップ 1 コミットのみ（例: メール P0 の 1 関数だけ、UI 再設計 Issue の Auth 待ち修正 1 件）
- 設計合意 Issue で実装 Issue（#2254）側で本体を閉じる方針
- 既に MERGED の親 Epic への doc 追記
- 実装は PR に含むがコミットタイトルに `#` が無い **別 Issue**（仕様書 `（#2252）` 参照）— **内容一致**なら closes 候補に昇格可

**PR 用トラッキング Issue**（タイトルが PR タイトルと同一・本文が PR 下書きに近い）:

- 本体 Issue（例: #2254）と併存する場合、**両方 closes** が一般的
- 本体だけ閉じてトラッキング Issue を残す運用は採用しない（本文に理由を書く場合のみ）

**superseded 記載がある Issue**（例: Issue 本文に「#2229 は superseded」）:

- 実装 PR で **closes に含めてよい**（本文の関連 Issue に理由を 1 行）

### 4. 内容一致判定

[issue-resolution.md §3](../../git-commit-message/references/issue-resolution.md) と同様、**PR 全体の diff**（`origin/development...HEAD`）と Issue の title / body を照合する。

| 例 | 判定 |
|----|------|
| #2254 福利厚生履歴移行 + PR が schema / functions / UI 一式 | closes |
| #2252 確定前再同期 — コミットに `#2252` 無しでも `syncEnterpriseSubsidyOrdersBeforeConfirm` 実装 | closes（仕様書・diff で確認） |
| #2248 P0 メール全体 — `communityMail #12` の 1 コミットのみ | Refs |
| #2230 UI 再設計 — `EnterpriseSubsidyUsagePanel` の Auth 待ち 1 修正のみ | Refs |
| #2223 既 MERGED — review doc 更新コミットのみ | Refs（closes 禁止） |
| #2250 vue-tsc gate — base テスト tsconfig 修正のみ | Refs |

複数 Issue が **同じテーマ**（例: #2254 と #2240 設計合意）のとき、closes に両方入れるかは Issue 本文の「superseded / 設計合意」表記を優先する。迷ったら **closes は最小限** + Refs で列挙 + 要確認 1 行。

### 5. PR 本文への出力

#### 関連 Issue（テンプレート §関連Issue）

```
#2254 #2252 #2257
Refs #2248 #2249 #2250 #2230
```

- **closes 候補を先**、**Refs を後**
- MERGED の #2223 等は `Refs` に含め、括弧で `(merged)` と書いてよい

#### closes（テンプレート末尾）

**1 Issue 1 行**（GitHub の自動クローズ用キーワード）:

```
closes #2254
closes #2252
closes #2257
```

- `Refs #` 行は **closes ブロックに書かない**
- 要確認の Issue は closes に入れず、関連 Issue または概要に理由を書く

### 6. 生成前チェックリスト（エージェント向け）

- [ ] コミット log から抽出した `#` をすべて gh で検証した
- [ ] MERGED Issue を closes から除外した
- [ ] 部分対応のみの Issue を Refs に降格した
- [ ] 仕様書・diff で実装済みだがコミットに無い `#` を closes 候補にした
- [ ] メール `#12` 等の偽陽性を除外した
- [ ] 判断が割れた Issue を「要確認」として本文に残した

## 例（dev/enterprise-mvp-v4 / PR #2257）

| Issue | 分類 | 理由 |
|-------|------|------|
| #2254 | closes | 本体機能 |
| #2252 | closes | 確定前再同期（D-20）実装済み |
| #2257 | closes | PR トラッキング Issue |
| #2229 / #2240 | closes 任意 | superseded / 設計合意（運用で選択） |
| #2248 / #2249 / #2250 / #2230 | Refs | 部分コミットのみ |
| #2223 | Refs (merged) | 既マージ Epic への doc 追記 |
