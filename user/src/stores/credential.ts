import { OAuthCredential } from 'firebase/auth'
import { defineStore } from 'pinia'

export const useStoreCredential = defineStore('credential', {
  state: (): { credential: OAuthCredential | undefined } => ({
    credential: undefined,
  }),
  actions: {
    update(credential: OAuthCredential) {
      this.credential = credential
    },
  },
})
