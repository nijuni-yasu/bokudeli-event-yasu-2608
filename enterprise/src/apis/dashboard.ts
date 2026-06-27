import { functions } from '@shokujii/base/firebase'
import { httpsCallable } from 'firebase/functions'
import type {
  GetDashboardMemberDataRequest,
  GetDashboardMemberDataResponse,
  GetDashboardMonthlyDataRequest,
  GetDashboardMonthlyDataResponse,
} from '@shokujii/common/apis/dashboard.js'

export const getDashboardMonthlyData = async (input: GetDashboardMonthlyDataRequest) => {
  const f = httpsCallable<GetDashboardMonthlyDataRequest, GetDashboardMonthlyDataResponse>(
    functions,
    'getDashboardMonthlyData',
  )
  return f(input)
}

export const getDashboardMemberData = async (input: GetDashboardMemberDataRequest) => {
  const f = httpsCallable<GetDashboardMemberDataRequest, GetDashboardMemberDataResponse>(
    functions,
    'getDashboardMemberData',
  )
  return f(input)
}
