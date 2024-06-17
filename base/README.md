# shokujii base

shokujii サイト共通で使用するコンポーネント等をまとめたディレクトリです。
当初は npm パッケージにするなどして再利用性を高める予定でしたが、[Materio](https://store.vuetifyjs.com/products/materio-vuetify-vuejs-admin-template) が依存関係の動的解決に向いていない構造なので、 ひとまずシンボリックリンクを用いて各アプリに共通項目を提供するものとします。

> TODO 将来的には何らかの方法でモジュール化する

- [src/@core](./src/@core/), [src/@layouts](./src/@layouts/)  
  Materio のディレクトリです。
  以下の [Materio の扱い](#Materio-の扱い) を参照してください。
- [src/*](./src)  
  その他のディレクトリは共通項目が保存されています。
  複数のプロジェクトから参照されているので、修正は慎重に。汎用性を壊さないよう気をつけてください。

## Materio の扱い
基本的には編集しないでください。
ただし、Materio 自体が「タイプチェックが通らない」、「最新のライブラリ(Vuetify 等)に対応していない」など、環境依存のバグを抱えていることがあります。
その際は、変更が最小限になるよう留意しながら修正してください。

不要な依存関係を排除するため、Theme と Layout に関係するモジュールのみ移植しました。今後、必要になった時に持ってくる方針です。
なお、 `@layouts` の中で [casl](https://casl.js.org/v6/en/) への依存関係が直接書き込まれており、これを削除するために [src/@layouts/plugins/casl.ts](./src/@layouts/plugins/casl.ts) を修正しています。このファイルを含む casl に依存する箇所を最新の Materio に更新する際は十分気をつけてください。