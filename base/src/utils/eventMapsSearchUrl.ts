/**
 * イベント会場の Google マップ検索 URL。
 * 住所・会場名がどちらも空の場合は undefined（リンクを出さない）。
 */
export const buildEventMapsSearchUrl = (fullAddress: string, eventPlace: string): string | undefined => {
  const query = [fullAddress, eventPlace]
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .join(' ')
  if (query === '') {
    return undefined
  }
  return `https://www.google.co.jp/maps/search/${encodeURIComponent(query)}`
}
