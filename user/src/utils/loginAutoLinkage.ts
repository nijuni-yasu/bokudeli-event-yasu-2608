import { clearStalePendingLinkRequestOutsideAutoLinkage, isProviderIdType } from '@shokujii/base/utils/redirect'
import type { ProviderIdType } from '@shokujii/base/utils/providerService'

export type LoginQueryPids = {
  pid1: string | null
  pid2: string | null
}

export type LinkRequestDialogParams = {
  tryLoginProviderId: ProviderIdType
  linkProviderId: ProviderIdType
}

export const parseLoginQueryPids = (pid1: unknown, pid2: unknown): LoginQueryPids => ({
  pid1: typeof pid1 === 'string' ? pid1 : null,
  pid2: typeof pid2 === 'string' ? pid2 : null,
})

export const getLinkRequestDialogParams = (pids: LoginQueryPids): LinkRequestDialogParams | null => {
  const { pid1, pid2 } = pids
  if (pid1 == null || pid2 == null) {
    return null
  }
  if (!isProviderIdType(pid1) || !isProviderIdType(pid2)) {
    return null
  }
  return {
    tryLoginProviderId: pid1,
    linkProviderId: pid2,
  }
}

/** /login マウント時: 通知の有無に関わらず stale pending を検証する（§6.2 RC-29） */
export const runLoginPageMountAutoLinkage = (pid1: unknown, pid2: unknown): LinkRequestDialogParams | null => {
  const pids = parseLoginQueryPids(pid1, pid2)
  clearStalePendingLinkRequestOutsideAutoLinkage({
    loginPid1: pids.pid1,
    loginPid2: pids.pid2,
  })
  return getLinkRequestDialogParams(pids)
}
