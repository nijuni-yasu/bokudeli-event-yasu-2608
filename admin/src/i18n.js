import Vue from 'vue'
import VueI18n from 'vue-i18n'

import ja from 'vuetify/lib/locale/ja'
import en from 'vuetify/lib/locale/en'

Vue.use(VueI18n)

const messages = {
  en: {
    ...require('@/locales/en.json'),
    $vuetify: en,
  },
  ja: {
    ...require('@/locales/ja.json'),
    $vuetify: ja,
  },
}

export default new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'ja',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'ja',
  messages,
  dateTimeFormats: {
    ja: {
      time: {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      },
    },
  },
})
