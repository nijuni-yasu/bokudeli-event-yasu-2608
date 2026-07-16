# レビュー記録ファイルのパス（正本）

`review-comments-evaluate` / `shokujii-code-review` / `wait-ai-pr-review` が参照する、RC 記録の保存先ルール。判断ロジックは本ファイルを正本とし、各スキルに重複記述しない。

## 新規記録の正本（2026-07 以降）

**1 ブランチ = 1 ファイル**。PR 前後で同じファイルに追記する。

| 項目 | 内容 |
|:-----|:-----|
| ディレクトリ | `documents/レビューコメント/`（無ければ作成） |
| ファイル名 | `review-<slug>.md` |
| slug | 現在のブランチ名の `/` を `-` に置換した文字列 |

### 例

| ブランチ名 | ファイル |
|:---|:---|
| `fix/2500` | `documents/レビューコメント/review-fix-2500.md` |
| `feat/2501` | `documents/レビューコメント/review-feat-2501.md` |
| `feat/960-v2` | `documents/レビューコメント/review-feat-960-v2.md` |
| `ai/2176` | `documents/レビューコメント/review-ai-2176.md` |

### パス解決（シェル）

**PR URL / 番号が分かる場合**（manual evaluate で別 PR を対象にするときは checkout ブランチより優先）:

```bash
branch=$(gh pr view <URL_or_PR_NUM> --json headRefName -q .headRefName)
slug=$(echo "$branch" | tr '/' '-')
review_doc="documents/レビューコメント/review-${slug}.md"
```

**PR が不明なとき**（通常のセルフレビュー・同一ブランチ evaluate）:

```bash
branch=$(git branch --show-current)
slug=$(echo "$branch" | tr '/' '-')
review_doc="documents/レビューコメント/review-${slug}.md"
```

### PR 番号のみ分かる場合（auto evaluate 等）

`git branch --show-current` が使えない、または PR 番号から解決する場合:

```bash
branch=$(gh pr view <PR_NUM> --json headRefName -q .headRefName)
slug=$(echo "$branch" | tr '/' '-')
review_doc="documents/レビューコメント/review-${slug}.md"
```

PR 番号はファイル名には使わない。評価セッションのメタデータ **`PR`** 欄に URL または `#番号` を書く（未作成時は `未作成`）。

## 記録対象外のブランチ

次のプレフィックスで始まるブランチでは、レビュー記録ファイルの**新規作成・追記をスキップ**してよい（セルフレビュー・evaluate とも）:

- `release/`
- `sync/`
- `hotfix/`
- `backup/`
- `tree/`

通常の作業ブランチ（`fix/` `feat/` `feature/` `ai/` `doc/` 等）では記録する。

## RC 採番

- **同一 `review-<slug>.md` 内**で通し番号（`RC-1`, `RC-2`, …）
- 追加セッションではリセットせず、既存ファイルの最終 RC の次から採番
- セルフレビュー（shokujii-code-review）と外部レビュー evaluate は**同じファイル・同じ RC 系列**を共有

## テンプレート

**正本は [review-xxxx_template.md](../../../../documents/レビューコメント/review-xxxx_template.md) のみ。** 新規 `review-<slug>.md` 作成時はその見出し・ブロック順（13項目）に合わせる。

`pr-xxxx_template.md` は廃止（リダイレクト stub のみ残置）。新規作業で参照しない。

## レガシー（既存 `pr-*.md`）

- 既存の `documents/レビューコメント/pr-<PR番号>.md` は**そのまま残す**（リネーム・マイグレーションしない）
- 既存 `pr-*.md` への追記・更新依頼があった場合は、そのファイルを正本として扱う（テンプレートは `review-xxxx_template.md` のフォーマットに揃えてよい）
- **新規作業**（新ブランチ・PR 前のセルフレビュー含む）は上記 `review-<slug>.md` を使う

## ブランチ名変更時

ブランチをリネームした場合は、記録ファイルも `git mv` で `review-<新slug>.md` に揃える（未対応のままだと記録が分裂する）。
