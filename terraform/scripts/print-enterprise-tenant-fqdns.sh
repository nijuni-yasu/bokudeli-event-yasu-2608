#!/usr/bin/env bash
# createEnterprise 後に auth_authorized_domains_extra へ追記する FQDN を出力する。
# ロジックは functions/default/src/utils/enterpriseBaseDomain.ts の getAllowedEnterpriseHosts と同等。
#
# 用法:
#   ./scripts/print-enterprise-tenant-fqdns.sh --subdomain company-a --base-domain sandbox2510.tabete.co
#   ./scripts/print-enterprise-tenant-fqdns.sh --subdomain company-a --custom-domain lunch.example.com
#
# Issue: https://github.com/nijuniinc/bokudeli-event-new/issues/2241

set -euo pipefail

subdomain=""
base_domain=""
custom_domain=""

usage() {
  cat <<'EOF'
usage:
  print-enterprise-tenant-fqdns.sh --subdomain <label> --base-domain <BASE>
  print-enterprise-tenant-fqdns.sh --custom-domain <fqdn> [--subdomain <label> --base-domain <BASE>]

--subdomain   createEnterprise の subdomain（例: company-a）
--base-domain ENTERPRISE_BASE_DOMAIN（例: sandbox2510.tabete.co）
--custom-domain  任意。custom_domain 指定時の FQDN（例: xxx-enterprise.web.app）
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --subdomain)
      subdomain="${2:-}"
      shift 2
      ;;
    --base-domain)
      base_domain="${2:-}"
      shift 2
      ;;
    --custom-domain)
      custom_domain="${2:-}"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

subdomain=$(printf '%s' "$subdomain" | tr '[:upper:]' '[:lower:]' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
base_domain=$(printf '%s' "$base_domain" | tr '[:upper:]' '[:lower:]' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
custom_domain=$(printf '%s' "$custom_domain" | tr '[:upper:]' '[:lower:]' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

hosts=()

if [ -n "$subdomain" ] && [ -n "$base_domain" ]; then
  hosts+=("${subdomain}.${base_domain}")
elif [ -n "$subdomain" ] && [ -z "$base_domain" ] && [ -z "$custom_domain" ]; then
  echo "error: --subdomain のみでは FQDN を組み立てられません。--base-domain または --custom-domain を指定してください。" >&2
  exit 1
fi

if [ -n "$custom_domain" ]; then
  hosts+=("$custom_domain")
fi

if [ ${#hosts[@]} -eq 0 ]; then
  echo "error: 出力する FQDN がありません。--subdomain + --base-domain または --custom-domain を指定してください。" >&2
  usage >&2
  exit 1
fi

# 重複除去
echo "# terraform.tfvars の auth_authorized_domains_extra に追記（ホスト名のみ。https:// は付けない）"
echo "# 追記後: cd terraform && terraform plan && terraform apply"
echo "# Storage CORS にも https:// 付きで自動反映されます（locals_storage_cors.tf）"
printf '%s\n' "${hosts[@]}" | sort -u | while IFS= read -r h; do
  [ -n "$h" ] || continue
  echo "\"${h}\","
done
