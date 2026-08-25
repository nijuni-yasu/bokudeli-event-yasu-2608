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

const PROJECT_ID = 'firestore-rules-test'
const testDir = fileURLToPath(new URL('.', import.meta.url))

let testEnv: RulesTestEnvironment

function partnerAuth(partnerId: string) {
  return testEnv.authenticatedContext(partnerId)
}

function managerAuth(userId: string) {
  return testEnv.authenticatedContext(userId)
}

async function seedCommunityWithManager(): Promise<void> {
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

describe('members_visible_min_count firestore rules', () => {
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

  it('partner が event_status のみ更新する場合は members_visible_min_count 変更なしで許可', async () => {
    const partner = partnerAuth('partner-1')
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      await admin
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .set({
          event_status: { value: 'applying_reservation', shop_comment: '' },
          partner_id: 'partner-1',
          members_visible_min_count: 3,
        })
    })

    await assertSucceeds(
      partner
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .update({
          event_status: { value: 'accepting_order', shop_comment: 'approved' },
        }),
    )
  })

  it('partner が members_visible_min_count を変更することを拒否', async () => {
    const partner = partnerAuth('partner-1')
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      await admin
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .set({
          event_status: { value: 'accepting_order', shop_comment: '' },
          partner_id: 'partner-1',
          members_visible_min_count: 3,
        })
    })

    await assertFails(
      partner
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .update({
          members_visible_min_count: 5,
        }),
    )
  })

  it('partner が members_visible_min_count を新規追加することを拒否', async () => {
    const partner = partnerAuth('partner-1')
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      await admin
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .set({
          event_status: { value: 'accepting_order', shop_comment: '' },
          partner_id: 'partner-1',
        })
    })

    await assertFails(
      partner
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .update({
          members_visible_min_count: 3,
        }),
    )
  })

  it('manager が members_visible_min_count を定員以下なら許可', async () => {
    await seedCommunityWithManager()
    const manager = managerAuth('manager-1')
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      await admin
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .set({
          event_status: { value: 'in_draft', shop_comment: '' },
          event_max_people: 10,
          members_visible_min_count: 3,
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
          members_visible_min_count: 5,
        }),
    )
  })

  it('manager が members_visible_min_count を定員超過で拒否', async () => {
    await seedCommunityWithManager()
    const manager = managerAuth('manager-1')
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      await admin
        .firestore()
        .collection('communities')
        .doc('community-1')
        .collection('events')
        .doc('event-1')
        .set({
          event_status: { value: 'in_draft', shop_comment: '' },
          event_max_people: 4,
          members_visible_min_count: 3,
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
          members_visible_min_count: 10,
        }),
    )
  })
})
