import { functions } from '@shokujii/base/firebase'
import { httpsCallable } from 'firebase/functions'
import {
  GetEnterpriseByDomainRequest,
  GetEnterpriseByDomainResponse,
  RequestEnterpriseEmailLoginRequest,
  RequestEnterpriseEmailLoginResponse,
  ConfirmEnterpriseEmailLoginRequest,
  ConfirmEnterpriseEmailLoginResponse,
  LogEnterpriseLogoutRequest,
  LogEnterpriseLogoutResponse,
} from '@shokujii/common/apis/enterprise.js'

export const getEnterpriseByDomain = async (input: GetEnterpriseByDomainRequest) => {
  const f = httpsCallable<GetEnterpriseByDomainRequest, GetEnterpriseByDomainResponse>(
    functions,
    'getEnterpriseByDomain',
  )
  return f(input)
}

export const requestEnterpriseEmailLogin = async (input: RequestEnterpriseEmailLoginRequest) => {
  const f = httpsCallable<RequestEnterpriseEmailLoginRequest, RequestEnterpriseEmailLoginResponse>(
    functions,
    'requestEnterpriseEmailLogin',
  )
  return f(input)
}

export const confirmEnterpriseEmailLogin = async (input: ConfirmEnterpriseEmailLoginRequest) => {
  const f = httpsCallable<ConfirmEnterpriseEmailLoginRequest, ConfirmEnterpriseEmailLoginResponse>(
    functions,
    'confirmEnterpriseEmailLogin',
  )
  return f(input)
}

export const logEnterpriseLogout = async (input: LogEnterpriseLogoutRequest) => {
  const f = httpsCallable<LogEnterpriseLogoutRequest, LogEnterpriseLogoutResponse>(functions, 'logEnterpriseLogout')
  return f(input)
}
