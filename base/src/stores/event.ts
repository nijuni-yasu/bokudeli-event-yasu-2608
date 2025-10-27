import { ref, computed, watch, toRaw } from 'vue'
import { defineStore } from 'pinia'
import { httpsCallable } from 'firebase/functions'
import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  updateDoc,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  type DocumentReference,
  type Unsubscribe,
  type FirestoreDataConverter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'
import { db, functions } from '@shokujii/base/firebase.js'
import { uploadEventImage } from '@shokujii/base/composable/uploadImage.js'
import { EventOrder } from '@shokujii/common/schemas/EventOrder.js'
import { EventMenu } from '@shokujii/common/schemas/EventMenu.js'
import { User } from '@shokujii/common/schemas/User.js'
import { useUserStore, type UserStore } from './user.js'
import { Event as _Event } from '@shokujii/common/schemas/Event.js'
import { getAuth } from 'firebase/auth'

const add_order = httpsCallable<Partial<EventOrder>, { order_id: string }>(functions, 'add_order')
const delete_order = httpsCallable<{ community_id: string; event_id: string; order_id: string; menu_id: string }>(
  functions,
  'delete_order',
)
const update_order_status = httpsCallable<{
  community_id: string
  event_id: string
  order_id: string
  status: EventOrder['status']
}>(functions, 'update_order_status')

class EventRefUpdatedEvent extends Event {
  constructor(
    type: string,
    public eventRef: DocumentReference<BokudeliEvent>,
  ) {
    super(type)
  }
}

/**
 * 将来的にユーティリティ関数などを定義する
 */
export class BokudeliEvent extends _Event {
  constructor(community_id: string, event_id: string | null, src: Partial<_Event>) {
    event_id = event_id ?? doc(collection(db, 'communities', community_id, 'events')).id
    super(event_id, { ...src, community_id })
  }
}

/**
 * 将来的にユーティリティ関数などを定義する
 */
export class BokudeliEventMember extends User {
  // 多重継承が出来ないので CommunityMember のプロパティを手動で追加する
  orders: EventOrder[] = []
}

/**
 * EventMember は UI 上で新規作成はしないので、いまのところコンストラクタを用意しない
 */
export class BokudeliEventMenu extends EventMenu {}

// eventList で使用するために export するが、他では使用しないように
export const eventConverter: FirestoreDataConverter<BokudeliEvent> = {
  toFirestore(event: BokudeliEvent): DocumentData {
    const userId = getAuth().currentUser?.uid
    if (userId == null) {
      throw new Error('Not logged in')
    }
    return event.toFirestore(userId)
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): BokudeliEvent {
    const data = snapshot.data(options)
    const community_id = snapshot.ref.parent.parent!.id
    return new BokudeliEvent(community_id, snapshot.id, data)
  },
}

const menuConverter: FirestoreDataConverter<EventMenu> = {
  toFirestore(menu: EventMenu): DocumentData {
    return menu.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EventMenu {
    const data = snapshot.data(options)
    const event_id = snapshot.ref.parent.parent!.id
    return new EventMenu(event_id, snapshot.id, data)
  },
}

const orderConverter: FirestoreDataConverter<EventOrder> = {
  toFirestore(order: EventOrder): DocumentData {
    return order.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EventOrder {
    const data = snapshot.data(options)
    const event_id = snapshot.ref.parent.parent!.id
    return new EventOrder(event_id, snapshot.id, data)
  },
}

export const createNewEvent = async (event: BokudeliEvent, coverImage: File): Promise<BokudeliEvent> => {
  const communityRef = doc(db, 'communities', event.community_id)
  const community = await getDoc(communityRef)
  if (!community.exists()) {
    throw new Error(`community ${event.community_id} does not exists`)
  }
  event.event_cover_url = await uploadEventImage(community.id, event.id, coverImage)
  event.bill_fullname = community.get('community_bill_fullname') ?? community.get('community_manager_fullname') ?? ''
  event.bill_email = community.get('community_bill_email') ?? community.get('community_email') ?? ''
  const newEventRef = doc(communityRef, 'events', event.id).withConverter(eventConverter)
  await setDoc(newEventRef, event, { merge: true })
  return event
}

export type EventStore = ReturnType<typeof useEventStore>

export const useEventStore = (target: string | BokudeliEvent) => {
  let eventId: string
  if (target instanceof BokudeliEvent) {
    eventId = target.id
  } else {
    eventId = target
  }
  const store = defineStore(`/events/${eventId}`, () => {
    const EVENT_TYPE_EVENT_REF_UPDATED = `onEventRefUpdated_${eventId}`
    const exists = ref<boolean | null>(null)
    const event = ref<BokudeliEvent | null>(target instanceof BokudeliEvent ? target : null)
    const _orders = ref<EventOrder[] | null>(null)
    const _members = ref<{ user_id: string; store: UserStore }[] | null>(null)
    const _menus = ref<EventMenu[] | null>(null)
    const _eventRef = ref<DocumentReference<BokudeliEvent> | null>(null)

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

    const getEventRef = async (): Promise<DocumentReference<BokudeliEvent>> => {
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

    const orders = computed<EventOrder[] | null>(() => {
      getEventRef().then((eventRef) => {
        subscribeOrders(eventRef)
      })
      return _orders.value
    })

    const menus = computed<EventMenu[] | null>(() => {
      getEventRef().then((eventRef) => {
        subscribeMenus(eventRef)
      })
      const sortedMenus =
        _menus.value?.sort((a, b) => {
          // 更新日時でソート
          return (b.updatedAt?.valueOf() ?? 0) - (a.updatedAt?.valueOf() ?? 0)
        }) ?? null
      return sortedMenus
    })

    const confirmedOrders = computed<EventOrder[] | null>(() => {
      getEventRef().then((eventRef) => {
        subscribeOrders(eventRef)
      })
      return _orders.value?.filter((order) => order.status === 'ordered') ?? null
    })

    const members = computed<BokudeliEventMember[] | null>(
      () =>
        _members.value?.flatMap((member) => {
          const target = _orders.value?.filter((order) => order.user_id === member.user_id) ?? ([] as EventOrder[])
          const orders = new Proxy(target, {
            get: (target, prop, receiver) => {
              getEventRef().then((eventRef) => {
                subscribeOrders(eventRef)
              })
              return Reflect.get(target, prop, receiver)
            },
          })
          const m: BokudeliEventMember =
            member.store.user == null
              ? // User をローディングする間にダミーの写真を表示するためにダミーユーザーを作成するが、
                // この一時代入は良くないので、明示的にローディング中であることを判断できる仕組みが必要
                new BokudeliEventMember(member.user_id, { user_name: '' })
              : new BokudeliEventMember(member.user_id, member.store.user)
          m.orders = orders
          return m
        }) ?? null,
    )

    const updateEvent = async (data: BokudeliEvent) => {
      const eventRef = await getEventRef()
      await setDoc(eventRef, data, { merge: true })
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

    const addOrder = async (data: Partial<EventOrder>): Promise<string> => {
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
      status: EventOrder['status'],
    ): Promise<void> => {
      await update_order_status({ ...order, status })
    }

    const deleteEvent = async (): Promise<void> => {
      return updateDoc(await getEventRef(), { is_deleted: true })
    }

    let unsubscribeEvent: Unsubscribe | null = null
    const subscribeEvent = (eventRef: DocumentReference<BokudeliEvent>) => {
      if (unsubscribeEvent == null) {
        unsubscribeEvent = onSnapshot(eventRef, (doc) => {
          try {
            event.value = doc.data() ?? null
            _members.value =
              event.value?.members?.map((memberId) => ({
                user_id: memberId,
                store: useUserStore(memberId) as UserStore,
              })) ?? []
          } catch (err) {
            console.error(err)
          }
        })
      }
    }
    let unsubscribeOrders: Unsubscribe | null = null
    const subscribeOrders = (eventRef: DocumentReference) => {
      if (unsubscribeOrders == null) {
        const ordersRef = collection(eventRef, 'orders').withConverter(orderConverter)
        unsubscribeOrders = onSnapshot(ordersRef, (ordersSnapshot) => {
          _orders.value = ordersSnapshot.docs.flatMap((o) => {
            try {
              const order = o.data()
              // https://github.com/nijuniinc/bokudeli-event-new/issues/729
              order.created_at = order.created_at ?? order.created_at
              return order
            } catch (err) {
              console.error(err)
              return []
            }
          })
        })
      }
    }

    let unsubscribeMenus: Unsubscribe | null = null
    const subscribeMenus = (eventRef: DocumentReference) => {
      if (unsubscribeMenus == null) {
        const menusRef = collection(eventRef, 'menus').withConverter(menuConverter)
        unsubscribeMenus = onSnapshot(menusRef, (menusSnapshot) => {
          _menus.value = menusSnapshot.docs.flatMap((m) => {
            try {
              return m.data()
            } catch (err) {
              console.error(err)
              return []
            }
          })
        })
      }
    }

    let retry = 0
    const subscribe = () =>
      getDocs(
        query(collectionGroup(db, 'events'), where('event_id', '==', eventId)).withConverter(eventConverter),
      ).then((querySnapshot) => {
        const eventRef = querySnapshot.docs[0]?.ref?.withConverter(eventConverter)
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
          // TODO: マイページ動作しないため、一時的にコメントアウト
          // router.replace('/404')
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
  })
  return store()
}
