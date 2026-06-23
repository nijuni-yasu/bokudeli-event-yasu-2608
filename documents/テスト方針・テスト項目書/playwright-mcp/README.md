# Playwright MCP 試行ドキュメント

Playwright MCP による手動項目の試行手順・結果・環境設定を管理する。

親ドキュメント: [`E2E_Playwright_導入検討.md`](../E2E_Playwright_導入検討.md)

## ディレクトリ構成

```
playwright-mcp/
├── README.md          # 本ファイル（入口）
├── 手順/              # 試行手順（Phase A / B）
├── 結果/              # 試行ログ（日付ごとに追加）
│   ├── PhaseA/
│   └── PhaseB/
└── 環境/              # fixture テンプレートとローカル設定
```

## クイックスタート

1. [`環境/環境設定.template.md`](./環境/環境設定.template.md) をコピーし、同ディレクトリに `環境設定.local.md` を作成（gitignore）
2. URL / fixture を記入
3. [`手順/PhaseA_試行手順.md`](./手順/PhaseA_試行手順.md) を実行
4. 結果を [`結果/PhaseA/`](./結果/PhaseA/) に `YYYY-MM-DD_MCP.md` として記録
5. ログインが必要な項目は [`手順/PhaseB_試行手順.md`](./手順/PhaseB_試行手順.md) へ

## 手順

| Phase | ファイル | 内容 |
|:--|:--|:--|
| A | [PhaseA_試行手順.md](./手順/PhaseA_試行手順.md) | 未ログイン・読み取り専用（U-02〜U-04, MP-03/04, P-01 前段） |
| B | [PhaseB_試行手順.md](./手順/PhaseB_試行手順.md) | ログイン後（MP-01〜08, FR-01〜05, U-05 等） |

## 試行結果

### Phase A

| 日付 | ファイル | 概要 |
|:--|:--|:--|
| 2026-06-20 | [2026-06-20.md](./結果/PhaseA/2026-06-20.md) | 初回 headless PoC（MP-03 SKIP） |
| 2026-06-20 | [2026-06-20_MCP.md](./結果/PhaseA/2026-06-20_MCP.md) | MCP 試行 7/7 PASS |
| 2026-06-21 | [2026-06-21_MCP.md](./結果/PhaseA/2026-06-21_MCP.md) | `test.tabete.co` で 7/7 PASS |

### Phase B

| 日付 | ファイル | 概要 |
|:--|:--|:--|
| 2026-06-20 | [2026-06-20_MCP.md](./結果/PhaseB/2026-06-20_MCP.md) | MCP 試行 10 PASS / 1 PARTIAL / 1 SKIP |

## 環境設定

| ファイル | 用途 |
|:--|:--|
| [環境設定.template.md](./環境/環境設定.template.md) | リポジトリ共有のテンプレート |
| `環境設定.local.md` | ローカル専用（**gitignore**）。URL / uid の実値を記録 |
