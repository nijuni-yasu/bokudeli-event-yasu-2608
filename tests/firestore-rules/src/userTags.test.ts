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
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const PROJECT_ID = 'firestore-rules-user-tags'
const testDir = fileURLToPath(new URL('.', import.meta.url))

const USER_A = 'user-a'
const USER_B = 'user-b'

let testEnv: RulesTestEnvironment

function userAuth(userId: string) {
  return testEnv.authenticatedContext(userId)
}

function userRef(context: ReturnType<RulesTestEnvironment['authenticatedContext']>, userId: string) {
  return context.firestore().collection('users').doc(userId)
}

async function seedUser(context: RulesTestContext, userId: string, userTags: unknown[] = []): Promise<void> {
  await context.firestore().collection('users').doc(userId).set({
    user_id: userId,
    participated_event_count: 0,
    friend_count: 0,
    joined_community_count: 0,
    managed_community_count: 0,
    ordered_food_count: 0,
    user_tags: userTags,
  })
}

describe('user_tags firestore rules', () => {
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
      await seedUser(context, USER_A)
      await seedUser(context, USER_B)
    })
  })

  it('owner can update user_tags with valid tags', async () => {
    await assertSucceeds(userRef(userAuth(USER_A), USER_A).update({ user_tags: ['サッカー'] }))
  })

  it('owner can update user_tags to empty array', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedUser(context, USER_A, ['和食'])
    })

    await assertSucceeds(userRef(userAuth(USER_A), USER_A).update({ user_tags: [] }))
  })

  it('rejects user_tags with more than 10 elements', async () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`)
    await assertFails(userRef(userAuth(USER_A), USER_A).update({ user_tags: tags }))
  })

  it('rejects user_tags containing empty string', async () => {
    await assertFails(userRef(userAuth(USER_A), USER_A).update({ user_tags: [''] }))
  })

  it('rejects user_tags containing whitespace-only string', async () => {
    await assertFails(userRef(userAuth(USER_A), USER_A).update({ user_tags: ['   '] }))
    await assertFails(userRef(userAuth(USER_A), USER_A).update({ user_tags: ['\u3000'] }))
  })

  it('rejects user_tags containing tag longer than 20 characters', async () => {
    await assertFails(userRef(userAuth(USER_A), USER_A).update({ user_tags: ['a'.repeat(21)] }))
  })

  it('rejects user_tags containing non-string element', async () => {
    await assertFails(userRef(userAuth(USER_A), USER_A).update({ user_tags: [123] }))
  })

  it('rejects update of another user user_tags', async () => {
    await assertFails(userRef(userAuth(USER_A), USER_B).update({ user_tags: ['サッカー'] }))
  })
})
