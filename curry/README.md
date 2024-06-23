## Project Setup

```sh
yarn install
```

### Compile and Hot-Reload for Development

```sh
yarn dev-development
```

### Type-Check, Compile and Minify for Production

```sh
yarn build-production
```

## Debug with the Emulator

Emulator を適切にスタートさせておく

https://firebase.google.com/docs/emulator-suite

```
firebase emulators:start --import=../snapshot
```

`VITE_FIRESTORE_EMULATOR_HOST`, `VITE_FIREBASE_STORAGE_EMULATOR_HOST`, `VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST` を設定した後、 アプリケーションを起動すると Emulator に接続する。
（今の所、Authentication に関してはリアル環境に接続しにいくので注意）

```
export VITE_FIRESTORE_EMULATOR_HOST='localhost:8080'
export VITE_FIREBASE_STORAGE_EMULATOR_HOST='localhost:9199'
export VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST='localhost:5001'
yarn dev-development
```

## Vue Devtools

`VUE_DEVTOOLS` 環境変数を設定すると [Vue Devtools](https://devtools.vuejs.org/) を有効にすることができます。

```
VUE_DEVTOOLS= yarn dev-development
```

## Lint & Formatter

`eslint`, `prettier` はシンボリックリンク以下を再帰的にチェックしないので、[package.json](./package.json) 内のスクリプトでは、`find` を用いてシンボリックリンク以下のファイルを検索するようにしています。
これは、[.prettierrc](./.prettierrc) や [eslint.config.js](./eslint.config.js) の一部の設定を無効化してしまうので注意してください。
