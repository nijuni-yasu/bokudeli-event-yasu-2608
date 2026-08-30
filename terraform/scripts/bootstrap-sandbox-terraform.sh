#!/usr/bin/env bash
# sandbox 1 本の Terraform 初期化〜 apply まで（PF 版）。
# 前提: gcloud / gh / terraform ログイン済み、Firebase Blaze 化済み。
#
# 用法:
#   ./bootstrap-sandbox-terraform.sh 2606
#   ./bootstrap-sandbox-terraform.sh 2607
#   ./bootstrap-sandbox-terraform.sh 2608
set -euo pipefail

NUM="${1:?usage: $0 <2606|2607|2608>}"

case "$NUM" in
  2606|2607|2608) ;;
  *) echo "unsupported: $NUM (allowed: 2606, 2607, 2608)"; exit 1 ;;
esac

PROJECT_ID="bokudeli-event-yasu-${NUM}"
GITHUB_REPO="nijuni-yasu/bokudeli-event-yasu-${NUM}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TERRAFORM_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${TERRAFORM_DIR}"

if [[ -d .terraform ]]; then
  echo "Removing existing .terraform (switching project)"
  rm -rf .terraform
fi

chmod +x init.sh
cat <<EOF > terraform.tfvars
project = "${PROJECT_ID}"
github_repo = "${GITHUB_REPO}"
github_env = ""
EOF
printf '%s\n%s\n\n' "${PROJECT_ID}" "${GITHUB_REPO}" | ./init.sh

terraform plan -out="tfplan-${NUM}"
terraform apply "tfplan-${NUM}"

echo ""
echo "=== Next steps for ${PROJECT_ID} ==="
echo "1. Create JSON key for firebase-deploy@${PROJECT_ID}.iam.gserviceaccount.com"
echo "2. Register as GitHub Secret GCLOUD_SERVICE_KEY on ${GITHUB_REPO}"
echo "3. Copy Secret Manager values from bokudeli-event-yasu-2605 (or test)"
echo "4. Run deploy workflows (firestore → storage → user → partner; functions は Phase 3 の 0004 後)"
echo ""
echo "If google_storage_bucket.default returns 409, see terraform/README.md import section."
