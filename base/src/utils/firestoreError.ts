import { FirebaseError } from 'firebase/app'

export const isFirestorePermissionDenied = (error: unknown): boolean =>
  error instanceof FirebaseError && error.code === 'permission-denied'
