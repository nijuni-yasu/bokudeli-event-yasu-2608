import { functions } from '@shokujii/base/firebase'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import {
  RequestEmailChangeRequest,
  RequestEmailLoginRequest,
  RequestEmailLoginResponse,
  ConfirmEmailLoginRequest,
  ConfirmEmailLoginResponse,
  ConfirmEmailChangeRequest,
  ConfirmEmailChangeResponse,
} from '@shokujii/common/apis/user.js'

export const requestEmailLogin = async (input: RequestEmailLoginRequest) => {
  const f = httpsCallable<RequestEmailLoginRequest, RequestEmailLoginResponse>(functions, 'requestEmailLogin')
  return f(input)
}

export const confirmEmailLogin = async (
  input: ConfirmEmailLoginRequest,
): Promise<HttpsCallableResult<ConfirmEmailLoginResponse>> => {
  const f = httpsCallable<ConfirmEmailLoginRequest, ConfirmEmailLoginResponse>(functions, 'confirmEmailLogin')
  return f(input)
}

export const requestEmailChange = async (input: RequestEmailChangeRequest) => {
  const f = httpsCallable<RequestEmailChangeRequest>(functions, 'requestEmailChange')
  return f(input)
}

export const confirmEmailChange = async (input: ConfirmEmailChangeRequest) => {
  const f = httpsCallable<ConfirmEmailChangeRequest, ConfirmEmailChangeResponse>(functions, 'confirmEmailChange')
  return f(input)
}
