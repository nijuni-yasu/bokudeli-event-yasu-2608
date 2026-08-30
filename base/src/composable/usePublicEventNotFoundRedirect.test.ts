import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { ZodError } from 'zod'

const replace = vi.fn()
const exists = ref<boolean | null>(null)
const event = ref<{ is_deleted: boolean; community_account: string } | null>(null)
const schemaError = ref<unknown>(null)

vi.mock('vue-router', () => ({
  useRouter: () => ({
    replace,
  }),
}))

vi.mock('@shokujii/base/stores/event.js', () => ({
  useEventStore: () => ({
    exists,
    event,
    schemaError,
  }),
}))

import { usePublicEventNotFoundRedirect } from './usePublicEventNotFoundRedirect.js'

describe('usePublicEventNotFoundRedirect', () => {
  it('削除済みイベントのとき /404 へ replace する', async () => {
    replace.mockClear()
    exists.value = true
    event.value = { is_deleted: true, community_account: 'acct' }
    schemaError.value = null

    const scope = effectScope()
    scope.run(() => {
      usePublicEventNotFoundRedirect('evt1', 'acct')
    })
    await nextTick()

    expect(replace).toHaveBeenCalledWith('/404')
    scope.stop()
  })

  it('communityAccount 不一致のとき /404 へ replace する', async () => {
    replace.mockClear()
    exists.value = true
    event.value = { is_deleted: false, community_account: 'other' }
    schemaError.value = null

    const scope = effectScope()
    scope.run(() => {
      usePublicEventNotFoundRedirect('evt1', 'acct')
    })
    await nextTick()

    expect(replace).toHaveBeenCalledWith('/404')
    scope.stop()
  })

  it('ZodError のとき /520 へ replace する', async () => {
    replace.mockClear()
    exists.value = true
    event.value = null
    schemaError.value = new ZodError([
      {
        code: 'custom',
        message: 'invalid',
        path: ['event_name'],
      },
    ])

    const scope = effectScope()
    scope.run(() => {
      usePublicEventNotFoundRedirect('evt1', 'acct')
    })
    await nextTick()

    expect(replace).toHaveBeenCalledWith('/520')
    scope.stop()
  })

  it('communityAccount 不一致判定は大文字小文字を無視する', async () => {
    replace.mockClear()
    exists.value = true
    event.value = { is_deleted: false, community_account: 'ACCT' }
    schemaError.value = null

    const scope = effectScope()
    scope.run(() => {
      usePublicEventNotFoundRedirect('evt1', 'acct')
    })
    await nextTick()

    expect(replace).not.toHaveBeenCalled()
    scope.stop()
  })
})
