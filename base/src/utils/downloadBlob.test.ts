import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob } from './downloadBlob.js'

describe('downloadBlob', () => {
  const anchorClick = vi.fn()
  const mockAnchor = {
    href: '',
    download: '',
    style: { display: '' },
    click: anchorClick,
  }
  const appendChild = vi.fn()
  const removeChild = vi.fn()
  const createObjectURL = vi.fn(() => 'blob:mock-url')
  const revokeObjectURL = vi.fn()
  const canShare = vi.fn()
  const share = vi.fn()

  beforeEach(() => {
    anchorClick.mockReset()
    appendChild.mockReset()
    removeChild.mockReset()
    createObjectURL.mockReset()
    createObjectURL.mockReturnValue('blob:mock-url')
    revokeObjectURL.mockReset()
    canShare.mockReset()
    share.mockReset()
    mockAnchor.href = ''
    mockAnchor.download = ''

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    })

    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'a') {
          return mockAnchor
        }
        return {}
      }),
      body: {
        appendChild,
        removeChild,
      },
    })

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        canShare,
        share,
      },
      writable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('Web Share が使える場合は share を呼ぶ', async () => {
    canShare.mockReturnValue(true)
    share.mockResolvedValue(undefined)
    const blob = new Blob(['x'], { type: 'image/jpeg' })

    const result = await downloadBlob(blob, 'photo.jpg')

    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledOnce()
    expect(anchorClick).not.toHaveBeenCalled()
  })

  it('iOS 以外では canShare が true でも anchor ダウンロードする', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        userAgent: 'Mozilla/5.0 (Linux; Android 14)',
        canShare,
        share,
      },
      writable: true,
    })
    canShare.mockReturnValue(true)
    const blob = new Blob(['x'], { type: 'image/jpeg' })

    const result = await downloadBlob(blob, 'photo.jpg')

    expect(result).toBe('downloaded')
    expect(share).not.toHaveBeenCalled()
    expect(anchorClick).toHaveBeenCalledOnce()
  })

  it('iPadOS デスクトップ UA でも Web Share を優先する', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        platform: 'MacIntel',
        maxTouchPoints: 5,
        canShare,
        share,
      },
      writable: true,
    })
    canShare.mockReturnValue(true)
    share.mockResolvedValue(undefined)
    const blob = new Blob(['x'], { type: 'image/jpeg' })

    const result = await downloadBlob(blob, 'photo.jpg')

    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledOnce()
    expect(anchorClick).not.toHaveBeenCalled()
  })

  it('Web Share が使えない場合は anchor ダウンロードする', async () => {
    canShare.mockReturnValue(false)
    const blob = new Blob(['x'], { type: 'image/jpeg' })

    const result = await downloadBlob(blob, 'photo.jpg')

    expect(result).toBe('downloaded')
    expect(anchorClick).toHaveBeenCalledOnce()
    expect(mockAnchor.download).toBe('photo.jpg')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('share 失敗時は anchor ダウンロードにフォールバックする', async () => {
    canShare.mockReturnValue(true)
    share.mockRejectedValue(new Error('cancelled'))
    const blob = new Blob(['x'], { type: 'image/png' })

    const result = await downloadBlob(blob, 'photo.png')

    expect(result).toBe('downloaded')
    expect(anchorClick).toHaveBeenCalledOnce()
  })

  it('空のファイル名は download にサニタイズする', async () => {
    canShare.mockReturnValue(false)
    const blob = new Blob(['x'], { type: 'image/jpeg' })

    await downloadBlob(blob, '   ')

    expect(mockAnchor.download).toBe('download')
  })
})
