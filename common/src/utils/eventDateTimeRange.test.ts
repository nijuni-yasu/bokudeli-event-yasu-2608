import { describe, expect, it } from 'vitest'
import { getEventDateTimeRangeDurationMs } from './datetime.js'

describe('getEventDateTimeRangeDurationMs', () => {
  it('開始・終了が有効なとき正の差分を返す', () => {
    expect(getEventDateTimeRangeDurationMs(1_000, 3_600_001)).toBe(3_599_001)
  })

  it('未設定・非有限は null', () => {
    expect(getEventDateTimeRangeDurationMs(null, 100)).toBeNull()
    expect(getEventDateTimeRangeDurationMs(100, undefined)).toBeNull()
    expect(getEventDateTimeRangeDurationMs(100, Number.NaN)).toBeNull()
  })

  it('終了が開始以下なら null', () => {
    expect(getEventDateTimeRangeDurationMs(100, 100)).toBeNull()
    expect(getEventDateTimeRangeDurationMs(200, 100)).toBeNull()
  })
})
