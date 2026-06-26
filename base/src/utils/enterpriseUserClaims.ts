/** ID token custom claims からエンタープライズユーザーか判定（PF 越境ガード等） */
export function isEnterpriseUserFromClaims(claims: Record<string, unknown> | undefined): boolean {
  if (claims == null) {
    return false
  }
  if (claims.user_type === 'enterprise') {
    return true
  }
  const enterpriseId = claims.enterprise_id
  return typeof enterpriseId === 'string' && enterpriseId !== ''
}
