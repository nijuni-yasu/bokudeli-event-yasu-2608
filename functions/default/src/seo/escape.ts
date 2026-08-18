const META_DESCRIPTION_MAX_LENGTH = 160

/** HTML 属性値用エスケープ */
export const escapeHtmlAttribute = (input: string): string =>
  input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** HTML テキストノード用エスケープ */
export const escapeHtmlText = (input: string): string =>
  input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** リッチテキスト由来のエンティティを素の文字に戻す。`&amp;` は他を解いた後に処理する */
const decodeHtmlEntitiesForExcerpt = (input: string): string =>
  input
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#0?39;/gi, "'")
    .replace(/&amp;/gi, '&')

/** 改行・HTML タグを除去し、メタ description 用に先頭 N 文字を返す */
export const toPlainTextExcerpt = (input: string, maxLength = META_DESCRIPTION_MAX_LENGTH): string => {
  // タグ除去を先に行う。デコードを先にすると、リテラル表記の &lt;b&gt; がタグとして除去されてしまう
  const plain = decodeHtmlEntitiesForExcerpt(input.replace(/\n/g, '').replace(/<[^>]*>/g, '')).trim()
  if (plain.length <= maxLength) {
    return plain
  }
  return plain.substring(0, maxLength)
}

/** OGP / meta 用（100 文字切り出し。HTML 属性エスケープは buildOgpMetaTags 側で行う） */
export const toOgpExcerpt = (input: string, maxLength = 100): string => toPlainTextExcerpt(input, maxLength)
