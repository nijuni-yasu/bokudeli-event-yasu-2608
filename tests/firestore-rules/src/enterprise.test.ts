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

describe('enterprise firestore rules', () => {
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
  })

  it('PF 既存データ（enterprise_id なし）の communities read は許可', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('communities').doc('community-1').set({ community_name: 'PF Community' })
    })

    const unauthed = testEnv.unauthenticatedContext()
    await assertSucceeds(unauthed.firestore().collection('communities').doc('community-1').get())
  })

  it('PF データ（enterprise_id: null 明示）の communities read は許可', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-pf-null')
        .set({ community_name: 'PF Community', enterprise_id: null })
    })

    const unauthed = testEnv.unauthenticatedContext()
    await assertSucceeds(unauthed.firestore().collection('communities').doc('community-pf-null').get())
  })

  it('未認証ユーザーは enterprise_id string の communities read を拒否される', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .set({ community_name: 'Enterprise A', enterprise_id: 'ent-a' })
    })

    const unauthed = testEnv.unauthenticatedContext()
    await assertFails(unauthed.firestore().collection('communities').doc('community-ent-a').get())
  })

  it('他社 enterprise_id claims では enterprises を read できない', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('enterprises').doc('ent-a').set({ company_name: 'Company A' })
    })

    const otherEnterpriseUser = testEnv.authenticatedContext('user-other', {
      enterprise_id: 'ent-b',
      enterprise_role: 'member',
      user_type: 'enterprise',
    })
    await assertFails(otherEnterpriseUser.firestore().collection('enterprises').doc('ent-a').get())
  })

  it('自社 enterprise_id claims では enterprises を read できる', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('enterprises').doc('ent-a').set({ company_name: 'Company A' })
    })

    const member = testEnv.authenticatedContext('user-a', {
      enterprise_id: 'ent-a',
      enterprise_role: 'member',
      user_type: 'enterprise',
    })
    await assertSucceeds(member.firestore().collection('enterprises').doc('ent-a').get())
  })

  it('他社 enterprise_id の communities read は拒否', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .set({ community_name: 'Enterprise A', enterprise_id: 'ent-a' })
    })

    const otherEnterpriseUser = testEnv.authenticatedContext('user-other', {
      enterprise_id: 'ent-b',
      enterprise_role: 'member',
      user_type: 'enterprise',
    })
    await assertFails(otherEnterpriseUser.firestore().collection('communities').doc('community-ent-a').get())
  })

  it('自社 enterprise_id の communities read は許可', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .set({ community_name: 'Enterprise A', enterprise_id: 'ent-a' })
    })

    const member = testEnv.authenticatedContext('user-a', {
      enterprise_id: 'ent-a',
      enterprise_role: 'member',
      user_type: 'enterprise',
    })
    await assertSucceeds(member.firestore().collection('communities').doc('community-ent-a').get())
  })

  it('他社 enterprise_id の member_orders read は拒否', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-1')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-1')
        .set({
          user_id: 'user-a',
          enterprise_id: 'ent-a',
          menu_price: 1000,
        })
    })

    const otherEnterpriseUser = testEnv.authenticatedContext('user-other', {
      enterprise_id: 'ent-b',
      enterprise_role: 'member',
      user_type: 'enterprise',
    })
    await assertFails(
      otherEnterpriseUser
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-1')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-1')
        .get(),
    )
  })

  it('pass_code はクライアントから read/write できない', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('pass_code').doc('code-1').set({ pass_code: '123456' })
    })

    const member = testEnv.authenticatedContext('user-a', {
      enterprise_id: 'ent-a',
      enterprise_role: 'member',
      user_type: 'enterprise',
    })
    await assertFails(member.firestore().collection('pass_code').doc('code-1').get())
    await assertFails(member.firestore().collection('pass_code').doc('code-1').set({ pass_code: '999999' }))
  })

  it('PF 既存データ（enterprise_id なし）の events read は許可', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-pf')
        .collection('events')
        .doc('event-pf')
        .set({ event_name: 'PF Event' })
    })

    const unauthed = testEnv.unauthenticatedContext()
    await assertSucceeds(
      unauthed.firestore().collection('communities').doc('community-pf').collection('events').doc('event-pf').get(),
    )
  })

  it('PF データ（enterprise_id: null 明示）の events read は許可', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-pf')
        .collection('events')
        .doc('event-pf-null')
        .set({ event_name: 'PF Event', enterprise_id: null })
    })

    const unauthed = testEnv.unauthenticatedContext()
    await assertSucceeds(
      unauthed
        .firestore()
        .collection('communities')
        .doc('community-pf')
        .collection('events')
        .doc('event-pf-null')
        .get(),
    )
  })

  it('未認証ユーザーは enterprise_id string の events read を拒否される', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-1')
        .set({ event_name: 'Enterprise Event', enterprise_id: 'ent-a' })
    })

    const unauthed = testEnv.unauthenticatedContext()
    await assertFails(
      unauthed
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-1')
        .get(),
    )
  })

  it('collectionGroup events: PF（enterprise_id: null）は read 可、エンプラ doc は未認証で拒否', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await db
        .collection('communities')
        .doc('community-pf')
        .collection('events')
        .doc('event-pf-null')
        .set({ event_name: 'PF Event', enterprise_id: null, is_public: true })
      await db
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-ent')
        .set({ event_name: 'Enterprise Event', enterprise_id: 'ent-a', is_public: true })
    })

    const unauthed = testEnv.unauthenticatedContext()
    const db = unauthed.firestore()
    await assertSucceeds(
      db.collectionGroup('events').where('event_name', '==', 'PF Event').get(),
    )
    await assertFails(
      db.collectionGroup('events').where('event_name', '==', 'Enterprise Event').get(),
    )
  })

  it('他社 enterprise_id の events read は拒否', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-1')
        .set({ event_name: 'Enterprise Event', enterprise_id: 'ent-a' })
    })

    const otherEnterpriseUser = testEnv.authenticatedContext('user-other', {
      enterprise_id: 'ent-b',
      enterprise_role: 'member',
      user_type: 'enterprise',
    })
    await assertFails(
      otherEnterpriseUser
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-1')
        .get(),
    )
  })

  it('自社 enterprise_id の events read は許可', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-1')
        .set({ event_name: 'Enterprise Event', enterprise_id: 'ent-a' })
    })

    const member = testEnv.authenticatedContext('user-a', {
      enterprise_id: 'ent-a',
      enterprise_role: 'member',
      user_type: 'enterprise',
    })
    await assertSucceeds(
      member.firestore().collection('communities').doc('community-ent-a').collection('events').doc('event-1').get(),
    )
  })

  it('PF member_orders（enterprise_id なし）は未認証でも read できる', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-pf')
        .collection('events')
        .doc('event-pf')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-pf')
        .set({ user_id: 'user-a', menu_price: 500 })
    })

    const unauthed = testEnv.unauthenticatedContext()
    await assertSucceeds(
      unauthed
        .firestore()
        .collection('communities')
        .doc('community-pf')
        .collection('events')
        .doc('event-pf')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-pf')
        .get(),
    )
  })

  it('注文本人は自社 enterprise_id の member_orders を read できる', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-1')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-1')
        .set({
          user_id: 'user-a',
          enterprise_id: 'ent-a',
          menu_price: 1000,
        })
    })

    const owner = testEnv.authenticatedContext('user-a', {
      enterprise_id: 'ent-a',
      enterprise_role: 'member',
      user_type: 'enterprise',
    })
    await assertSucceeds(
      owner
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-1')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-1')
        .get(),
    )
  })
})
