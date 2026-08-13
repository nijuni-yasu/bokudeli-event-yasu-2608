/** Minimal stubs for base plugins when app workspaces run vue-tsc (build:types). */
declare module 'vue-router/auto' {
  import type { Router, RouterHistory, RouteRecordRaw } from 'vue-router'

  export function createRouter(options: {
    history: RouterHistory
    routes: RouteRecordRaw[]
    scrollBehavior?: unknown
  }): Router
  export function createWebHistory(base?: string): RouterHistory
  export type { Router }
}

declare module 'virtual:generated-layouts' {
  import type { RouteRecordRaw } from 'vue-router'

  export function setupLayouts(routes: RouteRecordRaw[]): RouteRecordRaw[]
}
