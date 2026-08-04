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
import { Community } from '@shokujii/common/schemas/Community.js'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'
import { communityConverter, useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community.js'

export type CommunityListStore = ReturnType<typeof useCommunityListStore>

export const useCommunityListStore = (filters: QueryConstraint[] | null = null, pageSize: number = 5) => {
  const store = defineStore(
    filters == null ? '/communityList' : `/communityList/${JSON.stringify(filters)}/${pageSize}`,
    () => {
      const paginationExecutor = new TaskExecutor(1)
      const communityStores = ref<CommunityStore[] | null>(null)
      const totalCount = ref<number | null>(null)

      const communitiesSnapshot: QueryDocumentSnapshot<Community>[] = []

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
            communityStores.value = communitiesSnapshot.flatMap((doc) => {
              try {
                return useCommunityStore(doc.data())
              } catch (err) {
                console.error(err)
                reportClientError(err, { documentPath: doc.ref.path, severity: 'warn' })
                return []
              }
            })
          })
        })
      }

      const reload = () => {
        communitiesSnapshot.splice(0) // clear
        communityStores.value = null
        totalCount.value = null
        next()
      }

      const getCommunityData = async (
        communityAccount: string,
        options?: { enterpriseId?: string },
      ): Promise<DocumentData | null> => {
        const enterpriseId = options?.enterpriseId ?? null
        const duplicatedCommunity = await getDocs(
          query(
            collection(db, 'communities'),
            where('enterprise_id', '==', enterpriseId),
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
        reload,
        next,
        getCommunityData,
      }
    },
  )
  return store()
}
