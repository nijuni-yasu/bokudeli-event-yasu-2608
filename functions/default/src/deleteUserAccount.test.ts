import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  runTransactionMock,
  deleteUserMock,
  listFriendUserIdsMock,
  recountUserProfileCountsForUsersMock,
  listChatMembershipsForUserMock,
  batchCommitMock,
  batchUpdateMock,
  batchSetMock,
  chatRoomSnapshots,
} = vi.hoisted(() => ({
  runTransactionMock: vi.fn(),
  deleteUserMock: vi.fn(),
  listFriendUserIdsMock: vi.fn(),
  recountUserProfileCountsForUsersMock: vi.fn(),
  listChatMembershipsForUserMock: vi.fn(),
  batchCommitMock: vi.fn(),
  batchUpdateMock: vi.fn(),
  batchSetMock: vi.fn(),
  chatRoomSnapshots: new Map<string, { exists: boolean; member_user_ids: string[] }>(),
}))

const createChatRoomDocRef = (roomId: string) => {
  const path = `chat_rooms/${roomId}`
  return {
    path,
    get: async () => {
      const snapshot = chatRoomSnapshots.get(roomId)
      if (snapshot == null || !snapshot.exists) {
        return { exists: false, data: () => undefined }
      }
      return {
        exists: true,
        data: () => ({ member_user_ids: snapshot.member_user_ids }),
      }
    },
  }
}

vi.mock('firebase-functions/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  },
  onCall: <T>(handler: T) => handler,
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    arrayRemove: (...args: unknown[]) => ({ type: 'arrayRemove', args }),
    serverTimestamp: () => ({ type: 'serverTimestamp' }),
  },
  getFirestore: () => ({
    runTransaction: runTransactionMock,
    collection: (collectionPath: string) => ({
      doc: (docId: string) => ({ path: `${collectionPath}/${docId}` }),
    }),
    batch: () => ({
      set: batchSetMock,
      update: batchUpdateMock,
      delete: vi.fn(),
      commit: batchCommitMock,
    }),
  }),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    deleteUser: deleteUserMock,
  }),
}))

vi.mock('./stores/community.js', () => ({
  hasSoleManagerCommunity: vi.fn(),
  getCommunitiesWhereUserIsMember: vi.fn(),
  removeMemberFromCommunity: vi.fn(),
}))

vi.mock('./stores/passCode.js', () => ({
  getPassCodeRefsByUserId: vi.fn(),
  getPassCodeRefsByUserEmail: vi.fn(),
}))

vi.mock('./stores/user.js', () => ({
  anonymizeUser: vi.fn(),
  anonymizeUserPersonalInformation: vi.fn(),
  getUserPersonalInformation: vi.fn(),
}))

vi.mock('./stores/userFriend.js', () => ({
  listFriendUserIds: (...args: unknown[]) => listFriendUserIdsMock(...args),
}))

vi.mock('./utils/recountUserProfileCounts.js', () => ({
  recountUserProfileCountsForUsers: (...args: unknown[]) => recountUserProfileCountsForUsersMock(...args),
}))

vi.mock('./stores/chatMembership.js', () => ({
  listChatMembershipsForUser: (...args: unknown[]) => listChatMembershipsForUserMock(...args),
  getChatMembershipRef: vi.fn(() => ({ path: 'users/uid/chat_memberships/room1' })),
}))

vi.mock('./stores/chatRoom.js', () => ({
  getChatRoomRef: vi.fn((roomId: string) => createChatRoomDocRef(roomId)),
  updateChatRoomMembers: vi.fn((room: { member_user_ids: string[] }, memberUserIds: string[]) => ({
    ...room,
    member_user_ids: memberUserIds,
  })),
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { hasSoleManagerCommunity, getCommunitiesWhereUserIsMember } from './stores/community.js'
import { getPassCodeRefsByUserId, getPassCodeRefsByUserEmail } from './stores/passCode.js'
import { anonymizeUser, anonymizeUserPersonalInformation, getUserPersonalInformation } from './stores/user.js'
import { deleteUserAccount } from './deleteUserAccount.js'

type DeleteUserAccountHandler = (req: { auth?: { uid: string } }) => Promise<{ success: true }>

const callDeleteUserAccount = (uid: string | undefined) =>
  (deleteUserAccount as unknown as DeleteUserAccountHandler)({
    auth: uid == null ? undefined : { uid },
  })

beforeEach(() => {
  runTransactionMock.mockReset()
  deleteUserMock.mockReset()
  listFriendUserIdsMock.mockReset()
  recountUserProfileCountsForUsersMock.mockReset()
  listChatMembershipsForUserMock.mockReset()
  batchCommitMock.mockReset()
  batchUpdateMock.mockReset()
  batchSetMock.mockReset()

  vi.mocked(hasSoleManagerCommunity).mockReset()
  vi.mocked(getCommunitiesWhereUserIsMember).mockReset()
  vi.mocked(getPassCodeRefsByUserId).mockReset()
  vi.mocked(getPassCodeRefsByUserEmail).mockReset()
  vi.mocked(anonymizeUser).mockReset()
  vi.mocked(anonymizeUserPersonalInformation).mockReset()
  vi.mocked(getUserPersonalInformation).mockReset()

  runTransactionMock.mockImplementation(async (fn: (tx: object) => Promise<void>) => fn({}))
  vi.mocked(hasSoleManagerCommunity).mockResolvedValue(false)
  vi.mocked(getCommunitiesWhereUserIsMember).mockResolvedValue([])
  vi.mocked(getPassCodeRefsByUserId).mockResolvedValue([])
  vi.mocked(getPassCodeRefsByUserEmail).mockResolvedValue([])
  vi.mocked(getUserPersonalInformation).mockResolvedValue(undefined)
  vi.mocked(anonymizeUser).mockResolvedValue(undefined)
  vi.mocked(anonymizeUserPersonalInformation).mockResolvedValue(undefined)
  deleteUserMock.mockResolvedValue(undefined)
  listFriendUserIdsMock.mockResolvedValue(['userA', 'userC'])
  recountUserProfileCountsForUsersMock.mockResolvedValue(undefined)
  listChatMembershipsForUserMock.mockResolvedValue([])
  batchCommitMock.mockResolvedValue(undefined)
  chatRoomSnapshots.clear()
})

describe('deleteUserAccount', () => {
  it('未認証のとき unauthenticated', async () => {
    await expect(callDeleteUserAccount(undefined)).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('成功後に友人相手 uid へ recountUserProfileCountsForUsers を呼ぶ（RC-50）', async () => {
    const result = await callDeleteUserAccount('userB')

    expect(result).toEqual({ success: true })
    expect(listFriendUserIdsMock).toHaveBeenCalledWith('userB')
    expect(recountUserProfileCountsForUsersMock).toHaveBeenCalledWith(['userA', 'userC'])
    expect(deleteUserMock).toHaveBeenCalledWith('userB')
  })

  it('recount 失敗時もアカウント削除は成功する（RC-50 A1）', async () => {
    recountUserProfileCountsForUsersMock.mockRejectedValue(new Error('recount failed'))

    const result = await callDeleteUserAccount('userB')

    expect(result).toEqual({ success: true })
    expect(deleteUserMock).toHaveBeenCalledWith('userB')
  })

  it('友人がいないときは空配列で recount を呼ぶ', async () => {
    listFriendUserIdsMock.mockResolvedValue([])

    await callDeleteUserAccount('userB')

    expect(recountUserProfileCountsForUsersMock).toHaveBeenCalledWith([])
  })

  it('成功後に chat_memberships を削除し member_user_ids から除外する（RC-18）', async () => {
    listChatMembershipsForUserMock.mockResolvedValue([{ room_id: 'event_comm_evt', id: 'event_comm_evt' }])
    chatRoomSnapshots.set('event_comm_evt', { exists: true, member_user_ids: ['userB', 'userC'] })

    await callDeleteUserAccount('userB')

    expect(listChatMembershipsForUserMock).toHaveBeenCalledWith('userB')
    expect(batchUpdateMock).toHaveBeenCalledWith(
      { path: 'chat_rooms/event_comm_evt' },
      {
        member_user_ids: { type: 'arrayRemove', args: ['userB'] },
        updated_at: { type: 'serverTimestamp' },
      },
    )
    expect(batchSetMock).not.toHaveBeenCalled()
    expect(batchCommitMock).toHaveBeenCalledTimes(2)
    expect(deleteUserMock).toHaveBeenCalledWith('userB')
  })

  it('chat_room が存在しないとき room 更新 batch は commit しない（RC-94）', async () => {
    listChatMembershipsForUserMock.mockResolvedValue([{ room_id: 'missing_room', id: 'missing_room' }])

    await callDeleteUserAccount('userB')

    expect(batchUpdateMock).not.toHaveBeenCalled()
    expect(batchCommitMock).toHaveBeenCalledTimes(1)
    expect(deleteUserMock).toHaveBeenCalledWith('userB')
  })
})
