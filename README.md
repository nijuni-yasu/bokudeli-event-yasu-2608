# 食事でつながるshokujii

## フォルダ構成

- user
- admin
- functions
- manager

## GitHub Actions

user, admin のデプロイ作業をGitHub Actionsを使って行っている。mainブランチにマージしたタイミングでデプロイされる。また手動でデプロイアクションを実行することもできる。


### 環境変数の設定

GitHub Actions で .env ファイルを直接扱えないため、.env ファイルを JSON 
に変換し、GitHub Actions のシークレット変数 `USER_ENV_SECRET` に格納する。

変換するスクリプトとして `.github/make_env_json.py` を用意している

#### make_env_json.py の使い方

Python スクリプトなのでまず Python 3系を用意する。mac の場合、Homebrew などのパッケージ管理システムでインストールできる（mac かつ Homebrew の場合 `python3` なので注意）。

例:
```sh
brew install python3
```

make_env_json.py を以下の様なコマンドで実行する。 `<` の右側がGitHub Actions 内で扱いたい .env ファイルになる。

例:
```sh
python3 make_env_json.py < ../user/.env
```

このコマンドを実行すると画面上にJSONが表示されるのでコピー＆ペーストする。
