import { defineStore } from 'pinia'
import { FirebaseError } from 'firebase/app'

export const useStoreFirebaseAuthError = defineStore('firebaseError', {
  state: () => ({
    error: null as FirebaseError | null,
  }),
  actions: {
    update(error: FirebaseError) {
      this.error = error
    },
    reset() {
      this.error = null
    },
  },
})
