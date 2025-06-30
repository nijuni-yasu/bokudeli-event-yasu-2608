このディレクトリの関数は TypeScript & functions v2 で作成してください。
また、GitHub secrets の使用をやめ、`defineSecret` で Google Cloud Secret Manager から取得するようにしてください。

## 命名規則

関数名は lowerCamelCase で命名してください。
functions v2 より snake_case が使えなくなったためです。kebab-case は JavaScript と相性が悪いため、 lowerCamelCase を採用することとします。
また、ファイル名も統一するために lowerCamelCase を使用するようにしてください。
