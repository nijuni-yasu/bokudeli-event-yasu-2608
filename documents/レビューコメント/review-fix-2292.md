# ブランチ fix/2292 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-1 | なし | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ, 🐛 実害 | 🔧 微修正 | S | Google Maps の外部リンクに `rel="noopener noreferrer"` がなく、tabnabbing のリスクがあります。<br>`event_place` が未設定だと URL に `undefined` が混ざるため、空文字フォールバック + `encodeURIComponent` が必要です。 |

---

## 評価セッション（2026-08-23 19:33・shokujii-code-review）

- **評価日時**: 2026-08-23 19:33 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: `fix/2292`
- **PR**: 未取得
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-1 | なし | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ, 🐛 実害 | 🔧 微修正 | S | Google Maps の外部リンクに `rel="noopener noreferrer"` がなく、tabnabbing のリスクがあります。<br>`event_place` が未設定だと URL に `undefined` が混ざるため、空文字フォールバック + `encodeURIComponent` が必要です。 |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `partner/src/pages/order/[eventId].vue:168`

**該当コード（レビュー時点の diff）**:

```diff
@@ -142,6 +165,15 @@ const downloadNamesPrint = async () => {
          <div class="mt-5">
            <p>{{ $t('order_detail.event_name', [eventStore.event.event_name]) }}</p>
            <p v-linkify>{{ $t('order_detail.event_url', [eventUrl]) }}</p>
+            <p>
+              {{ $t('order_detail.event_address', [eventStore.event.fullAddress]) }}
+              <a
+                :href="`https://www.google.co.jp/maps/search/${eventStore.event.fullAddress} ${eventStore.event.event_place}`"
+                target="_blank"
+              >
+                <v-icon :icon="mdiMapMarkerRadius" />
+              </a>
+            </p>
            <p>
              {{
                $t(
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧 微修正/S]: `target="_blank"` の外部リンクに `rel="noopener noreferrer"` が無いため、tabnabbing のリスクがあります。さらに `event_place` は optional なので、未設定時に Google Maps の query に `undefined` が混ざります。→ `event_place ?? ''` を使って空文字にフォールバックし、query 全体を `encodeURIComponent` でエンコードしたうえで `rel="noopener noreferrer"` を付けてください。

**コメント要約**: Google Maps の外部リンクに `rel="noopener noreferrer"` がなく、tabnabbing のリスクがあります。<br>`event_place` が未設定だと URL に `undefined` が混ざるため、空文字フォールバック + `encodeURIComponent` が必要です。

**評価**: 🚨 必須修正

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: セキュリティチェックリストの `target="_blank"` + `rel="noopener noreferrer"` ルールに抵触しています。あわせて optional な `event_place` を文字列補間しているため、未設定データで誤った外部 URL が生成される実害があります。
