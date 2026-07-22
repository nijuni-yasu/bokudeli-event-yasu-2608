import { describe, expect, it } from 'vitest'
import { isEnterpriseCommunity, isEnterpriseEvent, isEnterpriseUser } from './enterpriseMail.js'

describe('isEnterpriseEvent', () => {
  it('enterprise_id が文字列なら true', () => {
    expect(isEnterpriseEvent({ enterprise_id: 'ent-a' })).toBe(true)
  })

  it('enterprise_id が null なら false', () => {
    expect(isEnterpriseEvent({ enterprise_id: null })).toBe(false)
  })

  it('enterprise_id が undefined なら false', () => {
    expect(isEnterpriseEvent({})).toBe(false)
    expect(isEnterpriseEvent({ enterprise_id: undefined })).toBe(false)
  })

  it('enterprise_id が空文字なら false', () => {
    expect(isEnterpriseEvent({ enterprise_id: '' })).toBe(false)
  })
})

describe('isEnterpriseCommunity', () => {
  it('enterprise_id が文字列なら true', () => {
    expect(isEnterpriseCommunity({ enterprise_id: 'ent-a' })).toBe(true)
  })

  it('null / undefined / 空文字 / 欠落なら false', () => {
    expect(isEnterpriseCommunity(null)).toBe(false)
    expect(isEnterpriseCommunity(undefined)).toBe(false)
    expect(isEnterpriseCommunity({ enterprise_id: null })).toBe(false)
    expect(isEnterpriseCommunity({ enterprise_id: '' })).toBe(false)
    expect(isEnterpriseCommunity({})).toBe(false)
  })
})

describe('isEnterpriseUser', () => {
  it('enterprise_id が文字列なら true', () => {
    expect(isEnterpriseUser({ enterprise_id: 'ent-a' })).toBe(true)
  })

  it('enterprise_id が null なら false', () => {
    expect(isEnterpriseUser({ enterprise_id: null })).toBe(false)
  })

  it('enterprise_id が undefined なら false', () => {
    expect(isEnterpriseUser({})).toBe(false)
    expect(isEnterpriseUser({ enterprise_id: undefined })).toBe(false)
  })

  it('enterprise_id が空文字なら false', () => {
    expect(isEnterpriseUser({ enterprise_id: '' })).toBe(false)
  })
})
