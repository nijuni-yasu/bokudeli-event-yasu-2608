import { describe, expect, it } from 'vitest'

import { getOrderDetailPath } from './utils.js'

describe('navigation utils', () => {
  it('getOrderDetailPath builds order detail path', () => {
    expect(getOrderDetailPath('e1')).toBe('/order/e1')
  })
})
