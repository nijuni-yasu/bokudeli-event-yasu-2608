locals {
  function_secret_ids = toset([
    "SENDGRID_API_KEY",
    "PDF_SERVICES_CLIENT_ID",
    "PDF_SERVICES_CLIENT_SECRET",
    "STRIPE_API_KEY",
    "STRIPE_WEBHOOK_ENDPOINT_SECRET",
    "TWITTER_CONSUMER_KEY",
    "TWITTER_CONSUMER_SECRET",
    "SLACK_SIGNING_SECRET",
    "SLACK_CLIENT_ID",
    "SLACK_CLIENT_SECRET",
    "SLACK_STATE_SECRET",
    "LINE_CHANNEL_ACCESS_TOKEN",
  ])
}

resource "google_secret_manager_secret" "functions" {
  for_each  = local.function_secret_ids
  secret_id = each.value
  replication {
    auto {}
  }

  depends_on = [
    google_project_service.default
  ]
}

# firebase_deploy SA にプロジェクト全体の secretmanager.admin は付与せず、Terraform で定義した各シークレットにのみ admin を付与する（デプロイ時の setIamPolicy 用）
resource "google_secret_manager_secret_iam_member" "firebase_deploy_secret_admin" {
  for_each  = local.function_secret_ids
  secret_id = google_secret_manager_secret.functions[each.value].id
  role      = "roles/secretmanager.admin"
  member    = "serviceAccount:${google_service_account.firebase_deploy.email}"

  depends_on = [
    google_service_account.firebase_deploy,
  ]
}
