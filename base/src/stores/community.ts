import { ref, computed, watch, toRaw } from 'vue'
import { defineStore } from 'pinia'
import _ from 'lodash'
import { getAuth } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  setDoc,
  type DocumentReference,
  type Unsubscribe,
  type FirestoreDataConverter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { Community } from '@shokujii/common/schemas/Community.js'
import { CommunityMember, CommunityMemberRolesType } from '@shokujii/common/schemas/CommunityMember.js'
import { BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useUserStore } from '@shokujii/base/stores/user.js'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import { User } from '@shokujii/common/schemas/User.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { uploadCommunityImage } from '@shokujii/base/composable/uploadImage.js'
import { useConfigStore } from './config.js'

class CommunityRefUpdatedEvent extends Event {
  constructor(
    type: string,
    public communityRef: DocumentReference<BokudeliCommunity>,
  ) {
    super(type)
  }
}

/**
 * 将来的にユーティリティ関数などを定義する
 */
export class BokudeliCommunity extends Community {
  constructor(communityId: string | null, src: Partial<Community>) {
    communityId = communityId ?? doc(collection(db, 'communities')).id
    super(communityId, src)
  }
}

/**
 * 将来的にユーティリティ関数などを定義する
 */
export class BokudeliCommunityMember extends User {
  // 多重継承が出来ないので CommunityMember のプロパティを手動で追加する
  roles: CommunityMemberRolesType[] = []
}

// communityList で使用するために export するが、他では使用しないように
export const communityConverter: FirestoreDataConverter<BokudeliCommunity> = {
  toFirestore(community: BokudeliCommunity): DocumentData {
    return community.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): BokudeliCommunity {
    return new BokudeliCommunity(snapshot.id, snapshot.data(options))
  },
}

const communityMemberConverter: FirestoreDataConverter<CommunityMember> = {
  toFirestore(member: CommunityMember): DocumentData {
    return member.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): CommunityMember {
    return new CommunityMember(snapshot.id, snapshot.data(options))
  },
}

export const createNewCommunity = async (
  community: BokudeliCommunity,
  coverImageFile: File | null,
  iconImageFile: File | null,
): Promise<CommunityStore> => {
  // TODO loginUserStore など共通のソースにする
  const uid = getAuth().currentUser?.uid
  if (uid == null) {
    throw new Error('Not Logged in')
  }
  const [coverImageUrl, iconImageUrl] = await Promise.all([
    coverImageFile != null ? uploadCommunityImage(community.id, coverImageFile) : null,
    iconImageFile != null ? uploadCommunityImage(community.id, iconImageFile) : null,
  ])
  if (coverImageUrl != null) {
    community.community_cover_image_url = coverImageUrl
  }
  if (iconImageUrl != null) {
    community.community_icon_image_url = iconImageUrl
  }
  const communityRef = doc(db, 'communities', community.id).withConverter(communityConverter)
  const memberRef = doc(communityRef, 'members', uid)
  await Promise.all([
    setDoc(communityRef, community, { merge: true }),
    // TODO withConverter
    setDoc(memberRef, { roles: ['manager'] }),
  ])
  return useCommunityStore(community)
}

export type CommunityStore = ReturnType<typeof useCommunityStore>

export const useCommunityStore = (target: string | BokudeliCommunity) => {
  const communityAccount: string = target instanceof BokudeliCommunity ? target.community_account : target
  // store の Identifier が firestore の path と異なるのは危険だが、この store 内に閉じている場合は問題ないはず
  const store = defineStore(`/communities/${communityAccount}`, () => {
    const EVENT_TYPE_COMMUNITY_REF_UPDATED = `onCommunityRefUpdated_${communityAccount}`
    const community = ref<BokudeliCommunity | null>(target instanceof BokudeliCommunity ? target : null)
    const eventStores = ref<Map<string, EventStore> | null>(null)
    const _communityRef = ref<DocumentReference<BokudeliCommunity> | null>(null)

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

    const getCommunityRef = async (): Promise<DocumentReference<BokudeliCommunity>> => {
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

    const members = computed<(BokudeliCommunityMember | null)[] | null>(() => {
      if (community.value == null || _communityRef.value == null) {
        return null
      }
      const members = community.value.members
      const managers = community.value.managers
      return members.flatMap((doc: DocumentReference) => {
        const userStore = useUserStore(doc.id)
        if (userStore.user == null) {
          return []
        }
        const roles: CommunityMemberRolesType[] = []
        if (managers.find((manager) => manager.id === doc.id) != null) {
          roles.push('manager')
        }
        return { ...userStore.user, roles }
      })
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
        .sort((a, b) => (b.event_start_datetime ?? 0) - (a.event_start_datetime ?? 0))
    })

    const updateCommunity = async (data: BokudeliCommunity) => {
      const communityRef = await getCommunityRef()
      const updateData = _.omit(data, ['community_cover_image_url', 'community_icon_image_url'])
      await updateDoc(communityRef, updateData)
    }

    const updateCoverImage = async (file: File) => {
      const communityRef = await getCommunityRef()
      const community_cover_image_url = await uploadCommunityImage(communityRef.id, file)
      await updateDoc(communityRef, { community_cover_image_url })
    }

    const updateIconImage = async (file: File) => {
      const communityRef = await getCommunityRef()
      const community_icon_image_url = await uploadCommunityImage(communityRef.id, file)
      await updateDoc(communityRef, { community_icon_image_url })
    }

    let unsubscribeCommunity: Unsubscribe | null = null
    const subscribeCommunity = (communityRef: DocumentReference<BokudeliCommunity>) => {
      if (unsubscribeCommunity == null) {
        unsubscribeCommunity = onSnapshot(communityRef.withConverter(communityConverter), (doc) => {
          try {
            community.value = doc.data() ?? null
          } catch (err) {
            console.error(err)
          }
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
    const subscribe = () =>
      getDocs(
        query(collection(db, 'communities'), where('community_account', '==', communityAccount)).withConverter(
          communityConverter,
        ),
      ).then((querySnapshot) => {
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
      })

    const unsubscribe = () => {
      retry = 0
      unsubscribeCommunity?.()
      unsubscribeCommunity = null
    }

    if (_communityRef.value == null) {
      subscribe()
    } else {
      subscribeCommunity(toRaw(_communityRef.value))
    }

    const getCurrentUserRoles = async () => {
      const communityRef = await getCommunityRef()
      const userId = useCurrentUserStore().firebaseUser?.uid
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

    const joinCommunity = async (userId?: string) => {
      const uid = userId ?? getAuth().currentUser?.uid
      if (uid == null) {
        throw new Error('not-logged-in')
      }
      const communityRef = await getCommunityRef()
      const memberRef = doc(communityRef, 'members', uid).withConverter(communityMemberConverter)
      const member = new CommunityMember(uid, {})
      await setDoc(memberRef, member, { merge: true })
    }

    const leaveCommunity = async (userId?: string) => {
      const uid = userId ?? getAuth().currentUser?.uid
      if (uid == null) {
        throw new Error('not-logged-in')
      }
      const communityRef = await getCommunityRef()
      const memberRef = doc(communityRef, 'members', uid).withConverter(communityMemberConverter)
      const memberDoc = await getDoc(memberRef)
      if (!memberDoc.exists()) {
        return
      }
      const roles = memberDoc.data()?.roles ?? []
      if (roles.includes('manager')) {
        throw new Error('manager-cannot-leave')
      }
      await deleteDoc(memberRef)
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
      joinCommunity,
      leaveCommunity,
      subscribe,
      unsubscribe,
      getCurrentUserRoles,
      $reset: () => {
        unsubscribe()
        subscribe()
      },
    }
  })
  return store()
}
