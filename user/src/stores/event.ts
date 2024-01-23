import _ from 'lodash'
import { db } from '@/firebase'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import {
  doc,
  collection,
  collectionGroup,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  DocumentReference,
  type DocumentData,
  type Unsubscribe,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore'
import { uploadEventImage } from '@/composable/uploadImage'
import { convertDocumentDataToEvent } from '@/schemes/converter'
import { Store, StateTree } from 'pinia'
import OrderItem from '@/schemes/orderItem'
import { EventMember } from '@/schemes/EventMember'
import { useUserStore, type UserStore } from './user'

type EventStoreState = {
  event: Ref<BokudeliEvent | null>,
} & StateTree

type EventStoreGetters = {
  orders: Ref<OrderItem[] | null>,
  members: Ref<EventMember[] | null>,
  orderConfiremedMembers: Ref<EventMember[] | null>,
} 

type EventStoreAction = {
  updateEvent: (data: BokudeliEvent, coverImage?: File) => Promise<void>,
  addOrder: (data: Partial<OrderItem>) => Promise<DocumentReference | null>,
  updateOrder: (id: string, data: Partial<OrderItem>) => Promise<void>,
  subscribe: () => Promise<void>,
  unsubscribe: () => void,
}

export type EventStore = Store<string, EventStoreState, EventStoreGetters, EventStoreAction>

export const useEventStore = (eventIdentifire: string | DocumentReference) => {
  const initialValues = reactive<{
    eventId: string;
    eventRef: DocumentReference | null;
  }>(eventIdentifire instanceof DocumentReference ? {
    eventId: eventIdentifire.id,
    eventRef: eventIdentifire,
  } : {
    eventId: eventIdentifire,
    eventRef: null,
  })

  const store = defineStore<string, EventStoreState & EventStoreGetters & EventStoreAction> (`/events/${initialValues.eventId}`, () => {
    const exists = ref<boolean | null>(null)
    const event = ref<BokudeliEvent | null>(null)
    const _members = ref<{ userStore: UserStore; orders: OrderItem[]}[] | null>(null)

    const orders = computed<OrderItem[] | null>(() => _members.value?.flatMap((member) => member.orders) ?? null)

    const members = computed<EventMember[] | null>(() => {      
      const eventRef = toRaw(initialValues.eventRef)
      if (eventRef != null) {
        subscribeOrders(eventRef)
      }
      return _members.value?.flatMap((member) => {
        if (member.userStore.exists == null && member.userStore.user == null) {
          return []
        }
        // CAUTION: _.merge is mutable function
        return _.merge({}, member.userStore.user, { orders: member.orders })
      }) ?? null
    })

    const orderConfiremedMembers = computed<EventMember[] | null>(() =>
      members.value?.filter((member) => member.orders.some((order) => order.status === 'ordered')) ?? null
    )

    const updateEvent = async (data: BokudeliEvent, coverImage?: File) => {
      const eventRef = toRaw(initialValues.eventRef)
      const communityId = eventRef?.parent?.parent?.id ?? data.community_id
      if (eventRef == null || communityId == null) {
        console.warn(`These values must be set. eventRef: ${eventRef} communityId: ${communityId}`)
        return
      }
      data.updated_at = Timestamp.now()
      if (coverImage) {
        data.event_cover_url = (await uploadEventImage(communityId, initialValues.eventId, coverImage)) ?? ''
      }
      return await updateDoc(eventRef, data.convertToDocumentData())
    }

    const addOrder = async (data: Partial<OrderItem>): Promise<DocumentReference | null> => {
      const eventRef = toRaw(initialValues.eventRef)
      if (eventRef == null) {
        console.warn('eventRef is null')
        return null
      }
      const addedDoc = await addDoc(collection(eventRef, 'orders'), data)
      await setDoc(addedDoc, { order_id: addedDoc.id }, { merge: true })
      return addedDoc
    }

    const updateOrder = async (id: string, data: Partial<OrderItem>): Promise<void> => {
      if (initialValues.eventRef == null) {
        console.warn('eventRef is null')
        return
      }
      const orderRef = doc(initialValues.eventRef, 'orders', id)
      await updateDoc(orderRef, data)
    }

    let unsubscribeEvent: Unsubscribe | null = null
    const subscribeEvent = (eventRef: DocumentReference) => {
      if (unsubscribeEvent == null) {
        unsubscribeEvent = onSnapshot(eventRef, (doc: DocumentSnapshot) => {
          exists.value = doc.exists()
          const data = doc.data()
          event.value = data ? convertDocumentDataToEvent(data) : null
        })
      }
    }
    let unsubscribeOrders: Unsubscribe | null = null
    const subscribeOrders = (eventRef: DocumentReference) => {
      const ordersRef = collection(eventRef, 'orders')
      if (unsubscribeOrders == null) {
        unsubscribeOrders = onSnapshot(ordersRef, (ordersSnapshot) => {
          if (ordersSnapshot.empty) {
            _members.value = []
          } else {
            _members.value = Array.from(ordersSnapshot.docs.reduce((map, orderSnapshot) => {
              const userId = orderSnapshot.get('user_id')
              const userStore = useUserStore(userId) as UserStore
              const item = map.get(userId) ?? {
                userStore,
                orders: [] as OrderItem[],
              }
              item.orders.push(orderSnapshot.data() as OrderItem) // TODO このキャストは雑なので、ちゃんと処理する
              map.set(userId, item)
              return map
            }, new Map()).values())
          }
        })
      }
    }

    const subscribe = () => getDocs(query(collectionGroup(db, 'events'), where('event_id', '==', initialValues.eventId)))
      .then((querySnapshot) => {
        initialValues.eventRef = querySnapshot.docs[0]?.ref
        // firestore は内部の値に直接アクセスするので、toRaw で unwrap しておかないといけない
        const eventRef = toRaw(initialValues.eventRef)
        if (eventRef != null) {
          subscribeEvent(eventRef)
          // 遅延評価なので以下を呼ぶ必要はない
          // subscribeOrders(eventRef)
        }
      })
    
    if (eventIdentifire instanceof DocumentReference) {
      subscribeEvent(eventIdentifire)
      // 遅延評価なので以下を呼ぶ必要はない
      // subscribeOrders(eventIdentifire)
    } else {
      subscribe()
    }

    return {
      event,
      orders,
      members,
      orderConfiremedMembers,
      updateEvent,
      addOrder,
      updateOrder,
      subscribe,
      unsubscribe: () => {
        unsubscribeEvent?.()
        unsubscribeEvent = null
        unsubscribeOrders?.()
        unsubscribeOrders = null
      }
    }
  })
  return store()
}

type EventsStoreState = {
  // Firestore の仕様が外に漏れるのは良い実装とは言えないが、
  // パフォーマンスにも影響する設定なので、ここではあえて外に出す
  filters: Ref<QueryConstraint[] | null>
} & StateTree

type EventsStoreGetters = {
  eventStores: Ref<EventStore[] | null>,
}

type EventsStoreAction = {
  addEvent: (communityId: string, data: Partial<BokudeliEvent>, coverImage?: File | string) => Promise<BokudeliEvent>,
}

export type EventsStore = Store<'/events', EventsStoreState, EventsStoreGetters, EventsStoreAction>

export const useEventsStore = defineStore<string, EventsStoreState & EventsStoreGetters & EventsStoreAction> ('/events', () => {
  const _eventStores = ref<EventStore[] | null>(null)
  const filters = ref<QueryConstraint[] | null>(null)

  let unsubscribe: Unsubscribe | null = null
  const subscribe = () => {
    // TODO ページネーション
    const q = query(collectionGroup(db, 'events'), ...(filters.value ?? []))
    unsubscribe?.()
    unsubscribe = onSnapshot(q, (querySnapshot) => {
      _eventStores.value = querySnapshot.docs.map((doc) => useEventStore(doc.ref) as EventStore)
    })
  }

  const eventStores = computed<EventStore[] | null>(() => {
    if (unsubscribe == null) {
      subscribe()
    }
    return _eventStores.value
  })

  watch(filters, (newValue, oldValue) => {
    const arrayLength = Math.max(newValue?.length ?? 0, oldValue?.length ?? 0);
    if ([...Array(arrayLength)].some((__, i) => {
      return !_.isEqual(newValue?.[i], oldValue?.[i])
    })) {
      subscribe()
    }
  })

  const addEvent = async (community_id: string, data: Partial<BokudeliEvent>, coverImage?: File | string): Promise<BokudeliEvent> => {
    const communityRef = doc(db, 'communities', community_id)
    const community = await getDoc(communityRef)
    if (!community.exists()) {
      throw new Error(`community ${community_id} does not exists`)
    }
    const addedDoc = await addDoc(collection(communityRef, 'events'), {
      // firebase は純粋なオブジェクトしか受け付けないので、data を unwrap する
      ...data,
      community_id,
      community_name: community.get('community_name'),
      community_account: community.get('community_account'),
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    })
    let eventCoverUrl
    if (coverImage == null) {
      eventCoverUrl = ''
    } else if (coverImage instanceof File) {
      eventCoverUrl = await uploadEventImage(community_id, addedDoc.id, coverImage)
    } else {
      eventCoverUrl = coverImage
    }
    await setDoc(addedDoc, { event_id: addedDoc.id, event_cover_url: eventCoverUrl }, { merge: true })
    return convertDocumentDataToEvent((await getDoc(addedDoc)).data() as DocumentData)
  }

  return {
    filters,
    eventStores,
    addEvent,
  }
})