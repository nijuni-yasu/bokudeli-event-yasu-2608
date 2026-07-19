import { createApp, defineAsyncComponent } from 'vue'

// Styles
import '@core/scss/template/index.scss'
import 'vuetify/styles'
import '@core/scss/template/libs/vuetify/index.scss'
// Styles from base
import '@shokujii/base/styles/base.scss'
// Styles for this project
import '@/styles/styles.scss'
// Themes
import { themes } from '@/themes'

import '@shokujii/base/firebase.js'
import '@/channelIo'
import { configureClientErrorReporting } from '@shokujii/base/utils/reportClientError.js'
import { setupGlobalErrorHandling } from '@shokujii/base/utils/setupGlobalErrorHandling.js'

const app = createApp(defineAsyncComponent(() => import('./App.vue')))

import('@shokujii/base/directives/linkify/index.js').then((m) => {
  app.directive('linkify', m.default)
})

Promise.all([
  import('@shokujii/base/plugins/router/index.js'),
  import('@shokujii/base/plugins/pinia.js'),
  import('@shokujii/base/plugins/vuetify/index.js'),
  import('@shokujii/base/plugins/i18n/index.js'),
  import('@shokujii/base/plugins/layouts.js'),
]).then(async ([routerMod, piniaMod, vuetifyMod, i18nMod, layoutsMod]) => {
  configureClientErrorReporting({ app: 'user' })
  const { buildEventStoreOptions, setDefaultEventStoreOptions } = await import('@shokujii/base/stores/event.js')
  setDefaultEventStoreOptions(buildEventStoreOptions(undefined))
  for (const plugin of [routerMod, piniaMod, vuetifyMod, i18nMod, layoutsMod]) {
    plugin.default(app, { themes })
  }
  setupGlobalErrorHandling(app, routerMod.router, { app: 'user' })
  app.mount('#app')
})
