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
  /** 送信競合判定用。内容変更時のみ更新 */
  updatedAt: number
  /** LRU eviction 用。getDraft で復元参照時に更新 */
  accessedAt: number
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

export const isSameDraftContent = (left: ChatComposeDraft, right: ChatComposeDraft): boolean => {
  if (left.body !== right.body) {
    return false
  }
  if (left.attachments.length !== right.attachments.length) {
    return false
  }
  for (let i = 0; i < left.attachments.length; i++) {
    const leftAttachment = left.attachments[i]
    const rightAttachment = right.attachments[i]
    if (leftAttachment.id !== rightAttachment.id || leftAttachment.previewUrl !== rightAttachment.previewUrl) {
      return false
    }
  }
  return true
}

export const useChatComposeDraftStore = defineStore('chatComposeDraft', () => {
  const draftsByRoomId = ref(new Map<string, StoredDraft>())
  const inFlightSendRoomIds = ref(new Set<string>())
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
    let oldestAccessedAt = Number.POSITIVE_INFINITY
    for (const [roomId, draft] of draftsByRoomId.value) {
      if (roomId === exceptRoomId) {
        continue
      }
      if (draft.accessedAt < oldestAccessedAt) {
        oldestAccessedAt = draft.accessedAt
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

    const existing = draftsByRoomId.value.get(roomId)
    if (existing != null && isSameDraftContent(existing, draft)) {
      return
    }

    const now = Date.now()

    const incomingPreviewUrls = new Set(draft.attachments.map((attachment) => attachment.previewUrl))
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
      updatedAt: now,
      accessedAt: now,
    })
    draftsByRoomId.value = next
  }

  const getDraft = (roomId: string): ChatComposeDraft | undefined => {
    if (inFlightSendRoomIds.value.has(roomId)) {
      return undefined
    }
    const stored = draftsByRoomId.value.get(roomId)
    if (stored == null) {
      return undefined
    }
    const now = Date.now()
    const next = new Map(draftsByRoomId.value)
    next.set(roomId, { ...stored, accessedAt: now })
    draftsByRoomId.value = next
    return cloneDraftForRead(stored)
  }

  const beginInFlightSend = (roomId: string): void => {
    const next = new Set(inFlightSendRoomIds.value)
    next.add(roomId)
    inFlightSendRoomIds.value = next
  }

  const endInFlightSend = (roomId: string): void => {
    if (!inFlightSendRoomIds.value.has(roomId)) {
      return
    }
    const next = new Set(inFlightSendRoomIds.value)
    next.delete(roomId)
    inFlightSendRoomIds.value = next
  }

  const getDraftUpdatedAt = (roomId: string): number | undefined => {
    return draftsByRoomId.value.get(roomId)?.updatedAt
  }

  const removeDraft = (roomId: string): void => {
    removeDraftEntry(roomId)
  }

  /** 送信完了時など、store 上の下書きが送信開始時点のリビジョンのままのときだけ削除する */
  const removeDraftIfUpdatedAt = (roomId: string, updatedAt: number): void => {
    const stored = draftsByRoomId.value.get(roomId)
    if (stored == null || stored.updatedAt !== updatedAt) {
      return
    }
    removeDraftEntry(roomId)
  }

  const clearAllDrafts = (): void => {
    for (const draft of draftsByRoomId.value.values()) {
      revokeDraftAttachments(draft)
    }
    draftsByRoomId.value = new Map()
    inFlightSendRoomIds.value = new Set()
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
      clearAllDrafts()
      ownerUserId.value = userId
    }
  }

  return {
    upsertDraft,
    getDraft,
    getDraftUpdatedAt,
    removeDraft,
    removeDraftIfUpdatedAt,
    beginInFlightSend,
    endInFlightSend,
    clearAllDrafts,
    syncOwnerUserId,
  }
})

export type ChatComposeDraftStore = ReturnType<typeof useChatComposeDraftStore>
