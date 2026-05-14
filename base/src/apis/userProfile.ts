import { functions } from '@shokujii/base/firebase'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import type {
  BackfillUserProfileCountsRequest,
  BackfillUserProfileCountsResponse,
  GetUserProfilePreviewRequest,
  GetUserProfilePreviewResponse,
} from '@shokujii/common/apis/userProfile.js'

export const getUserProfilePreview = async (
  input: GetUserProfilePreviewRequest,
): Promise<HttpsCallableResult<GetUserProfilePreviewResponse>> => {
  const f = httpsCallable<GetUserProfilePreviewRequest, GetUserProfilePreviewResponse>(
    functions,
    'getUserProfilePreview',
  )
  return f(input)
}

export const backfillUserProfileCounts = async (
  input: BackfillUserProfileCountsRequest,
): Promise<HttpsCallableResult<BackfillUserProfileCountsResponse>> => {
  const f = httpsCallable<BackfillUserProfileCountsRequest, BackfillUserProfileCountsResponse>(
    functions,
    'backfillUserProfileCounts',
  )
  return f(input)
}
