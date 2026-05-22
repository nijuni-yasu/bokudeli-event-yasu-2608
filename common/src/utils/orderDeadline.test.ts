import { describe, expect, it } from 'vitest'
import { isWithinOrderDeadline } from './orderDeadline.js'

describe('isWithinOrderDeadline', () => {
  it('期限前なら true', () => {
    expect(isWithinOrderDeadline(2000, 1000)).toBe(true)
  })

  it('期限ちょうどなら true', () => {
    expect(isWithinOrderDeadline(1000, 1000)).toBe(true)
  })

  it('期限後なら false', () => {
    expect(isWithinOrderDeadline(1000, 2000)).toBe(false)
  })
})
