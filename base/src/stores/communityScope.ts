import { where, type QueryConstraint } from 'firebase/firestore'

/** PF は省略（`enterprise_id == null` 名前空間）。Enterprise では `enterpriseId` を指定する */
export type CommunityStoreScope = {
  enterpriseId?: string
}

export function resolveCommunityStoreKey(enterpriseId: string | null | undefined): string {
  return enterpriseId != null && enterpriseId !== '' ? enterpriseId : 'pf'
}

/**
 * community オブジェクトの `enterprise_id` と scope から実効 enterpriseId を決める。
 * `null` は PF 確定なので scope へフォールバックしない（未 materialize の `undefined` のみ scope を使う）。
 */
export function resolveEffectiveEnterpriseId(
  communityEnterpriseId: string | null | undefined,
  scopeEnterpriseId: string | undefined,
): string | undefined {
  if (communityEnterpriseId === undefined) {
    return scopeEnterpriseId
  }
  return communityEnterpriseId ?? undefined
}

/** PF / scope 省略は Firestore 上 `enterprise_id == null`。Enterprise は非空 string。 */
export function resolveCommunityEnterpriseIdForQuery(scope?: CommunityStoreScope): string | null {
  const enterpriseId = scope?.enterpriseId
  return enterpriseId != null && enterpriseId !== '' ? enterpriseId : null
}

/** PF / scope 省略は `enterprise_id == null`。Enterprise は `scope.enterpriseId` を指定する。 */
export function buildCommunityLookupConstraints(
  communityAccount: string,
  scope?: CommunityStoreScope,
): QueryConstraint[] {
  const enterpriseFilter = resolveCommunityEnterpriseIdForQuery(scope)
  return [where('enterprise_id', '==', enterpriseFilter), where('community_account', '==', communityAccount)]
}
