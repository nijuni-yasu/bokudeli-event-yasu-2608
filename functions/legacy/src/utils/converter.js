
// TODO toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }) に変更する
export const convertNumberToYen = (num) => '¥' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

// HTMLのタグを削除する関数
export const convertHtmlToPlaneText = (html) => {
  // <a>タグのリンクテキストを抽出し、リンクを削除
  let textOnly = html.replace(/<a [^>]*>(.*?)<\/a>/gi, '$1')

  // 残りのHTMLタグを削除
  textOnly = textOnly.replace(/<[^>]+>/g, '')

  // 不要な空白を削除
  textOnly = textOnly.replace(/\s+/g, ' ')

  // 前後の空白を削除
  return textOnly.trim()
}
