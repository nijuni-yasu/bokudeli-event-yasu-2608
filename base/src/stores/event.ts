import { ref, computed, watch, toRaw } from 'vue'
import { defineStore } from 'pinia'
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
import { db } from '@shokujii/base/firebase.js'
import { EventOrder } from '@shokujii/common/schemas/EventOrder.js'
import { EventMenu } from '@shokujii/common/schemas/EventMenu.js'
import { User } from '@shokujii/common/schemas/User.js'
import { useUserStore, type UserStore } from './user.js'
import { Event as _Event } from '@shokujii/common/schemas/Event.js'
import { getAuth } from 'firebase/auth'
import { AddOrderRequest } from '@shokujii/common/apis/order.js'
import { generateTinymceImageStoragePath, getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import {
  addOrder as _addOrder,
  updateOrderStatus as _updateOrderStatus,
  updateMenuCountInCart as _updateMenuCountInCart,
  deleteMenuInCart as _deleteMenuInCart,
} from '@shokujii/base/apis/order.js'
import { updateEventMenus as _updateEventMenus } from '@shokujii/base/apis/eventMenu.js'
import { resizeImage } from '@shokujii/base/utils/image.js'
import { uploadImage } from '@shokujii/base/utils/storage.js'

const TINYMCE_MAX_IMAGE_SIZE = 600

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

// cart で使用するので export するが stores 以外では使用しないように注意
export const orderConverter: FirestoreDataConverter<EventOrder> = {
  toFirestore(order: EventOrder): DocumentData {
    return order.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EventOrder {
    const data = snapshot.data(options)
    const event_id = snapshot.ref.parent.parent!.id
    return new EventOrder(event_id, snapshot.id, data)
  },
}

export const createNewEvent = async (event: BokudeliEvent, coverImage: File | null): Promise<BokudeliEvent> => {
  const communityRef = doc(db, 'communities', event.community_id)
  const community = await getDoc(communityRef)
  if (!community.exists()) {
    throw new Error(`community ${event.community_id} does not exists`)
  }
  if (coverImage != null) {
    // updateCoverImage を使うべきだが、event document 作成前のため今は使えない
    // 将来的に event_cover_url を廃止するので、そのタイミングで統一する
    event.event_cover_url = await uploadImage(coverImage, getEventCoverStoragePath(community.id, event.id))
  }
  // event_cover_urlが設定されていない場合はエラー
  if (!event.event_cover_url) {
    throw new Error('event_cover_url must be set')
  }
  const newEventRef = doc(communityRef, 'events', event.id).withConverter(eventConverter)
  await setDoc(newEventRef, event, { merge: true })
  return event
}

export const updateEventMenus = async (
  eventId: string,
  communityId: string,
  selectedMenuIds: string[],
): Promise<void> => {
  await _updateEventMenus({
    eventId,
    communityId,
    selectedMenuIds,
  })
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
          // menu_sort_numberでソート（昇順）
          return a.menu_sort_number - b.menu_sort_number
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
      const event_cover_url = await uploadImage(coverImage, getEventCoverStoragePath(communityId, eventId))
      const data = {
        updated_at: Timestamp.now(),
        event_cover_url,
      }
      return await updateDoc(eventRef, data)
    }

    const uploadTinymceImage = async (image: File): Promise<string> => {
      const eventRef = await getEventRef()
      const communityId = eventRef.parent?.parent?.id
      if (communityId == null) {
        console.warn(`These values must be set. eventRef: ${eventRef} communityId: ${communityId}`)
        throw new Error('communityId is undefined. Cannot upload image during new event creation.')
      }
      const resized = await resizeImage(image, TINYMCE_MAX_IMAGE_SIZE)
      const url = await uploadImage(resized, generateTinymceImageStoragePath(communityId, eventId))
      return url
    }

    const addOrder = async (data: AddOrderRequest): Promise<string> => {
      const response = await _addOrder(data)
      return response.data.order_id
    }

    const updateMenuCountInCart = async (
      order: { community_id: string; event_id: string; order_id: string },
      menu_id: string,
      count: number,
    ): Promise<void> => {
      await _updateMenuCountInCart({ ...order, menu_id, count })
    }

    const deleteMenuInCart = async (
      order: { community_id: string; event_id: string; order_id: string },
      menu_id: string,
    ): Promise<void> => {
      await _deleteMenuInCart({ ...order, menu_id })
    }

    const updateOrderStatus = async (
      order: { community_id: string; event_id: string; order_id: string },
      status: EventOrder['status'],
    ): Promise<void> => {
      await _updateOrderStatus({ ...order, status })
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
          _orders.value = ordersSnapshot.docs.flatMap((o) => o.data())
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

    /**
     * Wait for the event to be loaded.
     * It's better not to use this method in UI components because of the performance issue.
     *
     * @param timeout [ms]
     * @returns Promise<BokudeliEvent> when the event is loaded
     * @throws Error when the event is not loaded within the timeout
     */
    const getLoadedEvent = async (timeout: number = 5000): Promise<BokudeliEvent> => {
      return await new Promise((resolve, reject) => {
        let unwatch: (() => void) | undefined
        const timeoutId = setTimeout(() => {
          unwatch?.()
          reject(new Error(`Event not loaded within ${timeout}ms`))
        }, timeout)
        unwatch = watch(
          event,
          (e) => {
            if (e != null) {
              clearTimeout(timeoutId)
              unwatch?.()
              resolve(e)
            }
          },
          { immediate: true },
        )
      })
    }

    /**
     * Wait for the members to be loaded.
     * It's better not to use this method in UI components because of the performance issue.
     *
     * @param timeout [ms]
     * @returns Promise<BokudeliEventMember[]> when the members are loaded
     * @throws Error when the members are not loaded within the timeout
     */
    const getLoadedMembers = async (timeout: number = 5000): Promise<BokudeliEventMember[]> => {
      return await new Promise((resolve, reject) => {
        let unwatch: (() => void) | undefined
        const timeoutId = setTimeout(() => {
          unwatch?.()
          reject(new Error(`Members not loaded within ${timeout}ms`))
        }, timeout)
        unwatch = watch(
          members,
          (ms) => {
            if (ms != null) {
              clearTimeout(timeoutId)
              unwatch?.()
              resolve(ms)
            }
          },
          { immediate: true },
        )
      })
    }

    /**
     * Wait for the menus to be loaded.
     * It's better not to use this method in UI components because of the performance issue.
     *
     * @param timeout [ms]
     * @returns Promise<EventMenu[]> when the menus are loaded
     * @throws Error when the menus are not loaded within the timeout
     */
    const getLoadedMenus = async (timeout: number = 5000): Promise<EventMenu[]> => {
      return await new Promise((resolve, reject) => {
        let unwatch: (() => void) | undefined
        const timeoutId = setTimeout(() => {
          unwatch?.()
          reject(new Error(`Menus not loaded within ${timeout}ms`))
        }, timeout)
        unwatch = watch(
          menus,
          (ms) => {
            if (ms != null) {
              clearTimeout(timeoutId)
              unwatch?.()
              resolve(ms)
            }
          },
          { immediate: true },
        )
      })
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
      getLoadedEvent,
      getLoadedMembers,
      getLoadedMenus,
      updateEvent,
      updateCoverImage,
      uploadTinymceImage,
      addOrder,
      updateMenuCountInCart,
      deleteMenuInCart,
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
