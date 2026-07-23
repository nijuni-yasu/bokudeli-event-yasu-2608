import { describe, expect, it } from 'vitest'
import {
  CHAT_REACTION_EMOJIS,
  ChatReaction,
  ChatReactionEmojiSchema,
  resolveChatReactionToggleAction,
} from './ChatReaction.js'
import { buildReactionSummary, normalizeReactionSummary } from '../utils/chatReactionSummary.js'

describe('CHAT_REACTION_EMOJIS', () => {
  it('contains 6 fixed emojis including surrogate pair 😭', () => {
    expect(CHAT_REACTION_EMOJIS).toHaveLength(6)
    expect(CHAT_REACTION_EMOJIS).toContain('😭')
    expect('😭'.length).toBe(2)
  })

  it('rejects emoji outside allow list', () => {
    expect(ChatReactionEmojiSchema.safeParse('😂').success).toBe(false)
    expect(ChatReactionEmojiSchema.safeParse('👍').success).toBe(true)
  })
})

describe('resolveChatReactionToggleAction', () => {
  it('returns add when no current reaction', () => {
    expect(resolveChatReactionToggleAction(undefined, '👍')).toBe('add')
  })

  it('returns remove when same emoji clicked', () => {
    expect(resolveChatReactionToggleAction('👍', '👍')).toBe('remove')
  })

  it('returns update when different emoji clicked', () => {
    expect(resolveChatReactionToggleAction('👍', '❤️')).toBe('update')
  })
})

describe('ChatReaction', () => {
  it('serializes emoji and timestamps to Firestore', () => {
    const now = Date.now()
    const reaction = new ChatReaction('user1', {
      emoji: '🎉',
      created_at: now,
      updated_at: now,
    })

    expect(reaction.isValidForDatabase()).toBe(true)
    const firestore = reaction.toFirestore()
    expect(firestore.emoji).toBe('🎉')
    expect(firestore.created_at).toBeDefined()
    expect(firestore.updated_at).toBeDefined()
  })
})

describe('buildReactionSummary', () => {
  it('aggregates emoji counts', () => {
    expect(buildReactionSummary([{ emoji: '👍' }, { emoji: '👍' }, { emoji: '❤️' }, { emoji: '😭' }])).toEqual({
      '👍': 2,
      '❤️': 1,
      '😭': 1,
    })
  })

  it('returns empty object for no reactions', () => {
    expect(buildReactionSummary([])).toEqual({})
  })
})

describe('normalizeReactionSummary', () => {
  it('removes zero counts and returns undefined when empty', () => {
    expect(normalizeReactionSummary({ '👍': 0, '❤️': 0 })).toBeUndefined()
    expect(normalizeReactionSummary({ '👍': 2, '❤️': 0 })).toEqual({ '👍': 2 })
  })
})
