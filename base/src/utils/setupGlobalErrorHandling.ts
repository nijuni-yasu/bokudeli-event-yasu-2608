import type { App } from 'vue'
import type { Router } from 'vue-router'
import {
  configureClientErrorReporting,
  reportClientError,
  type ClientErrorContext,
} from '@shokujii/base/utils/reportClientError.js'
import {
  clearStaleChunkReloadFlag,
  isStaleChunkRetryExhausted,
  tryReloadForStaleChunk,
} from '@shokujii/base/utils/reloadForStaleChunk.js'

type SetupGlobalErrorHandlingOptions = Pick<ClientErrorContext, 'app'>

export function setupGlobalErrorHandling(app: App, router: Router, options: SetupGlobalErrorHandlingOptions): void {
  const { app: appName } = options

  configureClientErrorReporting({ app: appName })

  const reportAndRedirect520 = (err: unknown, componentInfo?: string): void => {
    console.error('Stale chunk retry exhausted:', err)
    reportClientError(err, {
      app: appName,
      route: router.currentRoute.value.fullPath,
      componentInfo,
      severity: 'error',
    })
    router.replace('/520')
  }

  router
    .isReady()
    .then(() => {
      clearStaleChunkReloadFlag()
    })
    .catch((err) => {
      console.error('router.isReady failed:', err)
    })

  router.onError((error) => {
    if (tryReloadForStaleChunk(error)) {
      return
    }
    if (isStaleChunkRetryExhausted(error)) {
      reportAndRedirect520(error)
    }
  })

  app.config.errorHandler = (err, _instance, info) => {
    if (tryReloadForStaleChunk(err)) {
      return
    }
    if (isStaleChunkRetryExhausted(err)) {
      reportAndRedirect520(err, info)
      return
    }

    console.error('Global error handler:', { err, info })
    reportClientError(err, {
      app: appName,
      route: router.currentRoute.value.fullPath,
      componentInfo: info,
      severity: 'error',
    })
    router.replace('/520')
  }

  window.addEventListener('unhandledrejection', (event) => {
    if (tryReloadForStaleChunk(event.reason)) {
      event.preventDefault()
      return
    }
    if (isStaleChunkRetryExhausted(event.reason)) {
      event.preventDefault()
      reportAndRedirect520(event.reason)
      return
    }

    console.error('Unhandled rejection:', event.reason)
    reportClientError(event.reason, {
      app: appName,
      route: router.currentRoute.value.fullPath,
      severity: 'error',
    })
  })
}
