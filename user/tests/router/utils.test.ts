import { describe, expect, it } from 'vitest'

import { getEventEditPathByRawStatus, getEventPath } from '@/router/utils.js'

describe('router utils', () => {
  it('getEventPath builds community event path', () => {
    expect(getEventPath('acc', 'e1')).toBe('/c/acc/e/e1')
  })

  it('getEventEditPathByRawStatus uses step 1 for draft and step 4 otherwise', () => {
    expect(getEventEditPathByRawStatus('e1', 'in_draft')).toBe('/manage/event/e1/settings?step=1')
    expect(getEventEditPathByRawStatus('e1', 'published')).toBe('/manage/event/e1/settings?step=4')
  })
})
