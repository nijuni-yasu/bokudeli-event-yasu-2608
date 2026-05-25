import { describe, expect, it } from 'vitest'
import { computeServerFingerprint } from './clientErrorFingerprint.js'

const basePayload = {
  app: 'user' as const,
  error_type: 'ZodError',
  message: 'Invalid enum value',
  route: '/c/example/e/abc123',
  fingerprint: 'a'.repeat(64),
  severity: 'error' as const,
}

describe('computeServerFingerprint', () => {
  it('検証済みフィールドから 64 文字 hex を生成する', () => {
    const fingerprint = computeServerFingerprint(basePayload)
    expect(fingerprint).toHaveLength(64)
    expect(fingerprint).toMatch(/^[0-9a-f]+$/)
  })

  it('クライアント fingerprint を変えてもサーバー fingerprint は同一', () => {
    const serverFingerprint = computeServerFingerprint(basePayload)
    const tampered = computeServerFingerprint({ ...basePayload, fingerprint: 'b'.repeat(64) })
    expect(serverFingerprint).toBe(tampered)
  })

  it('zod_issues を含む場合も決定的に生成する', () => {
    const withIssues = {
      ...basePayload,
      zod_issues: [{ path: ['event_status', 'value'], code: 'invalid_enum_value', message: 'Invalid' }],
    }
    expect(computeServerFingerprint(withIssues)).toBe(computeServerFingerprint({ ...withIssues }))
  })
})
