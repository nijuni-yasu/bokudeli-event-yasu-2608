import type { App } from 'vue'
import { useI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { VBtn } from 'vuetify/components/VBtn'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import defaults from './defaults'
import { themes } from '@/themes'
import { getI18n } from '@/plugins/i18n/index'
import type { IconProps, IconSet } from 'vuetify'
import { Icon } from '@iconify/vue'

// Icons
// import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
export const iconify: IconSet = {
  // @ts-expect-error IconProps is a valid parameter
  component: (props: IconProps) => h(Icon, props),
}

export default function (app: App) {
  const vuetify = createVuetify({
    aliases: {
      IconBtn: VBtn,
    },
    components,
    directives,
    defaults,
    icons: {
      defaultSet: 'iconify',
      // aliases,
      sets: {
        // mdi,
        iconify,
      },
    },
    theme: { themes },
    locale: {
      adapter: createVueI18nAdapter({ i18n: getI18n(), useI18n }),
    },
  })

  app.use(vuetify)
}
