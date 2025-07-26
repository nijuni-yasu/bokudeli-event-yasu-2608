import { type AdditionalUserInfo } from 'firebase/auth'
import { defineStore } from 'pinia'

export const useStoreUserAdditionalInfo = defineStore('userAdditionalInfo', {
  state: (): {
    additionalUserInfo: AdditionalUserInfo | null
  } => ({
    additionalUserInfo: null,
  }),
  actions: {
    update(additionalUserInfo: AdditionalUserInfo) {
      this.additionalUserInfo = additionalUserInfo
    },
    reset() {
      this.additionalUserInfo = null
    },
  },
})
