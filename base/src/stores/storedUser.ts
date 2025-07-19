import { type StoredUser } from '@shokujii/base/schemes/storedUser'
import { defineStore } from 'pinia'

export const useStoreStoredUser = defineStore('storedUser', {
  state: (): { storedUser: StoredUser | undefined } => ({
    storedUser: undefined,
  }),
  actions: {
    update(storedUser: StoredUser) {
      this.storedUser = storedUser
    },
  },
})
