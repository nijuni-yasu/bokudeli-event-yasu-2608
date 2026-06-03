/** プレビュー・友人一覧で可視件数が足りないときの Firestore ページ読み飛ばし上限 */
export const MAX_PROFILE_PREVIEW_SKIP_PAGES = 20

export const isProfileViewerOwner = (viewerUid: string | null, targetUserId: string): boolean =>
  viewerUid != null && viewerUid === targetUserId

/**
 * マイページ上でイベント詳細・コミュニティ詳細へリンクしてよいか（§4.2.0）。
 * - 一般公開: 本人・他者とも true
 * - 限定公開: プロフィール所有者本人閲覧時のみ true
 */
export const computeProfileItemLinkableToViewer = (params: {
  isPublic: boolean
  viewerUid: string | null
  targetUserId: string
}): boolean => {
  const { isPublic, viewerUid, targetUserId } = params
  if (isPublic) return true
  return isProfileViewerOwner(viewerUid, targetUserId)
}
