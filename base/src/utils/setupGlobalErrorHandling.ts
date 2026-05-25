import type { App } from 'vue'
import type { Router } from 'vue-router'
import {
  configureClientErrorReporting,
  reportClientError,
  type ClientErrorContext,
} from '@shokujii/base/utils/reportClientError.js'

type SetupGlobalErrorHandlingOptions = Pick<ClientErrorContext, 'app'>

export function setupGlobalErrorHandling(app: App, router: Router, options: SetupGlobalErrorHandlingOptions): void {
  const { app: appName } = options

  configureClientErrorReporting({ app: appName })

  app.config.errorHandler = (err, _instance, info) => {
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
    console.error('Unhandled rejection:', event.reason)
    reportClientError(event.reason, {
      app: appName,
      route: router.currentRoute.value.fullPath,
      severity: 'error',
    })
  })
}
