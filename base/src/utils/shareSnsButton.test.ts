import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type BokudeliCommunity } from '@shokujii/base/stores/community.js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { type BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import { shareSnsButton } from './shareSnsButton.js'

const event = {
  community_account: 'test_community',
  event_id: 'event_1',
  event_name: 'Test Event',
} as BokudeliEvent

const community = {} as BokudeliCommunity
const shop = {} as BokudeliPartnerShop

describe('shareSnsButton', () => {
  const windowOpen = vi.fn()
  let location: { href: string }
  let openerStub: Window

  beforeEach(() => {
    windowOpen.mockReset()
    location = { href: '' }
    openerStub = {} as Window
    vi.stubGlobal('window', {
      open: windowOpen,
      location,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('facebook: popupWindow があるときはその location に遷移する', async () => {
    const popupWindow = { opener: openerStub, location: { href: '' } }
    await shareSnsButton('facebook', event, community, shop, popupWindow as Window)

    expect(popupWindow.opener).toBeNull()
    expect(popupWindow.location.href).toContain('facebook.com/sharer/sharer.php')
    expect(windowOpen).not.toHaveBeenCalled()
    expect(location.href).toBe('')
  })

  it('facebook: popupWindow が null のとき window.open にフォールバックする', async () => {
    const openedWindow = { opener: openerStub, location: { href: '' } }
    windowOpen.mockReturnValue(openedWindow)

    await shareSnsButton('facebook', event, community, shop, null)

    expect(windowOpen).toHaveBeenCalledWith(expect.stringContaining('facebook.com/sharer/sharer.php'), '_blank')
    expect(openedWindow.opener).toBeNull()
    expect(location.href).toBe('')
  })

  it('facebook: popupWindow も window.open も使えないとき location.href にフォールバックする', async () => {
    windowOpen.mockReturnValue(null)

    await shareSnsButton('facebook', event, community, shop, undefined)

    expect(windowOpen).toHaveBeenCalledWith(expect.stringContaining('facebook.com/sharer/sharer.php'), '_blank')
    expect(location.href).toContain('facebook.com/sharer/sharer.php')
  })

  it('line: popupWindow が null のとき window.open にフォールバックする', async () => {
    const openedWindow = { opener: openerStub, location: { href: '' } }
    windowOpen.mockReturnValue(openedWindow)

    await shareSnsButton('line', event, community, shop, null)

    expect(windowOpen).toHaveBeenCalledWith(expect.stringContaining('social-plugins.line.me/lineit/share'), '_blank')
    expect(openedWindow.opener).toBeNull()
    expect(location.href).toBe('')
  })

  it('line: window.open が null のとき location.href にフォールバックする', async () => {
    windowOpen.mockReturnValue(null)

    await shareSnsButton('line', event, community, shop, null)

    expect(windowOpen).toHaveBeenCalledWith(expect.stringContaining('social-plugins.line.me/lineit/share'), '_blank')
    expect(location.href).toContain('social-plugins.line.me/lineit/share')
  })

  it('twitter: popupWindow があるとき opener を null にして x.com に遷移する', async () => {
    const popupWindow = { opener: openerStub, location: { href: '' } }
    await shareSnsButton('twitter', event, community, shop, popupWindow as Window)

    expect(popupWindow.opener).toBeNull()
    expect(popupWindow.location.href).toContain('x.com/intent/post')
  })
})
