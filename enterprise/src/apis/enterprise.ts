import { functions } from '@shokujii/base/firebase'
import { httpsCallable } from 'firebase/functions'
import type {
  GetEnterpriseByDomainRequest,
  GetEnterpriseByDomainResponse,
  RequestEnterpriseEmailLoginRequest,
  RequestEnterpriseEmailLoginResponse,
  ConfirmEnterpriseEmailLoginRequest,
  ConfirmEnterpriseEmailLoginResponse,
  LogEnterpriseLogoutRequest,
  LogEnterpriseLogoutResponse,
  CreateEnterpriseMembersRequest,
  CreateEnterpriseMembersResponse,
  GetEnterpriseMembersRequest,
  GetEnterpriseMembersResponse,
  DisableEnterpriseMemberRequest,
  DisableEnterpriseMemberResponse,
  EnableEnterpriseMemberRequest,
  EnableEnterpriseMemberResponse,
  UpdateEnterpriseMemberRequest,
  UpdateEnterpriseMemberResponse,
  UpdateEnterpriseRoleRequest,
  UpdateEnterpriseRoleResponse,
  UpdateEnterpriseSettingsRequest,
  UpdateEnterpriseSettingsResponse,
  UpdateEnterpriseSubsidySettingsRequest,
  UpdateEnterpriseSubsidySettingsResponse,
  GetEnterpriseCommunitiesRequest,
  GetEnterpriseCommunitiesResponse,
  CreateEnterpriseCommunitiesRequest,
  CreateEnterpriseCommunitiesResponse,
  GetInvitationUrlForEnterpriseCommunityManagerRequest,
  GetInvitationUrlForEnterpriseCommunityManagerResponse,
  AcceptInvitationForEnterpriseCommunityManagerRequest,
  AcceptInvitationForEnterpriseCommunityManagerResponse,
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

export const createEnterpriseMembers = async (input: CreateEnterpriseMembersRequest) => {
  const f = httpsCallable<CreateEnterpriseMembersRequest, CreateEnterpriseMembersResponse>(
    functions,
    'createEnterpriseMembers',
  )
  return f(input)
}

export const getEnterpriseMembers = async (input: GetEnterpriseMembersRequest) => {
  const f = httpsCallable<GetEnterpriseMembersRequest, GetEnterpriseMembersResponse>(functions, 'getEnterpriseMembers')
  return f(input)
}

export const disableEnterpriseMember = async (input: DisableEnterpriseMemberRequest) => {
  const f = httpsCallable<DisableEnterpriseMemberRequest, DisableEnterpriseMemberResponse>(
    functions,
    'disableEnterpriseMember',
  )
  return f(input)
}

export const enableEnterpriseMember = async (input: EnableEnterpriseMemberRequest) => {
  const f = httpsCallable<EnableEnterpriseMemberRequest, EnableEnterpriseMemberResponse>(
    functions,
    'enableEnterpriseMember',
  )
  return f(input)
}

export const updateEnterpriseMember = async (input: UpdateEnterpriseMemberRequest) => {
  const f = httpsCallable<UpdateEnterpriseMemberRequest, UpdateEnterpriseMemberResponse>(
    functions,
    'updateEnterpriseMember',
  )
  return f(input)
}

export const updateEnterpriseRole = async (input: UpdateEnterpriseRoleRequest) => {
  const f = httpsCallable<UpdateEnterpriseRoleRequest, UpdateEnterpriseRoleResponse>(functions, 'updateEnterpriseRole')
  return f(input)
}

export const updateEnterpriseSettings = async (input: UpdateEnterpriseSettingsRequest) => {
  const f = httpsCallable<UpdateEnterpriseSettingsRequest, UpdateEnterpriseSettingsResponse>(
    functions,
    'updateEnterpriseSettings',
  )
  return f(input)
}

export const updateEnterpriseSubsidySettings = async (input: UpdateEnterpriseSubsidySettingsRequest) => {
  const f = httpsCallable<UpdateEnterpriseSubsidySettingsRequest, UpdateEnterpriseSubsidySettingsResponse>(
    functions,
    'updateEnterpriseSubsidySettings',
  )
  return f(input)
}

export const getEnterpriseCommunities = async (input: GetEnterpriseCommunitiesRequest) => {
  const f = httpsCallable<GetEnterpriseCommunitiesRequest, GetEnterpriseCommunitiesResponse>(
    functions,
    'getEnterpriseCommunities',
  )
  return f(input)
}

export const createEnterpriseCommunities = async (input: CreateEnterpriseCommunitiesRequest) => {
  const f = httpsCallable<CreateEnterpriseCommunitiesRequest, CreateEnterpriseCommunitiesResponse>(
    functions,
    'createEnterpriseCommunities',
  )
  return f(input)
}

export const getInvitationUrlForEnterpriseCommunityManager = async (
  input: GetInvitationUrlForEnterpriseCommunityManagerRequest,
) => {
  const f = httpsCallable<
    GetInvitationUrlForEnterpriseCommunityManagerRequest,
    GetInvitationUrlForEnterpriseCommunityManagerResponse
  >(functions, 'getInvitationUrlForEnterpriseCommunityManager')
  return f(input)
}

export const acceptInvitationForEnterpriseCommunityManager = async (
  input: AcceptInvitationForEnterpriseCommunityManagerRequest,
) => {
  const f = httpsCallable<
    AcceptInvitationForEnterpriseCommunityManagerRequest,
    AcceptInvitationForEnterpriseCommunityManagerResponse
  >(functions, 'acceptInvitationForEnterpriseCommunityManager')
  return f(input)
}
