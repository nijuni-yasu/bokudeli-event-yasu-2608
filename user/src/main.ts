import { createApp, defineAsyncComponent } from 'vue'

// Styles
import '@core/scss/template/index.scss'
import 'vuetify/styles'
import '@core/scss/template/libs/vuetify/index.scss'
// Styles from base
import '@styles/base.scss'
// Styles for this project
import '@styles/styles.scss'

import '@/firebase'

const app = createApp(defineAsyncComponent(() => import('./App.vue')))

import('@/directives/linkify').then((m) => {
  app.directive('linkify', m.default)
})

Promise.all([
  import('@/plugins/router'),
  import('@/plugins/pinia'),
  import('@/plugins/vuetify'),
  import('@/plugins/i18n'),
  import('@/plugins/layouts'),
]).then((plugins) => {
  for (const plugin of plugins) {
    plugin.default(app)
  }
  app.mount('#app')
})
