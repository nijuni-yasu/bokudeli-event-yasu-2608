import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { DEFAULT_TIME_ZONE, convertToDatetimeWeekdayShort, convertToTimeString, timeOfDayToMillis } from './datetime.js'

describe('timeOfDayToMillis', () => {
  it('指定時刻の epoch millis を JST 固定で生成する', () => {
    const millis = timeOfDayToMillis(14, 30)
    const dt = DateTime.fromMillis(millis, { zone: DEFAULT_TIME_ZONE })
    expect(dt.hour).toBe(14)
    expect(dt.minute).toBe(30)
    expect(convertToTimeString(millis)).toBe('14:30')
  })

  it('1桁の時刻は先頭ゼロなしで表示する', () => {
    const millis = timeOfDayToMillis(6, 0)
    expect(convertToTimeString(millis)).toBe('6:00')
  })
})

describe('convertToDatetimeWeekdayShort', () => {
  it('1桁の時刻は先頭ゼロなしで表示する', () => {
    const millis = DateTime.fromObject(
      { year: 2030, month: 12, day: 30, hour: 6, minute: 0 },
      { zone: DEFAULT_TIME_ZONE },
    ).toMillis()
    expect(convertToDatetimeWeekdayShort(millis)).toBe('2030/12/30(月) 6:00')
  })
})
