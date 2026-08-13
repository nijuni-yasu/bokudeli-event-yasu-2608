/**
 * Enterprise 専用 Firebase エントリ。
 * getAuth 直後に hostname キャッシュから auth.tenantId を設定し、永続化セッション復元前に tenant を合わせる。
 * user/partner は base/src/firebase.ts をそのまま利用する。
 */
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { readCachedEnterpriseTenantId } from '@/utils/enterpriseTenantCache'
import { setEnterpriseAuthTenantId } from '@/utils/enterpriseAuth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGE_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
getAnalytics(app)

const auth = getAuth(app)
const cachedTenantId = readCachedEnterpriseTenantId()
if (cachedTenantId != null) {
  setEnterpriseAuthTenantId(cachedTenantId)
}

export const storage = getStorage(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'asia-northeast1')

if (import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST != null) {
  const [host, port] = import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST.split(':')
  // eslint-disable-next-line no-console
  console.debug('connectFunctionsEmulator', host, port)
  connectFunctionsEmulator(functions, host, port)
}

if (import.meta.env.VITE_FIRESTORE_EMULATOR_HOST != null) {
  const [host, port] = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST.split(':')
  // eslint-disable-next-line no-console
  console.debug('connectFirestoreEmulator', host, port)
  connectFirestoreEmulator(db, host, Number.parseInt(port, 10))
}

let FIREBASE_STORAGE_BASE_URL = 'https://firebasestorage.googleapis.com/v0/'
if (import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST != null) {
  const [host, port] = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST.split(':')
  // eslint-disable-next-line no-console
  console.debug('connectStorageEmulator', host, port)
  connectStorageEmulator(storage, host, Number.parseInt(port, 10))
  FIREBASE_STORAGE_BASE_URL = `http://${host}:${port}/v0/`
}

if (import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST != null) {
  const host = `http://${import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST}`
  // eslint-disable-next-line no-console
  console.debug('connectAuthEmulator', host)
  connectAuthEmulator(auth, host)
}

const slackBotFunctionBaseUrl = import.meta.env.VITE_SLACK_BOT_FUNCTION_URL
  ? import.meta.env.VITE_SLACK_BOT_FUNCTION_URL
  : 'http://localhost:5001'
export const slackBotFunctionBaseURL = `${slackBotFunctionBaseUrl}/slack`
export { FIREBASE_STORAGE_BASE_URL }
