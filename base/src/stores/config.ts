import { ref, computed, watch, type ComputedRef } from 'vue'
import { defineStore } from 'pinia'
import type { StateTree, Store } from 'pinia'
import {
  doc,
  onSnapshot,
  QueryDocumentSnapshot,
  type SnapshotOptions,
  type DocumentData,
  type FirestoreDataConverter,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { ConfigGlobal } from '@shokujii/common/schemas/Config.js'
import { FIRESTORE_LOADING } from '@shokujii/base/utils/const.js'

const configConverter: FirestoreDataConverter<ConfigGlobal> = {
  toFirestore(config: ConfigGlobal): DocumentData {
    return config.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ConfigGlobal {
    return new ConfigGlobal(snapshot.id, snapshot.data(options))
  },
}

type ConfigStoreState = {} & StateTree

type ConfigStoreGetters = {
  config: ComputedRef<ConfigGlobal | typeof FIRESTORE_LOADING | undefined>
}

type ConfigStoreAction = {
  getResolvedConfig: () => Promise<ConfigGlobal | undefined>
}

export type ConfigStore = Store<string, ConfigStoreState, ConfigStoreGetters, ConfigStoreAction>
export const useConfigStore = (target: ConfigGlobal | undefined = undefined): ConfigStore => {
  const store = defineStore<string, ConfigStoreState & ConfigStoreGetters & ConfigStoreAction>(
    '/configs/global',
    () => {
      const _config = ref<ConfigGlobal | typeof FIRESTORE_LOADING | undefined>(
        target !== undefined ? target : FIRESTORE_LOADING,
      )

      const configRef = doc(db, 'configs', 'global').withConverter(configConverter)

      let unsubscribe: Unsubscribe | null = null
      const subscribe = () => {
        if (unsubscribe == null) {
          unsubscribe = onSnapshot(configRef, (snapshot) => {
            _config.value = snapshot.exists() ? snapshot.data() : undefined
          })
        }
      }

      const config = computed(() => {
        subscribe()
        return _config.value
      })

      const getResolvedConfig = () =>
        new Promise<ConfigGlobal | undefined>((resolve) => {
          watch(
            config,
            (value) => {
              if (value !== FIRESTORE_LOADING) {
                resolve(value)
              }
            },
            { immediate: true },
          )
        })

      return {
        config,
        getResolvedConfig,
      }
    },
  )
  return store() as ConfigStore
}
