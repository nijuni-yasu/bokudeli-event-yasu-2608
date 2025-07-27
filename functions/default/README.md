# functions/default

firebase functions v2 関数群です。

## 開発について

このディレクトリの関数は TypeScript & functions v2 で作成してください。
また、GitHub secrets の使用をやめ、`defineSecret` で Google Cloud Secret Manager から取得するようにしてください。

### 命名規則

関数名は lowerCamelCase で命名してください。
functions v2 より snake_case が使えなくなったためです。kebab-case は JavaScript と相性が悪いため、 lowerCamelCase を採用することとします。
また、ファイル名も統一するために lowerCamelCase を使用するようにしてください。

## Project Setup

1. 依存関係のインストール  
   **トップレベルディレクトリ**で以下を実行してください。

   ```sh
   npm install
   ```

1. `.env` と `.secret` を適切に準備  
   [GitHub Actions Variables](https://github.com/nijuniinc/bokudeli-event-new/settings/variables/actions) から適切な設定を取得し `.env` として保存してください。

   また、 [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager) から適切な設定を取得し `.secret` として保存してください。(フォーマットは .env と一緒)

   アクセス権がない場合は管理者に問い合わせてください。

## Build

以下のようにビルドすると、デフォルトでは `dist/` に出力されます。

```
cd functions/default
npm run build
```

## Debug

[firebase emulator](https://firebase.google.com/docs/emulator-suite) を使ってローカルでの動作確認をすることができます。
`.ts` ファイルを書き換えた場合は、ビルドし直さないと反映されないことに注意してください。（現時点での nodejs の制約）
エミュレータを起動したまま再ビルドしても反映されます。（別のコンソールでビルドしてください）

以下のように適切にエミュレータを起動しておきます。
起動オプションについては公式のドキュメントを参考にしてください。

```sh
firebase --project bokudeli-event-test emulators:start --only functions,firestore --import=../snapshot
```

関数の種類によってデバッグ方法が異なります。

### onCall

user などのフロントエンドアプリケーションをエミュレータに接続して起動します。
詳細は [Debug with the Emulator](../../user/README.md#debug-with-the-emulator) を参照のこと。
`httpsCallable` をアプリから呼び出すことで処理が実行されます。

### onRequest

エミュレータ起動時に以下のような URL が表示されているので、[curl](https://curl.se/) 等の HTTP Client で接続します。
`http://127.0.0.1:5001/bokudeli-event-test/asia-northeast1/myFunction`

### onDocumentXXX

エミュレータ起動時に `functions` と `firestore` を同時に起動します。ダミーのデータを用意しておくと良いでしょう。
エミュレータ起動時に Emulator UI のアドレス（デフォルトでは http://127.0.0.1:4000 ）が表示されるのでブラウザでアクセスします。
firestore エミュレータでドキュメントを修正すると各関数が呼ばれます。

### onSchedule

以下のように `functions:shell` を起動して直接呼び出すことができます。
ただし、 `scheduleTime` は呼び出した時刻固定で変更することは出来ません。

```sh
firebase --project bokudeli-event-test functions:shell
firebase > mySchedule()
```

時刻をカスタマイズしたい場合は、`onCall` もしくは `onRequest` でラップするのが現時点では最良かと思われます。
なお、 `functions:shell` は `onCall`, `onRequest` も呼び出すことが可能ですが、ヘッダなどをコントロールすることは出来ないので、適宜上記の方法を使用するのが良いでしょう。

```sh
# onCall （data は必須で request.data 以下に data object が入る）
firebase > myFunction({data: {name: "Taro"}})

# onRequest （request.body 以下に引数が入る）
firebase > myFunction({name: "Taro"})
```
