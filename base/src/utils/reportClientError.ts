import { getAuth } from 'firebase/auth'
import { ZodError } from 'zod'
import type { ClientErrorReportRequest } from '@shokujii/common/apis/clientError.js'
import { reportClientErrorCallable } from '@shokujii/base/apis/clientError.js'

export type ClientErrorContext = {
  app?: 'user' | 'admin'
  route?: string
  componentInfo?: string
  documentPath?: string
  severity?: 'error' | 'warn'
}

let defaultApp: 'user' | 'admin' = 'user'

/** user / admin 起動時に呼び出し、store 経由の reportClientError に app を反映する */
export function configureClientErrorReporting(options: { app: 'user' | 'admin' }): void {
  defaultApp = options.app
}

type SerializedError = Pick<ClientErrorReportRequest, 'error_type' | 'message' | 'stack' | 'zod_issues'>

function serializeError(err: unknown): SerializedError {
  if (err instanceof ZodError) {
    return {
      error_type: 'ZodError',
      message: err.message.slice(0, 500),
      stack: err.stack?.slice(0, 4000),
      zod_issues: err.issues.slice(0, 20).map((issue) => ({
        path: issue.path,
        code: issue.code,
        message: issue.message,
      })),
    }
  }
  if (err instanceof Error) {
    return {
      error_type: err.constructor.name.slice(0, 100),
      message: err.message.slice(0, 500),
      stack: err.stack?.slice(0, 4000),
    }
  }
  return {
    error_type: 'Unknown',
    message: String(err).slice(0, 500),
  }
}

async function computeFingerprint(parts: string[]): Promise<string> {
  const input = parts.join('\0')
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function getCurrentRoute(contextRoute?: string): string {
  if (contextRoute != null && contextRoute !== '') {
    return contextRoute.slice(0, 500)
  }
  return `${location.pathname}${location.search}`.slice(0, 500)
}

/**
 * クライアントエラーを Callable 経由で Cloud Logging に送信する。
 * fire-and-forget で呼び出し、失敗しても UX に影響しない。
 */
export function reportClientError(err: unknown, context: ClientErrorContext = {}): void {
  if (import.meta.env.DEV) {
    return
  }

  const app = context.app ?? defaultApp
  const serialized = serializeError(err)
  const route = getCurrentRoute(context.route)

  void (async () => {
    try {
      const fingerprintParts = [
        app,
        serialized.error_type,
        serialized.message.slice(0, 200),
        route,
        context.documentPath ?? '',
      ]
      if (serialized.zod_issues != null && serialized.zod_issues.length > 0) {
        const first = serialized.zod_issues[0]
        fingerprintParts.push(JSON.stringify(first.path), first.code)
      }

      const fingerprint = await computeFingerprint(fingerprintParts)
      const userId = getAuth().currentUser?.uid

      const payload: ClientErrorReportRequest = {
        app,
        error_type: serialized.error_type,
        message: serialized.message,
        route,
        fingerprint,
        severity: context.severity ?? 'error',
      }
      if (serialized.stack != null) {
        payload.stack = serialized.stack
      }
      if (serialized.zod_issues != null && serialized.zod_issues.length > 0) {
        payload.zod_issues = serialized.zod_issues
      }
      const componentInfo = context.componentInfo?.slice(0, 200)
      if (componentInfo != null) {
        payload.component_info = componentInfo
      }
      const documentPath = context.documentPath?.slice(0, 300)
      if (documentPath != null) {
        payload.document_path = documentPath
      }
      if (userId != null) {
        payload.user_id = userId
      }
      const userAgent = navigator.userAgent.slice(0, 300)
      if (userAgent !== '') {
        payload.user_agent = userAgent
      }

      await reportClientErrorCallable(payload)
    } catch (reportErr) {
      console.error('Failed to report client error:', reportErr)
    }
  })()
}
