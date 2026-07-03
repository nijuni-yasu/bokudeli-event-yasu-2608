import type { RouteLocationRaw } from 'vue-router'

export type ResolveUserPathFn = (userId: string) => RouteLocationRaw
export type ResolveEventPathFn = (communityAccount: string, eventId: string) => RouteLocationRaw
export type ResolveChatRoomPathFn = (roomId?: string) => RouteLocationRaw
export type NavigateToEventChatFn = (params: { communityId: string; eventId: string }) => Promise<boolean>
