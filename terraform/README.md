## Initialize

`terraform.tfstate` を Google Cloud Storage に保存するため、 `terraform init` に適切なオプションが必要です。
初期セットアップと `terraform.tfvars` を適切に作成するため、[init.sh](init.sh) を用意してあるので、そちらを利用してください。
なお、`init.sh` を使用するためには、[gcloud CLI](https://cloud.google.com/sdk/gcloud) と [GitHub CLI](https://cli.github.com) がインストールされていて、それぞれログイン済みであることが必要です。

なお、Google Cloud Project を変更する場合は `.terraform` を削除の上、再度 `init.sh` を実行してください。

## Apply

Initialize 後は `apply` を適用

```
# Dry run
terraform plan
# Apply
terrafrom apply
```

その後、各種変数は手動で登録する必要があります。

- [GitHub Actions](../../../../settings/secrets/actions) 用環境変数を登録
- [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager) に適切な変数を設定  
  変数そのものは Terraform で定義します。ただし値は手動で登録する必要があります。

## 補足

`terraform apply` を実行すると以下のようなエラーが出ることがあります。

```
Error: Error creating Instance: googleapi: Error 403: Your application is authenticating by using local Application Default Credentials. The firebasedatabase.googleapis.com API requires a quota project, which is not set by default. To learn how to set your quota project, see https://cloud.google.com/docs/authentication/adc-troubleshooting/user-creds
```

これは quota project が設定されていないのが問題なので、以下のどちらかの方法で quota project を設定してください

1. `GOOGLE_CLOUD_QUOTA_PROJECT` 環境変数に quota project id を設定する
1. `gcloud auth application-default set-quota-project PROJECT_ID`
