import { type Ref } from 'vue'
import { db } from '@/firebase'
import { getAuth } from 'firebase/auth'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  setDoc,
  getCountFromServer,
  QueryDocumentSnapshot,
  startAfter,
  limit,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { convertDocumentDataToCommunity } from '@/schemes/converter'
import type { StateTree, Store } from 'pinia'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { TaskExecutor } from '@/utils/executors'
import { useCommunityStore, type CommunityStore } from '@/stores/community'

type CommunityListStoreState = {
  communityDraft: Ref<BokudeliCommunity>
  totalCount: Ref<number | null>
} & StateTree

type CommunityListStoreGetters = {
  communityStores: Ref<CommunityStore[] | null>
}

type CommunityListStoreAction = {
  reload: () => void
  next: () => void
  getCommunityData: (communityAccount: string) => Promise<DocumentData | null>
  createNewCommunityFromDraft: () => Promise<BokudeliCommunity>
}

export type CommunityListStore = Store<
  string,
  CommunityListStoreState,
  CommunityListStoreGetters,
  CommunityListStoreAction
>

export const useCommunityListStore = (filters: QueryConstraint[] | null = null, pageSize: number = 5) => {
  const store = defineStore<string, CommunityListStoreState & CommunityListStoreGetters & CommunityListStoreAction>(
    filters == null ? '/communityList' : `/communityList/${JSON.stringify(filters)}/${pageSize}`,
    () => {
      const pagenationExecutor = new TaskExecutor(1)
      const communityStores = ref<CommunityStore[] | null>(null)
      const communityDraft = ref<BokudeliCommunity>(new BokudeliCommunity())
      const totalCount = ref<number | null>(null)

      const communitiesSnapshot: QueryDocumentSnapshot[] = []

      const next = () => {
        if (pagenationExecutor.totalTaskLength > 0 || filters == null) {
          return
        }
        pagenationExecutor.addTask(async () => {
          if (totalCount.value == null) {
            const q = query(collection(db, 'communities'), ...filters)
            totalCount.value = (await getCountFromServer(q)).data().count
          }
          const lastVisibleDocument = communitiesSnapshot[communitiesSnapshot.length - 1]
          const q = query(
            collection(db, 'communities'),
            ...filters,
            ...(lastVisibleDocument == null ? [] : [startAfter(lastVisibleDocument)]),
            ...(pageSize == null ? [] : [limit(pageSize)]),
          )
          const querySnapshot = await getDocs(q)
          communitiesSnapshot.push(...querySnapshot.docs)
          window.setTimeout(() => {
            communityStores.value = communitiesSnapshot.map((doc) => useCommunityStore(doc) as CommunityStore)
          })
        })
      }

      const reload = () => {
        communitiesSnapshot.splice(0) // clear
        communityStores.value = null
        totalCount.value = null
        next()
      }

      const getCommunityData = async (communityAccount: string): Promise<DocumentData | null> => {
        const duplicatedCommunity = await getDocs(
          query(collection(db, 'communities'), where('community_account', '==', communityAccount)),
        )
        if (duplicatedCommunity.empty) {
          return null
        } else {
          return duplicatedCommunity.docs[0].data()
        }
      }

      const createNewCommunityFromDraft = async () => {
        const c = await getCommunityData(communityDraft.value.community_account)
        if (c != null) {
          throw new Error(`community ${communityDraft.value.community_account} already exists`)
        }
        const userId = getAuth().currentUser?.uid
        if (userId == null) {
          throw new Error('user is not logged in')
        }
        const newCommunityRef = doc(collection(db, 'communities'))
        await setDoc(newCommunityRef, {
          ...communityDraft.value.convertToDocumentData(),
          community_id: newCommunityRef.id,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        })
        await setDoc(doc(newCommunityRef, 'members', userId), {
          roles: ['manager'],
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        })
        return convertDocumentDataToCommunity((await getDoc(newCommunityRef)).data() as DocumentData)
      }

      reload()

      return {
        filters,
        totalCount,
        communityDraft,
        communityStores,
        reload,
        next,
        getCommunityData,
        createNewCommunityFromDraft,
        $reset: () => {
          communityDraft.value = new BokudeliCommunity()
        },
      }
    },
  )
  return store() as CommunityListStore
}
