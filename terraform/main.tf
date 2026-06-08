variable "project" {}
variable "region" {
  type    = string
  default = "asia-northeast1"
}
variable "github_repo" {
  type = string
}

# Firebase Auth の Authorized domains（本番カスタムドメイン等）。全プロジェクト共通の 3 件に加えてマージする。
variable "auth_authorized_domains_extra" {
  type    = list(string)
  default = []
}

terraform {
  required_providers {
    google = {
      version = "~> 6.0.0"
    }
    google-beta = {}
  }
}

provider "google" {
  project               = var.project
  region                = var.region
  user_project_override = true
}

provider "google-beta" {
  project               = var.project
  region                = var.region
  user_project_override = true
}

data "google_project" "project" {
  project_id = var.project
}

output "project_number" {
  value = data.google_project.project.number
}

# Store terraform.tfstate in GCS Storage
resource "google_storage_bucket" "terraform_state" {
  name     = format("%s-terraform", var.project)
  location = var.region

  versioning {
    enabled = true
  }

  uniform_bucket_level_access = true
}

terraform {
  backend "gcs" {
    prefix = "state"
  }
}
