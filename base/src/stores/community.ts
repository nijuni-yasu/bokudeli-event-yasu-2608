import { type Ref } from 'vue'
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
  DocumentSnapshot,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore'
import { convertDocumentDataToCommunity } from '@/schemes/converter'
import type { StateTree, Store } from 'pinia'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { FirestoredUser } from '@/schemes/storedUser'
import { type CommunityMember, convertCommunityMemberToDocumentData } from '@/schemes/communityMember'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { useUserStore } from '@/stores/user'
import { useEventStore, type EventStore } from '@/stores/event'
import { useStoreStoredUser } from '@/stores/storedUser'
import { uploadCommunityImage } from '@/composable/uploadImage'
import { useConfigStore } from './config'

class CommunityRefUpdatedEvent extends Event {
  constructor(
    type: string,
    public communityRef: DocumentReference,
  ) {
    super(type)
  }
}

type CommunityStoreState = {
  community: Ref<BokudeliCommunity | null>
} & StateTree

type CommunityGetters = {
  members: Ref<(CommunityMember | null)[] | null>
  events: Ref<BokudeliEvent[] | null>
}

type CommunityStoreAction = {
  updateCommunity: (data: BokudeliCommunity) => Promise<void>
  updateCoverImage: (coverImage: File) => Promise<void>
  updateIconImage: (iconImage: File) => Promise<void>
  addRole: (userId: string, role: string) => Promise<void>
  removeRole: (userId: string, role: string) => Promise<void>
  subscribe: () => Promise<void>
  unsubscribe: () => void
  getCurrentUserRoles: () => Promise<string[] | null>
}

export type CommunityStore = Store<string, CommunityStoreState, CommunityGetters, CommunityStoreAction>

export const useCommunityStore = (target: string | DocumentSnapshot) => {
  let communityAccount: string
  if (target instanceof DocumentSnapshot) {
    communityAccount = target.get('community_account')
  } else {
    communityAccount = target
  }
  // store の Identifier が firestore の path と異なるのは危険だが、この store 内に閉じている場合は問題ないはず
  const store = defineStore<string, CommunityStoreState & CommunityGetters & CommunityStoreAction>(
    `/communities/${communityAccount}`,
    () => {
      const router = useRouter()

      const EVENT_TYPE_COMMUNITY_REF_UPDATED = `onCommunityRefUpdated_${communityAccount}`
      const exists = ref<boolean | null>(null)
      const community = ref<BokudeliCommunity | null>(null)
      const eventStores = ref<Map<string, EventStore> | null>(null)
      const _communityRef = ref<DocumentReference | null>(target instanceof DocumentSnapshot ? target.ref : null)

      const onCommunityUpdated = (doc: DocumentSnapshot) => {
        exists.value = doc.exists()
        const data = doc.data()
        community.value = data ? convertDocumentDataToCommunity(data) : null
        _communityRef.value = doc.ref
      }

      if (target instanceof DocumentSnapshot) {
        onCommunityUpdated(target)
      }

      watch(
        _communityRef,
        (newValue) => {
          if (newValue == null) {
            throw new Error('_communityRef can be null just as the initial value.')
          }
          document.dispatchEvent(new CommunityRefUpdatedEvent(EVENT_TYPE_COMMUNITY_REF_UPDATED, toRaw(newValue)))
        },
        { immediate: false },
      )

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

      const members = computed<(CommunityMember | null)[] | null>(() => {
        if (community.value == null || _communityRef.value == null) {
          return null
        }
        return (
          community.value.members?.flatMap((doc: DocumentReference) => {
            const userStore = useUserStore(doc.id)
            if (userStore.exists == null) {
              return null
            }
            const roles = []
            if (community.value?.managers.find((manager) => manager.id === doc.id) != null) {
              roles.push('manager')
            }
            // CAUTION: _.merge is mutable function
            return _.merge({}, userStore.user, { roles })
          }) ?? []
        )
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
          .flatMap((store) => (store.event == null ? [] : (store.event as BokudeliEvent)))
          .sort((a, b) => (b.event_start_datetime?.toMillis() ?? 0) - (a.event_start_datetime?.toMillis() ?? 0))
      })

      const updateCommunity = async (data: BokudeliCommunity) => {
        const communityRef = await getCommunityRef()
        const updateData = _.omit(data.convertToDocumentData(), [
          'community_cover_image_url',
          'community_icon_image_url',
        ])
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
          unsubscribeCommunity = onSnapshot(communityRef, onCommunityUpdated)
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
      const subscribe = () =>
        getDocs(query(collection(db, 'communities'), where('community_account', '==', communityAccount))).then(
          (querySnapshot) => {
            const communityRef = querySnapshot.docs[0]?.ref
            if (communityRef == null) {
              if (retry++ < 10) {
                console.warn(
                  `The community "${communityAccount}" does not exist. It may not have been created yet. It will retry in 500 ms.`,
                )
                window.setTimeout(subscribe, 500)
                return
              }
              console.error(`The community "${communityAccount}" does not exist. It ceased attempting to retry.`)
              // TODO: マイページ動作しないため、一時的にコメントアウト
              // router.replace('/404')
              return
            }
            retry = 0
            _communityRef.value = communityRef
            subscribeCommunity(communityRef)
            // 他の Store は遅延評価なので、以下を呼ぶ必要はない
            // subscribeEvents(communityRef)
          },
        )

      const unsubscribe = () => {
        retry = 0
        unsubscribeCommunity?.()
        unsubscribeCommunity = null
        unsubscribeEvents?.()
        unsubscribeEvents = null
      }

      if (_communityRef.value == null) {
        subscribe()
      } else {
        subscribeCommunity(toRaw(_communityRef.value))
      }

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
        const config = await useConfigStore().getResolvedConfig()
        if (config?.isSupport(userId) === true) {
          roles.add('manager')
        }
        return Array.from(roles)
      }

      const addRole = async (userId: string, role: string) => {
        const communityRef = await getCommunityRef()
        const memberRef = doc(communityRef, 'members', userId)
        const memberDoc = await getDoc(memberRef)
        const roles = Array.from(new Set(memberDoc.data()?.roles).add(role))
        await updateDoc(memberRef, { roles })
      }

      const removeRole = async (userId: string, role: string) => {
        const communityRef = await getCommunityRef()
        const memberRef = doc(communityRef, 'members', userId)
        const memberDoc = await getDoc(memberRef)
        const roles = memberDoc.data()?.roles?.filter((r: string) => r !== role)
        await updateDoc(memberRef, { roles })
      }

      return {
        community,
        members,
        events,
        updateCommunity,
        updateCoverImage,
        updateIconImage,
        addRole,
        removeRole,
        subscribe,
        unsubscribe,
        getCurrentUserRoles,
        $reset: () => {
          unsubscribe()
          subscribe()
        },
      }
    },
  )
  return store()
}
