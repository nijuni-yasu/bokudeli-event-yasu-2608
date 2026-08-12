import { describe, expect, it } from 'vitest'
import { isValidEmail, isValidPhone } from './contactFormat.js'

describe('isValidEmail', () => {
  it.each(['user@example.com', 'user.name+tag@example.co.jp'])('有効: %s', (value) => {
    expect(isValidEmail(value)).toBe(true)
  })

  it.each(['', 'abc', 'user@', '@example.com', 'user@example'])('無効: %s', (value) => {
    expect(isValidEmail(value)).toBe(false)
  })
})

describe('isValidPhone', () => {
  it.each(['0312345678', '03-1234-5678', '09012345678', '090-1234-5678', '0120-123-456'])('有効: %s', (value) => {
    expect(isValidPhone(value)).toBe(true)
  })

  it.each(['', '12345', 'abc', '0901234'])('無効: %s', (value) => {
    expect(isValidPhone(value)).toBe(false)
  })
})
