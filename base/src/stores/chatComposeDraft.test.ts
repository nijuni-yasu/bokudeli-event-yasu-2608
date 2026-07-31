import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAT_COMPOSE_DRAFT_MAX_ROOMS, isChatComposeDraftEmpty, useChatComposeDraftStore } from './chatComposeDraft.js'

const createPreviewUrl = (): string => {
  return `blob:mock-${crypto.randomUUID()}`
}

describe('isChatComposeDraftEmpty', () => {
  it('returns true when body and attachments are empty', () => {
    expect(isChatComposeDraftEmpty({ body: '  ', attachments: [] })).toBe(true)
  })

  it('returns false when body has content', () => {
    expect(isChatComposeDraftEmpty({ body: 'hello', attachments: [] })).toBe(false)
  })
})

describe('useChatComposeDraftStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('upsertDraft stores body and attachments', () => {
    const store = useChatComposeDraftStore()
    const previewUrl = createPreviewUrl()
    const file = new File(['x'], 'a.png', { type: 'image/png' })

    store.upsertDraft('room-1', {
      body: 'draft text',
      attachments: [{ id: 'img-1', file, previewUrl }],
    })

    const draft = store.getDraft('room-1')
    expect(draft?.body).toBe('draft text')
    expect(draft?.attachments).toHaveLength(1)
    expect(draft?.attachments[0]?.file).toBe(file)
    expect(draft?.attachments[0]?.previewUrl).toBe(previewUrl)
  })

  it('upsertDraft with empty content removes draft and revokes attachments', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const store = useChatComposeDraftStore()
    const previewUrl = createPreviewUrl()

    store.upsertDraft('room-1', {
      body: '',
      attachments: [{ id: 'img-1', file: new File(['x'], 'a.png', { type: 'image/png' }), previewUrl }],
    })
    store.upsertDraft('room-1', { body: '', attachments: [] })

    expect(store.getDraft('room-1')).toBeUndefined()
    expect(revokeSpy).toHaveBeenCalledWith(previewUrl)
  })

  it('removeDraft revokes attachments', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const store = useChatComposeDraftStore()
    const previewUrl = createPreviewUrl()

    store.upsertDraft('room-1', {
      body: 'x',
      attachments: [{ id: 'img-1', file: new File(['x'], 'a.png', { type: 'image/png' }), previewUrl }],
    })
    store.removeDraft('room-1')

    expect(store.getDraft('room-1')).toBeUndefined()
    expect(revokeSpy).toHaveBeenCalledWith(previewUrl)
  })

  it('clearAllDrafts revokes all attachment previews', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const store = useChatComposeDraftStore()
    const url1 = createPreviewUrl()
    const url2 = createPreviewUrl()

    store.upsertDraft('room-1', {
      body: 'a',
      attachments: [{ id: '1', file: new File(['x'], 'a.png', { type: 'image/png' }), previewUrl: url1 }],
    })
    store.upsertDraft('room-2', {
      body: 'b',
      attachments: [{ id: '2', file: new File(['y'], 'b.png', { type: 'image/png' }), previewUrl: url2 }],
    })
    store.clearAllDrafts()

    expect(store.getDraft('room-1')).toBeUndefined()
    expect(store.getDraft('room-2')).toBeUndefined()
    expect(revokeSpy).toHaveBeenCalledWith(url1)
    expect(revokeSpy).toHaveBeenCalledWith(url2)
  })

  it('upsertDraft with same previewUrl does not revoke blob URL', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const store = useChatComposeDraftStore()
    const previewUrl = createPreviewUrl()
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const attachment = { id: 'img-1', file, previewUrl }

    store.upsertDraft('room-1', { body: 'first', attachments: [attachment] })
    store.upsertDraft('room-1', { body: 'second', attachments: [attachment] })

    expect(store.getDraft('room-1')?.body).toBe('second')
    expect(store.getDraft('room-1')?.attachments[0]?.previewUrl).toBe(previewUrl)
    expect(revokeSpy).not.toHaveBeenCalledWith(previewUrl)
  })

  it('upsertDraft revokes preview URLs removed from draft', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const store = useChatComposeDraftStore()
    const oldUrl = createPreviewUrl()
    const newUrl = createPreviewUrl()

    store.upsertDraft('room-1', {
      body: 'a',
      attachments: [{ id: '1', file: new File(['x'], 'a.png', { type: 'image/png' }), previewUrl: oldUrl }],
    })
    store.upsertDraft('room-1', {
      body: 'b',
      attachments: [{ id: '2', file: new File(['y'], 'b.png', { type: 'image/png' }), previewUrl: newUrl }],
    })

    expect(revokeSpy).toHaveBeenCalledWith(oldUrl)
    expect(revokeSpy).not.toHaveBeenCalledWith(newUrl)
  })

  it('syncOwnerUserId clears drafts when owner user changes', () => {
    const store = useChatComposeDraftStore()
    store.syncOwnerUserId('user-a')
    store.upsertDraft('room-1', { body: 'draft-a', attachments: [] })
    store.syncOwnerUserId('user-b')
    expect(store.getDraft('room-1')).toBeUndefined()
  })

  it('syncOwnerUserId on remount with different user does not keep previous drafts', () => {
    const store = useChatComposeDraftStore()
    store.syncOwnerUserId('user-a')
    store.upsertDraft('room-1', { body: 'secret', attachments: [] })

    setActivePinia(createPinia())
    const remounted = useChatComposeDraftStore()
    remounted.syncOwnerUserId('user-b')

    expect(remounted.getDraft('room-1')).toBeUndefined()
  })

  it('evicts oldest draft when exceeding max rooms', () => {
    const store = useChatComposeDraftStore()
    const now = Date.now()
    vi.spyOn(Date, 'now').mockImplementation(() => now)

    for (let i = 0; i < CHAT_COMPOSE_DRAFT_MAX_ROOMS; i++) {
      store.upsertDraft(`room-${i}`, { body: `body-${i}`, attachments: [] })
    }

    vi.spyOn(Date, 'now').mockImplementation(() => now + 1000)
    store.upsertDraft('room-new', { body: 'new', attachments: [] })

    expect(store.getDraft('room-0')).toBeUndefined()
    expect(store.getDraft('room-new')?.body).toBe('new')
    expect(store.getDraft(`room-${CHAT_COMPOSE_DRAFT_MAX_ROOMS - 1}`)?.body).toBe(
      `body-${CHAT_COMPOSE_DRAFT_MAX_ROOMS - 1}`,
    )
  })
})
