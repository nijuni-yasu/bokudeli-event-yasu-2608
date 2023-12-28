import { createI18n } from 'vue-i18n'

const messages = Object.fromEntries(
  Object.entries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import.meta.glob<{ default: any }>('./locales/*.json', { eager: true }),
  ).map(([key, value]) => [key.slice(10, -5), value.default]),
)

export default createI18n({
  legacy: false,
  locale: 'ja',
  fallbackLocale: 'ja',
  messages,
  // TODO messages 同様、別ファイルに切り出す
  datetimeFormats: {
    ja: {
      time: {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      },
    }
  }
})
