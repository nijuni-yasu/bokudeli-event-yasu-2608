import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

const replace = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    replace,
  }),
}))

import { usePublicResourceNotFoundRedirect } from './usePublicResourceNotFoundRedirect.js'

describe('usePublicResourceNotFoundRedirect', () => {
  it('exists が false のとき /404 へ replace する', async () => {
    replace.mockClear()
    const exists = ref<boolean | null>(null)

    const scope = effectScope()
    scope.run(() => {
      usePublicResourceNotFoundRedirect(exists)
    })

    exists.value = false
    await nextTick()

    expect(replace).toHaveBeenCalledWith('/404')
    scope.stop()
  })

  it('exists が null のときは replace しない', async () => {
    replace.mockClear()
    const exists = ref<boolean | null>(null)

    const scope = effectScope()
    scope.run(() => {
      usePublicResourceNotFoundRedirect(exists)
    })

    await nextTick()

    expect(replace).not.toHaveBeenCalled()
    scope.stop()
  })
})
