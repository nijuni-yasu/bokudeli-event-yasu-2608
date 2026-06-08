# Firestore 定期エクスポート先（functions/default/src/backupFirestore.ts の命名と一致）
resource "google_storage_bucket" "firestore_backups" {
  name                        = format("%s-firestore-backups", var.project)
  location                    = var.region
  storage_class               = "ARCHIVE"
  uniform_bucket_level_access = true

  depends_on = [
    google_project_service.default,
    google_firestore_database.default,
  ]
}

# Firestore サービスエージェントがエクスポート先バケットに書き込めるようにする
resource "google_storage_bucket_iam_member" "firestore_backups_firestore_sa" {
  bucket = google_storage_bucket.firestore_backups.name
  role   = "roles/storage.admin"
  member = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-firestore.iam.gserviceaccount.com"
}
