import { functions } from '@shokujii/base/firebase'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import {
  RequestEmailChangeRequest,
  RequestEmailLoginRequest,
  RequestEmailLoginResponse,
  ConfirmEmailLoginRequest,
  ConfirmEmailLoginResponse,
  RequestEmailRegistrationRequest,
  RequestEmailRegistrationResponse,
  ConfirmEmailRegistrationRequest,
  ConfirmEmailRegistrationResponse,
  ConfirmEmailChangeRequest,
  ConfirmEmailChangeResponse,
  UpdateProfileFromProvidersRequest,
  UpdateProfileFromProvidersResponse,
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

export const requestEmailRegistration = async (input: RequestEmailRegistrationRequest) => {
  const f = httpsCallable<RequestEmailRegistrationRequest, RequestEmailRegistrationResponse>(
    functions,
    'requestEmailRegistration',
  )
  return f(input)
}

export const confirmEmailRegistration = async (
  input: ConfirmEmailRegistrationRequest,
): Promise<HttpsCallableResult<ConfirmEmailRegistrationResponse>> => {
  const f = httpsCallable<ConfirmEmailRegistrationRequest, ConfirmEmailRegistrationResponse>(
    functions,
    'confirmEmailRegistration',
  )
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

export const updateProfileFromProviders = async (input: UpdateProfileFromProvidersRequest) => {
  const f = httpsCallable<UpdateProfileFromProvidersRequest, UpdateProfileFromProvidersResponse>(
    functions,
    'updateProfileFromProviders',
  )
  return f(input)
}

export const deleteUserAccount = async (): Promise<{ success: true }> => {
  const f = httpsCallable<void, { success: true }>(functions, 'deleteUserAccount')
  const result = await f()
  return result.data
}
