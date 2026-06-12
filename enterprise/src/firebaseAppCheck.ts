import { getApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'

export function initEnterpriseAppCheck(): void {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
  if (siteKey == null || siteKey === '') {
    return
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }

  initializeAppCheck(getApp(), {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  })
}
