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
export const getNewEventPath = () => `/newevent`
export const getEventPath = (communityAccount: string, eventId: string) => `/c/${communityAccount}/e/${eventId}`
export const getEventCreatePath = (communityAccount: string) => `/c/${communityAccount}/e/create`
export const getUserPath = (userId: string) => `/u/${userId}`
export const getInvoicePath = () => `/invoice`
