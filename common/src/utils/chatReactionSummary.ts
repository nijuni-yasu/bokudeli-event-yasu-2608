import type { ChatReactionSummary } from '../schemas/ChatReaction.js'

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
