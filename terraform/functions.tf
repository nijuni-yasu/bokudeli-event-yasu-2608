resource "google_secret_manager_secret" "SENDGRID_API_KEY" {
  secret_id = "SENDGRID_API_KEY"
  replication {
    auto {}
  }

  depends_on = [
    google_project_service.default
  ]
}
