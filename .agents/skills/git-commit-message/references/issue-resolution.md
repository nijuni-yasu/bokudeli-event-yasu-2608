# イシュー番号解決（正本）

git-commit-message / git-fixup / classification が参照するイシュー番号解決ルール。判断ロジックは本ファイルを正本とし、各スキルに重複記述しない。

## 固定値

- リポジトリ: `nijuniinc/bokudeli-event-new`

## 解決モード

| モード              | 呼び出し元                                           | 目的                                                                 |
| ------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| **full**            | 新規・分割・squash 書き換え・amend（メッセージ更新） | 採用 `#` を決定してからメッセージ生成                                |
| **coherence-lite**  | fixup 前（A1-fast 判定）                             | 吸収先 `#` の存在とパス整合のみ。**`gh` は呼ばない**                 |
| **coherence-full**  | A1-full 昇格時                                       | 吸収先 `#` と diff が同一 Issue か検証。**新 `#` は選ばない**        |
| **inherit**         | ユーザーが `#NNNN` を明示                            | `gh issue view` で実在確認のみ。内容不一致なら full へ降格           |

## full フロー

コミットメッセージ生成前に必ず実行する。未解決のままメッセージを生成しない。

### 1. 候補番号を列挙する

優先順:

1. ユーザーが会話で明示した `#NNNN`（inherit 起点。内容不一致なら候補の一つとして full で再検証）
2. ブランチ名の数字（`fix/2101`, `feature/2101`, `ui/2093` 等）— **候補のみ。採用前に必ず検証**
3. squash 書き換え時: 元メッセージから抽出した `#`
4. 会話・PR 文脈で明示された Issue 番号

ブランチ名だけを根拠に採用してはならない。

### 2. 各候補を検証する

```bash
gh issue view <N> --repo nijuniinc/bokudeli-event-new --json number,title,body,state
```

- Issue が存在しない、または closed で意図的でない場合は却下
- `gh` 認証不足時はユーザーに `gh auth status` を案内し中断

### 3. 内容一致判定

title / body とステージング diff を照合する。

| 一致 | 不一致例                                                |
| ---- | ------------------------------------------------------- |
| OK   | #2101 は chunk 不具合、diff が chunk 関連の修正         |
| NG   | #2101 は chunk 不具合、diff が git-commit-workflow のみ |

**意味チェック**: この diff を説明するイシューとして `#N` が妥当か。

一致した候補を **採用** する。

### 4. 不一致時: イシュー検索

```bash
gh issue list --repo nijuniinc/bokudeli-event-new --state open --limit 100 \
  --json number,title,body

gh search issues "キーワード" --repo nijuniinc/bokudeli-event-new --state open
```

- キーワード: 変更の機能名・ファイル名・スキル名・エラー内容等
- 候補を最大3件提示し、内容一致するものを採用
- 複数候補で判断が割れる場合は **ユーザー確認**

### 5. 該当イシューなし

中断し、次をユーザーに提案する（勝手に作成しない）:

> 該当イシューが見つかりません。`/git-create-issue` で新規イシューを作成しますか？

- 同意後 [git-create-issue](../../git-create-issue/SKILL.md) を実行
- タイトル・本文は diff から下書き。**タイトルに `#番号` は含めない**
- 作成 URL の番号を採用

### 6. 出力（メッセージ生成前に必須）

```
### イシュー
- 採用: #NNNN（理由: 内容一致 / 検索で発見 / 新規作成）
- 却下: #2101（ブランチ候補だが Issue 内容と diff が不一致）
```

### 7. 制約

- **`#番号` は原則必須**。解決完了までコミットメッセージを出力しない
- 内容不一致の候補番号を採用しない

## coherence-lite フロー（A1-fast 用）

A1-fast 合格時に実行する。**GitHub API は呼ばない**。

### 1. 吸収先タイトルから `#` を抽出

```bash
git log -1 --format=%s <吸収先ハッシュ>
```

- `#` が無い → **lite NG** → A1-full へ（full でも NG なら A2）

### 2. パス整合（classification の機械チェックと同一）

- タイトル接頭辞 `[user]` `[functions]` 等と、未コミット diff のトップレベルパスが一致するか

### 3. ブランチ名ヒント（任意・警告のみ）

- ブランチ名の数字と `#` が **明らかに不一致**（例: ブランチ `fix/2101`、メッセージ `#2099` のみ）→ **A1-full へ昇格**（lite 単独では NG にしない）

### 4. 出力

```
### イシュー（coherence-lite）
- 吸収先: abc1234 の #2101 — lite OK（gh 未使用）
```

## coherence-full フロー（A1-full 昇格時）

A1-fast では判断しきれない場合のみ実行。新しい `#` は選ばず、吸収先メッセージの `#` を維持できるか検証する。

### 1. 吸収先メッセージから `#` を抽出

```bash
git log -1 --format=%B <吸収先ハッシュ>
```

メッセージに `#` が無い場合は **coherence-full NG**（A2 squash または B/C へ）。

### 2. GitHub Issue を取得

```bash
gh issue view <N> --repo nijuniinc/bokudeli-event-new --json number,title,body,state
```

### 3. diff が Issue 作業範囲内か判定

- 足す未コミット diff が、その Issue の title / body で説明される作業か
- [classification.md A1-full](../../git-commit-workflow/references/classification.md#a1-full昇格時のみ) の意味チェックを併用

### 4. 結果

| 結果 | 次のアクション                                       |
| ---- | ---------------------------------------------------- |
| OK   | fixup 続行。メッセージの `#` は変更しない            |
| NG   | fixup **中止**。B/C（別コミット）または A2 squash へ |

**例**: 吸収先 `#2101`（chunk 不具合）に git-commit-workflow だけを fixup → **NG**

### 5. 出力

```
### イシュー（coherence-full）
- 吸収先: abc1234 の #2101
- 判定: OK / NG（理由: …）
```

## inherit モード

ユーザーが `#NNNN` を明示した場合:

1. `gh issue view` で実在確認
2. 内容一致 → その番号を採用
3. 不一致 → **full フロー**に降格（明示番号は候補の先頭に残す）

## 分割コミット

**ステージング単位（1コミット分）ごと**に full を実行する。1ブランチでコミットごとに Issue 番号が異なってよい。

## squash 書き換え

git-commit-message の squash コンテキストでは **full** を使う。

- 統合後 diff を入力にする
- 元メッセージの `#` を候補に含める
- 統合後も同じ `#` で説明できるなら維持
- 説明できないなら full で正しい `#` を解決してからメッセージ生成

## amend

- メッセージ更新なし（`--no-edit`）: **coherence-lite** 相当（HEAD タイトルの `#` + パス整合。`gh` 不要）
- メッセージ更新あり: **full**（HEAD の `#` を候補に含める）
