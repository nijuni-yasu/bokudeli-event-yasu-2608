const PUBLIC_EXACT_PATHS = new Set(['/login', '/pass-code', '/maintenance'])

/** MVP: ゲスト未認証閲覧（G-1）は対象外。上記以外はログイン必須。 */
export const isPublicRoute = (path: string): boolean => {
  if (PUBLIC_EXACT_PATHS.has(path)) {
    return true
  }
  if (path === '/404' || path === '/520') {
    return true
  }
  return false
}

export const isLoginRequired = (path: string): boolean => !isPublicRoute(path)
