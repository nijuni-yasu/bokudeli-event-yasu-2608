import { describe, expect, it } from 'vitest'
import { isClientErrorNoise } from './clientErrorNoise.js'

describe('isClientErrorNoise', () => {
  it('ZodError は常に false（ノイズ扱いしない）', () => {
    expect(isClientErrorNoise('anything', 'ZodError')).toBe(false)
  })

  it('chunk 読み込み失敗は true', () => {
    expect(isClientErrorNoise('Failed to fetch dynamically imported module: https://shokujii.jp/assets/blank.js')).toBe(
      true,
    )
  })

  it('Failed to register a ServiceWorker は true', () => {
    expect(
      isClientErrorNoise(
        // eslint-disable-next-line quotes -- Prettier が文字列内の ' により二重引用符を選択
        "Failed to register a ServiceWorker for scope ('https://shokujii.jp/') with script ('https://shokujii.jp/sw.js')",
      ),
    ).toBe(true)
  })

  it('Rejected（大文字・単体）は true', () => {
    expect(isClientErrorNoise('Rejected')).toBe(true)
  })

  it('rejected（小文字・単体）は true', () => {
    expect(isClientErrorNoise('rejected')).toBe(true)
  })

  it('Connection failed. は true', () => {
    expect(isClientErrorNoise('Connection failed.')).toBe(true)
  })

  it('rejected を含むが単体以外は false（要対応）', () => {
    expect(isClientErrorNoise('Permission rejected by policy')).toBe(false)
  })

  it('storage/unauthorized は false（要対応）', () => {
    expect(isClientErrorNoise('Firebase Storage: User does not have permission. (storage/unauthorized)')).toBe(false)
  })

  it('空メッセージは false（未知エラーは ERROR 維持）', () => {
    expect(isClientErrorNoise('')).toBe(false)
  })

  it('shareSns 等の未知 TypeError は false', () => {
    // eslint-disable-next-line quotes -- Prettier が文字列内の ' により二重引用符を選択
    expect(isClientErrorNoise("null is not an object (evaluating 'h.location')")).toBe(false)
  })

  it('単体 Failed to fetch は false（#2174 調査完了まで ERROR 維持）', () => {
    expect(isClientErrorNoise('Failed to fetch')).toBe(false)
  })

  it('Failed to fetch dynamically imported module は true', () => {
    expect(isClientErrorNoise('Failed to fetch dynamically imported module: https://shokujii.jp/assets/x.js')).toBe(
      true,
    )
  })
})
