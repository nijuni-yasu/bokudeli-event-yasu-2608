resource "google_firebase_app_check_recaptcha_enterprise_config" "enterprise_web" {
  provider = google-beta
  project  = var.project
  app_id   = google_firebase_web_app.default.app_id
  site_key = local.enterprise_recaptcha_site_key

  depends_on = [
    google_recaptcha_enterprise_key.enterprise_app_check,
    google_firebase_web_app.default,
    google_project_service.default,
  ]
}
