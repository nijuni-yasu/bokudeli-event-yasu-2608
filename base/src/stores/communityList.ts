import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collection,
  getDocs,
  query,
  where,
  getCountFromServer,
  QueryDocumentSnapshot,
  startAfter,
  limit,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'
import {
  communityConverter,
  useCommunityStore,
  type BokudeliCommunity,
  type CommunityStore,
} from '@shokujii/base/stores/community.js'

export type CommunityListOptions = {
  lightweight?: boolean
}

export type CommunityListStore = ReturnType<typeof useCommunityListStore>

export const buildCommunityListStoreId = (
  filters: QueryConstraint[] | null,
  pageSize: number,
  lightweight: boolean,
): string => {
  if (filters == null) {
    return lightweight ? '/communityList/lightweight' : '/communityList'
  }
  const suffix = lightweight ? '/lightweight' : ''
  return `/communityList/${JSON.stringify(filters)}/${pageSize}${suffix}`
}

export const useCommunityListStore = (
  filters: QueryConstraint[] | null = null,
  pageSize: number = 5,
  options?: CommunityListOptions,
) => {
  const lightweight = options?.lightweight === true
  const store = defineStore(buildCommunityListStoreId(filters, pageSize, lightweight), () => {
    const paginationExecutor = new TaskExecutor(1)
    const communityStores = ref<CommunityStore[] | null>(null)
    const communities = ref<BokudeliCommunity[] | null>(null)
    const totalCount = ref<number | null>(null)

    const communitiesSnapshot: QueryDocumentSnapshot<BokudeliCommunity>[] = []

    const syncLoadedCommunities = () => {
      if (lightweight) {
        communities.value = communitiesSnapshot.flatMap((doc) => {
          try {
            return [doc.data()]
          } catch (err) {
            console.error(err)
            reportClientError(err, { documentPath: doc.ref.path, severity: 'warn' })
            return []
          }
        })
        return
      }
      communityStores.value = communitiesSnapshot.flatMap((doc) => {
        try {
          return useCommunityStore(doc.data())
        } catch (err) {
          console.error(err)
          reportClientError(err, { documentPath: doc.ref.path, severity: 'warn' })
          return []
        }
      })
    }

    const next = () => {
      if (paginationExecutor.totalTaskLength > 0 || filters == null) {
        return
      }
      paginationExecutor.addTask(async () => {
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
        ).withConverter(communityConverter)
        const querySnapshot = await getDocs(q)
        communitiesSnapshot.push(...querySnapshot.docs)
        window.setTimeout(() => {
          syncLoadedCommunities()
        })
      })
    }

    const reload = () => {
      communitiesSnapshot.splice(0) // clear
      communityStores.value = null
      communities.value = null
      totalCount.value = null
      next()
    }

    const getCommunityData = async (
      communityAccount: string,
      options?: { enterpriseId?: string | null },
    ): Promise<DocumentData | null> => {
      const duplicatedCommunity = await getDocs(
        query(
          collection(db, 'communities'),
          ...(options?.enterpriseId !== undefined
            ? [where('enterprise_id', '==', options.enterpriseId ?? null)]
            : [where('enterprise_id', '==', null)]),
          where('community_account', '==', communityAccount),
          limit(1),
        ),
      )
      if (duplicatedCommunity.empty) {
        return null
      } else {
        return duplicatedCommunity.docs[0].data()
      }
    }

    reload()

    return {
      filters,
      totalCount,
      communityStores,
      communities,
      reload,
      next,
      getCommunityData,
    }
  })
  return store()
}
