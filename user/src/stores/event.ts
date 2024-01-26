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

const EVENT_TYPE_EVENT_REF_UPDATED = 'onEventRefUpdated'

class EventRefUpdatedEvent extends Event {
  constructor(public eventRef: DocumentReference) {
    super(EVENT_TYPE_EVENT_REF_UPDATED)
  }
}

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

export const useEventStore = (eventId: string) => {
  const store = defineStore<string, EventStoreState & EventStoreGetters & EventStoreAction> (`/events/${eventId}`, () => {
    const exists = ref<boolean | null>(null)
    const event = ref<BokudeliEvent | null>(null)
    const _members = ref<{ userStore: UserStore; orders: OrderItem[]}[] | null>(null)

    const _eventRef = ref<DocumentReference | null>(null)
    watch(_eventRef, (newValue) => {
      if (newValue == null) {
        throw new Error('_eventRef can be null just as the initial value.')
      }
      document.dispatchEvent(new EventRefUpdatedEvent(newValue))
    }, { immediate: false })

    const getEventRef = async (): Promise<DocumentReference> => {
      return new Promise((resolve, reject) => {
        if (_eventRef.value == null) {
          const listener = (event: Event) => {
            document.removeEventListener(EVENT_TYPE_EVENT_REF_UPDATED, listener)
            resolve((event as EventRefUpdatedEvent).eventRef)
          }
          document.addEventListener(EVENT_TYPE_EVENT_REF_UPDATED, listener)
          // Timeout
          window.setTimeout(() => {
            document.removeEventListener(EVENT_TYPE_EVENT_REF_UPDATED, listener)
            reject(new Error('getEventRef timeout'))
          }, 5000)
        } else {
          resolve(toRaw(_eventRef.value))
        }
      })
    }

    const orders = computed<OrderItem[] | null>(() => _members.value?.flatMap((member) => member.orders) ?? null)

    const members = computed<EventMember[] | null>(() => {
      getEventRef().then((eventRef) => {
        subscribeOrders(eventRef)
      })
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
      const eventRef = await getEventRef()
      const communityId = eventRef.parent?.parent?.id ?? data.community_id
      if (communityId == null) {
        console.warn(`These values must be set. eventRef: ${eventRef} communityId: ${communityId}`)
        return
      }
      data.updated_at = Timestamp.now()
      if (coverImage) {
        data.event_cover_url = (await uploadEventImage(communityId, eventId, coverImage)) ?? ''
      }
      return await updateDoc(eventRef, data.convertToDocumentData())
    }

    const addOrder = async (data: Partial<OrderItem>): Promise<DocumentReference | null> => {
      const eventRef = await getEventRef()
      const addedDoc = await addDoc(collection(eventRef, 'orders'), data)
      await setDoc(addedDoc, { order_id: addedDoc.id }, { merge: true })
      return addedDoc
    }

    const updateOrder = async (id: string, data: Partial<OrderItem>): Promise<void> => {
      const eventRef = await getEventRef()
      const orderRef = doc(eventRef, 'orders', id)
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

    let retry = 0
    const subscribe = () => getDocs(query(collectionGroup(db, 'events'), where('event_id', '==', eventId)))
      .then((querySnapshot) => {
        const eventRef = querySnapshot.docs[0]?.ref
        if (eventRef == null) {
          if (retry++ < 10) {
            console.warn(`The event "${eventId}" does not exist. It may not have been created yet. It will retry in 500 ms.`)
            window.setTimeout(subscribe, 500)
            return
          }
          throw new Error(`The event "${eventId}" does not exist. It ceased attempting to retry.`)
        }
        retry = 0
        _eventRef.value = eventRef
        subscribeEvent(eventRef)
        // 遅延評価なので以下を呼ぶ必要はない
        // subscribeOrders(eventRef)
      })

    const unsubscribe = () => {
      retry = 0
      unsubscribeEvent?.()
      unsubscribeEvent = null
      unsubscribeOrders?.()
      unsubscribeOrders = null
    }

    subscribe()

    return {
      event,
      orders,
      members,
      orderConfiremedMembers,
      updateEvent,
      addOrder,
      updateOrder,
      subscribe,
      unsubscribe,
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
      _eventStores.value = querySnapshot.docs.map((doc) => useEventStore(doc.id) as EventStore)
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
