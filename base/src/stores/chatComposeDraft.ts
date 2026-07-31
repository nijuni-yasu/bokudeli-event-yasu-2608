import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ChatComposeDraftAttachment = {
  id: string
  file: File
  previewUrl: string
}

export type ChatComposeDraft = {
  body: string
  attachments: ChatComposeDraftAttachment[]
}

export const CHAT_COMPOSE_DRAFT_MAX_ROOMS = 15

type StoredDraft = ChatComposeDraft & {
  updatedAt: number
}

export const isChatComposeDraftEmpty = (draft: ChatComposeDraft): boolean => {
  return draft.body.trim() === '' && draft.attachments.length === 0
}

const revokeDraftAttachments = (draft: ChatComposeDraft): void => {
  for (const attachment of draft.attachments) {
    URL.revokeObjectURL(attachment.previewUrl)
  }
}

const revokeAttachmentsNotInPreviewUrls = (draft: ChatComposeDraft, keepPreviewUrls: ReadonlySet<string>): void => {
  for (const attachment of draft.attachments) {
    if (!keepPreviewUrls.has(attachment.previewUrl)) {
      URL.revokeObjectURL(attachment.previewUrl)
    }
  }
}

const cloneDraftForRead = (draft: ChatComposeDraft): ChatComposeDraft => {
  return {
    body: draft.body,
    attachments: draft.attachments.map((attachment) => ({
      id: attachment.id,
      file: attachment.file,
      previewUrl: attachment.previewUrl,
    })),
  }
}

export const useChatComposeDraftStore = defineStore('chatComposeDraft', () => {
  const draftsByRoomId = ref(new Map<string, StoredDraft>())
  const ownerUserId = ref<string | null>(null)

  const removeDraftEntry = (roomId: string): void => {
    const existing = draftsByRoomId.value.get(roomId)
    if (existing == null) {
      return
    }
    revokeDraftAttachments(existing)
    const next = new Map(draftsByRoomId.value)
    next.delete(roomId)
    draftsByRoomId.value = next
  }

  const evictOldestDraftIfNeeded = (exceptRoomId: string): void => {
    if (draftsByRoomId.value.size < CHAT_COMPOSE_DRAFT_MAX_ROOMS) {
      return
    }
    let oldestRoomId: string | null = null
    let oldestUpdatedAt = Number.POSITIVE_INFINITY
    for (const [roomId, draft] of draftsByRoomId.value) {
      if (roomId === exceptRoomId) {
        continue
      }
      if (draft.updatedAt < oldestUpdatedAt) {
        oldestUpdatedAt = draft.updatedAt
        oldestRoomId = roomId
      }
    }
    if (oldestRoomId != null) {
      removeDraftEntry(oldestRoomId)
    }
  }

  const upsertDraft = (roomId: string, draft: ChatComposeDraft): void => {
    if (isChatComposeDraftEmpty(draft)) {
      removeDraftEntry(roomId)
      return
    }

    const incomingPreviewUrls = new Set(draft.attachments.map((attachment) => attachment.previewUrl))
    const existing = draftsByRoomId.value.get(roomId)
    if (existing != null) {
      revokeAttachmentsNotInPreviewUrls(existing, incomingPreviewUrls)
    } else {
      evictOldestDraftIfNeeded(roomId)
    }

    const next = new Map(draftsByRoomId.value)
    next.set(roomId, {
      body: draft.body,
      attachments: draft.attachments.map((attachment) => ({
        id: attachment.id,
        file: attachment.file,
        previewUrl: attachment.previewUrl,
      })),
      updatedAt: Date.now(),
    })
    draftsByRoomId.value = next
  }

  const getDraft = (roomId: string): ChatComposeDraft | undefined => {
    const stored = draftsByRoomId.value.get(roomId)
    if (stored == null) {
      return undefined
    }
    return cloneDraftForRead(stored)
  }

  const removeDraft = (roomId: string): void => {
    removeDraftEntry(roomId)
  }

  const clearAllDrafts = (): void => {
    for (const draft of draftsByRoomId.value.values()) {
      revokeDraftAttachments(draft)
    }
    draftsByRoomId.value = new Map()
    ownerUserId.value = null
  }

  /** ChatApp 未マウント中の UID 変更でも、再マウント時に他ユーザーの下書きを残さない */
  const syncOwnerUserId = (userId: string): void => {
    if (userId === '') {
      clearAllDrafts()
      return
    }
    if (ownerUserId.value == null) {
      ownerUserId.value = userId
      return
    }
    if (ownerUserId.value !== userId) {
      for (const draft of draftsByRoomId.value.values()) {
        revokeDraftAttachments(draft)
      }
      draftsByRoomId.value = new Map()
      ownerUserId.value = userId
    }
  }

  return {
    upsertDraft,
    getDraft,
    removeDraft,
    clearAllDrafts,
    syncOwnerUserId,
  }
})

export type ChatComposeDraftStore = ReturnType<typeof useChatComposeDraftStore>
