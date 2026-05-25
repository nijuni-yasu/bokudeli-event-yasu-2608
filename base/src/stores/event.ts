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
  type DocumentReference,
  type Unsubscribe,
  type FirestoreDataConverter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { EventMenu } from '@shokujii/common/schemas/EventMenu.js'
import { User } from '@shokujii/common/schemas/User.js'
import { useUserStore, type UserStore } from './user.js'
import { Event as _Event } from '@shokujii/common/schemas/Event.js'
import { getAuth } from 'firebase/auth'
import { AddToCartRequest, RemoveFromCartRequest, ConfirmOrderRequest } from '@shokujii/common/apis/order.js'
import { generateTinymceImageStoragePath, getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import {
  addToCart as _addToCart,
  removeFromCart as _removeFromCart,
  confirmOrder as _confirmOrder,
} from '@shokujii/base/apis/order.js'
import { updateEventMenus as _updateEventMenus } from '@shokujii/base/apis/eventMenu.js'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'
import { ZodError } from 'zod'
import { copyCommunityCoverToEvent as callCopyCommunityCoverToEvent } from '@shokujii/base/apis/copyCommunityCoverToEvent.js'
import { resizeImage } from '@shokujii/base/utils/image.js'
import { uploadImage, convertStoragePathToURL } from '@shokujii/base/utils/storage.js'

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
  orders: EventMemberOrder[] = []
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

const memberOrderConverter: FirestoreDataConverter<EventMemberOrder> = {
  toFirestore(order: EventMemberOrder): DocumentData {
    return order.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EventMemberOrder {
    const data = snapshot.data(options)
    return new EventMemberOrder(snapshot.id, data)
  },
}

export const createNewEvent = async (event: BokudeliEvent, coverImage: File | null): Promise<BokudeliEvent> => {
  const communityRef = doc(db, 'communities', event.community_id)
  const community = await getDoc(communityRef)
  if (!community.exists()) {
    throw new Error(`community ${event.community_id} does not exists`)
  }
  if (coverImage == null) {
    // Callable でコミュニティカバーをコピー。Storage にコミュニティカバーが無い場合は Callable が失敗し setDoc には進まない。
    await callCopyCommunityCoverToEvent({ communityId: community.id, eventId: event.id })
  } else {
    await uploadImage(coverImage, getEventCoverStoragePath(community.id, event.id))
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
    const _coverImageCacheBuster = ref(0)
    const _orders = ref<EventMemberOrder[] | null>(null)
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

    const orders = computed<EventMemberOrder[] | null>(() => {
      subscribeOrders()
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

    const confirmedOrders = computed<EventMemberOrder[] | null>(() => {
      subscribeOrders()
      return _orders.value?.filter((order) => order.status === 'ordered') ?? null
    })

    const members = computed<BokudeliEventMember[] | null>(
      () =>
        _members.value?.flatMap((member) => {
          const target =
            _orders.value?.filter((order) => order.user_id === member.user_id) ?? ([] as EventMemberOrder[])
          const orders = new Proxy(target, {
            get: (target, prop, receiver) => {
              subscribeOrders()
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

    const coverImageUrl = computed<string | undefined>(() => {
      const communityId = event.value?.community_id
      const eid = event.value?.id
      if (communityId == null || eid == null) {
        return undefined
      }
      const base = convertStoragePathToURL(getEventCoverStoragePath(communityId, eid))
      return _coverImageCacheBuster.value > 0 ? `${base}&t=${_coverImageCacheBuster.value}` : base
    })

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
      await uploadImage(coverImage, getEventCoverStoragePath(communityId, eventId))
      _coverImageCacheBuster.value = Date.now()
    }

    const uploadTinymceImage = async (image: File): Promise<string> => {
      const eventRef = await getEventRef()
      const communityId = eventRef.parent?.parent?.id
      if (communityId == null) {
        console.warn(`These values must be set. eventRef: ${eventRef} communityId: ${communityId}`)
        throw new Error('communityId is undefined. Cannot upload image during new event creation.')
      }
      const resized = await resizeImage(image, TINYMCE_MAX_IMAGE_SIZE)
      const storagePath = generateTinymceImageStoragePath(communityId, eventId)
      await uploadImage(resized, storagePath)
      return convertStoragePathToURL(storagePath)
    }

    const addToCart = async (data: AddToCartRequest): Promise<void> => {
      await _addToCart(data)
    }

    const removeFromCart = async (data: RemoveFromCartRequest): Promise<void> => {
      await _removeFromCart(data)
    }

    const confirmOrder = async (data: ConfirmOrderRequest): Promise<void> => {
      await _confirmOrder(data)
    }

    const deleteEvent = async (): Promise<void> => {
      return updateDoc(await getEventRef(), { is_deleted: true })
    }

    let pendingLoadedEventReject: ((reason: unknown) => void) | null = null
    let pendingLoadedEventCleanup: (() => void) | null = null

    const rejectPendingLoadedEvent = (reason: unknown) => {
      const reject = pendingLoadedEventReject
      const cleanup = pendingLoadedEventCleanup
      pendingLoadedEventReject = null
      pendingLoadedEventCleanup = null
      cleanup?.()
      reject?.(reason)
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
            reportClientError(err, { documentPath: doc.ref.path, severity: 'warn' })
            if (err instanceof ZodError) {
              rejectPendingLoadedEvent(err)
            }
          }
        })
      }
    }

    let unsubscribeOrders: Unsubscribe | null = null
    const subscribeOrders = () => {
      if (unsubscribeOrders == null) {
        const ordersQuery = query(collectionGroup(db, 'member_orders'), where('event_id', '==', eventId)).withConverter(
          memberOrderConverter,
        )
        unsubscribeOrders = onSnapshot(ordersQuery, (ordersSnapshot) => {
          _orders.value = ordersSnapshot.docs.flatMap((orderDoc) => {
            try {
              return orderDoc.data()
            } catch (err) {
              console.error(err)
              reportClientError(err, { documentPath: orderDoc.ref.path, severity: 'warn' })
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
              reportClientError(err, { documentPath: m.ref.path, severity: 'warn' })
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
        const cleanup = () => {
          clearTimeout(timeoutId)
          unwatch?.()
          if (pendingLoadedEventReject === reject) {
            pendingLoadedEventReject = null
            pendingLoadedEventCleanup = null
          }
        }
        const timeoutId = setTimeout(() => {
          cleanup()
          reject(new Error(`Event not loaded within ${timeout}ms`))
        }, timeout)
        pendingLoadedEventReject = reject
        pendingLoadedEventCleanup = cleanup
        unwatch = watch(
          event,
          (e) => {
            if (e != null) {
              cleanup()
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
      coverImageUrl,
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
      addToCart,
      removeFromCart,
      confirmOrder,
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
