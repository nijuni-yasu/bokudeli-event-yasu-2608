# Create Firebase project
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project

  # Wait for Google Cloud project APIs to be enabled before executing this resource
  depends_on = [
    google_project_service.default,
  ]
}

# Firebase Authentication
resource "google_identity_platform_config" "auth" {
  provider = google-beta
  project  = var.project

  # Authentication method configuration
  sign_in {
    allow_duplicate_emails = false

    anonymous {
      enabled = false
    }

    email {
      enabled           = true
      password_required = true
    }

    phone_number {
      enabled = false
    }
  }

  # Authorized domains configuration（環境固有ドメインは auth_authorized_domains_extra で追加）
  authorized_domains = distinct(concat(
    [
      "localhost",
      "${var.project}.web.app",
      "${var.project}.firebaseapp.com",
      "${var.project}-enterprise.web.app",
      "${var.project}-enterprise.firebaseapp.com",
    ],
    var.auth_authorized_domains_extra,
  ))

  depends_on = [
    google_project_service.default,
    google_firebase_project.default
  ]
}

# Firestore Database
resource "google_firestore_database" "default" {
  provider = google-beta
  project  = var.project
  name     = "(default)"

  # Firestore location configuration
  location_id = var.region

  # Database type (FIRESTORE_NATIVE or DATASTORE_MODE)
  type = "FIRESTORE_NATIVE"

  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_ENABLED"

  depends_on = [
    google_firebase_project.default,
    google_app_engine_application.default
  ]
}

# Firebase Cloud Storage
# App Engine must be enabled first to use Firebase Cloud Storage
resource "google_app_engine_application" "default" {
  project     = var.project
  location_id = var.region

  depends_on = [
    google_firebase_project.default
  ]
}

# Storage bucket
resource "google_firebase_storage_bucket" "default" {
  provider  = google-beta
  project   = var.project
  bucket_id = google_app_engine_application.default.default_bucket
}

# Firebase Web Application
resource "google_firebase_web_app" "default" {
  provider = google-beta
  project  = var.project

  display_name = var.project

  depends_on = [
    google_firebase_project.default
  ]
}

# Firebase Hosting Site - User
resource "google_firebase_hosting_site" "user" {
  provider = google-beta
  project  = var.project
  site_id  = var.project

  depends_on = [
    google_firebase_project.default
  ]
}

# Firebase Hosting Site - Admin
resource "google_firebase_hosting_site" "admin" {
  provider = google-beta
  project  = var.project
  site_id  = "${var.project}-admin"

  depends_on = [
    google_firebase_project.default
  ]
}

# Firebase Hosting Site - Enterprise
resource "google_firebase_hosting_site" "enterprise" {
  provider = google-beta
  project  = var.project
  site_id  = "${var.project}-enterprise"

  depends_on = [
    google_firebase_project.default
  ]
}

# Firebase Hosting Site - Terms
resource "google_firebase_hosting_site" "terms" {
  provider = google-beta
  project  = var.project
  site_id  = "${var.project}-terms"

  depends_on = [
    google_firebase_project.default
  ]
}
