// 本来このファイルは、partner が持っているべきではないが、 `getEventPath` or `getUserPath` に関しては base に依存関係が散らばってしまっているため、
// ここに残すことにする。
// TODO 将来的にはアプリケーションをまたいだ path の解決方法を提供する
// navigation/utils.ts に移行する

export const getEventPath = (communityAccount: string, eventId: string) => `/c/${communityAccount}/e/${eventId}`
export const getUserPath = (userId: string) => `/u/${userId}`
export const getCommunityPath = (communityAccount: string) => `/c/${communityAccount}`

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getManageEventPath = (_eventId: string) => ''
/** Phase 1-C manage 系 base コンポーネントの import 解決用。partner では manage 画面を描画しない */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getManageCommunityPath = (_communityAccount: string) => ''
export const getManageNewCommunityPath = () => ''
export const getManageCommunityListPath = () => ''
export const getManagePath = () => ''
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getEventCreatePath = (_communityAccount: string) => ''
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getManageCommunitySettingsPath = (_communityAccount: string) => ''
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getManageCommunityInvoicePath = (_communityAccount: string) => ''
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getEventEditPathByRawStatus = (_eventId: string, _rawStatus: string) => ''
/** base/src/components/EventEdit.vue が参照する。partner ではアルバムプレビューを出さないが import 解決に必要 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getManageCommunityAlbumPath = (_communityAccount: string) => ''
/** Phase 2 manage 系 base コンポーネントの import 解決用。partner では manage 画面を描画しない */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getEventBillInvoicePath = (_eventId: string) => ''
/** Phase 2 manage 系 base コンポーネントの import 解決用。partner では manage 画面を描画しない */
export const getFlyerPath = () => ''

export const getUrlFromPath = (path: string) => `https://${import.meta.env.VITE_ORIGIN_HOST}${path}`
export const getProfile = () => '/profile'
export const getLogin = () => '/login'
