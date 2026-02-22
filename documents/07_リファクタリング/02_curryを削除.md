# curryを削除

## 背景
- curryの更新を現状していない
- 今後curryのような、OEMプロジェクト/分岐プロジェクトが発生した場合、改めて作成した方が実装コストは低い
 
## 対応箇所

### ファイル・ディレクトリ削除

| 対象 | 内容 |
|---|---|
| `curry/` | ディレクトリごと削除 |
| `.github/workflows/deploy_curry_production.yml` | GitHub Actions ワークフローファイルを削除 |

### ファイル修正

| ファイル | 修正内容 |
|---|---|
| `package.json`（ルート） | `workspaces` 配列から `"curry"` を削除 |
| `firebase.json` | `hosting` 配列の curry エントリ（`"target": "curry"` のオブジェクト全体）を削除 |
| `.github/pull_request_template.md` | 「対象パッケージ」セクションの `- [ ] curry` の行を削除 |
| `.github/copilot-instructions.md` | ディレクトリ構造テーブルの curry 行、コミットタグ一覧の `[curry]` を削除 |
| `AGENTS.md` | ディレクトリ構造テーブルの curry 行、コミットタグ一覧の `[curry]` を削除 |
| `base/src/locales/messages/ja.ts` | `'kanda-curry': '神田カレーグランプリ'` の行を削除 |

### 注意事項

- `base/src/locales/messages/ja.ts` の `'kanda-curry'` キーは `user` / `admin` から参照されていないことを確認済み。ただし Firebase 上のコミュニティデータに `kanda-curry` スラッグが存在する場合は表示崩れが起きる可能性があるため、削除前に DB の利用有無を確認すること。
