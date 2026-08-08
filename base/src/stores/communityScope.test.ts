import { describe, expect, it } from 'vitest'
import {
  buildCommunityLookupConstraints,
  resolveCommunityEnterpriseIdForQuery,
  resolveCommunityStoreKey,
} from '@shokujii/base/stores/communityScope.js'

describe('resolveCommunityStoreKey', () => {
  it('enterpriseId 文字列はそのままキー', () => {
    expect(resolveCommunityStoreKey('ent-a')).toBe('ent-a')
  })

  it('省略・空は pf', () => {
    expect(resolveCommunityStoreKey(undefined)).toBe('pf')
    expect(resolveCommunityStoreKey(null)).toBe('pf')
    expect(resolveCommunityStoreKey('')).toBe('pf')
  })
})

describe('resolveCommunityEnterpriseIdForQuery', () => {
  it('scope 省略は PF（null）', () => {
    expect(resolveCommunityEnterpriseIdForQuery(undefined)).toBeNull()
    expect(resolveCommunityEnterpriseIdForQuery({})).toBeNull()
  })

  it('enterprise scope は文字列 id', () => {
    expect(resolveCommunityEnterpriseIdForQuery({ enterpriseId: 'ent-1' })).toBe('ent-1')
  })

  it('空文字 enterpriseId は PF（null）', () => {
    expect(resolveCommunityEnterpriseIdForQuery({ enterpriseId: '' })).toBeNull()
  })
})

describe('buildCommunityLookupConstraints', () => {
  it('scope 省略は 2 constraints（PF null + account）', () => {
    const constraints = buildCommunityLookupConstraints('acme')
    expect(constraints).toHaveLength(2)
    expect(resolveCommunityEnterpriseIdForQuery(undefined)).toBeNull()
  })

  it('enterprise scope も 2 constraints', () => {
    expect(buildCommunityLookupConstraints('acme', { enterpriseId: 'ent-1' })).toHaveLength(2)
    expect(resolveCommunityEnterpriseIdForQuery({ enterpriseId: 'ent-1' })).toBe('ent-1')
  })
})
