resource "google_iam_workload_identity_pool" "github_pool" {
  provider = google
  project  = var.project

  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions Pool"

  depends_on = [
    google_project_service.default
  ]
}

resource "google_iam_workload_identity_pool_provider" "github_provider" {
  provider = google
  project  = var.project

  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC Provider"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }
  attribute_condition = "attribute.repository == assertion.repository"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  depends_on = [
    google_project_service.default
  ]
}

resource "google_service_account" "firebase_deploy" {
  account_id   = "firebase-deploy"
  display_name = "Firebase Deploy for GitHub Actions"

  depends_on = [
    google_project_service.default
  ]
}
resource "google_project_iam_member" "default" {
  project = var.project
  for_each = toset([
    "roles/firebase.admin",
    "roles/iam.serviceAccountUser",
    "roles/cloudfunctions.admin",
    "roles/cloudscheduler.admin",
    "roles/artifactregistry.admin",
    "roles/secretmanager.viewer",
  ])
  role   = each.key
  member = "serviceAccount:${google_service_account.firebase_deploy.email}"

  depends_on = [
    google_project_service.default
  ]
}

resource "google_service_account_iam_binding" "firebase_wif" {
  service_account_id = google_service_account.firebase_deploy.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/projects/${data.google_project.project.number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.github_pool.workload_identity_pool_id}/attribute.repository/${var.github_repo}"
  ]

  depends_on = [
    google_project_service.default
  ]
}
