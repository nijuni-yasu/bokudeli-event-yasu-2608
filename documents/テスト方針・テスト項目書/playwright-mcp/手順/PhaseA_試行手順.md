# Phase A Playwright MCP 試行手順

未ログイン・読み取り専用の公開導線を Playwright MCP で確認する。
親ドキュメント: [`E2E_Playwright_導入検討.md`](../../E2E_Playwright_導入検討.md) §4 Phase A

## 1. 事前チェック

- [ ] [`.cursor/mcp.json`](../../../../.cursor/mcp.json) または [`.mcp.json`](../../../../.mcp.json) が存在する
- [ ] `npx playwright install chromium` を実行済み
- [ ] [`環境設定.local.md`](../環境/環境設定.local.md) を [`環境設定.template.md`](../環境/環境設定.template.md) から作成し、URL / fixture を記入済み
- [ ] 対象 URL が **sandbox / development** であり、本番ではない
- [ ] Cursor: **Settings → Tools & MCP** で `playwright` が Connected
- [ ] Claude Code: `claude mcp list` で `playwright` が Connected
- [ ] **新規 Agent チャット**を開く（MCP ツールが読み込まれる）

### MCP 有効化（Cursor）

1. 設定追加後 **Developer: Reload Window**
2. Settings → Tools & MCP → `playwright` を ON
3. 初回はツール一覧で Playwright 系ツールを有効化

### Windows で MCP が接続できない場合

`npx` の代わりに `node node_modules/@playwright/mcp/cli.js` を直接指定する。
詳細: [`E2E_Playwright_導入検討.md`](../../E2E_Playwright_導入検討.md) §6.7

---

## 2. 接続確認（Hello World）

**対象 URL**: `https://example.com`

**MCP 依頼プロンプト（コピペ用）**

```
Playwright MCP で https://example.com を開いてください。
ページタイトルと h1 の見出しを教えてください。
MCP が正常に動作しているか確認したいです。
```

**期待結果**: ページが開き、タイトルまたは見出しが取得できる

| 結果 | 備考 |
|:--|:--|
| PASS / FAIL | |

---

## 3. Phase A チェックリスト

`環境設定.local.md` の変数をプロンプト内の `{...}` に置き換えて依頼する。
**ログイン・カート投入・決済は行わない。**

### 3.1 U-02 トップ表示（未ログイン）

| 項目 | 内容 |
|:--|:--|
| 手動項目 ID | U-02 |
| URL | `{USER_BASE_URL}/` |
| 期待結果 | イベント一覧・コミュニティ導線が表示される |

**MCP 依頼プロンプト**

```
Playwright MCP で {USER_BASE_URL}/ を未ログイン状態で開いてください。
- イベント一覧またはイベントへの導線が表示されるか
- ナビゲーション（ホーム、コミュニティ等）が表示されるか
- コンソールに重大なエラーがないか
v2.10 手動項目 U-02 の期待結果と照合し、PASS/FAIL で報告してください。
```

| 結果 | 備考 |
|:--|:--|
| PASS / FAIL / SKIP | |

---

### 3.2 U-04 コミュニティ詳細

| 項目 | 内容 |
|:--|:--|
| 手動項目 ID | U-04 |
| URL | `{USER_BASE_URL}/c/{TEST_COMMUNITY_ACCOUNT}` |
| 期待結果 | イベント一覧・アルバム等が表示される |
| SKIP 条件 | 公開コミュニティ fixture が未整備 |

**MCP 依頼プロンプト**

```
Playwright MCP で {USER_BASE_URL}/c/{TEST_COMMUNITY_ACCOUNT} を未ログインで開いてください。
- コミュニティ名・説明等の基本情報が表示されるか
- イベント一覧または関連導線が表示されるか
- 画面が崩れていないか、重大なコンソールエラーがないか
U-04 の期待結果と照合し、PASS/FAIL で報告してください。
```

| 結果 | 備考 |
|:--|:--|
| PASS / FAIL / SKIP | |

---

### 3.3 U-03 イベント詳細

| 項目 | 内容 |
|:--|:--|
| 手動項目 ID | U-03 |
| URL | `{USER_BASE_URL}/c/{TEST_COMMUNITY_ACCOUNT}/e/{TEST_EVENT_ID}` |
| 期待結果 | 画面表示、参加者、注文導線が崩れない |
| SKIP 条件 | 公開イベント fixture が未整備 |

**MCP 依頼プロンプト**

```
Playwright MCP で {USER_BASE_URL}/c/{TEST_COMMUNITY_ACCOUNT}/e/{TEST_EVENT_ID} を未ログインで開いてください。
- イベント詳細（日時、場所、説明等）が表示されるか
- 参加・注文に関する導線が表示されるか（クリックして決済までは進まない）
- 参加者表示等が極端に崩れていないか
U-03 の期待結果と照合し、PASS/FAIL で報告してください。
```

| 結果 | 備考 |
|:--|:--|
| PASS / FAIL / SKIP | |

---

### 3.4 MP-03 未ログインのプロフィール表示

| 項目 | 内容 |
|:--|:--|
| 手動項目 ID | MP-03 |
| URL | `{USER_BASE_URL}/u/{TEST_USER_UID}` |
| 期待結果 | 公開プロフィールが表示される |

**MCP 依頼プロンプト**

```
Playwright MCP で {USER_BASE_URL}/u/{TEST_USER_UID} を未ログインで開いてください。
- 公開プロフィール（表示名、アイコン等）が表示されるか
- ログインを要求する致命的エラーになっていないか
MP-03 の期待結果と照合し、PASS/FAIL で報告してください。
```

| 結果 | 備考 |
|:--|:--|
| PASS / FAIL / SKIP | |

---

### 3.5 MP-04 存在しないユーザー

| 項目 | 内容 |
|:--|:--|
| 手動項目 ID | MP-04 |
| URL | `{USER_BASE_URL}/u/{NONEXISTENT_USER_UID}` |
| 期待結果 | 存在しないユーザーとしてエラー表示される |

**MCP 依頼プロンプト**

```
Playwright MCP で {USER_BASE_URL}/u/{NONEXISTENT_USER_UID} を未ログインで開いてください。
- 存在しないユーザーである旨のエラーまたは空状態が表示されるか
- 白画面・未処理例外で落ちていないか
MP-04 の期待結果と照合し、PASS/FAIL で報告してください。
```

| 結果 | 備考 |
|:--|:--|
| PASS / FAIL | |

---

### 3.6 P-01 前段 partner ログイン画面

| 項目 | 内容 |
|:--|:--|
| 手動項目 ID | P-01（前段） |
| URL | `{PARTNER_BASE_URL}/login` |
| 期待結果 | partner ログイン画面が表示される（ログイン操作は Phase B） |

**MCP 依頼プロンプト**

```
Playwright MCP で {PARTNER_BASE_URL}/login を開いてください。
- partner（飲食店向け）ログイン画面が表示されるか
- ログインボタン等の主要 UI が表示されるか（認証操作は不要）
P-01 のログイン前段として PASS/FAIL で報告してください。
```

| 結果 | 備考 |
|:--|:--|
| PASS / FAIL | |

---

## 4. 試行結果の記録

試行完了後、[`結果/PhaseA/`](../結果/PhaseA/) に `YYYY-MM-DD.md` または `YYYY-MM-DD_MCP.md` を作成する。

初回 PoC（2026-06-20）: [`2026-06-20.md`](../結果/PhaseA/2026-06-20.md)  
Playwright MCP 試行（2026-06-20）: [`2026-06-20_MCP.md`](../結果/PhaseA/2026-06-20_MCP.md)  
Playwright MCP 試行（2026-06-21・`test.tabete.co`）: [`2026-06-21_MCP.md`](../結果/PhaseA/2026-06-21_MCP.md)

テンプレート:

```markdown
# Phase A 試行結果 YYYY-MM-DD

- 環境: （development / sandbox 名）
- 実施者:
- MCP: Cursor / Claude Code

| 順 | ID | 結果 | 備考 |
|:--|:--|:--|:--|
| 1 | Hello World | | |
| 2 | U-02 | | |
| 3 | U-04 | | |
| 4 | U-03 | | |
| 5 | MP-03 | | |
| 6 | MP-04 | | |
| 7 | P-01 前段 | | |

## 所感・次のアクション
-
```

---

## 5. 実行順サマリー

| 順 | ID | リスク |
|:--|:--|:--|
| 1 | Hello World | なし |
| 2 | U-02 | 低 |
| 3 | U-04 | 低 |
| 4 | U-03 | 低 |
| 5 | MP-03 | 低 |
| 6 | MP-04 | 低 |
| 7 | P-01 前段 | 低 |

---

## 6. 参考

- [v2.10 手動テスト項目書](../../v2.10/v2.10_テスト項目書.md) §4, §5
- [Playwright MCP 公式](https://playwright.dev/docs/getting-started-mcp)

---

## 7. 次のステップ（Phase B）

Phase A 完了後、**ログインが必要な項目**は [`PhaseB_試行手順.md`](./PhaseB_試行手順.md) に進む。

- 推奨 URL: `{USER_BASE_URL}`（[`環境設定.local.md`](../環境/環境設定.local.md) に記録）
- ログイン uid: `{LOGIN_USER_UID}`（同上）
- MCP ブラウザ上で人手ログイン → AI が MP-01 / FR-01 / U-05 等を確認
