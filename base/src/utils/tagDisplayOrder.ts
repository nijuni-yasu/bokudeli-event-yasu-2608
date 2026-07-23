/**
 * タグの表示順（閲覧者プロフィールとの一致＝ハイライト）を共通化する。
 */

/**
 * 個数なしのタグ配列: ハイライトを先に、各グループ内は元の配列順を維持する。
 */
export function orderTagsWithHighlightFirst(tags: string[], isHighlighted: (tag: string) => boolean): string[] {
  const highlighted: string[] = []
  const rest: string[] = []
  for (const t of tags) {
    if (isHighlighted(t)) highlighted.push(t)
    else rest.push(t)
  }
  return [...highlighted, ...rest]
}

export type TagCountRow = { tag: string; count: number }

/**
 * event_members_tags 等の集計行: ハイライト行を先頭ブロックにまとめ、その中で件数降順。
 * 非ハイライト行も同様に後ろのブロックで件数降順。
 */
export function sortTagCountRowsByHighlightThenCount(
  rows: TagCountRow[],
  isHighlighted: (tag: string) => boolean,
): TagCountRow[] {
  return [...rows].sort((a, b) => {
    const ha = isHighlighted(a.tag)
    const hb = isHighlighted(b.tag)
    if (ha !== hb) return ha ? -1 : 1
    return b.count - a.count
  })
}
