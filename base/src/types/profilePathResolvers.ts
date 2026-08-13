import type { RouteLocationRaw } from 'vue-router'

export type ResolveUserPathFn = (userId: string) => RouteLocationRaw
export type ResolveEventPathFn = (communityAccount: string, eventId: string) => RouteLocationRaw
export type ResolveReceiptPathFn = (eventId: string, stripeId: string) => string
export type ResolveCommunityPathFn = (communityAccount: string) => RouteLocationRaw
/** 注文確定後に注文履歴へ遷移する際の URL（成功ダイアログ用 query 付き） */
export type ResolveOrdersPathFn = (params: { eventId: string; communityAccount: string }) => RouteLocationRaw
export type ResolveChatRoomPathFn = (roomId?: string) => RouteLocationRaw
export type NavigateToEventChatFn = (params: { communityId: string; eventId: string }) => Promise<boolean>

export type ProfileLinkPolicyFn = (isPublic: boolean, isLinkable?: boolean) => boolean
