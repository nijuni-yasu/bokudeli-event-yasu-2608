import type { RouteLocationRaw } from 'vue-router'

export type ResolveUserPathFn = (userId: string) => RouteLocationRaw
export type ResolveEventPathFn = (communityAccount: string, eventId: string) => RouteLocationRaw
