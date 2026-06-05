import { initializeApp, applicationDefault } from 'firebase-admin/app'

initializeApp({
  credential: applicationDefault(),
})

export const { orderNotification } = await import('./order-notification.js')
