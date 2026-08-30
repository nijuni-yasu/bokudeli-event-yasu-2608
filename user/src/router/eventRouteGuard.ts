import { ZodError } from 'zod'

/** 公開イベント詳細（`/c/{account}/e/{eventId}` および members 等の子パス） */
export const isPublicEventDetailPath = (path: string): boolean => /^\/c\/[^/]+\/e\/[^/]+/.test(path)

/**
 * イベント router guard で getLoadedEvent 失敗時のリダイレクト先。
 * 公開イベント詳細は ogpRequest がサーバー側で存在確認済みのため、
 * クライアント Firestore 失敗（Googlebot 等）で /404 + noindex にしない。
 * 存在確定（exists === false）時の SPA 内 404 は usePublicEventNotFoundRedirect が担当。
 */
export const resolveEventLoadFailureRedirect = (path: string, err: unknown): '/404' | '/520' | undefined => {
  if (err instanceof ZodError) {
    return '/520'
  }
  if (isPublicEventDetailPath(path)) {
    return undefined
  }
  return '/404'
}
