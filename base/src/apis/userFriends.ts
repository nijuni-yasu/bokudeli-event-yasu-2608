import { functions } from '@shokujii/base/firebase'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import type {
  BackfillUserFriendsRequest,
  BackfillUserFriendsResponse,
  GetUserFriendMeetLogRequest,
  GetUserFriendMeetLogResponse,
  GetUserFriendsRequest,
  GetUserFriendsResponse,
} from '@shokujii/common/apis/userFriends.js'

export const getUserFriends = async (
  input: GetUserFriendsRequest,
): Promise<HttpsCallableResult<GetUserFriendsResponse>> => {
  const f = httpsCallable<GetUserFriendsRequest, GetUserFriendsResponse>(functions, 'getUserFriends')
  return f(input)
}

export const getUserFriendMeetLog = async (
  input: GetUserFriendMeetLogRequest,
): Promise<HttpsCallableResult<GetUserFriendMeetLogResponse>> => {
  const f = httpsCallable<GetUserFriendMeetLogRequest, GetUserFriendMeetLogResponse>(functions, 'getUserFriendMeetLog')
  return f(input)
}

export const backfillUserFriends = async (
  input: BackfillUserFriendsRequest,
): Promise<HttpsCallableResult<BackfillUserFriendsResponse>> => {
  const f = httpsCallable<BackfillUserFriendsRequest, BackfillUserFriendsResponse>(functions, 'backfillUserFriends')
  return f(input)
}
