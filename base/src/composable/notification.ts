import { inject } from 'vue'
import type { Notification } from '@shokujii/base/types'

export const useNotification = () => {
  const notification = inject('notification') as Notification

  const show = (message: string, color: string) => {
    Object.assign(notification, { message, color })
  }
  const hide = () => {
    Object.assign(notification, { message: undefined, color: undefined })
  }
  return {
    show,
    hide,
  }
}
