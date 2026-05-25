import { functions } from '@shokujii/base/firebase'
import { httpsCallable } from 'firebase/functions'
import type { ClientErrorReportRequest, ClientErrorReportResponse } from '@shokujii/common/apis/clientError.js'

export const reportClientErrorCallable = (input: ClientErrorReportRequest) => {
  const f = httpsCallable<ClientErrorReportRequest, ClientErrorReportResponse>(functions, 'reportClientError')
  return f(input)
}
