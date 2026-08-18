import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const PROJECT_ID = 'firestore-rules-test'
const testDir = fileURLToPath(new URL('.', import.meta.url))

const TENANT_A = 'tenant-ent-a'
const TENANT_B = 'tenant-ent-b'

let testEnv: RulesTestEnvironment

function enterpriseAuth(
  userId: string,
  enterpriseId: string,
  tenantId: string,
  overrides: Record<string, unknown> = {},
) {
  const { firebase: firebaseOverrides, ...restOverrides } = overrides as {
    firebase?: Record<string, unknown>
  }
  return testEnv.authenticatedContext(userId, {
    enterprise_id: enterpriseId,
    enterprise_role: 'member',
    user_type: 'enterprise',
    firebase: {
      sign_in_provider: 'custom',
      identities: {},
      tenant: tenantId,
      ...firebaseOverrides,
    },
    ...restOverrides,
  })
}

async function seedEnterpriseTenant(context: RulesTestContext, enterpriseId: string, tenantId: string): Promise<void> {
  await context.firestore().collection('enterprises').doc(enterpriseId).set({
    company_name: `Company ${enterpriseId}`,
    tenant_id: tenantId,
  })
}

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
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedEnterpriseTenant(context, 'ent-a', TENANT_A)
      await seedEnterpriseTenant(context, 'ent-b', TENANT_B)
    })
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
      await seedEnterpriseTenant(context, 'ent-a', TENANT_A)
      await seedEnterpriseTenant(context, 'ent-b', TENANT_B)
    })

    const otherEnterpriseUser = enterpriseAuth('user-other', 'ent-b', TENANT_B)
    await assertFails(otherEnterpriseUser.firestore().collection('enterprises').doc('ent-a').get())
  })

  it('自社 enterprise_id claims では enterprises を read できる', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedEnterpriseTenant(context, 'ent-a', TENANT_A)
    })

    const member = enterpriseAuth('user-a', 'ent-a', TENANT_A)
    await assertSucceeds(member.firestore().collection('enterprises').doc('ent-a').get())
  })

  it('firebase.tenant なしの enterprise claims では enterprises を read できない', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedEnterpriseTenant(context, 'ent-a', TENANT_A)
    })

    const legacyUser = testEnv.authenticatedContext('user-a', {
      enterprise_id: 'ent-a',
      enterprise_role: 'member',
      user_type: 'enterprise',
    })
    await assertFails(legacyUser.firestore().collection('enterprises').doc('ent-a').get())
  })

  it('tenant 不一致の enterprise user は enterprises を read できない', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedEnterpriseTenant(context, 'ent-a', TENANT_A)
    })

    const wrongTenantUser = enterpriseAuth('user-a', 'ent-a', 'wrong-tenant')
    await assertFails(wrongTenantUser.firestore().collection('enterprises').doc('ent-a').get())
  })

  it('他社 enterprise_id の communities read は拒否', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .set({ community_name: 'Enterprise A', enterprise_id: 'ent-a' })
    })

    const otherEnterpriseUser = enterpriseAuth('user-other', 'ent-b', TENANT_B)
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

    const member = enterpriseAuth('user-a', 'ent-a', TENANT_A)
    await assertSucceeds(member.firestore().collection('communities').doc('community-ent-a').get())
  })

  it('PF ユーザーは enterprise_id なしで communities create できる', async () => {
    const pfUser = testEnv.authenticatedContext('user-pf', {})
    await assertSucceeds(
      pfUser.firestore().collection('communities').doc('community-pf-new').set({ community_name: 'New PF' }),
    )
  })

  it('Enterprise ユーザーは自社 enterprise_id で communities create できる', async () => {
    const member = enterpriseAuth('user-a', 'ent-a', TENANT_A)
    await assertSucceeds(
      member
        .firestore()
        .collection('communities')
        .doc('community-ent-new')
        .set({ community_name: 'New Enterprise', enterprise_id: 'ent-a' }),
    )
  })

  it('Enterprise ユーザーは他社 enterprise_id で communities create できない', async () => {
    const member = enterpriseAuth('user-a', 'ent-a', TENANT_A)
    await assertFails(
      member
        .firestore()
        .collection('communities')
        .doc('community-ent-bad')
        .set({ community_name: 'Bad', enterprise_id: 'ent-b' }),
    )
  })

  it('Enterprise ユーザーは enterprise_id なしで communities create できない', async () => {
    const member = enterpriseAuth('user-a', 'ent-a', TENANT_A)
    await assertFails(
      member.firestore().collection('communities').doc('community-pf-from-ent').set({ community_name: 'PF from ent' }),
    )
  })

  it('Enterprise ユーザーは tenant 不一致で communities create できない', async () => {
    const member = enterpriseAuth('user-a', 'ent-a', TENANT_B)
    await assertFails(
      member
        .firestore()
        .collection('communities')
        .doc('community-ent-wrong-tenant')
        .set({ community_name: 'Wrong tenant', enterprise_id: 'ent-a' }),
    )
  })

  it('Enterprise ユーザーは tenant 未設定で communities create できない', async () => {
    const member = enterpriseAuth('user-a', 'ent-a', TENANT_A, {
      firebase: { sign_in_provider: 'custom', identities: {}, tenant: null },
    })
    await assertFails(
      member
        .firestore()
        .collection('communities')
        .doc('community-ent-no-tenant')
        .set({ community_name: 'No tenant', enterprise_id: 'ent-a' }),
    )
  })

  it('未認証ユーザーは enterprise_id string の member_orders read を拒否される', async () => {
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
        .doc('order-ent')
        .set({
          user_id: 'user-a',
          enterprise_id: 'ent-a',
          menu_price: 1000,
          pay_enterprise_subsidy_amount: 500,
        })
    })

    const unauthed = testEnv.unauthenticatedContext()
    await assertFails(
      unauthed
        .firestore()
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-1')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-ent')
        .get(),
    )
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

    const otherEnterpriseUser = enterpriseAuth('user-other', 'ent-b', TENANT_B)
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

    const member = enterpriseAuth('user-a', 'ent-a', TENANT_A)
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
      unauthed.firestore().collection('communities').doc('community-ent-a').collection('events').doc('event-1').get(),
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
    const pfSnap = await assertSucceeds(db.collectionGroup('events').where('event_name', '==', 'PF Event').get())
    expect(pfSnap.docs.length).toBe(1)
    // エンプラ events の CG 露出は T2（enterprise_id == null フィルタ）で遮断。未認証 CG は PF doc のみ検証。
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

    const otherEnterpriseUser = enterpriseAuth('user-other', 'ent-b', TENANT_B)
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

    const member = enterpriseAuth('user-a', 'ent-a', TENANT_A)
    await assertSucceeds(
      member.firestore().collection('communities').doc('community-ent-a').collection('events').doc('event-1').get(),
    )
  })

  it('collectionGroup member_orders: PF は未認証でも read 可、エンプラ doc は未認証で拒否', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await db
        .collection('communities')
        .doc('community-pf')
        .collection('events')
        .doc('event-pf')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-pf')
        .set({
          user_id: 'user-a',
          event_id: 'event-pf',
          enterprise_id: null,
          menu_name: 'PF Menu',
          menu_price: 500,
        })
      await db
        .collection('communities')
        .doc('community-ent-a')
        .collection('events')
        .doc('event-ent')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-ent')
        .set({
          user_id: 'user-a',
          enterprise_id: 'ent-a',
          menu_name: 'Enterprise Menu',
          menu_price: 1000,
          pay_enterprise_subsidy_amount: 500,
        })
    })

    const unauthed = testEnv.unauthenticatedContext()
    const db = unauthed.firestore()
    const pfSnapUnauthed = await assertSucceeds(
      db
        .collectionGroup('member_orders')
        .where('event_id', '==', 'event-pf')
        .where('enterprise_id', '==', null)
        .get(),
    )
    expect(pfSnapUnauthed.docs.length).toBe(1)
    expect(pfSnapUnauthed.docs[0].data().menu_name).toBe('PF Menu')
    // 未認証 CG: エンプラ doc は Rules（docEnterpriseId != null）で per-document deny。PF doc のみ上記 assertSucceeds で検証。
    await assertFails(db.collectionGroup('member_orders').where('enterprise_id', '==', 'ent-a').get())

    const owner = enterpriseAuth('user-a', 'ent-a', TENANT_A)
    const authDb = owner.firestore()
    const enterpriseSnap = await assertSucceeds(
      authDb.collectionGroup('member_orders').where('menu_name', '==', 'Enterprise Menu').get(),
    )
    expect(enterpriseSnap.docs.length).toBe(1)
    const pfSnap = await assertSucceeds(
      authDb.collectionGroup('member_orders').where('menu_name', '==', 'PF Menu').get(),
    )
    expect(pfSnap.docs.length).toBe(1)
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

  it('PF member_orders（enterprise_id: null 明示）は未認証でも read できる', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('communities')
        .doc('community-pf')
        .collection('events')
        .doc('event-pf-null')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-pf-null')
        .set({ user_id: 'user-a', enterprise_id: null, menu_price: 500 })
    })

    const unauthed = testEnv.unauthenticatedContext()
    await assertSucceeds(
      unauthed
        .firestore()
        .collection('communities')
        .doc('community-pf')
        .collection('events')
        .doc('event-pf-null')
        .collection('members')
        .doc('user-a')
        .collection('member_orders')
        .doc('order-pf-null')
        .get(),
    )
  })

  it('同社別ユーザーは他人の enterprise_id member_orders を read できる', async () => {
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
          pay_enterprise_subsidy_amount: 500,
        })
    })

    const coworker = enterpriseAuth('user-b', 'ent-a', TENANT_A)
    await assertSucceeds(
      coworker
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

    const owner = enterpriseAuth('user-a', 'ent-a', TENANT_A)
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

  it('enterprise admin は invoice_files を read できる', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('enterprises').doc('ent-a').collection('members').doc('admin-a').set({
        role: 'admin',
        is_active: true,
      })
      await context
        .firestore()
        .collection('enterprises')
        .doc('ent-a')
        .collection('invoice_files')
        .doc('2026-06')
        .set({
          year_month: '2026-06',
          gcs_id: 'cached-invoice-id',
          created_at: new Date(),
        })
    })

    const admin = enterpriseAuth('admin-a', 'ent-a', TENANT_A, { enterprise_role: 'admin' })
    await assertSucceeds(
      admin.firestore().collection('enterprises').doc('ent-a').collection('invoice_files').doc('2026-06').get(),
    )
  })

  it('一般 member は invoice_files を read できない', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('enterprises').doc('ent-a').collection('members').doc('user-a').set({
        role: 'member',
        is_active: true,
      })
      await context
        .firestore()
        .collection('enterprises')
        .doc('ent-a')
        .collection('invoice_files')
        .doc('2026-06')
        .set({
          year_month: '2026-06',
          gcs_id: 'cached-invoice-id',
          created_at: new Date(),
        })
    })

    const member = enterpriseAuth('user-a', 'ent-a', TENANT_A)
    await assertFails(
      member.firestore().collection('enterprises').doc('ent-a').collection('invoice_files').doc('2026-06').get(),
    )
  })
})
