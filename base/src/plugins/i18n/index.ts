import type { App } from 'vue'
import { createI18n, type I18n } from 'vue-i18n'
import _ from 'lodash'

const messages1 = Object.fromEntries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(import.meta.glob<{ default: any }>('../../locales/messages/*.ts', { eager: true })).flatMap(
    ([key, value]) => {
      const fileName = /.*\/locales\/messages\/(.+)\.ts/.exec(key)?.[1]
      return fileName == null ? [] : [[fileName, value.default]]
    },
  ),
)

const messages2 = Object.fromEntries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(import.meta.glob<{ default: any }>('@/locales/messages/*.ts', { eager: true })).flatMap(
    ([key, value]) => {
      const fileName = /.*\/locales\/messages\/(.+)\.ts/.exec(key)?.[1]
      return fileName == null ? [] : [[fileName, value.default]]
    },
  ),
)

const messages = _.merge(messages1, messages2)

const numberFormats1 = Object.fromEntries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(import.meta.glob<{ default: any }>('../../locales/numberFormats/*.ts', { eager: true })).flatMap(
    ([key, value]) => {
      const fileName = /.*\/locales\/numberFormats\/(.+)\.ts/.exec(key)?.[1]
      return fileName == null ? [] : [[fileName, value.default]]
    },
  ),
)

const numberFormats2 = Object.fromEntries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(import.meta.glob<{ default: any }>('@/locales/numberFormats/*.ts', { eager: true })).flatMap(
    ([key, value]) => {
      const fileName = /.*\/locales\/numberFormats\/(.+)\.ts/.exec(key)?.[1]
      return fileName == null ? [] : [[fileName, value.default]]
    },
  ),
)

const numberFormats = _.merge(numberFormats1, numberFormats2)

let _i18n: I18n | null = null

export const getI18n = () => {
  if (_i18n === null) {
    _i18n = createI18n({
      legacy: false,
      locale: 'ja',
      fallbackLocale: 'ja',
      fallbackWarn: false,
      missingWarn: false,
      warnHtmlMessage: false,
      messages,
      numberFormats,
    })
  }

  return _i18n
}

export default function (app: App) {
  app.use(getI18n())
}
