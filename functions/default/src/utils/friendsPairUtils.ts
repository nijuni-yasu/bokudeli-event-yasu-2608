const dedupeUserIds = (userIds: string[]): string[] => [...new Set(userIds.filter((id) => id !== ''))]

export const buildPairs = (userIds: string[]): [string, string][] => {
  const unique = dedupeUserIds(userIds)
  const pairs: [string, string][] = []
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      if (unique[i] !== unique[j]) {
        pairs.push([unique[i], unique[j]])
      }
    }
  }
  return pairs
}

/** キャンセルユーザーと各相手のペアのみ（残存参加者同士は含めない） */
export const buildPairsWithAnchor = (anchorUserId: string, counterpartUserIds: string[]): [string, string][] =>
  dedupeUserIds(counterpartUserIds)
    .filter((id) => id !== anchorUserId)
    .map((id) => [anchorUserId, id] as [string, string])

export const dedupeUserIdsForFriends = dedupeUserIds
