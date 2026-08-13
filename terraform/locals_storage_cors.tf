locals {
  storage_cors_origins_base = [
    "https://${var.project}.firebaseapp.com",
    "https://${var.project}.web.app",
    "https://${var.project}-admin.firebaseapp.com",
    "https://${var.project}-admin.web.app",
    "https://${var.project}-enterprise.firebaseapp.com",
    "https://${var.project}-enterprise.web.app",
    "http://localhost:5173",
    "http://localhost:8080",
  ]

  # auth_authorized_domains_extra を CORS origin に変換（tfvars 重複を避ける）
  storage_cors_origins_from_auth = [
    for domain in var.auth_authorized_domains_extra :
    startswith(domain, "http://") || startswith(domain, "https://") ? domain :
    domain == "localhost" ? "http://localhost:5173" :
    "https://${domain}"
  ]

  storage_cors_origins = distinct(concat(
    local.storage_cors_origins_base,
    local.storage_cors_origins_from_auth,
    var.storage_cors_origins_extra,
  ))
}
