import { defineStore } from 'pinia'

export interface CurrentUser {
  displayName: string
  email: string
  photoURL: string
  uid: string
}

export const useStoreCurrentUser = defineStore('currentUser', {
  state: (): { currentUser: CurrentUser | undefined } => ({
    currentUser: undefined,
  }),
  actions: {
    update(currentUser: CurrentUser) {
      this.currentUser = currentUser
    },
  },
})
