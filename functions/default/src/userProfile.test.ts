import { describe, expect, it, vi } from 'vitest'

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  },
  onCall: () => () => undefined,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
  Timestamp: {
    now: vi.fn(),
    fromMillis: vi.fn((ms: number) => ({ toMillis: () => ms })),
  },
  FieldValue: { delete: vi.fn() },
  FieldPath: { documentId: vi.fn() },
}))

vi.mock('./stores/config.js', () => ({ getConfigGlobal: vi.fn() }))
vi.mock('./stores/user.js', () => ({ getUser: vi.fn(), getUserRef: vi.fn() }))
vi.mock('./stores/event.js', () => ({ getCommunityEventKey: vi.fn(), getEventsInCommunities: vi.fn() }))
vi.mock('./utils/userProfileBackfill.js', () => ({ runUserProfileBackfill: vi.fn() }))
vi.mock('./utils/userFriendsResolver.js', () => ({ resolveUserFriendsList: vi.fn() }))
vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

import {
  computeProfileItemLinkableToViewer,
  isProfileViewerOwner,
  MAX_PROFILE_PREVIEW_SKIP_PAGES,
} from './utils/profileItemVisibility.js'

describe('profileItemVisibility helpers', () => {
  it('MAX_PROFILE_PREVIEW_SKIP_PAGES は 20', () => {
    expect(MAX_PROFILE_PREVIEW_SKIP_PAGES).toBe(20)
  })

  it('isProfileViewerOwner: 本人閲覧のみ true', () => {
    expect(isProfileViewerOwner('owner', 'owner')).toBe(true)
    expect(isProfileViewerOwner('viewer', 'owner')).toBe(false)
    expect(isProfileViewerOwner(null, 'owner')).toBe(false)
  })
})

describe('computeProfileItemLinkableToViewer', () => {
  it('一般公開は未ログインでもリンク可（true）', () => {
    expect(computeProfileItemLinkableToViewer({ isPublic: true, viewerUid: null, targetUserId: 'owner' })).toBe(true)
  })

  it('限定公開は未ログインではリンク不可（false）', () => {
    expect(computeProfileItemLinkableToViewer({ isPublic: false, viewerUid: null, targetUserId: 'owner' })).toBe(false)
  })

  it('限定公開でも閲覧者がプロフィール本人ならリンク可（true）', () => {
    expect(computeProfileItemLinkableToViewer({ isPublic: false, viewerUid: 'owner', targetUserId: 'owner' })).toBe(
      true,
    )
  })

  it('限定公開で閲覧者が本人以外ならリンク不可（false）', () => {
    expect(computeProfileItemLinkableToViewer({ isPublic: false, viewerUid: 'viewer', targetUserId: 'owner' })).toBe(
      false,
    )
  })
})
