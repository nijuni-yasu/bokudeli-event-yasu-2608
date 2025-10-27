#!/bin/bash

# Prompt for project ID input
read -p "Enter the GCP project ID: " PROJECT_ID
# GitHub repository
read -p "Enter the GitHub repository (e.g., user/repo): " GITHUB_REPO
# GitHub environment
read -p "Enter the GitHub environment (leave blank if none): " GITHUB_ENV

# Input validation (empty string check)
if [ -z "$PROJECT_ID" ]; then
  echo "Error: Project ID cannot be empty."
  exit 1
fi
if [ -z "$GITHUB_REPO" ]; then
  echo "Error: GitHub repository cannot be empty."
  exit 1
fi
BACKEND_BUCKET_NAME="${PROJECT_ID}-terraform"

# If backend bucket doesn't exist, it needs to be created first using gcloud CLI
if ! gcloud storage buckets describe "gs://$BACKEND_BUCKET_NAME" --project="$PROJECT_ID" --format="value(name)"  > /dev/null 2>&1; then
  echo "Bucket $BACKEND_BUCKET_NAME does not exist. Creating..."
  gcloud storage buckets create "gs://$BACKEND_BUCKET_NAME" --project="$PROJECT_ID" --location="asia-northeast1" --uniform-bucket-level-access
  echo "Bucket created successfully."

  terraform init -backend-config="bucket=${BACKEND_BUCKET_NAME}"
  # Import the newly created bucket to avoid creation errors during terraform apply
  terraform import -var="project=${PROJECT_ID}" google_storage_bucket.terraform_state $BACKEND_BUCKET_NAME
else
  terraform init -backend-config="bucket=${BACKEND_BUCKET_NAME}"
fi

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
if [ -z "$GITHUB_ENV" ]; then
  gh variable --repo "$GITHUB_REPO" set PROJECT_ID --body "$PROJECT_ID"
  gh variable --repo "$GITHUB_REPO" set PROJECT_NUMBER --body "$PROJECT_NUMBER"
else
  gh variable --repo "$GITHUB_REPO" set PROJECT_ID --env "$GITHUB_ENV" --body "$PROJECT_ID"
  gh variable --repo "$GITHUB_REPO" set PROJECT_NUMBER --env "$GITHUB_ENV" --body "$PROJECT_NUMBER"
fi

cat << EOS > terraform.tfvars
project = "${PROJECT_ID}"
github_repo = "${GITHUB_REPO}"
github_env = "${GITHUB_ENV}"
EOS

echo "==== Done ===="
