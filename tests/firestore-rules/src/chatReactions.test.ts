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
import { serverTimestamp } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const PROJECT_ID = 'firestore-rules-chat-reactions'
const testDir = fileURLToPath(new URL('.', import.meta.url))

const ROOM_ID = 'room1'
const MESSAGE_ID = 'msg1'
const MEMBER_A = 'user-a'
const MEMBER_B = 'user-b'
const OUTSIDER = 'user-out'

let testEnv: RulesTestEnvironment

function memberAuth(userId: string) {
  return testEnv.authenticatedContext(userId)
}

function reactionRef(context: ReturnType<RulesTestEnvironment['authenticatedContext']>, userId: string) {
  return context
    .firestore()
    .collection('chat_rooms')
    .doc(ROOM_ID)
    .collection('messages')
    .doc(MESSAGE_ID)
    .collection('reactions')
    .doc(userId)
}

async function seedChatRoom(context: RulesTestContext, isActive: boolean): Promise<void> {
  const now = new Date()
  await context.firestore().collection('chat_rooms').doc(ROOM_ID).set({
    room_type: 'event',
    member_user_ids: [MEMBER_A, MEMBER_B],
    is_active: isActive,
    created_at: now,
    updated_at: now,
  })
  await context
    .firestore()
    .collection('chat_rooms')
    .doc(ROOM_ID)
    .collection('messages')
    .doc(MESSAGE_ID)
    .set({
      message_type: 'user',
      sender_user_id: MEMBER_A,
      body: 'hello',
      created_at: now,
    })
}

describe('chat reactions firestore rules', () => {
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
      await seedChatRoom(context, true)
    })
  })

  it('member can read reactions', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('chat_rooms')
        .doc(ROOM_ID)
        .collection('messages')
        .doc(MESSAGE_ID)
        .collection('reactions')
        .doc(MEMBER_A)
        .set({
          emoji: '👍',
          created_at: new Date(),
          updated_at: new Date(),
        })
    })

    await assertSucceeds(reactionRef(memberAuth(MEMBER_B), MEMBER_A).get())
  })

  it('non-member cannot read reactions', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('chat_rooms')
        .doc(ROOM_ID)
        .collection('messages')
        .doc(MESSAGE_ID)
        .collection('reactions')
        .doc(MEMBER_A)
        .set({
          emoji: '👍',
          created_at: new Date(),
          updated_at: new Date(),
        })
    })

    await assertFails(reactionRef(memberAuth(OUTSIDER), MEMBER_A).get())
  })

  it('member can create own reaction with allowed emoji', async () => {
    const ref = reactionRef(memberAuth(MEMBER_A), MEMBER_A)
    await assertSucceeds(
      ref.set({
        emoji: '😭',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }),
    )
  })

  it('rejects invalid emoji', async () => {
    const ref = reactionRef(memberAuth(MEMBER_A), MEMBER_A)
    await assertFails(
      ref.set({
        emoji: '😂',
        created_at: new Date(),
        updated_at: new Date(),
      }),
    )
  })

  it('member can update own reaction to another allowed emoji', async () => {
    const ref = reactionRef(memberAuth(MEMBER_A), MEMBER_A)
    await assertSucceeds(
      ref.set({
        emoji: '👍',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }),
    )
    await assertSucceeds(
      ref.update({
        emoji: '❤️',
        updated_at: serverTimestamp(),
      }),
    )
  })

  it('member can delete own reaction', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .collection('chat_rooms')
        .doc(ROOM_ID)
        .collection('messages')
        .doc(MESSAGE_ID)
        .collection('reactions')
        .doc(MEMBER_A)
        .set({
          emoji: '👍',
          created_at: new Date(),
          updated_at: new Date(),
        })
    })

    await assertSucceeds(reactionRef(memberAuth(MEMBER_A), MEMBER_A).delete())
  })

  it('cannot write reaction for another user', async () => {
    const ref = reactionRef(memberAuth(MEMBER_A), MEMBER_B)
    await assertFails(
      ref.set({
        emoji: '👍',
        created_at: new Date(),
        updated_at: new Date(),
      }),
    )
  })

  it('rejects reaction write in ended room', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await seedChatRoom(context, false)
    })

    const ref = reactionRef(memberAuth(MEMBER_A), MEMBER_A)
    await assertFails(
      ref.set({
        emoji: '👍',
        created_at: new Date(),
        updated_at: new Date(),
      }),
    )
  })

  it('rejects reaction write for non-existent message', async () => {
    const ref = memberAuth(MEMBER_A)
      .firestore()
      .collection('chat_rooms')
      .doc(ROOM_ID)
      .collection('messages')
      .doc('missing-message')
      .collection('reactions')
      .doc(MEMBER_A)

    await assertFails(
      ref.set({
        emoji: '👍',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }),
    )
  })
})
