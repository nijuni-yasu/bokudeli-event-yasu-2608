import { functions } from '@shokujii/base/firebase'
import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import type {
  ArchiveCommunityFormRequest,
  ArchiveCommunityFormResponse,
  ClearEventFormConfigRequest,
  ClearEventFormConfigResponse,
  CreateCommunityFormRequest,
  CreateCommunityFormResponse,
  DuplicateCommunityFormRequest,
  DuplicateCommunityFormResponse,
  GetCommunityFormRequest,
  GetCommunityFormResponse,
  GetEventFormConfigRequest,
  GetEventFormConfigResponse,
  GetEventFormPresenceRequest,
  GetEventFormPresenceResponse,
  GetEventFormResponseRequest,
  GetEventFormResponseResponse,
  GetOrderFormForCartRequest,
  GetOrderFormForCartResponse,
  ListCommunityFormsRequest,
  ListCommunityFormsResponse,
  ListEventFormResponsesRequest,
  ListEventFormResponsesResponse,
  SaveOrderFormAttemptRequest,
  SaveOrderFormAttemptResponse,
  SetEventFormFromCommunityRequest,
  SetEventFormFromCommunityResponse,
  UpdateCommunityFormRequest,
  UpdateCommunityFormResponse,
  UpdateEventFormConfigRequest,
  UpdateEventFormConfigResponse,
} from '@shokujii/common/apis/form.js'

export const listCommunityForms = (input: ListCommunityFormsRequest) => {
  const f = httpsCallable<ListCommunityFormsRequest, ListCommunityFormsResponse>(
    functions,
    'listCommunityFormsCallable',
  )
  return f(input)
}

export const getCommunityForm = (input: GetCommunityFormRequest) => {
  const f = httpsCallable<GetCommunityFormRequest, GetCommunityFormResponse>(functions, 'getCommunityFormCallable')
  return f(input)
}

export const createCommunityForm = (input: CreateCommunityFormRequest) => {
  const f = httpsCallable<CreateCommunityFormRequest, CreateCommunityFormResponse>(functions, 'createCommunityForm')
  return f(input)
}

export const updateCommunityForm = (input: UpdateCommunityFormRequest) => {
  const f = httpsCallable<UpdateCommunityFormRequest, UpdateCommunityFormResponse>(functions, 'updateCommunityForm')
  return f(input)
}

export const duplicateCommunityForm = (input: DuplicateCommunityFormRequest) => {
  const f = httpsCallable<DuplicateCommunityFormRequest, DuplicateCommunityFormResponse>(
    functions,
    'duplicateCommunityForm',
  )
  return f(input)
}

export const archiveCommunityForm = (input: ArchiveCommunityFormRequest) => {
  const f = httpsCallable<ArchiveCommunityFormRequest, ArchiveCommunityFormResponse>(functions, 'archiveCommunityForm')
  return f(input)
}

export const getEventFormPresence = (
  input: GetEventFormPresenceRequest,
): Promise<HttpsCallableResult<GetEventFormPresenceResponse>> => {
  const f = httpsCallable<GetEventFormPresenceRequest, GetEventFormPresenceResponse>(functions, 'getEventFormPresence')
  return f(input)
}

export const getEventFormConfig = (input: GetEventFormConfigRequest) => {
  const f = httpsCallable<GetEventFormConfigRequest, GetEventFormConfigResponse>(
    functions,
    'getEventFormConfigCallable',
  )
  return f(input)
}

export const setEventFormFromCommunity = (input: SetEventFormFromCommunityRequest) => {
  const f = httpsCallable<SetEventFormFromCommunityRequest, SetEventFormFromCommunityResponse>(
    functions,
    'setEventFormFromCommunity',
  )
  return f(input)
}

export const updateEventFormConfig = (input: UpdateEventFormConfigRequest) => {
  const f = httpsCallable<UpdateEventFormConfigRequest, UpdateEventFormConfigResponse>(
    functions,
    'updateEventFormConfig',
  )
  return f(input)
}

export const clearEventFormConfig = (input: ClearEventFormConfigRequest) => {
  const f = httpsCallable<ClearEventFormConfigRequest, ClearEventFormConfigResponse>(functions, 'clearEventFormConfig')
  return f(input)
}

export const getOrderFormForCart = (input: GetOrderFormForCartRequest) => {
  const f = httpsCallable<GetOrderFormForCartRequest, GetOrderFormForCartResponse>(functions, 'getOrderFormForCart')
  return f(input)
}

export const saveOrderFormAttempt = (input: SaveOrderFormAttemptRequest) => {
  const f = httpsCallable<SaveOrderFormAttemptRequest, SaveOrderFormAttemptResponse>(functions, 'saveOrderFormAttempt')
  return f(input)
}

export const listEventFormResponses = (input: ListEventFormResponsesRequest) => {
  const f = httpsCallable<ListEventFormResponsesRequest, ListEventFormResponsesResponse>(
    functions,
    'listEventFormResponses',
  )
  return f(input)
}

export const getEventFormResponse = (input: GetEventFormResponseRequest) => {
  const f = httpsCallable<GetEventFormResponseRequest, GetEventFormResponseResponse>(functions, 'getEventFormResponse')
  return f(input)
}
