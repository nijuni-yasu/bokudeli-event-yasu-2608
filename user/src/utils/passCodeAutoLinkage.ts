import { clearStalePendingLinkRequestOutsideAutoLinkage, isProviderIdType } from '@shokujii/base/utils/redirect'
import type { ProviderIdType } from '@shokujii/base/utils/providerService'
import type { PassCodeMode } from '@/router/utils'

export type PendingLinkPrecondition = 'proceed' | 'skipped'

export type PassCodePostOtpLinkPreCheckResult =
  | { outcome: 'skipped' }
  | { outcome: 'proceed'; linkProviderId: ProviderIdType }

export const parsePassCodeLinkProviderId = (pid: unknown): ProviderIdType | null => {
  if (typeof pid !== 'string' || !isProviderIdType(pid)) {
    return null
  }
  return pid
}

export const shouldClearStalePendingOnPassCodeMount = (context: { mode: PassCodeMode; isLogin: boolean }): boolean => {
  return context.mode === 'login' && !context.isLogin
}

export const shouldAutoSendOtpOnPassCodeMount = (context: {
  mode: PassCodeMode
  isLogin: boolean
  linkProviderId: ProviderIdType | null
}): boolean => {
  return context.linkProviderId != null && context.mode === 'login' && !context.isLogin
}

export const clearStalePendingForPassCode = (passCodePid: ProviderIdType | null): void => {
  clearStalePendingLinkRequestOutsideAutoLinkage({ passCodePid })
}

/** /pass-code マウント時: stale pending 検証と OTP 自動送信要否を返す */
export const runPassCodeMountAutoLinkageSetup = (context: {
  mode: PassCodeMode
  isLogin: boolean
  passCodePid: ProviderIdType | null
}): { shouldAutoSendOtp: boolean } => {
  if (shouldClearStalePendingOnPassCodeMount(context)) {
    clearStalePendingForPassCode(context.passCodePid)
  }
  return {
    shouldAutoSendOtp: shouldAutoSendOtpOnPassCodeMount({
      mode: context.mode,
      isLogin: context.isLogin,
      linkProviderId: context.passCodePid,
    }),
  }
}

export const evaluatePendingLinkPreconditions = (
  linkProviderId: ProviderIdType | null,
  pendingId: string | null,
  hasCurrentUser: boolean,
): PendingLinkPrecondition => {
  if (linkProviderId == null) {
    return 'skipped'
  }
  if (pendingId == null || pendingId !== linkProviderId) {
    return 'skipped'
  }
  if (!hasCurrentUser) {
    return 'skipped'
  }
  return 'proceed'
}

/** OTP ログイン後の SNS 連携開始前: stale 検証と前提条件チェック */
export const runPassCodePostOtpLinkPreCheck = (
  linkProviderId: ProviderIdType | null,
  pendingId: string | null,
  hasCurrentUser: boolean,
): PassCodePostOtpLinkPreCheckResult => {
  clearStalePendingForPassCode(linkProviderId)
  if (evaluatePendingLinkPreconditions(linkProviderId, pendingId, hasCurrentUser) === 'skipped') {
    return { outcome: 'skipped' }
  }
  if (linkProviderId == null) {
    return { outcome: 'skipped' }
  }
  return { outcome: 'proceed', linkProviderId }
}
