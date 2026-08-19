import { onUnmounted } from 'vue'
import { getAuth } from 'firebase/auth'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'
import { performEnterpriseLogout } from '@/utils/enterpriseLogout'
import { SESSION_LAST_ACTIVITY_KEY, SESSION_TIMEOUT_FLAG_KEY, SESSION_TIMEOUT_MS } from '@/constants/sessionTimeout'

const THROTTLE_MS = 10_000
const CHECK_INTERVAL_MS = 60_000
const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'mousemove'] as const

export function useSessionTimeout() {
  let lastWriteAt = 0
  let intervalId: ReturnType<typeof setInterval> | null = null
  let isActive = false

  const touchActivity = () => {
    const now = Date.now()
    if (now - lastWriteAt < THROTTLE_MS) {
      return
    }
    lastWriteAt = now
    localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(now))
  }

  const handleSessionTimeout = async () => {
    if (getAuth().currentUser == null) {
      return
    }
    await performEnterpriseLogout('session_timeout')
    sessionStorage.setItem(SESSION_TIMEOUT_FLAG_KEY, '1')
    window.location.href = '/login'
  }

  const checkTimeout = async () => {
    if (getAuth().currentUser == null) {
      return
    }
    const last = Number(localStorage.getItem(SESSION_LAST_ACTIVITY_KEY) ?? 0)
    if (Date.now() - last <= SESSION_TIMEOUT_MS) {
      return
    }
    await handleSessionTimeout()
  }

  const runCheckTimeout = () => {
    // ここが失敗するとタイムアウトによる強制ログアウトが成立しないため、運用側から検知できるようにする
    void checkTimeout().catch((err: unknown) => {
      reportClientError(err, { componentInfo: 'useSessionTimeout' })
    })
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      runCheckTimeout()
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
      runCheckTimeout()
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
