import { ref, computed, watch, toRaw } from 'vue'
import { defineStore } from 'pinia'
import { getAuth } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  limit,
  query,
  updateDoc,
  where,
  onSnapshot,
  setDoc,
  Timestamp,
  runTransaction,
  deleteField,
  type DocumentReference,
  type Unsubscribe,
  type FirestoreDataConverter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'
import { db, storage } from '@shokujii/base/firebase.js'
import { deleteObject, ref as storageRef } from 'firebase/storage'
import { Community } from '@shokujii/common/schemas/Community.js'
import { CommunityMember, CommunityMemberRolesType } from '@shokujii/common/schemas/CommunityMember.js'
import {
  getCommunityAlbumItemStoragePath,
  getCommunityCoverStoragePath,
  getCommunityIconStoragePath,
} from '@shokujii/common/utils/storagePaths.js'
import { AlbumItem } from '@shokujii/common/schemas/AlbumItem.js'
import { BokudeliEvent } from '@shokujii/base/stores/event.js'
import { getUserRef, useUserStore } from '@shokujii/base/stores/user.js'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import { User } from '@shokujii/common/schemas/User.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { uploadAlbumImage, uploadImage, convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'
import { useConfigStore } from './config.js'
import { TaskExecutor } from '../utils/executors.js'
import {
  buildCommunityLookupConstraints,
  resolveCommunityStoreKey,
  resolveEffectiveEnterpriseId,
  type CommunityStoreScope,
} from '@shokujii/base/stores/communityScope.js'
import { resolveEventStoreOptionsFromInjectedEnterpriseId } from '@shokujii/base/stores/eventStoreOptions.js'

export type { CommunityStoreScope } from '@shokujii/base/stores/communityScope.js'
export {
  buildCommunityLookupConstraints,
  resolveCommunityStoreKey,
  resolveCommunityEnterpriseIdForQuery,
} from '@shokujii/base/stores/communityScope.js'

const MEMBER_LOAD_BATCH_SIZE = 10

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

export class BokudeliAlbumItem extends AlbumItem {
  readonly community_id: string

  constructor(communityId: string, albumItemId: string | null, src: Partial<AlbumItem>) {
    const id = albumItemId ?? doc(collection(db, 'communities', communityId, 'album_items')).id
    super(id, src)
    this.community_id = communityId
  }
}

const albumItemConverter: FirestoreDataConverter<BokudeliAlbumItem> = {
  toFirestore(item: BokudeliAlbumItem): DocumentData {
    return item.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): BokudeliAlbumItem {
    const data = snapshot.data(options)
    const communityId = snapshot.ref.parent.parent!.id
    return new BokudeliAlbumItem(communityId, snapshot.id, data)
  },
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
  const communityRef = doc(db, 'communities', community.id).withConverter(communityConverter)
  const memberRef = doc(communityRef, 'members', uid)
  await Promise.all([
    setDoc(communityRef, community, { merge: true }),
    // TODO withConverter
    setDoc(memberRef, { roles: ['manager'] }),
  ])
  await Promise.all([
    coverImageFile != null ? uploadImage(coverImageFile, getCommunityCoverStoragePath(community.id)) : null,
    iconImageFile != null ? uploadImage(iconImageFile, getCommunityIconStoragePath(community.id)) : null,
  ])
  return useCommunityStore(community)
}

/**
 * ユーザーが管理しているコミュニティが1つ以上存在するかチェックする。
 * イベント開催ボタンの遷移先判定などに使用する。
 *
 * @param userId チェック対象のユーザーID
 * @returns 管理コミュニティが1件以上あれば true
 */
export const hasManagedCommunity = async (userId: string): Promise<boolean> => {
  const q = query(
    collection(db, 'communities').withConverter(communityConverter),
    where('managers', 'array-contains', getUserRef(userId)),
    limit(1),
  )
  const snapshot = await getDocs(q)
  return !snapshot.empty
}

/**
 * 指定 enterprise 内でユーザーが管理しているコミュニティが1件以上存在するかチェックする。
 * enterprise アプリのイベント主催導線など、テナント分離が必要な判定に使用する。
 */
export const hasManagedCommunityInEnterprise = async (userId: string, enterpriseId: string): Promise<boolean> => {
  const q = query(
    collection(db, 'communities').withConverter(communityConverter),
    where('enterprise_id', '==', enterpriseId),
    where('managers', 'array-contains', getUserRef(userId)),
    limit(1),
  )
  const snapshot = await getDocs(q)
  return !snapshot.empty
}

/**
 * ユーザーが唯一の管理者であるコミュニティが存在するかチェックする。
 * アカウント削除時に、唯一の管理者の場合は削除を許容しないため使用する。
 *
 * @param userId チェック対象のユーザーID
 * @returns 唯一の管理者であるコミュニティが1件以上あれば true
 */
export const checkSoleManagerCommunity = async (userId: string): Promise<boolean> => {
  const q = query(
    collection(db, 'communities').withConverter(communityConverter),
    where('managers', 'array-contains', getUserRef(userId)),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.some((d) => {
    const community = d.data()
    return (community.managers ?? []).length === 1
  })
}

export type CommunityStore = ReturnType<typeof useCommunityStore>

export async function resolveCommunityDocumentRef(
  communityAccount: string,
  scope?: CommunityStoreScope,
): Promise<DocumentReference<BokudeliCommunity>> {
  const querySnapshot = await getDocs(
    query(
      collection(db, 'communities').withConverter(communityConverter),
      ...buildCommunityLookupConstraints(communityAccount, scope),
      limit(2),
    ),
  )
  if (querySnapshot.docs.length === 0) {
    throw new Error(`Community "${communityAccount}" was not found for the given scope.`)
  }
  if (querySnapshot.docs.length > 1) {
    console.warn(`Multiple communities matched account "${communityAccount}" for scope; expected at most one document.`)
    throw new Error(`Community "${communityAccount}" is ambiguous for the given scope.`)
  }
  return querySnapshot.docs[0].ref.withConverter(communityConverter)
}

/**
 * コミュニティ store。文字列を渡す場合は community_account（URL スラッグ）で検索する。
 * Pinia store ID は `/communities/${scope}/${communityAccount}` だが、Firestore path は `_communityRef.id`（community_id）。
 */
export const useCommunityStore = (target: string | BokudeliCommunity, scope?: CommunityStoreScope) => {
  const communityAccount: string = target instanceof BokudeliCommunity ? target.community_account : target
  const resolvedEnterpriseId = resolveEffectiveEnterpriseId(
    target instanceof BokudeliCommunity ? target.enterprise_id : undefined,
    scope?.enterpriseId,
  )
  const storeKey = resolveCommunityStoreKey(resolvedEnterpriseId)
  const store = defineStore(`/communities/${storeKey}/${communityAccount}`, () => {
    const EVENT_TYPE_COMMUNITY_REF_UPDATED = `onCommunityRefUpdated_${storeKey}_${communityAccount}`
    const eventStoreOptions = resolveEventStoreOptionsFromInjectedEnterpriseId(resolvedEnterpriseId)
    const community = ref<BokudeliCommunity | null>(target instanceof BokudeliCommunity ? target : null)
    const eventStores = ref<Map<string, EventStore> | null>(null)
    const _communityRef = ref<DocumentReference<BokudeliCommunity> | null>(null)
    const _coverImageCacheBuster = ref(0)
    const _iconImageCacheBuster = ref(0)

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
            resolve((event as CommunityRefUpdatedEvent).communityRef.withConverter(communityConverter))
          }
          document.addEventListener(EVENT_TYPE_COMMUNITY_REF_UPDATED, listener)
          window.setTimeout(() => {
            document.removeEventListener(EVENT_TYPE_COMMUNITY_REF_UPDATED, listener)
            reject(new Error('getCommunityRef timeout'))
          }, 5000)
        } else {
          resolve(toRaw(_communityRef.value).withConverter(communityConverter))
        }
      })
    }

    const retrievedMembers = ref<(BokudeliCommunityMember | undefined)[]>([])
    const memberLoadExecutor = new TaskExecutor(MEMBER_LOAD_BATCH_SIZE)
    let memberLoadGeneration = 0
    const loadMembers = () => {
      // メンバー情報を常にクリアしてから再取得
      memberLoadExecutor.clear()
      retrievedMembers.value = []
      memberLoadGeneration += 1
      const currentGeneration = memberLoadGeneration

      const _members = community.value?.members as DocumentReference[] | undefined
      const _managers = community.value?.managers as DocumentReference[] | undefined
      if (_members === undefined || _managers == undefined) {
        return
      }
      // managers 優先で members と結合し、重複を削除する
      const membersWithManagersFirst = [...new Map([..._managers, ..._members].map((v) => [v.id, v])).values()]
      membersWithManagersFirst.forEach((memberRef: DocumentReference) => {
        memberLoadExecutor.addTask(async () => {
          const userStore = useUserStore(memberRef.id)
          const user = await userStore.getLoadedUser()
          // 再取得が発動済みなら古い結果を破棄（世代競合の防止）
          if (currentGeneration !== memberLoadGeneration) {
            return
          }
          if (user === undefined) {
            retrievedMembers.value.push(undefined)
          } else {
            const roles: CommunityMemberRolesType[] = []
            if (_managers.find((manager) => manager.id === memberRef.id) != null) {
              roles.push('manager')
            }
            retrievedMembers.value.push({ ...user, roles } as BokudeliCommunityMember)
          }
        })
      })
    }

    let isFirstMemberLoad = true
    // 読み込み中は null, ユーザーが存在しない場合は undefined
    // TODO 仕様検討
    const members = computed<(BokudeliCommunityMember | null | undefined)[] | null>(() => {
      if (community.value == null) {
        return null
      }
      // community 取得後に初回ロード（直接 URL / リロード時の競合を避ける）
      if (isFirstMemberLoad) {
        isFirstMemberLoad = false
        loadMembers()
      }
      // 負数にならないように Math.max でガード
      const remainingCount = Math.max(0, community.value.members.length - retrievedMembers.value.length)
      return [...retrievedMembers.value, ...Array(remainingCount).fill(null)]
    })

    // community.members が変更されたときにメンバー情報を再取得
    watch(
      () => community.value?.members,
      (newMembers, oldMembers) => {
        // 初回ロードは computed 内で実行されるのでスキップ
        if (oldMembers !== undefined && newMembers !== undefined) {
          // メンバー配列の参照または内容が変更された場合に再取得
          if (newMembers !== oldMembers) {
            loadMembers()
          }
        }
      },
    )

    const events = computed<BokudeliEvent[] | null>(() => {
      getCommunityRef()
        .then((communityRef) => {
          subscribeEvents(communityRef)
        })
        .catch((err) => {
          console.error('getCommunityRef for events failed', err)
          reportClientError(err, { documentPath: `communities/${communityAccount}`, severity: 'warn' })
        })
      if (eventStores.value == null) {
        return null
      }
      const stores = Array.from(eventStores.value.values())
      return stores
        .flatMap((store) => (store.event == null ? [] : (store.event as BokudeliEvent)))
        .sort((a, b) => (b.event_start_datetime ?? 0) - (a.event_start_datetime ?? 0))
    })

    const _albumItems = ref<BokudeliAlbumItem[] | null>(null)
    let unsubscribeAlbumItems: Unsubscribe | null = null

    const subscribeAlbumItems = (communityRef: DocumentReference<BokudeliCommunity>) => {
      if (unsubscribeAlbumItems != null) {
        return
      }
      const albumItemsRef = collection(communityRef, 'album_items').withConverter(albumItemConverter)
      unsubscribeAlbumItems = onSnapshot(
        albumItemsRef,
        (snapshot) => {
          _albumItems.value = snapshot.docs.flatMap((d) => {
            try {
              return [d.data()]
            } catch (err) {
              console.error(err)
              reportClientError(err, { documentPath: d.ref.path, severity: 'warn' })
              return []
            }
          })
        },
        (err) => {
          console.error('subscribeAlbumItems snapshot error', err)
          reportClientError(err, { documentPath: communityRef.path, severity: 'warn' })
          _albumItems.value = []
          unsubscribeAlbumItems?.()
          unsubscribeAlbumItems = null
        },
      )
    }

    const albumItems = computed(() => {
      if (community.value == null) {
        return null
      }
      const refRaw = _communityRef.value
      if (refRaw != null) {
        subscribeAlbumItems(toRaw(refRaw))
      }
      if (_albumItems.value == null) {
        return null
      }
      const ids = community.value.community_album_item_ids ?? []
      const itemMap = new Map(_albumItems.value.map((item) => [item.id, item]))
      const idSet = new Set(ids)
      const ordered = ids.flatMap((id) => {
        const i = itemMap.get(id)
        return i !== undefined ? [i] : []
      })
      const extras = _albumItems.value.filter((item) => !idSet.has(item.id))
      return [...ordered, ...extras]
    })

    const addAlbumItem = async (file: File) => {
      const maxBytes = 10 * 1024 * 1024
      if (file.size > maxBytes) {
        throw new Error('album-file-too-large')
      }
      await getLoadedCommunity()
      const communityRef = await getCommunityRef()
      const communityId = communityRef.id
      const albumItemId = doc(collection(communityRef, 'album_items')).id
      const path = getCommunityAlbumItemStoragePath(communityId, albumItemId)
      await uploadAlbumImage(file, path)
      const now = Date.now()
      const item = new BokudeliAlbumItem(communityId, albumItemId, {
        album_caption: '',
        created_at: now,
        updated_at: now,
      })
      const itemRef = doc(communityRef, 'album_items', albumItemId).withConverter(albumItemConverter)
      await runTransaction(db, async (transaction) => {
        const commSnap = await transaction.get(communityRef)
        if (!commSnap.exists()) {
          throw new Error('Community not found')
        }
        const currentIds = commSnap.data()?.community_album_item_ids ?? []
        transaction.set(itemRef, item)
        transaction.update(communityRef, {
          community_album_item_ids: [...currentIds, albumItemId],
          updated_at: Timestamp.now(),
        })
      })
    }

    const deleteAlbumItem = async (albumItemId: string) => {
      await getLoadedCommunity()
      const communityRef = await getCommunityRef()
      const communityId = communityRef.id
      const itemRef = doc(communityRef, 'album_items', albumItemId).withConverter(albumItemConverter)
      await runTransaction(db, async (transaction) => {
        const commSnap = await transaction.get(communityRef)
        if (!commSnap.exists()) {
          throw new Error('Community not found')
        }
        const currentIds = commSnap.data()?.community_album_item_ids ?? []
        transaction.delete(itemRef)
        transaction.update(communityRef, {
          community_album_item_ids: currentIds.filter((id) => id !== albumItemId),
          updated_at: Timestamp.now(),
        })
      })
      try {
        await deleteObject(storageRef(storage, getCommunityAlbumItemStoragePath(communityId, albumItemId)))
      } catch (e) {
        console.error('Failed to delete album storage object', e)
      }
    }

    const replaceAlbumImage = async (albumItemId: string, file: File) => {
      const maxBytes = 10 * 1024 * 1024
      if (file.size > maxBytes) {
        throw new Error('album-file-too-large')
      }
      await getLoadedCommunity()
      const communityRef = await getCommunityRef()
      const communityId = communityRef.id
      const path = getCommunityAlbumItemStoragePath(communityId, albumItemId)
      await uploadAlbumImage(file, path)
      const itemRef = doc(communityRef, 'album_items', albumItemId).withConverter(albumItemConverter)
      await updateDoc(itemRef, {
        updated_at: Timestamp.now(),
      })
    }

    const updateAlbumCaption = async (albumItemId: string, caption: string) => {
      await getLoadedCommunity()
      const communityRef = await getCommunityRef()
      const itemRef = doc(communityRef, 'album_items', albumItemId).withConverter(albumItemConverter)
      const trimmed = caption.trim()
      await updateDoc(itemRef, {
        ...(trimmed === '' ? { album_caption: deleteField() } : { album_caption: trimmed }),
        updated_at: Timestamp.now(),
      })
    }

    const updateAlbumSortOrder = async (albumItemIds: string[]) => {
      const communityRef = await getCommunityRef()
      await updateDoc(communityRef, {
        community_album_item_ids: albumItemIds,
        updated_at: Timestamp.now(),
      })
    }

    const updateCommunity = async (data: BokudeliCommunity) => {
      const communityRef = await getCommunityRef()
      await setDoc(communityRef, data, { merge: true })
    }

    const coverImageUrl = computed<string | undefined>(() => {
      const communityId = community.value?.community_id
      if (communityId == null) {
        return undefined
      }
      const base = convertStoragePathToURL(getCommunityCoverStoragePath(communityId))
      return _coverImageCacheBuster.value > 0 ? `${base}&t=${_coverImageCacheBuster.value}` : base
    })

    const iconImageUrl = computed<string | undefined>(() => {
      const communityId = community.value?.community_id
      if (communityId == null) {
        return undefined
      }
      const base = convertStoragePathToURL(getCommunityIconStoragePath(communityId))
      return _iconImageCacheBuster.value > 0 ? `${base}&t=${_iconImageCacheBuster.value}` : base
    })

    const updateCoverImage = async (file: File) => {
      const loadedCommunity = await getLoadedCommunity()
      await uploadImage(file, getCommunityCoverStoragePath(loadedCommunity.id))
      _coverImageCacheBuster.value = Date.now()
    }

    const updateIconImage = async (file: File) => {
      const loadedCommunity = await getLoadedCommunity()
      await uploadImage(file, getCommunityIconStoragePath(loadedCommunity.id))
      _iconImageCacheBuster.value = Date.now()
    }

    /**
     * Wait for the community to be loaded.
     * It's better not to use this method in UI components because of the performance issue.
     *
     * @param timeout [ms]
     * @returns Promise<BokudeliCommunity> when the community is loaded
     * @throws Error when the community is not loaded within the timeout
     */
    const getLoadedCommunity = async (timeout: number = 5000): Promise<BokudeliCommunity> => {
      return await new Promise((resolve, reject) => {
        let unwatch: (() => void) | undefined
        const timeoutId = setTimeout(() => {
          unwatch?.()
          reject(new Error(`Community not loaded within ${timeout}ms`))
        }, timeout)
        unwatch = watch(
          community,
          (c) => {
            if (c != null) {
              clearTimeout(timeoutId)
              unwatch?.()
              resolve(c)
            }
          },
          { immediate: true },
        )
      })
    }

    let unsubscribeCommunity: Unsubscribe | null = null
    const subscribeCommunity = (communityRef: DocumentReference<BokudeliCommunity>) => {
      if (unsubscribeCommunity == null) {
        unsubscribeCommunity = onSnapshot(
          communityRef,
          (doc) => {
            try {
              community.value = doc.data() ?? null
            } catch (err) {
              console.error(err)
              reportClientError(err, { documentPath: doc.ref.path, severity: 'warn' })
            }
          },
          (err) => {
            console.error('subscribeCommunity snapshot error', err)
            reportClientError(err, { documentPath: communityRef.path, severity: 'warn' })
            unsubscribeCommunity?.()
            unsubscribeCommunity = null
          },
        )
      }
    }

    let unsubscribeEvents: Unsubscribe | null = null
    const subscribeEvents = (communityRef: DocumentReference) => {
      const eventsRef = collection(communityRef, 'events')
      if (unsubscribeEvents == null) {
        unsubscribeEvents = onSnapshot(
          eventsRef,
          (querySnapshot) => {
            eventStores.value = new Map()
            querySnapshot.docs.forEach((doc) => {
              const eventId = doc.id
              const stores = eventStores.value || new Map()
              stores.set(eventId, useEventStore(eventId, eventStoreOptions) as EventStore)
              eventStores.value = stores
            })
          },
          (err) => {
            console.error('subscribeEvents snapshot error', err)
            reportClientError(err, { documentPath: `${communityRef.path}/events`, severity: 'warn' })
            unsubscribeEvents?.()
            unsubscribeEvents = null
          },
        )
      }
    }

    let retry = 0
    const subscribe = () => {
      const queryConstraints = buildCommunityLookupConstraints(communityAccount, {
        enterpriseId: resolvedEnterpriseId,
      })
      return getDocs(
        query(collection(db, 'communities'), ...queryConstraints, limit(2)).withConverter(communityConverter),
      )
        .then((querySnapshot) => {
          if (querySnapshot.docs.length > 1) {
            reportClientError(new Error(`Community "${communityAccount}" is ambiguous for the given scope.`), {
              severity: 'error',
            })
            return
          }
          const communityRef = querySnapshot.docs[0]?.ref?.withConverter(communityConverter)
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
        .catch((err) => {
          console.error('community subscribe getDocs error', err)
          reportClientError(err, { documentPath: `communities/${communityAccount}`, severity: 'warn' })
        })
    }

    const unsubscribe = () => {
      retry = 0
      unsubscribeAlbumItems?.()
      unsubscribeAlbumItems = null
      _albumItems.value = null
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
      coverImageUrl,
      iconImageUrl,
      members,
      events,
      albumItems,
      getLoadedCommunity,
      updateCommunity,
      updateCoverImage,
      updateIconImage,
      addAlbumItem,
      deleteAlbumItem,
      replaceAlbumImage,
      updateAlbumCaption,
      updateAlbumSortOrder,
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
