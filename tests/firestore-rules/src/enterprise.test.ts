import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const PROJECT_ID = 'firestore-rules-test'

let testEnv: RulesTestEnvironment

describe('enterprise firestore rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve(import.meta.dirname, '../../../firestore.rules'), 'utf8'),
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
})
