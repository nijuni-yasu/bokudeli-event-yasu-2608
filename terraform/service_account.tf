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
    # 一覧参照のみプロジェクト単位。各シークレットへの setIamPolicy は functions.tf の個別 IAM で付与する
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

# Cloud Functions (2nd gen) のデフォルトサービスアカウントにカスタムトークン作成権限を付与
# Cloud Functions 2nd genはCloud Run上で実行され、App Engineのデフォルトサービスアカウントを使用します
resource "google_project_iam_member" "app_engine_service_account_token_creator" {
  project = var.project
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${var.project}@appspot.gserviceaccount.com"

  depends_on = [
    google_project_service.default,
    google_app_engine_application.default
  ]
}

# Compute Engineのデフォルトサービスアカウントにも権限を付与
# Cloud Functions 2nd genは実際にはこのサービスアカウントを使用している場合があります
resource "google_project_iam_member" "compute_service_account_token_creator" {
  project = var.project
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"

  depends_on = [
    google_project_service.default
  ]
}

# Compute Engineのデフォルトサービスアカウントに「Storage オブジェクト閲覧者」権限を付与
# Cloud Functions 2nd genがGCSから画像をダウンロードするために必要
resource "google_project_iam_member" "compute_service_account_storage_viewer" {
  project = var.project
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"

  depends_on = [
    google_project_service.default
  ]
}

# App Engineのデフォルトサービスアカウントに「Storage オブジェクト閲覧者」権限を付与
# Cloud Functions 2nd genがGCSから画像をダウンロードするために必要
resource "google_project_iam_member" "app_engine_service_account_storage_viewer" {
  project = var.project
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${var.project}@appspot.gserviceaccount.com"

  depends_on = [
    google_project_service.default,
    google_app_engine_application.default
  ]
}

# Cloud Functions 2nd gen / Firebase deploy がプロジェクト IAM を自動調整しようとして失敗するのを防ぐため、
# Pub/Sub サービスエージェントにプロジェクト全体の Token Creator は付与せず、実行に使う Compute デフォルト SA に対してのみ付与する
resource "google_service_account_iam_member" "pubsub_agent_token_creator_on_compute_default" {
  service_account_id = "projects/${var.project}/serviceAccounts/${data.google_project.project.number}-compute@developer.gserviceaccount.com"
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-pubsub.iam.gserviceaccount.com"

  depends_on = [
    google_project_service.default,
  ]
}

resource "google_project_iam_member" "compute_service_account_run_invoker" {
  project = var.project
  role    = "roles/run.invoker"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"

  depends_on = [
    google_project_service.default,
  ]
}

resource "google_project_iam_member" "compute_service_account_eventarc_event_receiver" {
  project = var.project
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"

  depends_on = [
    google_project_service.default,
  ]
}

# Cloud Storage のプロジェクトサービスエージェントが Pub/Sub にメッセージを publish できるようにする
# Firebase Functions デプロイ時の IAM 検証で要求される（gcloud projects add-iam-policy-binding と同等）
resource "google_project_iam_member" "gs_project_accounts_pubsub_publisher" {
  project = var.project
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-${data.google_project.project.number}@gs-project-accounts.iam.gserviceaccount.com"

  depends_on = [
    google_project_service.default,
  ]
}
