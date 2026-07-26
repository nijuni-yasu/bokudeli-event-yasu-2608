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
