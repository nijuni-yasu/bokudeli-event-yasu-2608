import { db } from '@/firebase'
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  type DocumentReference,
  type Unsubscribe,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { convertDocumentDataToCommunity } from '@/schemes/converter'
import { StateTree, Store } from 'pinia'
import BokudeliCommunity from "@/schemes/bokudeliCommunity"
import { FirestoredUser } from '@/schemes/storedUser'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { useUserStore, type UserStore } from '@/stores/user'
import { useEventStore, type EventStore } from '@/stores/event'
import { checkCommunityManager } from '@/composable/checkCommunityManager'
import { checkCommunityMember } from '@/composable/checkCommunityMember'

type ComunityStoreState = {
  community: Ref<BokudeliCommunity | null>,
} & StateTree

type CommunityGetters = {
  members: Ref<FirestoredUser[] | null>,
  managers: Ref<FirestoredUser[] | null>,
  events: Ref<BokudeliEvent[] | null>,
}

type ComunityStoreAction = {
  updateComunity: (data: Partial<BokudeliCommunity>) => Promise<void>,
  subscribe: () => Promise<void>,
  unsubscribe: () => void,
  isManager: () => Promise<boolean>,
  isMember: () => Promise<boolean>,
}

export type CommunityStore = Store<string, ComunityStoreState, CommunityGetters, ComunityStoreAction>

export const useCommunityStore = (communityAccount: string) => {
  const store = defineStore<string, ComunityStoreState & CommunityGetters & ComunityStoreAction>(`/comunities/${communityAccount}`, () => {
    const initialValues = reactive<{
      communityRef: DocumentReference | null
    }>({
      communityRef: null,
    })
    const exists = ref<boolean | null>(null)
    const community = ref<BokudeliCommunity | null>(null)
    const memberStores = ref<Map<string, UserStore> | null>(null)
    const managerStores = ref<Map<string, UserStore> | null>(null)
    const eventStores = ref<Map<string, EventStore> | null>(null)

    const members = computed<FirestoredUser[] | null>(() => {
      const communityRef = toRaw(initialValues.communityRef)
      if (communityRef != null) {
        subscribeMembers(communityRef)
      }
      if (memberStores.value == null) {
        return null
      }
      const stores = Array.from(memberStores.value.values())
      return stores.flatMap((store) => !store.exists || store.user == null ? [] : store.user as FirestoredUser)
    })
    const managers = computed<FirestoredUser[] | null>(() => {
      const communityRef = toRaw(initialValues.communityRef)
      if (communityRef != null) {
        subscribeManagers(communityRef)
      }
      if (managerStores.value == null) {
        return null
      }
      const stores = Array.from(managerStores.value.values())
      return stores.flatMap((store) => !store.exists || store.user == null ? [] : store.user as FirestoredUser)
    })
    const events = computed<BokudeliEvent[] | null>(() => {
      const communityRef = toRaw(initialValues.communityRef)
      if (communityRef != null) {
        subscribeEvents(communityRef)
      }
      if (eventStores.value == null) {
        return null
      }
      const stores = Array.from(eventStores.value.values())
      return stores
        .flatMap((store) => store.event == null ? [] : store.event as BokudeliEvent)
        .sort((a, b) => (b.event_start_datetime?.toMillis() ?? 0) - (a.event_start_datetime?.toMillis() ?? 0))
    })

    const updateComunity = async (data: Partial<BokudeliCommunity>): Promise<void> => {
      const communityRef = toRaw(initialValues.communityRef)
      if (communityRef == null) {
        console.warn('communityRef is null')
        return
      }
      await updateDoc(communityRef, data)
    }

    let unsubscribeCommunity: Unsubscribe | null = null
    const subscribeCommunity = (communityRef: DocumentReference) => {
      getDoc(communityRef).then((documentSnapshot) => exists.value = documentSnapshot.exists())
      if (unsubscribeCommunity == null) {
        unsubscribeCommunity = onSnapshot(communityRef, (doc: DocumentSnapshot) => {
          const data = doc.data()
          community.value = data ? convertDocumentDataToCommunity(data) : null
        })
      }
    }

    let unsubscribeMembers: Unsubscribe | null = null
    const subscribeMembers = (communityRef: DocumentReference) => {
      const membersRef = collection(communityRef, 'members')
      if (memberStores.value == null) {
        getDocs(membersRef).then((querySnapshot) => {
          if (querySnapshot.empty) {
            memberStores.value = new Map()
          }
        })
      }
      if (unsubscribeMembers == null) {
        unsubscribeMembers = onSnapshot(membersRef, (querySnapshot) => {
          querySnapshot.docs.forEach((doc) => {
            const userId = doc.get('user_id')
            if (userId == null) {
              return
            }
            const stores = memberStores.value || new Map()
            stores.set(userId, useUserStore(userId) as UserStore)
            memberStores.value = stores
          })
        })
      }
    }

    let unsubscribeManagers: Unsubscribe | null = null
    const subscribeManagers = (communityRef: DocumentReference) => {
      const managersRef = collection(communityRef, 'managers')
      if (managerStores.value == null) {
        getDocs(managersRef).then((querySnapshot) => {
          if (querySnapshot.empty) {
            managerStores.value = new Map()
          }
        })
      }
      if (unsubscribeManagers == null) {
        unsubscribeManagers = onSnapshot(managersRef, (querySnapshot) => {
          querySnapshot.docs.forEach((doc) => {
            const userId = doc.get('user_id')
            if (userId == null) {
              return
            }
            const stores = managerStores.value || new Map()
            stores.set(userId, useUserStore(userId) as UserStore)
            managerStores.value = stores
          })
        })
      }
    }

    let unsubscribeEvents: Unsubscribe | null = null
    const subscribeEvents = (communityRef: DocumentReference) => {
      const eventsRef = collection(communityRef, 'events')
      if (eventStores.value == null) {
        getDocs(eventsRef).then((querySnapshot) => {
          if (querySnapshot.empty) {
            eventStores.value = new Map()
          }
        })
      }
      if (unsubscribeEvents == null) {
        unsubscribeEvents = onSnapshot(eventsRef, (querySnapshot) => {
          querySnapshot.docs.forEach((doc) => {
            const eventId = doc.id
            const stores = eventStores.value || new Map()
            stores.set(eventId, useEventStore(eventId) as EventStore)
            eventStores.value = stores
          })
        })
      }
    }

    const subscribe = () => getDocs(query(collection(db, 'communities'), where('community_account', '==', communityAccount)))
      .then((querySnapshot) => {
        initialValues.communityRef = querySnapshot.docs[0]?.ref
        // firestore は内部の値に直接アクセスするので、toRaw で unwrap しておかないといけない
        const communityRef = toRaw(initialValues.communityRef)
        if (communityRef != null) {
          subscribeCommunity(communityRef)
          // 他の Store は遅延評価なので、以下を呼ぶ必要はない
          // subscribeMembers(communityRef)
          // subscribeManagers(communityRef)
          // subscribeEvents(communityRef)
        }
      })

    subscribe()

    const isManager = async () => {
      // 外部スコープの communityRef は習得前の可能性があるので、ここでは使用せず、再度取得する
      const querySnapshot = await getDocs(query(collection(db, 'communities'), where('community_account', '==', communityAccount)))
      const communityRef = querySnapshot.docs[0]?.ref
      if (communityRef == null) {
        return false
      }
      return checkCommunityManager(communityRef)
    }

    const isMember = async () => {
      // 外部スコープの communityRef は習得前の可能性があるので、ここでは使用せず、再度取得する
      const querySnapshot = await getDocs(query(collection(db, 'communities'), where('community_account', '==', communityAccount)))
      const communityRef = querySnapshot.docs[0]?.ref
      if (communityRef == null) {
        return false
      }
      return checkCommunityMember(communityRef)
    }

    return {
      community,
      members,
      managers,
      events,
      updateComunity,
      subscribe,
      unsubscribe: () => {
        unsubscribeCommunity?.()
        unsubscribeCommunity = null
        unsubscribeMembers?.()
        unsubscribeMembers = null
        unsubscribeManagers?.()
        unsubscribeManagers = null
        unsubscribeEvents?.()
        unsubscribeEvents = null
      },
      isManager,
      isMember,
    }
  })
  return store()
}

type CommunitiesStoreState = {
  publicOnly: Ref<boolean>
} & StateTree

type CommunitiesStoreGetters = {
  communityStores: Ref<CommunityStore[] | null>,
}

export type CommunitiesStore = Store<string, CommunitiesStoreState, CommunitiesStoreGetters>

export const useCommunitiesStore = defineStore<string, CommunitiesStoreState & CommunitiesStoreGetters>('/communities', () => {
  const publicOnly = ref(true)
  const _communityStores = ref<CommunityStore[] | null>(null)

  let unsubscribe: Unsubscribe | null = null
  const subscribe = () => {
    // TODO updated_at がないコミュニティがあるので、現在は orderBy が使えない
    // const q = query(collection(db, 'communities'), orderBy('updated_at', 'desc'))
    // TODO ページネーション
    const q = publicOnly.value ? query(
      collection(db, 'communities'),
      where('is_public', '==', true),
    ) : query( 
      collection(db, 'communities'),
    )
    if (unsubscribe != null) {
      unsubscribe()
    }
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

  watch(publicOnly, () => {
    _communityStores.value = null
    subscribe()
  })

  return {
    publicOnly,
    communityStores,
  }
})