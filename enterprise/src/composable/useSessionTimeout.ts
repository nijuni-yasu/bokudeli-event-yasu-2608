import { onUnmounted } from 'vue'
import { getAuth } from 'firebase/auth'
import { useNotification } from '@shokujii/base/composable/notification'
import { performEnterpriseLogout } from '@/utils/enterpriseLogout'

const TIMEOUT_MS = 60 * 60 * 1000
const STORAGE_KEY = 'enterprise:last_activity_at'
const THROTTLE_MS = 10_000
const CHECK_INTERVAL_MS = 60_000
const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'mousemove'] as const

export function useSessionTimeout() {
  const notification = useNotification()
  const { t } = useI18n()

  let lastWriteAt = 0
  let intervalId: ReturnType<typeof setInterval> | null = null
  let isActive = false

  const touchActivity = () => {
    const now = Date.now()
    if (now - lastWriteAt < THROTTLE_MS) {
      return
    }
    lastWriteAt = now
    localStorage.setItem(STORAGE_KEY, String(now))
  }

  const handleSessionTimeout = async () => {
    if (getAuth().currentUser == null) {
      return
    }
    await performEnterpriseLogout('session_timeout')
    notification.show(t('enterprise.session.timeout'), 'warning')
    window.location.href = '/login'
  }

  const checkTimeout = async () => {
    if (getAuth().currentUser == null) {
      return
    }
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0)
    if (Date.now() - last <= TIMEOUT_MS) {
      return
    }
    await handleSessionTimeout()
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkTimeout()
    }
  }

  const start = () => {
    if (isActive) {
      return
    }
    isActive = true
    touchActivity()
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, touchActivity)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    intervalId = setInterval(() => {
      checkTimeout()
    }, CHECK_INTERVAL_MS)
  }

  const stop = () => {
    if (!isActive) {
      return
    }
    isActive = false
    for (const event of ACTIVITY_EVENTS) {
      document.removeEventListener(event, touchActivity)
    }
    document.removeEventListener('visibilitychange', onVisibilityChange)
    if (intervalId != null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onUnmounted(() => {
    stop()
  })

  return { start, stop }
}
