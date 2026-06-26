import { defineString } from 'firebase-functions/params'

/** 第2段階ロールアウト: `true` にするとエンプラ未認証 Callable で App Check を enforce */
const ENTERPRISE_APP_CHECK_ENFORCE = defineString('ENTERPRISE_APP_CHECK_ENFORCE', { default: 'false' })

export function isEnterpriseAppCheckEnforced(): boolean {
  return ENTERPRISE_APP_CHECK_ENFORCE.value() === 'true'
}
