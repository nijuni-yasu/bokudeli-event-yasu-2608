/**
 * アクセス中テナントのホストを解決する。
 *
 * enterprise は「1 ビルド・複数テナント（サブドメイン）」方式のため、固定の基準ホストではなく
 * 実際にアクセスしているテナントのホストを使う必要がある。
 *
 * 優先順位:
 * 1. VITE_ENTERPRISE_SUBDOMAIN + VITE_ENTERPRISE_BASE_DOMAIN（主にローカル開発の上書き）
 * 2. window.location（デプロイ時の実テナントのサブドメイン / カスタムドメイン）
 *
 * @param includePort URL 生成用にポートを含めるか（Callable 突合用途は false で hostname を使う）
 */
export const resolveTenantHost = (includePort = false): string => {
  const subdomain = import.meta.env.VITE_ENTERPRISE_SUBDOMAIN
  const baseDomain = import.meta.env.VITE_ENTERPRISE_BASE_DOMAIN
  if (subdomain != null && subdomain !== '' && baseDomain != null && baseDomain !== '') {
    return `${subdomain}.${baseDomain}`
  }
  return includePort ? window.location.host : window.location.hostname
}
