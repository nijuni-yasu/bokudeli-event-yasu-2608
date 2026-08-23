import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { Timestamp } from 'firebase/firestore'

const PROJECT_ID = 'firestore-rules-test'
const testDir = fileURLToPath(new URL('.', import.meta.url))

let testEnv: RulesTestEnvironment

function managerAuth(userId: string) {
  return testEnv.authenticatedContext(userId)
}

async function seedCommunityWithManager(
  context: ReturnType<RulesTestEnvironment['authenticatedContext']>,
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (admin) => {
    await admin
      .firestore()
      .collection('communities')
      .doc('community-1')
      .set({ community_name: 'C1', is_approved: true })
    await admin
      .firestore()
      .collection('communities')
      .doc('community-1')
      .collection('members')
      .doc('manager-1')
      .set({ roles: ['manager'] })
  })
}

describe('minimum_participants firestore rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve(testDir, '../../../firestore.rules'), 'utf8'),
      },
    })
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('configs').doc('global').set({ support_user_ids: [] })
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('configs').doc('global').set({ support_user_ids: [] })
    })
  })

  it('accepting_order 中は minimum_participants の count 変更を拒否', async () => {
    const manager = managerAuth('manager-1')
    await seedCommunityWithManager(manager)
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      await admin
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .set({
          event_status: { value: 'accepting_order' },
          partner_id: 'partner-1',
          minimum_participants: {
            enabled: true,
            count: 3,
            judgment_days_before: 1,
            judgment_datetime: Timestamp.fromMillis(Date.now() + 86400000),
          },
        })
    })

    await assertFails(
      manager
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .update({
          minimum_participants: {
            enabled: true,
            count: 5,
            judgment_days_before: 1,
            judgment_datetime: Timestamp.fromMillis(Date.now() + 86400000),
          },
        }),
    )
  })

  it('in_draft では minimum_participants の count 変更を許可', async () => {
    const manager = managerAuth('manager-1')
    await seedCommunityWithManager(manager)
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      await admin
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .set({
          event_status: { value: 'in_draft' },
          partner_id: 'partner-1',
          minimum_participants: {
            enabled: true,
            count: 3,
            judgment_days_before: 1,
            judgment_datetime: Timestamp.fromMillis(Date.now() + 86400000),
          },
        })
    })

    await assertSucceeds(
      manager
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .update({
          minimum_participants: {
            enabled: true,
            count: 4,
            judgment_days_before: 1,
            judgment_datetime: Timestamp.fromMillis(Date.now() + 86400000),
          },
        }),
    )
  })

  it('judgment_evaluated_at のクライアント設定を拒否', async () => {
    const manager = managerAuth('manager-1')
    await seedCommunityWithManager(manager)
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      await admin
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .set({
          event_status: { value: 'in_draft' },
          partner_id: 'partner-1',
          minimum_participants: {
            enabled: true,
            count: 3,
            judgment_days_before: 1,
            judgment_datetime: Timestamp.fromMillis(Date.now() + 86400000),
          },
        })
    })

    await assertFails(
      manager
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .update({
          minimum_participants: {
            enabled: true,
            count: 3,
            judgment_days_before: 1,
            judgment_datetime: Timestamp.fromMillis(Date.now() + 86400000),
            judgment_evaluated_at: Timestamp.fromMillis(Date.now()),
          },
        }),
    )
  })
})
