import { onCall, HttpsError } from 'firebase-functions/https'
import {
  ClientErrorReportRequestSchema,
  type ClientErrorReportRequest,
  type ClientErrorReportResponse,
} from '@shokujii/common/apis/clientError.js'
import { createModuleLogger } from './utils/logger.js'
import { shouldReportClientError } from './utils/clientErrorDedup.js'
import { computeServerFingerprint } from './utils/clientErrorFingerprint.js'
import { isClientErrorNoise } from './utils/clientErrorNoise.js'

const logger = createModuleLogger('clientError')

const dedupCache = new Map<string, number>()

export const reportClientError = onCall<ClientErrorReportRequest, Promise<ClientErrorReportResponse>>(
  async (request) => {
    let data: ClientErrorReportRequest
    try {
      data = ClientErrorReportRequestSchema.parse(request.data)
    } catch {
      throw new HttpsError('invalid-argument', 'Invalid client error report payload')
    }

    const fingerprint = computeServerFingerprint(data)

    if (!shouldReportClientError(fingerprint, Date.now(), dedupCache)) {
      return { accepted: true }
    }

    const authenticatedUserId = request.auth?.uid

    const shouldLogAsError = !isClientErrorNoise(data.message, data.error_type)
    const loggedSeverity = shouldLogAsError ? 'error' : 'warn'

    const logPayload = {
      app: data.app,
      error_type: data.error_type,
      error_message: data.message,
      stack: data.stack,
      route: data.route,
      document_path: data.document_path,
      zod_issues: data.zod_issues,
      ...(authenticatedUserId != null ? { user_id: authenticatedUserId } : {}),
      user_agent: data.user_agent,
      component_info: data.component_info,
      fingerprint,
      severity: loggedSeverity,
    }

    if (shouldLogAsError) {
      logger.error('Client application error', logPayload)
    } else {
      logger.warn('Client application error', logPayload)
    }

    return { accepted: true }
  },
)
