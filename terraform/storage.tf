resource "google_storage_bucket" "invoice" {
  name                        = format("%s-invoice", var.project)
  location                    = var.region
  uniform_bucket_level_access = true
}

# Firebase デフォルト Storage バケット（App Engine default bucket）の CORS。
# google_firebase_storage_bucket.default は Firebase 連携のみ。CORS は本リソースで管理する。
resource "google_storage_bucket" "default" {
  name     = google_app_engine_application.default.default_bucket
  location = var.region

  cors {
    origin          = local.storage_cors_origins
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 86400
  }

  lifecycle {
    prevent_destroy = true
    # import 後 plan で location 等に不要差分が出た場合、bokudeli-event-test で検証のうえ ignore_changes を追加する
  }

  depends_on = [google_app_engine_application.default]
}

resource "google_storage_bucket" "firestore_backups" {
  name                        = format("%s-firestore-backups", var.project)
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true

  lifecycle {
    prevent_destroy = true
  }

  lifecycle_rule {
    condition {
      age            = 15
      matches_prefix = ["daily/"]
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      age            = 30
      matches_prefix = ["monthly/"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  depends_on = [
    google_project_service.default,
    google_firestore_database.default,
  ]
}

resource "google_storage_bucket" "storage_backups" {
  name                        = format("%s-storage-backups", var.project)
  location                    = var.region
  uniform_bucket_level_access = true

  lifecycle {
    prevent_destroy = true
  }

  lifecycle_rule {
    condition {
      age            = 8
      matches_prefix = ["daily/"]
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      age            = 30
      matches_prefix = ["monthly/"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  depends_on = [google_project_service.default]
}

# Firestore サービスエージェントがエクスポート先バケットに書き込めるようにする
resource "google_storage_bucket_iam_member" "firestore_backups_firestore_sa" {
  bucket = google_storage_bucket.firestore_backups.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-firestore.iam.gserviceaccount.com"
}

resource "google_storage_bucket_iam_member" "storage_backups_compute_object_admin" {
  bucket = google_storage_bucket.storage_backups.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_storage_bucket_iam_member" "firestore_backups_compute_object_admin" {
  bucket = google_storage_bucket.firestore_backups.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}
