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

const PROJECT_ID = 'firestore-rules-letters'
const testDir = fileURLToPath(new URL('.', import.meta.url))

const SUPPORT_USER = 'support-user'
const MANAGER_A = 'manager-a'
const MANAGER_B = 'manager-b'
const MEMBER_A = 'member-a'
const OUTSIDER = 'outsider'
const COMMUNITY_A = 'community-a'
const COMMUNITY_B = 'community-b'
const LETTER_ID = 'letter-1'

let testEnv: RulesTestEnvironment

function auth(userId: string) {
  return testEnv.authenticatedContext(userId)
}

function unauthenticated() {
  return testEnv.unauthenticatedContext()
}

function letterRef(
  context: ReturnType<RulesTestEnvironment['authenticatedContext']>,
  communityId: string,
  letterId: string,
) {
  return context.firestore().collection('communities').doc(communityId).collection('letters').doc(letterId)
}

async function seedGlobalConfig(context: RulesTestContext): Promise<void> {
  await context
    .firestore()
    .collection('configs')
    .doc('global')
    .set({
      support_user_ids: [SUPPORT_USER],
      system_id: 'system-user',
      maintenance_mode: false,
    })
}

async function seedCommunity(context: RulesTestContext, communityId: string): Promise<void> {
  await context
    .firestore()
    .collection('communities')
    .doc(communityId)
    .set({
      community_name: `Community ${communityId}`,
      community_account: communityId,
      is_approved: true,
    })
}

async function seedCommunityMember(
  context: RulesTestContext,
  communityId: string,
  userId: string,
  roles: string[],
): Promise<void> {
  await context.firestore().collection('communities').doc(communityId).collection('members').doc(userId).set({ roles })
}

function minimalLetterData(communityId: string, letterId: string) {
  const now = new Date()
  return {
    letter_id: letterId,
    letter_type: 'community',
    community_account: communityId,
    status: 'draft',
    letter_title: 'Title',
    letter_content: 'Body',
    scheduled_at: now,
    updated_at: now,
  }
}

async function seedLetter(context: RulesTestContext, communityId: string, letterId: string): Promise<void> {
  await letterRef(context as never, communityId, letterId).set(minimalLetterData(communityId, letterId))
}

describe('letters firestore rules', () => {
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
      await seedGlobalConfig(context)
      await seedCommunity(context, COMMUNITY_A)
      await seedCommunity(context, COMMUNITY_B)
      await seedCommunityMember(context, COMMUNITY_A, MANAGER_A, ['manager'])
      await seedCommunityMember(context, COMMUNITY_B, MANAGER_B, ['manager'])
      await seedCommunityMember(context, COMMUNITY_A, MEMBER_A, ['member'])
      await seedLetter(context, COMMUNITY_A, LETTER_ID)
    })
  })

  it('manager can read letters in own community', async () => {
    await assertSucceeds(letterRef(auth(MANAGER_A), COMMUNITY_A, LETTER_ID).get())
  })

  it('manager can create letter in own community', async () => {
    await assertSucceeds(
      letterRef(auth(MANAGER_A), COMMUNITY_A, 'letter-new').set(minimalLetterData(COMMUNITY_A, 'letter-new')),
    )
  })

  it('manager can update letter in own community', async () => {
    await assertSucceeds(
      letterRef(auth(MANAGER_A), COMMUNITY_A, LETTER_ID).update({
        letter_title: 'Updated',
      }),
    )
  })

  it('manager can delete letter in own community', async () => {
    await assertSucceeds(letterRef(auth(MANAGER_A), COMMUNITY_A, LETTER_ID).delete())
  })

  it('support can read and write letters in any community', async () => {
    await assertSucceeds(letterRef(auth(SUPPORT_USER), COMMUNITY_A, LETTER_ID).get())
    await assertSucceeds(
      letterRef(auth(SUPPORT_USER), COMMUNITY_B, 'letter-support').set(
        minimalLetterData(COMMUNITY_B, 'letter-support'),
      ),
    )
  })

  it('regular member cannot read letters', async () => {
    await assertFails(letterRef(auth(MEMBER_A), COMMUNITY_A, LETTER_ID).get())
  })

  it('regular member cannot create letter', async () => {
    await assertFails(
      letterRef(auth(MEMBER_A), COMMUNITY_A, 'letter-member').set(minimalLetterData(COMMUNITY_A, 'letter-member')),
    )
  })

  it('regular member cannot update letter', async () => {
    await assertFails(
      letterRef(auth(MEMBER_A), COMMUNITY_A, LETTER_ID).update({
        letter_title: 'Updated',
      }),
    )
  })

  it('regular member cannot delete letter', async () => {
    await assertFails(letterRef(auth(MEMBER_A), COMMUNITY_A, LETTER_ID).delete())
  })

  it('unauthenticated user cannot read letters', async () => {
    await assertFails(letterRef(unauthenticated() as never, COMMUNITY_A, LETTER_ID).get())
  })

  it('outsider cannot read or write letters', async () => {
    await assertFails(letterRef(auth(OUTSIDER), COMMUNITY_A, LETTER_ID).get())
    await assertFails(
      letterRef(auth(OUTSIDER), COMMUNITY_A, 'letter-outsider').set(minimalLetterData(COMMUNITY_A, 'letter-outsider')),
    )
  })

  it('manager of community A cannot read letters in community B', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedLetter(context, COMMUNITY_B, LETTER_ID)
    })
    await assertFails(letterRef(auth(MANAGER_A), COMMUNITY_B, LETTER_ID).get())
  })
})
