# E2E / Playwright 導入検討

## 1. 文書の目的

本書は Shokujii における E2E テスト・Playwright 導入の検討メモである。

- **最初に E2E 化すべきフロー**の候補整理
- **Playwright MCP** の具体的な導入手順
- 手動テスト項目書・Vitest・Playwright テストコードとの棲み分け

親ドキュメント: [`テスト方針.md`](./テスト方針.md)

---

## 2. 前提と用語

| 用語 | 意味 |
|:--|:--|
| **E2E テスト** | ユーザー操作の最初から最後までを通しで確認するテスト |
| **Playwright** | ブラウザを自動操作する Microsoft 製ツール |
| **Playwright MCP** | AI エージェントが Playwright 経由でブラウザを操作する仕組み（テストコード不要） |
| **Playwright テストコード** | `.spec.ts` 等に書く、CI で再実行可能な E2E テスト |

Shokujii は Firebase Auth（Google / X / Facebook / メール）・Firestore・Stripe・Slack / LINE 連携を持つため、**全部を一度に E2E 化するのは現実的ではない**。段階導入とする。

---

## 3. フロー選定の評価軸

候補フローは次の 5 軸で評価する。

| 軸 | 高いと E2E 向き | 低いと後回し |
|:--|:--|:--|
| **ビジネス影響** | 壊れると参加・決済・公開に直結 | 表示崩れのみ |
| **手動確認コスト** | リリースごとに毎回確認している | たまにしか触らない |
| **自動化しやすさ** | 未ログインで見られる、DOM が安定 | OAuth ポップアップ、Stripe、Slack 等 |
| **Vitest で代替可能か** | 画面・権限・連携の確認が必要 | ロジックのみ（料金・日付等） |
| **データ依存** | sandbox の固定データで再現可能 | 本番相当の複雑な状態が必要 |

**原則**

- ロジックは Vitest（`common` / `functions/default`）
- 画面・権限・導線は E2E または手動テスト項目書
- 開発中の探索確認は Playwright MCP

---

## 4. 最初に E2E 化すべきフロー候補

[`v2.10/v2.10_テスト項目書.md`](./v2.10/v2.10_テスト項目書.md) の項目 ID と対応づけて整理する。

### Phase A: Playwright MCP で試す（認証不要・最優先）

**目的**: E2E の「触り方」に慣れる。テストコード・CI 不要。

| 優先 | 候補フロー | 手動項目 ID | 理由 | 確認環境 |
|:--|:--|:--|:--|:--|
| ★★★ | トップページ表示（未ログイン） | U-02 | ログイン不要。イベント一覧・ナビの退行を早期検知 | sandbox / dev |
| ★★★ | イベント詳細表示 | U-03 | 公開イベント URL を直叩き可能。参加導線の表示確認 | sandbox / dev |
| ★★★ | コミュニティ詳細表示 | U-04 | 同上。一覧・基本情報の表示確認 | sandbox / dev |
| ★★☆ | 存在しないユーザーのプロフィール | MP-04 | エラー表示・404 相当の確認。データ不要 | sandbox / dev |
| ★★☆ | 未ログインのプロフィール表示 | MP-03 | 公開プロフィールの権限表示 | sandbox / dev |
| ★☆☆ | partner ログイン画面表示 | P-01 の前段 | 画面表示のみ（ログイン操作は Phase B） | sandbox |

**MCP への依頼例**

```
sandbox の user アプリ（https://...）を開いて、
未ログイン状態でトップページが表示されるか確認して。
イベント一覧とナビゲーションが見えるか、コンソールエラーがないかも見て。
```

---

### Phase B: Playwright MCP + 人手ログイン（認証あり・次点）

Firebase Auth は OAuth ポップアップ（Google / X / Facebook）が主体のため、**完全自動ログインは難しい**。
Phase B では「人間が一度ログイン → AI が続きを確認」する運用から始める。

| 優先 | 候補フロー | 手動項目 ID | 理由 | 注意 |
|:--|:--|:--|:--|:--|
| ★★★ | マイページ・プロフィールタブ表示 | MP-01, MP-06 | v2.10 の重点変更。タブ構成の退行検知 | ログイン後に MCP へ引き継ぎ |
| ★★★ | 他者プロフィール + 注文履歴非表示 | MP-02, MP-07, MP-08 | 権限制御の退行は影響大 | テスト用 uid を固定 |
| ★★☆ | ともだち一覧・並び替え | FR-01〜FR-04 | v2.10 新機能。URL クエリ同期も確認 | 同席履歴データが必要 |
| ★★☆ | カート投入（決済まで行かない） | U-05 | 注文導線の前半。Stripe より安定 | 注文受付中イベントが必要 |
| ★★☆ | partner 基本導線 | P-02〜P-05 | partner リネーム後の表示確認 | 店舗アカウント必要 |

**運用フロー**

1. 人間が sandbox にログイン（テスト用アカウント）
2. AI に「ログイン済み。`/u/{uid}` を開いてタブ構成を確認して」と依頼
3. 結果を手動テスト項目書の該当 ID にメモ

---

### Phase C: Playwright テストコード化の第 1 弾（CI 連携前）

MCP で問題なさそうなフローから、**1〜3 本**に絞って `.spec.ts` 化する。

| 優先 | 候補フロー | 手動項目 ID | E2E 化の条件 |
|:--|:--|:--|:--|
| ★★★ | 公開ページ smoke | U-02, U-03, U-04 | 未ログイン・固定 URL・安定セレクタ |
| ★★☆ | プロフィール権限（storageState 利用） | MP-07, MP-08 | ログイン状態を `storageState` で再利用 |
| ★☆☆ | カート投入まで | U-05 | sandbox 固定イベント ID + テストユーザー |

**第 1 弾でやらないもの（後回し）**

| フロー | 手動項目 ID | 後回し理由 |
|:--|:--|:--|
| Stripe Checkout 〜 決済完了 | U-06, ORD-01 | Stripe テストモード・Webhook・タイミング問題 |
| 領収書 PDF | U-08, PDF-01 | 外部 API・バイナリ取得 |
| Slack / LINE bot | SLK-*, LIN-* | 外部サービス・CLI / Scheduler 依存 |
| Firestore ルール直接検証 | SEC-* | ブラウザ E2E ではなくエミュレータテスト向き |
| バックフィル Callable | BF-* | 管理操作・本番データ影響 |

---

### Phase D: 本格 E2E（将来）

CI 常時実行・リリースゲートに載せる段階。

| フロー | 前提整備 |
|:--|:--|
| ログイン → イベント参加 → 決済 | Firebase Auth エミュレータ or `storageState`、Stripe テストモード、テストデータ seed |
| partner イベント管理 | 店舗テストアカウント、固定コミュニティ |
| 注文確定副作用（友人更新） | 複数ユーザー・イベント状態の seed |

---

## 5. 認証まわりの方針（重要）

Shokujii のログイン（`user/src/pages/login.vue`）は次を使う。

- Google / X / Facebook（OAuth ポップアップ）
- メール（パスコード）

**Playwright MCP / E2E 共通の現実的な選択肢**

| 方式 | 概要 | Phase |
|:--|:--|:--|
| **人手ログイン + MCP 引き継ぎ** | 人間がログイン後、AI が操作続行 | B（今すぐ） |
| **storageState** | 一度手動ログインし、Cookie / LocalStorage を保存して再利用 | C |
| **Firebase Auth Emulator + カスタムトークン** | テスト専用ログイン。CI 向きだが環境構築コスト大 | D |
| **OAuth 完全自動化** | Google ログイン画面の自動操作 | **非推奨**（不安定・規約リスク） |

**結論**: 最初は **未ログインフロー + 人手ログイン後の MCP 確認**。E2E コード化時は **storageState** から始める。

---

## 6. Playwright MCP 導入手順

**プロジェクト共有設定（追加済み）**

| クライアント | ファイル |
|:--|:--|
| Cursor | [`.cursor/mcp.json`](../../.cursor/mcp.json) |
| Claude Code | [`.mcp.json`](../../.mcp.json) |

Phase A の試行手順: [`playwright-mcp/手順/PhaseA_試行手順.md`](./playwright-mcp/手順/PhaseA_試行手順.md)  
Phase B の試行手順: [`playwright-mcp/手順/PhaseB_試行手順.md`](./playwright-mcp/手順/PhaseB_試行手順.md)（development: `https://test.tabete.co`）  
環境 URL / fixture テンプレート: [`playwright-mcp/環境/環境設定.template.md`](./playwright-mcp/環境/環境設定.template.md)

### 6.1 前提

- Node.js 18 以上（プロジェクトは Node 20）
- Chrome 等のブラウザ（Playwright が利用）
- 確認対象 URL（ローカル `npm -w user run dev` または sandbox デプロイ先）

### 6.2 ブラウザのインストール

リポジトリルートで一度実行する。

```bash
npx playwright install
```

Linux / Docker では追加で:

```bash
npx playwright install-deps
```

### 6.3 Cursor への追加

リポジトリに [`.cursor/mcp.json`](../../.cursor/mcp.json) を追加済み。Cursor 再起動後、Settings → Tools & MCP で Connected を確認する。

手動で追加する場合:

| 項目 | 値 |
|:--|:--|
| Name | `playwright` |
| Type | `command` |
| Command | `npx` |
| Args | `-y`, `@playwright/mcp@latest` |

またはプロジェクトルートに `.cursor/mcp.json`（チーム共有する場合）:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

**設定ファイルの差異**: [`.cursor/mcp.json`](../../.cursor/mcp.json) は Cursor 仕様のため `type` を省略できる。[`.mcp.json`](../../.mcp.json) は Claude Code 仕様のため `"type": "stdio"` が必要。意図的な差異である。

**パッケージバージョン**: Phase A/B の PoC では `@playwright/mcp@latest` を使用する。再現性が必要なときは試行結果 md に `npx @playwright/mcp@<version> --version` の出力を記録する。Phase C で `.spec.ts` 化する際に pin を検討する。

3. Cursor を再起動し、MCP サーバーが **Connected** になることを確認

### 6.4 Claude Code への追加

リポジトリに [`.mcp.json`](../../.mcp.json) を追加済み。

手動で追加する場合:

```bash
claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest
```

**チーム共有（リポジトリに `.mcp.json` をコミット）**

```bash
claude mcp add --scope project playwright -- npx -y @playwright/mcp@latest
```

生成例（`.mcp.json`）:

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

**設定ファイルの差異**: 上記 `.mcp.json` には `"type": "stdio"` が必要（Claude Code 仕様）。[`.cursor/mcp.json`](../../.cursor/mcp.json) では Cursor 仕様のため `type` を省略する。意図的な差異である。

接続確認:

```bash
claude mcp list
```

### 6.5 動作確認（Hello World）

エージェントに次のように依頼する。

```
Playwright MCP で https://example.com を開き、
ページタイトルと主要な見出しを教えて。
```

Shokujii 向け:

```
Playwright MCP で sandbox の user アプリ URL を開き、
未ログイン状態でトップページが表示されるか確認して。
コンソールエラーがあれば報告して。
```

### 6.6 Shokujii 向けの確認手順

1. **対象 URL を決める**
   - ローカル: `npm -w user run dev -- -m development` → `http://localhost:5173` 等
   - sandbox: `/github-sandbox-wip-deploy` スキルで WIP デプロイ後の URL
2. **テスト用アカウントを用意**（Phase B 以降）
   - sandbox / development 専用。本番アカウントは使わない
3. **手動テスト項目書の ID を指定して依頼**
   - 例: 「U-02, U-03 に相当する確認をして。結果を表形式で」
4. **結果を記録**
   - リリース単位のテスト項目書（`v2.10/` 等）に PASS / FAIL を追記

### 6.7 トラブルシューティング

| 症状 | 対処 |
|:--|:--|
| MCP が Connected にならない | ターミナルで `npx -y @playwright/mcp@latest` を直接実行しエラーを確認 |
| ブラウザが起動しない | `npx playwright install` を再実行 |
| macOS で headless 問題 | MCP 設定に `--headless` を付けない（まずは headed で確認） |
| Windows で stdio 接続失敗 | `npx` の代わりに `node node_modules/@playwright/mcp/cli.js` を直接指定（[Issue #1540](https://github.com/microsoft/playwright-mcp/issues/1540)） |
| ログインできない | Phase A（未ログイン）から始める。OAuth 自動化は狙わない |

### 6.8 セキュリティ上の注意

- **本番（production）URL への自動操作は原則禁止**。sandbox / development のみ
- テスト用アカウントの credential を MCP 設定やリポジトリに書かない
- Stripe 本番決済・バックフィル本実行など、データを変更する操作は MCP 自動化の対象外

---

## 7. Playwright テストコード（Phase C 以降）の置き場所案

未決定。導入時に以下から選ぶ。

| 案 | メリット | デメリット |
|:--|:--|:--|
| リポジトリルート `e2e/` | user / partner 横断テストが書きやすい | 新規 package 管理が必要 |
| `user/e2e/` + `partner/e2e/` | アプリ単位で分離 | 共通 setup の重複 |
| 専用 workspace `e2e/` package | CI 設定が明確 | 初期コスト最大 |

**第 1 弾の推奨**: ルート `e2e/` に smoke 1 本だけ。CI 組み込みは Phase D。

---

## 8. ロードマップ（テスト方針との対応）

| 時期 | 内容 | テスト方針 Step |
|:--|:--|:--|
| **今すぐ** | Playwright MCP 導入、Phase A フローで試す | Step 3 |
| **1〜2 リリース** | Phase B を手動項目書と並行、Vitest 拡充継続 | Step 1–2 |
| **余裕ができたら** | Phase C: smoke 1〜3 本の `.spec.ts` | Step 5 着手 |
| **環境整備後** | Firebase Emulator + CI E2E | Step 4 + Step 5 |

---

## 9. 次のアクション

- [ ] Node / Playwright ブラウザのインストール確認
- [ ] Cursor または Claude Code に Playwright MCP を追加 — **設定ファイルはリポジトリに追加済み**（各クライアントで Connected 確認）
- [ ] sandbox URL で Phase A（U-02, U-03, U-04）を 1 回試す — [`PhaseA_試行手順.md`](./playwright-mcp/手順/PhaseA_試行手順.md)
- [ ] 結果を `v2.10_テスト項目書.md` または次リリース項目書に反映するか判断
- [ ] Phase C に進む前に、認証方式（storageState vs Emulator）を決定

---

## 10. 参考リンク

- [Playwright MCP 公式](https://playwright.dev/docs/getting-started-mcp)
- [Claude Code MCP クイックスタート](https://code.claude.com/docs/en/mcp-quickstart)
- [Shokujii テスト方針](./テスト方針.md)
- [v2.10 手動テスト項目書](./v2.10/v2.10_テスト項目書.md)
