import { createApp, defineAsyncComponent } from 'vue'

// Styles
import '@core/scss/template/index.scss'
import 'vuetify/styles'
import '@core/scss/template/libs/vuetify/index.scss'
// Styles from base
import '@shokujii/base/styles/base.scss'
// Styles for this project
import '@/styles/styles.scss'

import '@shokujii/base/firebase.js'
import '@/channelIo'

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
]).then((plugins) => {
  for (const plugin of plugins) {
    plugin.default(app)
  }
  app.mount('#app')
})

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error handler:', { err, instance, info })
  // TODO エラーの種類によって処理を変える
  import('@shokujii/base/plugins/router/index.js').then(({ router }) => {
    router.replace('/520')
  })
}
