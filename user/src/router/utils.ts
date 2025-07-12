/**
 * Return if user is logged in
 * This is completely up to you and how you want to store the token in your frontend application
 * e.g. If you are using cookies to store the application please update this function
 */
export const isUserLoggedIn = () => !!(localStorage.getItem('userData') && localStorage.getItem('accessToken'))

export const getHomePath = () => '/'
export const getCommunityListPath = () => '/communitylist'
export const getCommunityPath = (communityAccount: string) => `/c/${communityAccount}`
export const getEventPath = (communityAccount: string, eventId: string) => `/c/${communityAccount}/e/${eventId}`
export const getUserPath = (userId: string) => `/u/${userId}`
export const getInvoicePath = () => `/invoice`
export const getEventCreatePath = (communityAccount: string) => `/manage/community/${communityAccount}/newevent`
export const getEventEditPath = (eventId: string) => `/manage/event/${eventId}/settings`
export const getEventEditBasicPath = (eventId: string) => `/manage/event/${eventId}/settings?step=1`
export const getEventEditShopNoticePath = (eventId: string) => `/manage/event/${eventId}/settings?step=5`
export const getEventEditDetailsPath = (eventId: string) => `/manage/event/${eventId}/settings?step=4`
export const getManagePath = () => `/manage`
export const getManageNewCommunityPath = () => `/manage/newcommunity`
export const getManageCommunitySettingsPath = (communityAccount: string) =>
  `/manage/community/${communityAccount}/settings`
export const getManageCommunityListPath = () => '/manage/community'
export const getManageEventListPath = () => '/manage/event'
export const getManageCommunityPath = (communityAccount: string) => `/manage/community/${communityAccount}`
// export const getManageEventListPath = (communityAccount: string) => `/manage/community/${communityAccount}/event`
export const getManageEventPath = (eventId: string) => `/manage/event/${eventId}`
export const getManageEventSettingsPath = (eventId: string) => `/manage/event/${eventId}/settings`
export const getEventBillInvoicePath = (eventId: string) => `/manage/event/${eventId}/invoice`
export const getFlyerPath = () => `/flyer`
export const getProfile = () => `/profile`
