import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
} from 'firebase-admin/firestore'
import { CommunityForm } from '@shokujii/common/schemas/CommunityForm.js'
import { EVENT_FORM_CONFIG_DOC_ID, EventFormConfig } from '@shokujii/common/schemas/EventFormConfig.js'
import { FormResponse } from '@shokujii/common/schemas/FormResponse.js'
import { FormCheckoutAttempt } from '@shokujii/common/schemas/FormCheckoutAttempt.js'

const communityFormConverter: FirestoreDataConverter<CommunityForm> = {
  toFirestore(form: CommunityForm): DocumentData {
    return form.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): CommunityForm {
    return new CommunityForm(snapshot.id, snapshot.data())
  },
}

const eventFormConfigConverter: FirestoreDataConverter<EventFormConfig> = {
  toFirestore(config: EventFormConfig): DocumentData {
    return config.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): EventFormConfig {
    return new EventFormConfig(snapshot.id, snapshot.data())
  },
}

const formResponseConverter: FirestoreDataConverter<FormResponse> = {
  toFirestore(response: FormResponse): DocumentData {
    return response.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): FormResponse {
    return new FormResponse(snapshot.id, snapshot.data())
  },
}

const formCheckoutAttemptConverter: FirestoreDataConverter<FormCheckoutAttempt> = {
  toFirestore(attempt: FormCheckoutAttempt): DocumentData {
    return attempt.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): FormCheckoutAttempt {
    return new FormCheckoutAttempt(snapshot.id, snapshot.data())
  },
}

const formsCollection = (communityId: string) => {
  const db = getFirestore()
  return db.collection('communities').doc(communityId).collection('forms').withConverter(communityFormConverter)
}

const eventFormConfigRef = (communityId: string, eventId: string) => {
  const db = getFirestore()
  return db
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .collection('form_configs')
    .doc(EVENT_FORM_CONFIG_DOC_ID)
    .withConverter(eventFormConfigConverter)
}

const formResponsesCollection = (communityId: string, eventId: string) => {
  const db = getFirestore()
  return db
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .collection('form_responses')
    .withConverter(formResponseConverter)
}

const formAttemptsCollection = (communityId: string, eventId: string) => {
  const db = getFirestore()
  return db
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .collection('form_checkout_attempts')
    .withConverter(formCheckoutAttemptConverter)
}

export const listCommunityForms = async (communityId: string): Promise<CommunityForm[]> => {
  const snapshot = await formsCollection(communityId).get()
  return snapshot.docs.map((doc) => doc.data())
}

export const getCommunityForm = async (
  communityId: string,
  formId: string,
  transaction?: Transaction,
): Promise<CommunityForm | undefined> => {
  const ref = formsCollection(communityId).doc(formId)
  const snapshot = await (transaction === undefined ? ref.get() : transaction.get(ref))
  return snapshot.exists ? snapshot.data() : undefined
}

export const createCommunityForm = async (communityId: string, form: CommunityForm): Promise<CommunityForm> => {
  const ref = formsCollection(communityId).doc()
  const created = new CommunityForm(ref.id, form)
  await ref.set(created)
  return created
}

export const saveCommunityForm = async (
  communityId: string,
  form: CommunityForm,
  transaction?: Transaction,
): Promise<void> => {
  const ref = formsCollection(communityId).doc(form.id)
  if (transaction === undefined) {
    await ref.set(form)
  } else {
    transaction.set(ref, form)
  }
}

export const getEventFormConfig = async (
  communityId: string,
  eventId: string,
  transaction?: Transaction,
): Promise<EventFormConfig | undefined> => {
  const ref = eventFormConfigRef(communityId, eventId)
  const snapshot = await (transaction === undefined ? ref.get() : transaction.get(ref))
  return snapshot.exists ? snapshot.data() : undefined
}

export const saveEventFormConfig = async (
  communityId: string,
  eventId: string,
  config: EventFormConfig,
  transaction?: Transaction,
): Promise<void> => {
  const ref = eventFormConfigRef(communityId, eventId)
  if (transaction === undefined) {
    await ref.set(config)
  } else {
    transaction.set(ref, config)
  }
}

export const deleteEventFormConfig = async (
  communityId: string,
  eventId: string,
  transaction?: Transaction,
): Promise<void> => {
  const ref = eventFormConfigRef(communityId, eventId)
  if (transaction === undefined) {
    await ref.delete()
  } else {
    transaction.delete(ref)
  }
}

export const getFormResponse = async (
  communityId: string,
  eventId: string,
  userId: string,
  transaction?: Transaction,
): Promise<FormResponse | undefined> => {
  const ref = formResponsesCollection(communityId, eventId).doc(userId)
  const snapshot = await (transaction === undefined ? ref.get() : transaction.get(ref))
  return snapshot.exists ? snapshot.data() : undefined
}

export const listFormResponses = async (communityId: string, eventId: string): Promise<FormResponse[]> => {
  const snapshot = await formResponsesCollection(communityId, eventId).get()
  return snapshot.docs.map((doc) => doc.data())
}

export const saveFormResponse = async (
  communityId: string,
  eventId: string,
  response: FormResponse,
  transaction?: Transaction,
): Promise<void> => {
  const ref = formResponsesCollection(communityId, eventId).doc(response.id)
  if (transaction === undefined) {
    await ref.set(response)
  } else {
    transaction.set(ref, response)
  }
}

export const createFormCheckoutAttempt = async (
  communityId: string,
  eventId: string,
  src: Partial<FormCheckoutAttempt>,
  transaction?: Transaction,
): Promise<FormCheckoutAttempt> => {
  const ref = formAttemptsCollection(communityId, eventId).doc()
  const attempt = new FormCheckoutAttempt(ref.id, src)
  if (transaction === undefined) {
    await ref.set(attempt)
  } else {
    transaction.set(ref, attempt)
  }
  return attempt
}

export const getFormCheckoutAttempt = async (
  communityId: string,
  eventId: string,
  attemptId: string,
  transaction?: Transaction,
): Promise<FormCheckoutAttempt | undefined> => {
  const ref = formAttemptsCollection(communityId, eventId).doc(attemptId)
  const snapshot = await (transaction === undefined ? ref.get() : transaction.get(ref))
  return snapshot.exists ? snapshot.data() : undefined
}

export const saveFormCheckoutAttempt = async (
  communityId: string,
  eventId: string,
  attempt: FormCheckoutAttempt,
  transaction?: Transaction,
): Promise<void> => {
  const ref = formAttemptsCollection(communityId, eventId).doc(attempt.id)
  if (transaction === undefined) {
    await ref.set(attempt)
  } else {
    transaction.set(ref, attempt)
  }
}

export const listPendingFormCheckoutAttemptsForUser = async (
  communityId: string,
  eventId: string,
  userId: string,
  transaction?: Transaction,
): Promise<FormCheckoutAttempt[]> => {
  const query = formAttemptsCollection(communityId, eventId).where('user_id', '==', userId)
  const snapshot = await (transaction === undefined ? query.get() : transaction.get(query))
  return snapshot
    .docs
    .map((doc) => doc.data())
    .filter((attempt) => attempt.status === 'pending' || attempt.status === 'frozen')
}
