import type { RouteLocationRaw } from 'vue-router'

export type ResolveUserPathFn = (userId: string) => RouteLocationRaw
export type ResolveEventPathFn = (communityAccount: string, eventId: string) => RouteLocationRaw
export type ResolveReceiptPathFn = (eventId: string, stripeId: string) => string
export type ResolveCommunityPathFn = (communityAccount: string) => RouteLocationRaw
export type ResolveChatRoomPathFn = (roomId?: string) => RouteLocationRaw
export type NavigateToEventChatFn = (params: { communityId: string; eventId: string }) => Promise<boolean>

export type ProfileLinkPolicyFn = (isPublic: boolean, isLinkable?: boolean) => boolean
