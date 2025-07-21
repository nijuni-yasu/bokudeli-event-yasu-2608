resource "google_secret_manager_secret" "SENDGRID_API_KEY" {
  secret_id = "SENDGRID_API_KEY"
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
