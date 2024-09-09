export const getHomePath = () => '/'
export const getShopPath = () => '/shop'
export const getMenuPath = () => '/menu'
export const getOrderPath = () => '/orders'
export const getCommunityPath = () => '/community'
export const getEventPath = () => '/events'
export const getOrderDetailPath = (eventId: string) => `/orders/${eventId}`
export const getUserEventUrl = (communityId: string, eventId: string) =>
  `${import.meta.env.VITE_ORIGIN_HOST}/c/${communityId}/e/${eventId}`
