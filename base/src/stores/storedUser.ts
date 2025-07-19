import { defineStore } from 'pinia'
import { type StoredUser } from '@shokujii/base/schemes/storedUser.js'

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
