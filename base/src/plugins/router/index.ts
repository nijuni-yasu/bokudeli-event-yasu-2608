import type { App } from 'vue'
import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory, type Router } from 'vue-router/auto'

import { routes } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
  // @ts-expect-error vue-router/auto does not provide types for this option
  scrollBehavior: (_, __, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// 昔の仕様を維持するために、このような実装になっているが、もっと汎用的な仕組みに変更するべき
Object.values(import.meta.glob<{ setupRouter?: (r: Router) => void }>('@/router/*.ts', { eager: true })).forEach(
  (t) => {
    t.setupRouter?.(router)
  },
)

export default function (app: App) {
  app.use(router)
}
