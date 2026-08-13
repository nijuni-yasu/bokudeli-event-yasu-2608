#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(node -p "require('./node_modules/vue-tsc/package.json').version")"
case "$VERSION" in
  2.2.*) ;;
  *)
    echo "vue-tsc gate: expected 2.2.x, got $VERSION" >&2
    exit 1
    ;;
esac

FIXTURE="$ROOT/base/.vue-tsc-gate-fixture.vue"
cleanup() {
  rm -f "$FIXTURE" "${FIXTURE}.js"
}
trap cleanup EXIT

cat >"$FIXTURE" <<'EOF'
<script setup lang="ts">
const value: number = 'not-a-number'
</script>
<template><div>{{ value }}</div></template>
EOF

set +e
OUTPUT="$(npm -w base exec -- vue-tsc --noEmit --pretty false "$FIXTURE" 2>&1)"
STATUS=$?
set -e

if [[ "$STATUS" -eq 0 ]]; then
  echo "vue-tsc gate: expected type error to fail, but exit code was 0" >&2
  exit 1
fi

# 終了コードだけでは TS6053（ファイル未検出）等でも合格してしまうため、意図した型エラーの検出を確認する
if [[ "$OUTPUT" != *"error TS2322"* ]]; then
  echo "vue-tsc gate: expected TS2322 for the fixture, got:" >&2
  echo "$OUTPUT" >&2
  exit 1
fi

echo "vue-tsc gate: type error correctly failed (exit $STATUS)"
