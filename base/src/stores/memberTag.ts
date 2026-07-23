import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collection,
  onSnapshot,
  type Unsubscribe,
  type FirestoreDataConverter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { EventMemberTag } from '@shokujii/common/schemas/EventMemberTag.js'

const memberTagConverter: FirestoreDataConverter<EventMemberTag> = {
  toFirestore(tag: EventMemberTag): DocumentData {
    return tag.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EventMemberTag {
    return new EventMemberTag(snapshot.id, snapshot.data(options))
  },
}

export type MemberTagStore = ReturnType<typeof useMemberTagStore>

/** `events/{eventId}/member_tags` のリアルタイム購読（必要な画面でのみ subscribe する） */
export const useMemberTagStore = (communityId: string, eventId: string) => {
  const store = defineStore(`memberTags/${communityId}/${eventId}`, () => {
    const memberTagsByUserId = ref<Map<string, EventMemberTag>>(new Map())
    let unsub: Unsubscribe | null = null

    const subscribe = () => {
      if (unsub != null) return
      const colRef = collection(db, 'communities', communityId, 'events', eventId, 'member_tags').withConverter(
        memberTagConverter,
      )
      unsub = onSnapshot(colRef, (snap) => {
        const next = new Map<string, EventMemberTag>()
        for (const d of snap.docs) {
          next.set(d.id, d.data())
        }
        memberTagsByUserId.value = next
      })
    }

    const unsubscribe = () => {
      unsub?.()
      unsub = null
    }

    return {
      memberTagsByUserId,
      subscribe,
      unsubscribe,
    }
  })
  return store()
}
