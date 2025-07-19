import type { App } from 'vue'
import { useI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { type ThemeOptions } from 'vuetify/lib/composables/theme.js'

import { VBtn } from 'vuetify/components/VBtn'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import defaults from './defaults'
import { getI18n } from '@shokujii/base/plugins/i18n/index'

// Icons
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

export default function (app: App, theme: ThemeOptions) {
  const vuetify = createVuetify({
    aliases: {
      IconBtn: VBtn,
      // ...aliases,
    },
    components,
    directives,
    defaults,
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
    theme,
    locale: {
      adapter: createVueI18nAdapter({ i18n: getI18n(), useI18n }),
    },
  })

  app.use(vuetify)
}
