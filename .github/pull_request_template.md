## 📝 タイトル

<!-- 例: fix: #1234 イベント詳細ページで注文一覧が表示されない不具合修正 -->

---

## 1. このPRの目的 / 背景

<!--
・なぜこの変更が必要か？
・どんな課題/バグ/要望に対応しているか？
・ユーザー/オペレーションにどんな価値があるか？
-->

- 関連Issue: #
- 区分: (例) バグ修正 / 機能追加 / リファクタリング / 運用改善 など

---

## 2. やったこと (What)

<!-- 箇条書きで「実際にやったこと」を書いてください -->

-
-
-

---

## 3. 画面・挙動の変更点 (UI / UX)

<!-- UIに変更がある場合は必須。なければ「なし」と明記 -->

- 変更の有無: あり / なし
- 変更内容:

### 3-1. スクリーンショット / 動画

<!-- ありの場合、Before / After を貼る -->

**Before**

**After**

---

## 4. 動作確認内容 (How to Test)

<!-- レビュワーがそのまま真似できるレベルで記載 -->

### 4-1. 環境

- 対象プロジェクト: (例) user / admin / manager など
- 対象環境: local / sandbox / production

### 4-2. テスト手順

1. `npm install` 済みであることを確認
2. `npm -w <pkg> run dev -- -m <env_file_postfix>` でローカル起動
   例1： `npm -w user run dev -- -m development`
   例2： `npm -w admin run dev -- -m sandbox`
3. 以下の手順を実施
   - [ ] 手順1:
   - [ ] 手順2:
   - [ ] 手順3:

---

## 5. 技術的なポイント / レビューしてほしい観点

<!--
・設計判断
・迷いどころ
・特に見てほしい関数/ファイル
-->

- 技術的な観点:
  -
- レビューしてほしい点:
  -

---

## 6. Firebase / Backend 影響範囲

<!-- 該当しない場合は「なし」と明記 -->

- Firestore スキーマ変更: あり / なし
- Functions 変更: あり / なし
- 影響内容：

---

## 7. リスク・懸念点 / ロールバック

- 想定リスク:
  -
- ロールバック方法:
  - (例) このPRをrevertすれば元に戻る / データの手動修正が必要 など

---

## ✅ チェックリスト

- [ ] TypeScript の型エラーが出ていない
- [ ] Lint を実行済み（`npm run lint`）
- [ ] Format を実行済み（`npm run format:check`, `npm run format`）

<!-- for GitHub Copilot review rule -->
<!--
レビューする際には、以下のprefix(接頭辞)をつけてください
[must] → 必ず変更
[imo] → 自分の意見だとこうだけど修正必須ではない(in my opinion)
[nits] → ささいな指摘(nitpick)
[ask] → 質問
[fyi] → 参考情報
-->
<!-- for GitHub Copilot review rule-->

<!-- I want to review in Japanese. -->
