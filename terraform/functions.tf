resource "google_secret_manager_secret" "SENDGRID_API_KEY" {
  secret_id = "SENDGRID_API_KEY"
  replication {
    auto {}
  }

  depends_on = [
    google_project_service.default
  ]
}

resource "google_secret_manager_secret" "PDF_SERVICES_CLIENT_ID" {
  secret_id = "PDF_SERVICES_CLIENT_ID"
  replication {
    auto {}
  }

  depends_on = [
    google_project_service.default
  ]
}

resource "google_secret_manager_secret" "PDF_SERVICES_CLIENT_SECRET" {
  secret_id = "PDF_SERVICES_CLIENT_SECRET"
  replication {
    auto {}
  }

  depends_on = [
    google_project_service.default
  ]
}

resource "google_secret_manager_secret" "STRIPE_API_KEY" {
  secret_id = "STRIPE_API_KEY"
  replication {
    auto {}
  }

  depends_on = [
    google_project_service.default
  ]
}

resource "google_secret_manager_secret" "STRIPE_WEBHOOK_ENDPOINT_SECRET" {
  secret_id = "STRIPE_WEBHOOK_ENDPOINT_SECRET"
  replication {
    auto {}
  }

  depends_on = [
    google_project_service.default
  ]
}

resource "google_secret_manager_secret" "TWITTER_CONSUMER_KEY" {
  secret_id = "TWITTER_CONSUMER_KEY"
  replication {
    auto {}
  }

  depends_on = [
    google_project_service.default
  ]
}

resource "google_secret_manager_secret" "TWITTER_CONSUMER_SECRET" {
  secret_id = "TWITTER_CONSUMER_SECRET"
  replication {
    auto {}
  }

  depends_on = [
    google_project_service.default
  ]
}

# firebase_deploy SA にプロジェクト全体の secretmanager.admin は付与せず、Terraform で定義した各シークレットにのみ admin を付与する（デプロイ時の setIamPolicy 用）
resource "google_secret_manager_secret_iam_member" "firebase_deploy_secret_admin" {
  for_each = {
    sendgrid                   = google_secret_manager_secret.SENDGRID_API_KEY.id
    pdf_services_client_id     = google_secret_manager_secret.PDF_SERVICES_CLIENT_ID.id
    pdf_services_client_secret = google_secret_manager_secret.PDF_SERVICES_CLIENT_SECRET.id
    stripe_api_key             = google_secret_manager_secret.STRIPE_API_KEY.id
    stripe_webhook             = google_secret_manager_secret.STRIPE_WEBHOOK_ENDPOINT_SECRET.id
    twitter_consumer_key       = google_secret_manager_secret.TWITTER_CONSUMER_KEY.id
    twitter_consumer_secret    = google_secret_manager_secret.TWITTER_CONSUMER_SECRET.id
  }

  secret_id = each.value
  role      = "roles/secretmanager.admin"
  member    = "serviceAccount:${google_service_account.firebase_deploy.email}"

  depends_on = [
    google_service_account.firebase_deploy,
  ]
}
