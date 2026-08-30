#!/usr/bin/env bash
# sandbox2606-2608 向け GitHub Actions Variables を設定する。
# 用法: ./setup-sandbox-github-vars.sh 2606
set -euo pipefail

NUM="${1:?usage: $0 <2606|2607|2608>}"
PROJECT_ID="bokudeli-event-yasu-${NUM}"
REPO="nijuni-yasu/bokudeli-event-yasu-${NUM}"

case "$NUM" in
  2606) PROJECT_NUMBER="961716760393" ;;
  2607) PROJECT_NUMBER="995455890089" ;;
  2608) PROJECT_NUMBER="677315478183" ;;
  *) echo "unsupported: $NUM"; exit 1 ;;
esac

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
USER_ENV_FILE="${ROOT}/user/.env.sandbox${NUM}"
PARTNER_ENV_FILE="${ROOT}/partner/.env.sandbox${NUM}"

if [[ ! -f "$USER_ENV_FILE" ]]; then
  echo "missing $USER_ENV_FILE"
  exit 1
fi

if [[ ! -f "$PARTNER_ENV_FILE" ]]; then
  echo "missing $PARTNER_ENV_FILE"
  exit 1
fi

FIREBASERC="$(cat <<EOF
{
  "targets": {
    "${PROJECT_ID}": {
      "hosting": {
        "partner": ["${PROJECT_ID}-admin"],
        "manager": ["${PROJECT_ID}-manager"],
        "user": ["${PROJECT_ID}"],
        "terms": ["${PROJECT_ID}-terms"]
      }
    }
  }
}
EOF
)"

FUNCTIONS_ENV="$(cat <<EOF
EVENT_HOST=${PROJECT_ID}.firebaseapp.com
ADMIN_HOST=${PROJECT_ID}-admin.firebaseapp.com
PARTNER_HOST=${PROJECT_ID}-admin.firebaseapp.com
CORS=["https://${PROJECT_ID}.firebaseapp.com","https://${PROJECT_ID}-admin.firebaseapp.com"]
SLACK_COMMAND_NAME=shokujii_test2510
SENDGRID_SUPPRESS=true
ENTERPRISE_BASE_DOMAIN=sandbox${NUM}.tabete.co
ENTERPRISE_APP_CHECK_ENFORCE=false
EOF
)"

gh variable set PROJECT_ID --repo "$REPO" --body "$PROJECT_ID"
gh variable set PROJECT_NUMBER --repo "$REPO" --body "$PROJECT_NUMBER"
gh variable set FIREBASERC --repo "$REPO" --body "$FIREBASERC"
gh variable set USER_ENV --repo "$REPO" --body "$(cat "$USER_ENV_FILE")"
gh variable set PARTNER_ENV --repo "$REPO" --body "$(cat "$PARTNER_ENV_FILE")"
gh variable set FUNCTIONS_ENV --repo "$REPO" --body "$FUNCTIONS_ENV"

echo "Done: $REPO"
