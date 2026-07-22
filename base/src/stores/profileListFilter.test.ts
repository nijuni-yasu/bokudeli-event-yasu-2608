import { describe, expect, it } from 'vitest'
import { profileListFilterKey, profileListFilterToConstraints } from './profileListFilter.js'

describe('profileListFilterKey', () => {
  it('returns stable keys for each filter kind', () => {
    expect(profileListFilterKey({ kind: 'none' })).toBe('none')
    expect(profileListFilterKey({ kind: 'pf-null' })).toBe('pf-null')
    expect(profileListFilterKey({ kind: 'enterprise', enterpriseId: 'ent-1' })).toBe('enterprise/ent-1')
  })
})

describe('profileListFilterToConstraints', () => {
  it('returns empty array for none', () => {
    expect(profileListFilterToConstraints({ kind: 'none' })).toEqual([])
  })

  it('returns enterprise_id null constraint for pf-null', () => {
    const constraints = profileListFilterToConstraints({ kind: 'pf-null' })
    expect(constraints).toHaveLength(1)
  })

  it('returns enterprise_id equality constraint for enterprise', () => {
    const constraints = profileListFilterToConstraints({ kind: 'enterprise', enterpriseId: 'ent-1' })
    expect(constraints).toHaveLength(1)
  })
})
