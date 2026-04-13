import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
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

export type ConfigStore = ReturnType<typeof useConfigStore>
export const useConfigStore = (target: ConfigGlobal | undefined = undefined) => {
  const store = defineStore('/configs/global', () => {
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
        // immediate だと watch() が返る前にコールバックが走り、const stop 代入前に stop() を呼ぶと TDZ になる。
        // マイクロタスクに回すと代入後に stop / resolve できる。
        const stop = watch(
          config,
          (value) => {
            if (value !== FIRESTORE_LOADING) {
              queueMicrotask(() => {
                stop()
                resolve(value)
              })
            }
          },
          { immediate: true },
        )
      })

    const isMaintenanceMode = computed(() => {
      subscribe()
      const value = _config.value
      if (value === FIRESTORE_LOADING || value === undefined) {
        return false
      }
      return value.isMaintenanceMode()
    })

    return {
      config,
      getResolvedConfig,
      isMaintenanceMode,
    }
  })
  return store()
}
