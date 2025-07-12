import { type UserCredential} from 'firebase/auth'
import { defineStore } from 'pinia'

export const useStoreUserCredential = defineStore('userCredential', {
  state: (): { userCredential: UserCredential | undefined } => ({
    userCredential: undefined,
  }),
  actions: {
    update(userCredential: UserCredential) {
      this.userCredential = userCredential
    },
    reset() {
      this.userCredential = undefined;
    },
  },
})
