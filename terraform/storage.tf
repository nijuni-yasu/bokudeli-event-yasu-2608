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
