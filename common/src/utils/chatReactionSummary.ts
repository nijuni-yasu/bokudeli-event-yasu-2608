import { CHAT_REACTION_EMOJIS, type ChatReactionEmoji, type ChatReactionSummary } from '../schemas/ChatReaction.js'

/** reactions サブコレクションから message.reaction_summary を再計算する */
export const buildReactionSummary = (reactions: { emoji: string }[]): ChatReactionSummary => {
  const summary: ChatReactionSummary = {}
  for (const { emoji } of reactions) {
    summary[emoji] = (summary[emoji] ?? 0) + 1
  }
  return summary
}

/** 集計結果が空なら undefined（FieldValue.delete 用） */
export const normalizeReactionSummary = (summary: ChatReactionSummary): ChatReactionSummary | undefined => {
  const entries = Object.entries(summary).filter(([, count]) => count > 0)
  if (entries.length === 0) {
    return undefined
  }
  return Object.fromEntries(entries)
}

const incrementEmojiCount = (summary: ChatReactionSummary, emoji: ChatReactionEmoji): void => {
  summary[emoji] = (summary[emoji] ?? 0) + 1
}

const decrementEmojiCount = (summary: ChatReactionSummary, emoji: ChatReactionEmoji): void => {
  const nextCount = (summary[emoji] ?? 0) - 1
  if (nextCount <= 0) {
    delete summary[emoji]
    return
  }
  summary[emoji] = nextCount
}

/** 自分 1 人分の add/remove/update を reaction_summary に楽観反映する */
export const applyOptimisticReactionSummary = (
  summary: ChatReactionSummary | undefined,
  previousEmoji: ChatReactionEmoji | undefined,
  nextEmoji: ChatReactionEmoji | undefined,
): ChatReactionSummary | undefined => {
  const nextSummary: ChatReactionSummary = { ...(summary ?? {}) }

  if (previousEmoji != null) {
    decrementEmojiCount(nextSummary, previousEmoji)
  }
  if (nextEmoji != null) {
    incrementEmojiCount(nextSummary, nextEmoji)
  }

  return normalizeReactionSummary(nextSummary)
}

/** サマリ pill 表示用: CHAT_REACTION_EMOJIS 順に emoji を count 回連続表示 */
export const formatReactionSummaryText = (summary: ChatReactionSummary | undefined): string => {
  if (summary == null) {
    return ''
  }
  return CHAT_REACTION_EMOJIS.filter((emoji) => (summary[emoji] ?? 0) > 0)
    .map((emoji) => emoji.repeat(summary[emoji] ?? 0))
    .join('')
}

export type ReactionSummaryLabelFormatter = (emoji: ChatReactionEmoji, count: number) => string

/** a11y 用: emoji ごとの件数ラベルを連結 */
export const buildReactionSummaryAriaLabel = (
  summary: ChatReactionSummary | undefined,
  formatEntry: ReactionSummaryLabelFormatter,
): string => {
  if (summary == null) {
    return ''
  }
  return CHAT_REACTION_EMOJIS.filter((emoji) => (summary[emoji] ?? 0) > 0)
    .map((emoji) => formatEntry(emoji, summary[emoji] ?? 0))
    .join('、')
}
