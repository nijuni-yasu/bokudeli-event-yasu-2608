import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const PROJECT_ID = 'firestore-rules-form-collections'
const testDir = fileURLToPath(new URL('.', import.meta.url))

const SUPPORT_USER = 'support-user'
const MANAGER = 'manager-user'
const MEMBER = 'member-user'
const COMMUNITY_ID = 'community-1'
const EVENT_ID = 'event-1'

let testEnv: RulesTestEnvironment

function auth(userId: string) {
  return testEnv.authenticatedContext(userId)
}

function unauthenticated() {
  return testEnv.unauthenticatedContext()
}

function formRef(context: RulesTestContext) {
  return context.firestore().collection('communities').doc(COMMUNITY_ID).collection('forms').doc('form-1')
}

function formConfigRef(context: RulesTestContext) {
  return context
    .firestore()
    .collection('communities')
    .doc(COMMUNITY_ID)
    .collection('events')
    .doc(EVENT_ID)
    .collection('form_configs')
    .doc('current')
}

function formResponseRef(context: RulesTestContext) {
  return context
    .firestore()
    .collection('communities')
    .doc(COMMUNITY_ID)
    .collection('events')
    .doc(EVENT_ID)
    .collection('form_responses')
    .doc(MEMBER)
}

function formAttemptRef(context: RulesTestContext) {
  return context
    .firestore()
    .collection('communities')
    .doc(COMMUNITY_ID)
    .collection('events')
    .doc(EVENT_ID)
    .collection('form_checkout_attempts')
    .doc('attempt-1')
}

describe('form collections firestore rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve(testDir, '../../../firestore.rules'), 'utf8'),
      },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('configs')
        .doc('global')
        .set({
          support_user_ids: [SUPPORT_USER],
          system_id: 'system-user',
          maintenance_mode: false,
        })
      await context.firestore().collection('communities').doc(COMMUNITY_ID).set({
        community_id: COMMUNITY_ID,
        community_name: 'Community',
        community_account: 'community-1',
        is_approved: true,
        is_public: true,
      })
      await context
        .firestore()
        .collection('communities')
        .doc(COMMUNITY_ID)
        .collection('members')
        .doc(MANAGER)
        .set({
          roles: ['manager'],
        })
      await context.firestore().collection('communities').doc(COMMUNITY_ID).collection('events').doc(EVENT_ID).set({
        event_id: EVENT_ID,
        community_id: COMMUNITY_ID,
        event_name: 'Event',
        is_deleted: false,
        is_public: true,
      })
      await formRef(context).set({ name: '事前アンケート' })
      await formConfigRef(context).set({ source_form_id: 'form-1', definition_version: 1 })
      await formResponseRef(context).set({ user_id: MEMBER, definition_version: 1 })
      await formAttemptRef(context).set({ user_id: MEMBER, status: 'pending' })
    })
  })

  it.each([
    ['未認証', () => unauthenticated()],
    ['一般ユーザー', () => auth(MEMBER)],
    ['コミュマネ', () => auth(MANAGER)],
    ['サポート', () => auth(SUPPORT_USER)],
  ])('%sは forms / form_configs / form_responses / form_checkout_attempts を read/write できない', async (_label, ctx) => {
    const context = ctx()
    await assertFails(formRef(context).get())
    await assertFails(formRef(context).set({ name: '更新' }))
    await assertFails(formConfigRef(context).get())
    await assertFails(formConfigRef(context).set({ definition_version: 2 }))
    await assertFails(formResponseRef(context).get())
    await assertFails(formResponseRef(context).set({ answers: [] }))
    await assertFails(formAttemptRef(context).get())
    await assertFails(formAttemptRef(context).set({ status: 'frozen' }))
  })

  it('collection group からも form_responses を読めない', async () => {
    await assertFails(auth(MANAGER).firestore().collectionGroup('form_responses').get())
    await assertFails(auth(SUPPORT_USER).firestore().collectionGroup('forms').get())
  })
})
