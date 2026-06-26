resource "google_recaptcha_enterprise_key" "enterprise_app_check" {
  display_name = "enterprise-app-check"
  project      = var.project

  web_settings {
    integration_type = "SCORE"
    allowed_domains = distinct(
      compact([
        var.enterprise_base_domain != "" ? var.enterprise_base_domain : null,
        "${var.project}-enterprise.web.app",
      ])
    )
  }

  depends_on = [google_project_service.default]
}

locals {
  enterprise_recaptcha_site_key = element(
    split("/", google_recaptcha_enterprise_key.enterprise_app_check.name),
    length(split("/", google_recaptcha_enterprise_key.enterprise_app_check.name)) - 1,
  )
}

output "enterprise_recaptcha_site_key" {
  description = "App Check 用 reCAPTCHA Enterprise 公開サイトキー（ENTERPRISE_ENV の VITE_RECAPTCHA_SITE_KEY に設定）"
  value       = local.enterprise_recaptcha_site_key
}
