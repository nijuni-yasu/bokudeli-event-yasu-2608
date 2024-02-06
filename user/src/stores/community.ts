import _ from 'lodash'
import { db } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type Unsubscribe,
  type DocumentSnapshot,
  type QueryConstraint,
  setDoc,
} from 'firebase/firestore'
import { convertDocumentDataToCommunity } from '@/schemes/converter'
import { StateTree, Store } from 'pinia'
import BokudeliCommunity from "@/schemes/bokudeliCommunity"
import { FirestoredUser } from '@/schemes/storedUser'
import { CommunityMember, convertCommunityMemberToDocumentData } from '@/schemes/communityMember'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { useUserStore } from '@/stores/user'
import { useEventStore, type EventStore } from '@/stores/event'
import { useStoreStoredUser } from '@/stores/storedUser'
import { uploadCommunityImage } from '@/composable/uploadImage'

const EVENT_TYPE_COMMUNITY_REF_UPDATED = 'onCommunityRefUpdated'

class CommunityRefUpdatedEvent extends Event {
  constructor(public communityRef: DocumentReference) {
    super(EVENT_TYPE_COMMUNITY_REF_UPDATED)
  }
}

type CommunityStoreState = {
  community: Ref<BokudeliCommunity | null>,
} & StateTree

type CommunityGetters = {
  members: Ref<CommunityMember[] | null>,
  events: Ref<BokudeliEvent[] | null>,
}

type CommunityStoreAction = {
  updateComunity: (data: BokudeliCommunity) => Promise<void>,
  updateCoverImage: (coverImage: File) => Promise<void>,
  updateIconImage: (iconImage: File) => Promise<void>,
  subscribe: () => Promise<void>,
  unsubscribe: () => void,
  getCurrentUserRoles: () => Promise<string[] | null>,
}

export type CommunityStore = Store<string, CommunityStoreState, CommunityGetters, CommunityStoreAction>

export const useCommunityStore = (communityAccount: string) => {
  // store の Identifier が firestore の path と異なるのは危険だが、この store 内に閉じている場合は問題ないはず
  const store = defineStore<string, CommunityStoreState & CommunityGetters & CommunityStoreAction>(`/communities/${communityAccount}`, () => {
    const exists = ref<boolean | null>(null)
    const community = ref<BokudeliCommunity | null>(null)
    const memberStores = ref<CommunityMemberStore[] | null>(null)
    const eventStores = ref<Map<string, EventStore> | null>(null)

    const _communityRef = ref<DocumentReference | null>(null)
    watch(_communityRef, (newValue) => {
      if (newValue == null) {
        throw new Error('_communityRef can be null just as the initial value.')
      }
      document.dispatchEvent(new CommunityRefUpdatedEvent(newValue))
    })

    const getCommunityRef = async (): Promise<DocumentReference> => {
      return new Promise((resolve, reject) => {
        if (_communityRef.value == null) {
          const listener = (event: Event) => {
            document.removeEventListener(EVENT_TYPE_COMMUNITY_REF_UPDATED, listener)
            resolve((event as CommunityRefUpdatedEvent).communityRef)
          }
          document.addEventListener(EVENT_TYPE_COMMUNITY_REF_UPDATED, listener)
          window.setTimeout(() => {
            document.removeEventListener(EVENT_TYPE_COMMUNITY_REF_UPDATED, listener)
            reject(new Error('getCommunityRef timeout'))
          }, 5000)
        } else {
          resolve(toRaw(_communityRef.value))
        }
      })
    }

    const members = computed<CommunityMember[] | null>(() => {
      if (memberStores.value == null) {
        return null
      }
      const stores = Array.from(memberStores.value.values())
      return stores.flatMap((store) => !store.exists || store.member == null ? [] : store.member as CommunityMember)
    })
    const events = computed<BokudeliEvent[] | null>(() => {
      getCommunityRef().then((communityRef) => {
        subscribeEvents(communityRef)
      })
      if (eventStores.value == null) {
        return null
      }
      const stores = Array.from(eventStores.value.values())
      return stores
        .flatMap((store) => store.event == null ? [] : store.event as BokudeliEvent)
        .sort((a, b) => (b.event_start_datetime?.toMillis() ?? 0) - (a.event_start_datetime?.toMillis() ?? 0))
    })

    const updateComunity = async (data: BokudeliCommunity) => {
      const communityRef = await getCommunityRef()
      const updateData = _.omit(data.convertToDocumentData(), ['community_cover_image_url', 'community_icon_image_url'])
      updateData.updated_at = Timestamp.now()
      await updateDoc(communityRef, updateData)
    }

    const updateCoverImage = async (file: File) => {
      const communityRef = await getCommunityRef()
      const community_cover_image_url = await uploadCommunityImage(communityRef.id, file)
      const data = {
        updated_at: Timestamp.now(),
        community_cover_image_url,
      }
      await updateDoc(communityRef, data)
    }

    const updateIconImage = async (file: File) => {
      const communityRef = await getCommunityRef()
      const community_icon_image_url = await uploadCommunityImage(communityRef.id, file)
      const data = {
        updated_at: Timestamp.now(),
        community_icon_image_url,
      }
      await updateDoc(communityRef, data)
    }

    let unsubscribeCommunity: Unsubscribe | null = null
    const subscribeCommunity = (communityRef: DocumentReference) => {
      if (unsubscribeCommunity == null) {
        unsubscribeCommunity = onSnapshot(communityRef, (doc: DocumentSnapshot) => {
          exists.value = doc.exists()
          const data = doc.data()
          community.value = data ? convertDocumentDataToCommunity(data) : null
          memberStores.value = data?.members?.map((member: DocumentReference) => useCommunityMemberStore(communityRef.id, member.id)) ?? []
        })
      }
    }

    let unsubscribeEvents: Unsubscribe | null = null
    const subscribeEvents = (communityRef: DocumentReference) => {
      const eventsRef = collection(communityRef, 'events')
      if (unsubscribeEvents == null) {
        unsubscribeEvents = onSnapshot(eventsRef, (querySnapshot) => {
          eventStores.value = new Map()
          querySnapshot.docs.forEach((doc) => {
            const eventId = doc.id
            const stores = eventStores.value || new Map()
            stores.set(eventId, useEventStore(eventId) as EventStore)
            eventStores.value = stores
          })
        })
      }
    }

    let retry = 0
    const subscribe = () => getDocs(query(collection(db, 'communities'), where('community_account', '==', communityAccount)))
      .then((querySnapshot) => {
        const communityRef = querySnapshot.docs[0]?.ref
        if (communityRef == null) {
          if (retry++ < 10) {
            console.warn(`The community "${communityAccount}" does not exist. It may not have been created yet. It will retry in 500 ms.`)
            window.setTimeout(subscribe, 500)
            return
          }
          throw new Error(`The community "${communityAccount}" does not exist. It ceased attempting to retry.`)
        }
        retry = 0
        _communityRef.value = communityRef
        subscribeCommunity(communityRef)
        // 他の Store は遅延評価なので、以下を呼ぶ必要はない
        // subscribeEvents(communityRef)
      })

    const unsubscribe = () => {
      retry = 0
      unsubscribeCommunity?.()
      unsubscribeCommunity = null
      unsubscribeEvents?.()
      unsubscribeEvents = null
    }

    subscribe()

    const getCurrentUserRoles = async () => {
      const communityRef = await getCommunityRef()
      const userId = useStoreStoredUser().storedUser?.userId
      if (communityRef == null || userId == null) {
        return null
      }
      const memberRef = doc(communityRef, 'members', userId)
      const member = await getDoc(memberRef)
      const roles = new Set<string>(member.data()?.roles)
      // ログインユーザーがサポートアカウントの場合、コミュニティマネージャーの権限を持つ
      if (userId === import.meta.env.VITE_SUPPORT_ACCOUNT_USER_ID as string) {
        roles.add('manager')
      }
      return Array.from(roles)
    }

    return {
      community,
      members,
      events,
      updateComunity,
      updateCoverImage,
      updateIconImage,
      subscribe,
      unsubscribe,
      getCurrentUserRoles,
      $reset: () => {
        unsubscribe()
        subscribe()
      }
    }
  })
  return store()
}

type CommunityMemberStoreGetter = {
  exists: Ref<boolean | null>,
  member: Ref<CommunityMember | null>,
}

type CommunityMemberStoreAction = {
  subscribe: () => Promise<void>,
  unsubscribe: () => void,
}

type CommunityMemberStore = Store<string, StateTree, CommunityMemberStoreGetter, CommunityMemberStoreAction>

const useCommunityMemberStore = (communityId: string, memberId: string) => {
  const store = defineStore(`/comunities/${communityId}/members/${memberId}`, () => {
    const memberRef: DocumentReference = doc(db, 'communities', communityId, 'members', memberId)
    const userStore = useUserStore(memberId)

    const _exists = ref<boolean | null>(null)
    const _member = ref<Omit<CommunityMember, keyof FirestoredUser> | null>(null)

    const exists = computed<boolean | null>(() => {
      if (_exists.value == null || userStore.exists == null) {
        return null
      }
      return _exists.value && userStore.exists
    })
    const member = computed<CommunityMember | null>(() => {
      if (_member.value == null || userStore.user == null) {
        return null
      }
      // CAUTION: _.merge is mutable function
      return _.merge({}, userStore.user, convertCommunityMemberToDocumentData(_member.value))
    })

    let unsubscribeMember: Unsubscribe | null = null
    const subscribe = () => {
      if (unsubscribeMember == null) {
        unsubscribeMember = onSnapshot(memberRef, (memberSnapshot) => {
          _exists.value = memberSnapshot.exists()
          const data = memberSnapshot.data()
          _member.value = data ? data as Omit<CommunityMember, keyof FirestoredUser> : null
        })
      }
    }

    subscribe()

    return {
      exists,
      member,
      subscribe,
      unsubscribe: () => {
        unsubscribeMember?.()
        unsubscribeMember = null
      }
    }
  })
  return store()
}

type CommunitiesStoreState = {
  // Firestore の仕様が外に漏れるのは良い実装とは言えないが、
  // パフォーマンスにも影響する設定なので、ここではあえて外に出す
  filters: Ref<QueryConstraint[] | null>,
  communityDraft: Ref<BokudeliCommunity>,
} & StateTree

type CommunitiesStoreGetters = {
  communityStores: Ref<CommunityStore[] | null>,
}

type CommunitiesStoreAction = {
  getCommunityData: (communityAccount: string) => Promise<DocumentData | null>,
  createNewCommunityFromDraft: () => Promise<BokudeliCommunity>,
}

export type CommunitiesStore = Store<string, CommunitiesStoreState, CommunitiesStoreGetters, CommunitiesStoreAction>

export const useCommunitiesStore = defineStore<string, CommunitiesStoreState & CommunitiesStoreGetters & CommunitiesStoreAction>('/communities', () => {
  const _communityStores = ref<CommunityStore[] | null>(null)
  const communityDraft = ref<BokudeliCommunity>(new BokudeliCommunity())
  const filters = ref<QueryConstraint[] | null>(null)

  let unsubscribe: Unsubscribe | null = null
  const subscribe = () => {
    _communityStores.value = null
    // TODO ページネーション
    const q = query(collection(db, 'communities'), ...(filters.value ?? []))
    unsubscribe?.()
    unsubscribe = onSnapshot(q, (querySnapshot) => {
      _communityStores.value = querySnapshot.docs.map((doc) => {
        const communityAccount = doc.get('community_account')
        return useCommunityStore(communityAccount) as CommunityStore
      })
    })
  }

  const communityStores = computed<CommunityStore[] | null>(() => {
    if (unsubscribe == null) {
      subscribe()
    }
    return _communityStores.value
  })

  watch(filters, (newValue, oldValue) => {
    const arrayLength = Math.max(newValue?.length ?? 0, oldValue?.length ?? 0);
    if ([...Array(arrayLength)].some((__, i) => {
      return !_.isEqual(newValue?.[i], oldValue?.[i])
    })) {
      subscribe()
    }
  })

  const getCommunityData = async (communityAccount: string): Promise<DocumentData | null> => {
    const duplicatedCommunity = await getDocs(query(collection(db, 'communities'), where('community_account', '==', communityAccount)))
    if (duplicatedCommunity.empty) {
      return null
    } else {
      return duplicatedCommunity.docs[0].data()
    }
  }

  const createNewCommunityFromDraft = async () => {
    const c = await getCommunityData(communityDraft.value.community_account)
    if (c != null) {
      throw new Error(`community ${communityDraft.value.community_account} already exists`)
    }
    const userId = useStoreStoredUser().storedUser?.userId
    if (userId == null) {
      throw new Error('user is not logged in')
    }
    const newCommunityRef = doc(collection(db, 'communities'))
    await setDoc(newCommunityRef, {
      ...communityDraft.value.convertToDocumentData(),
      community_id: newCommunityRef.id,
      is_approved: false,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    })
    await setDoc(doc(newCommunityRef, 'members', userId), {
      roles: ['manager'],
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    })
    return convertDocumentDataToCommunity((await getDoc(newCommunityRef)).data() as DocumentData)
  }

  return {
    filters,
    communityDraft,
    communityStores,
    getCommunityData,
    createNewCommunityFromDraft,
    $reset: () => {
      communityDraft.value = new BokudeliCommunity()
      filters.value = null
      unsubscribe?.()
      unsubscribe = null
    },
  }
})
