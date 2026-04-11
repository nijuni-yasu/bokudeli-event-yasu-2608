このディレクトリには Composable ではないものが含まれることがあります。
Composable は Vue3 の stateful logic を表したものと定義されています。
[What is a "Composable"?](https://vuejs.org/guide/reusability/composables.html#what-is-a-composable)

stateless な関数（例: 郵便番号 API 呼び出し）は `src/utils` に置きます。
このディレクトリの Uncomposable なファイルに変更を加える場合、まず `src/utils` に移動してからにしてください。
