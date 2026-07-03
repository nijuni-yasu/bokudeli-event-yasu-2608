import { describe, expect, it } from 'vitest'
import { computeChatAttachmentDisplaySize } from './chatAttachmentDisplaySize.js'

describe('computeChatAttachmentDisplaySize', () => {
  it('returns original size when within max', () => {
    expect(computeChatAttachmentDisplaySize(200, 150)).toEqual({ width: 200, height: 150 })
  })

  it('scales down wide images preserving aspect ratio', () => {
    expect(computeChatAttachmentDisplaySize(1024, 541)).toEqual({ width: 240, height: 127 })
  })

  it('scales down to fit max box for square images', () => {
    expect(computeChatAttachmentDisplaySize(800, 800)).toEqual({ width: 240, height: 240 })
  })
})
