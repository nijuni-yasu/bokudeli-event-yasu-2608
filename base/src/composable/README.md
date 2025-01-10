このディレクトリには Composable ではないものが含まれています。
Composable は Vue3 の stateful logic を表したものと定義されています。
[What is a "Composable"?](https://vuejs.org/guide/reusability/composables.html#what-is-a-composable)

stateless な関数はユーティリティ関数として `src/utils` に移動すべきですが、工数の都合上、このディレクトリに維持されています。
このディレクトリの Uncomposable なファイルに変更を加える場合、まず `src/utils` に移動してからにしてください。
