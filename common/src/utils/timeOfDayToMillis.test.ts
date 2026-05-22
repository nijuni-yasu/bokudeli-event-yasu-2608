import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { DEFAULT_TIME_ZONE, convertToTimeString, timeOfDayToMillis } from './datetime.js'

describe('timeOfDayToMillis', () => {
  it('指定時刻の epoch millis を JST 固定で生成する', () => {
    const millis = timeOfDayToMillis(14, 30)
    const dt = DateTime.fromMillis(millis, { zone: DEFAULT_TIME_ZONE })
    expect(dt.hour).toBe(14)
    expect(dt.minute).toBe(30)
    expect(convertToTimeString(millis)).toBe('14:30')
  })
})
