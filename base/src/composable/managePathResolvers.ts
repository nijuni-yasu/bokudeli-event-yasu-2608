/** path 注入用の関数型（§2.3 A）。実装は user / enterprise の router/utils 側 */

export type ManageEventPathResolver = (_eventId: string) => string

export type UserPathResolver = (_userId: string) => string

export type EventCreatePathResolver = () => string

export type ManageCommunitySettingsPathResolver = (_communityAccount: string) => string
