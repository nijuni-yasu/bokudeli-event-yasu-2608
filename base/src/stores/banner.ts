import { type ComputedRef } from 'vue'
import type { StateTree, Store } from 'pinia'
import {
  doc,
  onSnapshot,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase'
import { Banners, type Banner } from '@shokujii/common/schemas/Banners.js'
import { FIRESTORE_LOADING } from '@shokujii/base/utils/const'

const bannersConverter: FirestoreDataConverter<Banners> = {
  toFirestore(banners: Banners): DocumentData {
    return banners.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Banners {
    return new Banners(snapshot.id, snapshot.data())
  },
}

type BannersStoreState = {} & StateTree

type BannersStoreGetters = {
  banners: ComputedRef<Banner[] | typeof FIRESTORE_LOADING | undefined>
}

type BannersStoreAction = {}

export type BannersStore = Store<string, BannersStoreState, BannersStoreGetters, BannersStoreAction>
export const useBannersStore = (target: Banners | string): BannersStore => {
  let bannersId: string
  if (target instanceof Banners) {
    bannersId = target.id
  } else {
    bannersId = target
  }
  const useStore = defineStore(`/assets/${bannersId}`, () => {
    const bannersRef = doc(db, 'assets', bannersId).withConverter(bannersConverter)
    const _banners = ref<Banner[] | typeof FIRESTORE_LOADING | undefined>(
      target instanceof Banners ? target.banners : FIRESTORE_LOADING,
    )

    let unsubscribe: Unsubscribe | null = null
    const subscribe = () => {
      if (unsubscribe == null) {
        unsubscribe = onSnapshot(bannersRef, (snapshot) => {
          _banners.value = snapshot.exists() ? snapshot.data().banners : undefined
        })
      }
    }

    const banners = computed(() => {
      subscribe()
      return _banners.value
    })
    return {
      banners,
    }
  })
  return useStore()
}
