resource "google_storage_bucket" "invoice" {
  name          = format("%s-invoice", var.project)
  location      = var.region
   uniform_bucket_level_access = true
}
