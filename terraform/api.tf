resource "google_project_service" "default" {
    project = var.project
    for_each = toset([
      "serviceusage.googleapis.com",
      "dataplex.googleapis.com",
      "iam.googleapis.com",
      "runtimeconfig.googleapis.com",
      "cloudbilling.googleapis.com",
      "cloudbuild.googleapis.com",
      "firebaseextensions.googleapis.com",
      "run.googleapis.com",
      "eventarc.googleapis.com",
      "cloudfunctions.googleapis.com",
      "firebase.googleapis.com",
      "firestore.googleapis.com",
      "firebasestorage.googleapis.com",
      "firebasehosting.googleapis.com",
      "cloudresourcemanager.googleapis.com",
      "firebaserules.googleapis.com",
      "cloudscheduler.googleapis.com",
      "secretmanager.googleapis.com",
      "identitytoolkit.googleapis.com",
    ])
    service = each.key
    disable_dependent_services = true
}
