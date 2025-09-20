import { functions } from '@shokujii/base/firebase'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import {
  CreateOrUpdateUserRequset,
  CreateOrUpdateUserResponse,
  VerifyPassCodeRequest,
  VerifyPassCodeResponse,
  GetCustomTokenRequest,
  GetCustomTokenResponse,
} from '@shokujii/common/apis/user.js'

export const createOrUpdateUser = async (
  input: CreateOrUpdateUserRequset,
): Promise<HttpsCallableResult<CreateOrUpdateUserResponse>> => {
  const f = httpsCallable<CreateOrUpdateUserRequset, CreateOrUpdateUserResponse>(functions, 'createOrUpdateUser')
  return f(input)
}

export const verifyPassCode = (input: VerifyPassCodeRequest): Promise<HttpsCallableResult<VerifyPassCodeResponse>> => {
  const f = httpsCallable<VerifyPassCodeRequest, VerifyPassCodeResponse>(functions, 'verifyPassCode')
  return f(input)
}

export const getCustomToken = (input: GetCustomTokenRequest): Promise<HttpsCallableResult<GetCustomTokenResponse>> => {
  const f = httpsCallable<GetCustomTokenRequest, GetCustomTokenResponse>(functions, 'getCustomToken')
  return f(input)
}
