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
  type DocumentReference,
  type Unsubscribe,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore'
import { convertDocumentDataToCommunity } from '@/schemes/converter'
import { StateTree, Store } from 'pinia'
import BokudeliCommunity from "@/schemes/bokudeliCommunity"
import { FirestoredUser } from '@/schemes/storedUser'
import { CommunityMember } from '@/schemes/communityMember'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { useUserStore } from '@/stores/user'
import { useEventStore, type EventStore } from '@/stores/event'
import { useStoreStoredUser } from '@/stores/storedUser'

type CommunityStoreState = {
  community: Ref<BokudeliCommunity | null>,
} & StateTree

type CommunityGetters = {
  members: Ref<CommunityMember[] | null>,
  events: Ref<BokudeliEvent[] | null>,
}

type CommunityStoreAction = {
  updateComunity: (data: Partial<BokudeliCommunity>) => Promise<void>,
  subscribe: () => Promise<void>,
  unsubscribe: () => void,
  getCurrentUserRoles: () => Promise<string[] | null>,
}

export type CommunityStore = Store<string, CommunityStoreState, CommunityGetters, CommunityStoreAction>

export const useCommunityStore = (communityAccount: string) => {
  const store = defineStore<string, CommunityStoreState & CommunityGetters & CommunityStoreAction>(`/comunities/${communityAccount}`, () => {
    const initialValues = reactive<{
      communityRef: DocumentReference | null
    }>({
      communityRef: null,
    })
    const exists = ref<boolean | null>(null)
    const community = ref<BokudeliCommunity | null>(null)
    const memberStores = ref<CommunityMemberStore[] | null>(null)
    const eventStores = ref<Map<string, EventStore> | null>(null)

    const members = computed<CommunityMember[] | null>(() => {
      if (memberStores.value == null) {
        return null
      }
      const stores = Array.from(memberStores.value.values())
      return stores.flatMap((store) => !store.exists || store.member == null ? [] : store.member as CommunityMember)
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

    const subscribe = () => getDocs(query(collection(db, 'communities'), where('community_account', '==', communityAccount)))
      .then((querySnapshot) => {
        initialValues.communityRef = querySnapshot.docs[0]?.ref
        // firestore は内部の値に直接アクセスするので、toRaw で unwrap しておかないといけない
        const communityRef = toRaw(initialValues.communityRef)
        if (communityRef != null) {
          subscribeCommunity(communityRef)
          // 他の Store は遅延評価なので、以下を呼ぶ必要はない
          // subscribeEvents(communityRef)
        }
      })

    subscribe()

    const getCurrentUserRoles = async () => {
      // 外部スコープの communityRef は習得前の可能性があるので、ここでは使用せず、再度取得する
      const querySnapshot = await getDocs(query(collection(db, 'communities'), where('community_account', '==', communityAccount)))
      const communityRef = querySnapshot.docs[0]?.ref
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
      subscribe,
      unsubscribe: () => {
        unsubscribeCommunity?.()
        unsubscribeCommunity = null
        unsubscribeEvents?.()
        unsubscribeEvents = null
      },
      getCurrentUserRoles,
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
      return _.merge({}, userStore.user, _member.value)
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
  filters: Ref<QueryConstraint[] | null>
} & StateTree

type CommunitiesStoreGetters = {
  communityStores: Ref<CommunityStore[] | null>,
}

export type CommunitiesStore = Store<string, CommunitiesStoreState, CommunitiesStoreGetters>

export const useCommunitiesStore = defineStore<string, CommunitiesStoreState & CommunitiesStoreGetters>('/communities', () => {
  const _communityStores = ref<CommunityStore[] | null>(null)
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

  return {
    filters,
    communityStores,
  }
})