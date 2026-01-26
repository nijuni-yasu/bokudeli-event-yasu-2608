import {
  query,
  collectionGroup,
  getDocs,
  getCountFromServer,
  startAfter,
  QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@shokujii/base/firebase'
import { shopConverter, type BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import { TaskExecutor } from '@shokujii/base/utils/executors'

// EventEdit は Incremental search 向けに出来ていないので pageSize は一旦ペンディング
// EventEdit そのものの構造を変更してからの方が効率的に実装できるはず
export const useShopListStore = (filters: QueryConstraint[] /*, pageSize: number = 6*/) => {
  const store = defineStore(`shopList/${JSON.stringify(filters)}` /*/${pageSize}`*/, () => {
    const paginationExecutor = new TaskExecutor(1)
    const shops = ref<BokudeliPartnerShop[]>([])
    const totalCount = ref<number | null>(null)

    const shopsSnapshot: QueryDocumentSnapshot<BokudeliPartnerShop>[] = []

    const next = () => {
      // 既にタスクが実行中またはキューにある場合は、新しいタスクを追加しない
      if (paginationExecutor.totalTaskLength > 0) {
        return
      }
      paginationExecutor.addTask(async () => {
        try {
          if (totalCount.value == null) {
            const q = query(collectionGroup(db, 'shops'), ...filters)
            totalCount.value = (await getCountFromServer(q)).data().count
          }
          const lastVisibleDocument = shopsSnapshot[shopsSnapshot.length - 1]
          const q = query(
            collectionGroup(db, 'shops'),
            ...filters,
            ...(lastVisibleDocument == null ? [] : [startAfter(lastVisibleDocument)]),
            // limit(pageSize),
          ).withConverter(shopConverter)
          const querySnapshot = await getDocs(q)
          shopsSnapshot.push(...querySnapshot.docs)
          shops.value = shopsSnapshot.flatMap((shopSnapshot) => {
            const shop = shopSnapshot.data()
            return shop
          })
        } catch (error) {
          console.error('Failed to fetch shops:', error)
        }
      })
    }

    const reload = () => {
      shopsSnapshot.splice(0) // clear
      shops.value = []
      totalCount.value = null
      next()
    }

    reload()

    return {
      totalCount,
      shops,
      reload,
      next,
    }
  })
  return store()
}
