/**
 * Return if user is logged in
 * This is completely up to you and how you want to store the token in your frontend application
 * e.g. If you are using cookies to store the application please update this function
 */
export const isUserLoggedIn = () => !!(localStorage.getItem('userData') && localStorage.getItem('accessToken'))

export const getHomePath = () => '/'
export const getCommunityListPath = () => '/communitylist'
export const getCommunityPath = (communityAccount: string) => `/c/${communityAccount}`
export const getCommunitySettingsPath = (communityAccount: string) => `/c/setup?id=${communityAccount}`
export const getCommunityCreatePath = () => `/c/setup`
export const getEventPath = (communityAccount: string, eventId: string) => `/c/${communityAccount}/e/${eventId}`
export const getUserPath = (userId: string) => `/u/${userId}`
export const getInvoicePath = () => `/invoice`
export const getEventCreatePath = (communityAccount: string) => `/manage/community/${communityAccount}/newevent`
export const getEventEditPath = (eventId: string) => `/manage/event/${eventId}/settings`
export const getManagePath = () => `/manage`
export const getManageCommunityListPath = () => '/manage/community'
export const getManageEventListPath = () => '/manage/event'
export const getManageCommunityPath = (communityAccount: string) => `/manage/community/${communityAccount}`
// export const getManageEventListPath = (communityAccount: string) => `/manage/community/${communityAccount}/event`
export const getManageEventPath = (eventId: string) => `/manage/event/${eventId}`
