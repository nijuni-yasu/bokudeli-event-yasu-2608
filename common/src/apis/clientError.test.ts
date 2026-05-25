import { describe, expect, it } from 'vitest'
import { ClientErrorReportRequestSchema } from './clientError.js'

const validPayload = {
  app: 'user' as const,
  error_type: 'ZodError',
  message: 'Invalid enum value',
  route: '/c/example/e/abc123',
  fingerprint: 'a'.repeat(64),
}

describe('ClientErrorReportRequestSchema', () => {
  it('必須フィールドが揃っていれば parse できる', () => {
    const result = ClientErrorReportRequestSchema.parse(validPayload)
    expect(result.severity).toBe('error')
  })

  it('severity のデフォルトは error', () => {
    const result = ClientErrorReportRequestSchema.parse(validPayload)
    expect(result.severity).toBe('error')
  })

  it('必須フィールド欠落で parse 失敗', () => {
    expect(() =>
      ClientErrorReportRequestSchema.parse({
        app: validPayload.app,
        error_type: validPayload.error_type,
        message: validPayload.message,
        route: validPayload.route,
      }),
    ).toThrow()
  })

  it('message が max 長を超えると parse 失敗', () => {
    expect(() =>
      ClientErrorReportRequestSchema.parse({
        ...validPayload,
        message: 'x'.repeat(501),
      }),
    ).toThrow()
  })

  it('user_id が max 長を超えると parse 失敗', () => {
    expect(() =>
      ClientErrorReportRequestSchema.parse({
        ...validPayload,
        user_id: 'x'.repeat(129),
      }),
    ).toThrow()
  })

  it('zod_issues を含めて parse できる', () => {
    const result = ClientErrorReportRequestSchema.parse({
      ...validPayload,
      severity: 'warn',
      zod_issues: [{ path: ['event_status', 'value'], code: 'invalid_enum_value', message: 'Invalid' }],
    })
    expect(result.severity).toBe('warn')
    expect(result.zod_issues).toHaveLength(1)
  })

  it('optional フィールドが null でも parse できる（Callable が null を送る場合）', () => {
    const result = ClientErrorReportRequestSchema.parse({
      ...validPayload,
      severity: 'warn',
      component_info: null,
      document_path: 'communities/x/events/y',
      zod_issues: [{ path: ['event_status', 'value'], code: 'invalid_type', message: 'Invalid' }],
    })
    expect(result.severity).toBe('warn')
    expect(result.component_info).toBeNull()
    expect(result.document_path).toBe('communities/x/events/y')
  })
})
