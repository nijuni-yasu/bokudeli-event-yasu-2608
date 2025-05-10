import { type Ref } from 'vue'
import { db, functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import {
  collection,
  collectionGroup,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  DocumentReference,
  DocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { uploadEventImage } from '@/composable/uploadImage'
import { convertDocumentDataToEvent, convertDocumentDataToMenu } from '@/schemes/converter'
import type { Store, StateTree } from 'pinia'
import { type OrderItem } from '@/schemes/orderItem'
import { type EventMember } from '@/schemes/EventMember'
import type { PartnerMenu } from '@/schemes/partnerMenu'
import { useUserStore, type UserStore } from './user'

const add_order = httpsCallable<Partial<OrderItem>, { order_id: string }>(functions, 'add_order')
const delete_order = httpsCallable<{ community_id: string; event_id: string; order_id: string; menu_id: string }>(
  functions,
  'delete_order',
)
const update_order_status = httpsCallable<{
  community_id: string
  event_id: string
  order_id: string
  status: OrderItem['status']
}>(functions, 'update_order_status')

class EventRefUpdatedEvent extends Event {
  constructor(
    type: string,
    public eventRef: DocumentReference,
  ) {
    super(type)
  }
}

type EventStoreState = {
  event: Ref<BokudeliEvent | null>
  exists: Ref<boolean | null>
  /**
   * 未注文のものを含む注文リスト
   */
  orders: Ref<OrderItem[] | null>
  /**
   * 注文確定済みリスト
   */
  confirmedOrders: Ref<OrderItem[] | null>
  menus: Ref<PartnerMenu[] | null>
} & StateTree

type EventStoreGetters = {
  /**
   * 注文済みユーザーのみのリスト
   */
  members: Ref<EventMember[] | null>
}

type EventStoreAction = {
  updateEvent: (data: BokudeliEvent) => Promise<void>
  updateCoverImage: (coverImage: File) => Promise<void>
  addOrder: (data: Partial<OrderItem>) => Promise<string>
  deleteOrder: (order: { community_id: string; event_id: string; order_id: string }, menu_id: string) => Promise<void>
  updateOrderStatus: (
    order: { community_id: string; event_id: string; order_id: string },
    status: OrderItem['status'],
  ) => Promise<void>
  deleteEvent: () => Promise<void>
  subscribe: () => Promise<void>
  unsubscribe: () => void
}

export type EventStore = Store<string, EventStoreState, EventStoreGetters, EventStoreAction>

export const useEventStore = (terget: string | DocumentSnapshot) => {
  let eventId: string
  if (terget instanceof DocumentSnapshot) {
    eventId = terget.id
  } else {
    eventId = terget
  }
  const store = defineStore<string, EventStoreState & EventStoreGetters & EventStoreAction>(
    `/events/${eventId}`,
    () => {
      const router = useRouter()

      const EVENT_TYPE_EVENT_REF_UPDATED = `onEventRefUpdated_${eventId}`
      const exists = ref<boolean | null>(null)
      const event = ref<BokudeliEvent | null>(null)
      const _orders = ref<OrderItem[] | null>(null)
      const _members = ref<{ user_id: string; store: UserStore }[] | null>(null)
      const _menus = ref<PartnerMenu[] | null>(null)
      const _eventRef = ref<DocumentReference | null>(null)

      const onEventUpdated = (doc: DocumentSnapshot) => {
        const data = doc.data()
        exists.value = data?.is_deleted ? false : doc.exists()
        if (exists.value === false) {
          return
        }
        event.value = data ? convertDocumentDataToEvent(data) : null
        _eventRef.value = doc.ref
        _members.value =
          data?.members?.map((memberRef: DocumentReference) => ({
            user_id: memberRef.id,
            store: useUserStore(memberRef.id),
          })) ?? null
      }

      if (terget instanceof DocumentSnapshot) {
        onEventUpdated(terget)
      }

      watch(
        _eventRef,
        (newValue) => {
          if (newValue == null) {
            throw new Error('_eventRef can be null just as the initial value.')
          }
          document.dispatchEvent(new EventRefUpdatedEvent(EVENT_TYPE_EVENT_REF_UPDATED, toRaw(newValue)))
        },
        { immediate: false },
      )

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

      const orders = computed<OrderItem[] | null>(() => {
        getEventRef().then((eventRef) => {
          subscribeOrders(eventRef)
        })
        return _orders.value
      })

      const menus = computed<PartnerMenu[] | null>(() => {
        getEventRef().then((eventRef) => {
          subscribeMenus(eventRef)
        })
        const sortedMenus =
          _menus.value?.sort((a, b) => (b.updatedAt?.valueOf() ?? 0) - (a.updatedAt?.valueOf() ?? 0)) ?? null
        return sortedMenus
      })

      const confirmedOrders = computed<OrderItem[] | null>(() => {
        getEventRef().then((eventRef) => {
          subscribeOrders(eventRef)
        })
        return _orders.value?.filter((order) => order.status === 'ordered') ?? null
      })

      const members = computed<EventMember[] | null>(
        () =>
          _members.value?.flatMap((member) => {
            if (member.store.exists === false) {
              return []
            }
            const target = _orders.value?.filter((order) => order.user_id === member.user_id) ?? ([] as OrderItem[])
            const orders = new Proxy(target, {
              get: (target, prop, receiver) => {
                getEventRef().then((eventRef) => {
                  subscribeOrders(eventRef)
                })
                return Reflect.get(target, prop, receiver)
              },
            })
            // TODO 雑なキャストを修正する
            return member.store.user == null
              ? ({
                  user_id: member.user_id,
                  orders,
                } as EventMember)
              : {
                  ...member.store.user,
                  orders,
                }
          }) ?? null,
      )

      const updateEvent = async (data: BokudeliEvent) => {
        const eventRef = await getEventRef()
        const communityId = eventRef.parent?.parent?.id ?? data.community_id
        if (communityId == null) {
          console.warn(`These values must be set. eventRef: ${eventRef} communityId: ${communityId}`)
          return
        }
        data.updated_at = Timestamp.now()
        return await updateDoc(eventRef, data.convertToDocumentData())
      }

      const updateCoverImage = async (coverImage: File) => {
        const eventRef = await getEventRef()
        const communityId = eventRef.parent?.parent?.id
        if (communityId == null) {
          console.warn(`These values must be set. eventRef: ${eventRef} communityId: ${communityId}`)
          return
        }
        const data = {
          updated_at: Timestamp.now(),
          event_cover_url: (await uploadEventImage(communityId, eventId, coverImage)) ?? '',
        }
        return await updateDoc(eventRef, data)
      }

      const addOrder = async (data: Partial<OrderItem>): Promise<string> => {
        const response = await add_order(data)
        return response.data.order_id
      }

      const deleteOrder = async (
        order: { community_id: string; event_id: string; order_id: string },
        menu_id: string,
      ): Promise<void> => {
        await delete_order({ ...order, menu_id })
      }

      const updateOrderStatus = async (
        order: { community_id: string; event_id: string; order_id: string },
        status: OrderItem['status'],
      ): Promise<void> => {
        await update_order_status({ ...order, status })
      }

      const deleteEvent = async (): Promise<void> => {
        return updateDoc(await getEventRef(), { is_deleted: true })
      }

      let unsubscribeEvent: Unsubscribe | null = null
      const subscribeEvent = (eventRef: DocumentReference) => {
        if (unsubscribeEvent == null) {
          unsubscribeEvent = onSnapshot(eventRef, onEventUpdated)
        }
      }
      let unsubscribeOrders: Unsubscribe | null = null
      const subscribeOrders = (eventRef: DocumentReference) => {
        if (unsubscribeOrders == null) {
          const ordersRef = collection(eventRef, 'orders')
          unsubscribeOrders = onSnapshot(ordersRef, (ordersSnapshot) => {
            _orders.value = ordersSnapshot.docs.map((o) => {
              const order = o.data() as OrderItem // TODO このキャストは雑なので、ちゃんと処理する
              // https://github.com/nijuniinc/bokudeli-event-new/issues/729
              order.carted_at = order.carted_at ?? order.created_at
              return order
            })
          })
        }
      }

      let unsubscribeMenus: Unsubscribe | null = null
      const subscribeMenus = (eventRef: DocumentReference) => {
        if (unsubscribeMenus == null) {
          const menusRef = collection(eventRef, 'menus')
          unsubscribeMenus = onSnapshot(menusRef, (menusSnapshot) => {
            const partnerId = event.value?.partner_id
            if (partnerId != null) {
              _menus.value = menusSnapshot.docs.map((m) => convertDocumentDataToMenu(partnerId, m.id, m.data()))
            }
          })
        }
      }

      let retry = 0
      const subscribe = () =>
        getDocs(query(collectionGroup(db, 'events'), where('event_id', '==', eventId))).then((querySnapshot) => {
          const eventRef = querySnapshot.docs[0]?.ref
          if (eventRef == null) {
            if (retry++ < 10) {
              console.warn(
                `The event "${eventId}" does not exist. It may not have been created yet. It will retry in 500 ms.`,
              )
              window.setTimeout(subscribe, 500)
              return
            }
            exists.value = false
            console.error(`The event "${eventId}" does not exist. It ceased attempting to retry.`)
            router.replace('/404')
            return
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

      if (_eventRef.value == null) {
        subscribe()
      } else {
        subscribeEvent(toRaw(_eventRef.value))
      }

      return {
        event,
        exists,
        orders,
        confirmedOrders,
        members,
        menus,
        updateEvent,
        updateCoverImage,
        addOrder,
        deleteOrder,
        updateOrderStatus,
        deleteEvent,
        subscribe,
        unsubscribe,
        $reset: () => {
          unsubscribe()
          subscribe()
        },
      }
    },
  )
  return store()
}
