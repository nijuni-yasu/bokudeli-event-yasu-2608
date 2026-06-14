import { onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { parseEventChatRoomId } from '@shokujii/common/schemas/ChatRoom.js'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import { getEventInCommunityRef } from './event.js'

export type RoomDisplayMeta = {
  displayTitle: string
  displayTitleReady: boolean
  coverImageUrl?: string
}

const PENDING_META: RoomDisplayMeta = {
  displayTitle: '',
  displayTitleReady: false,
}

const cache = new Map<string, RoomDisplayMeta>()
const listeners = new Map<string, Unsubscribe>()
const subscriberSets = new Map<string, Set<(meta: RoomDisplayMeta) => void>>()

const eventCacheKey = (communityId: string, eventId: string): string => `${communityId}_${eventId}`

const notifySubscribers = (key: string, meta: RoomDisplayMeta): void => {
  cache.set(key, meta)
  const subscribers = subscriberSets.get(key)
  if (subscribers == null) {
    return
  }
  for (const callback of subscribers) {
    callback(meta)
  }
}

const ensureEventListener = (communityId: string, eventId: string): void => {
  const key = eventCacheKey(communityId, eventId)
  if (listeners.has(key)) {
    return
  }

  const ref = getEventInCommunityRef(communityId, eventId)
  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        notifySubscribers(key, {
          displayTitle: '',
          displayTitleReady: true,
        })
        return
      }
      const event = snapshot.data()
      const coverPath = getEventCoverStoragePath(communityId, eventId)
      notifySubscribers(key, {
        displayTitle: event.event_name,
        displayTitleReady: true,
        coverImageUrl: convertStoragePathToURL(coverPath),
      })
    },
    () => {
      notifySubscribers(key, {
        displayTitle: '',
        displayTitleReady: true,
      })
    },
  )
  listeners.set(key, unsubscribe)
}

export const subscribeEventRoomDisplay = (
  communityId: string,
  eventId: string,
  onUpdate: (meta: RoomDisplayMeta) => void,
): Unsubscribe => {
  const key = eventCacheKey(communityId, eventId)
  let subscribers = subscriberSets.get(key)
  if (subscribers == null) {
    subscribers = new Set()
    subscriberSets.set(key, subscribers)
  }
  subscribers.add(onUpdate)

  const cached = cache.get(key)
  if (cached != null) {
    onUpdate(cached)
  } else {
    onUpdate(PENDING_META)
  }

  ensureEventListener(communityId, eventId)

  return () => {
    const current = subscriberSets.get(key)
    current?.delete(onUpdate)
    if (current != null && current.size === 0) {
      subscriberSets.delete(key)
      listeners.get(key)?.()
      listeners.delete(key)
      cache.delete(key)
    }
  }
}

export const resolveEventIdsFromRoomId = (roomId: string): { communityId: string; eventId: string } | null => {
  return parseEventChatRoomId(roomId)
}

export const unsubscribeAllEventRoomDisplays = (): void => {
  for (const unsubscribe of listeners.values()) {
    unsubscribe()
  }
  listeners.clear()
  subscriberSets.clear()
  cache.clear()
}
