// 本来このファイルは、admin が持っているべきではないが、 `getEventPath` or `getUserPath` に関しては base に依存関係が散らばってしまっているため、
// ここに残すことにする。
// TODO 将来的にはアプリケーションをまたいだ path の解決方法を提供する

export const getEventPath = (communityAccount: string, eventId: string) => `/c/${communityAccount}/e/${eventId}`
export const getUserPath = (userId: string) => `/u/${userId}`
export const getNamesSheetPath = () => `/namesSheet`
export const getCommunityPath = (communityAccount: string) => `/c/${communityAccount}`