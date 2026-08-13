import type { App } from 'vue'

import { createLayoutsFromThemeConfig } from '@shokujii/base/utils/createLayoutsFromThemeConfig.js'
import { layoutConfig } from '@themeConfig'

// Styles
import '@layouts/styles/index.scss'

export default function (app: App) {
  // ℹ️ We generate layout config from our themeConfig so you don't have to write config twice
  app.use(createLayoutsFromThemeConfig(layoutConfig))
}
