export const getHomePath = () => '/'
export const getShopPath = () => '/shop'
export const getMenuPath = () => '/menu'
export const getOrderPath = () => '/order'
export const getCommunityPath = () => '/community'
export const getEventPath = () => '/events'
export const getOrderDetailPath = (eventId: string) => `/order/${eventId}`
export const getUserEventUrl = (communityAccount: string, eventId: string) =>
  `https://${import.meta.env.VITE_ORIGIN_HOST}/c/${communityAccount}/e/${eventId}`
export const getNamesPrintPath = () => '/namesprint'
