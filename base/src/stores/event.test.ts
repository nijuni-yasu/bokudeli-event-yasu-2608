import { describe, expect, it, vi } from 'vitest'

vi.mock('@shokujii/base/stores/eventDraft.js', () => ({
  preparePfEventDraft: async () => {},
  prepareEnterpriseEventDraft: async () => {},
}))

import {
  buildEventStoreOptions,
  resolveEventStoreOptionsFromInjectedEnterpriseId,
} from '@shokujii/base/stores/eventStoreOptions.js'

describe('resolveEventStoreOptionsFromInjectedEnterpriseId', () => {
  it('非空 enterpriseId で tenant 固定 options を返す', () => {
    const options = resolveEventStoreOptionsFromInjectedEnterpriseId('ent-a')
    expect(options.eventsEnterpriseId).toBe('ent-a')
    expect(options.ordersEnterpriseId).toBe('ent-a')
    expect('draftPreparer' in options).toBe(true)
  })

  it('undefined は空オブジェクト（partner 無フィルタ / user default merge）', () => {
    const options = resolveEventStoreOptionsFromInjectedEnterpriseId(undefined)
    expect(options).toEqual({})
    expect('eventsEnterpriseId' in options).toBe(false)
  })

  it('空文字は空オブジェクト', () => {
    expect(resolveEventStoreOptionsFromInjectedEnterpriseId('')).toEqual({})
  })
})

describe('buildEventStoreOptions', () => {
  it('PF 明示は null キー付き', () => {
    const options = buildEventStoreOptions(undefined)
    expect(options.eventsEnterpriseId).toBeNull()
    expect('eventsEnterpriseId' in options).toBe(true)
  })
})
