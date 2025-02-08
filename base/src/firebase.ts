// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGE_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
getAnalytics(app)
getAuth(app)
export const storage = getStorage(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'asia-northeast1')
if (import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST != null) {
  const [host, port] = import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST.split(':')
  console.info('connectFunctionsEmulator', host, port)
  connectFunctionsEmulator(functions, host, port)
}

export const stripeBaseURL = !import.meta.env.VITE_USE_LOCALHOST
  ? import.meta.env.VITE_ORIGIN_HOST
  : 'http://localhost:5173'

if (import.meta.env.VITE_FIRESTORE_EMULATOR_HOST != null) {
  const [host, port] = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST.split(':')
  console.info('connectFirestoreEmulator', host, port)
  connectFirestoreEmulator(db, host, Number.parseInt(port, 10))
}

let FIREBASE_STORAGE_BASE_URL = 'https://firebasestorage.googleapis.com/v0/'
if (import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST != null) {
  const [host, port] = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST.split(':')
  console.info('connectStorageEmulator', host, port)
  connectStorageEmulator(storage, host, Number.parseInt(port, 10))
  FIREBASE_STORAGE_BASE_URL = `http://${host}:${port}/v0/`
}

const slackBotFunctionBaseUrl = import.meta.env.VITE_SLACK_BOT_FUNCTION_URL
  ? import.meta.env.VITE_SLACK_BOT_FUNCTION_URL
  : 'http://localhost:5001'
export const slackBotFunctionBaseURL = `${slackBotFunctionBaseUrl}/slack`
export { FIREBASE_STORAGE_BASE_URL }
