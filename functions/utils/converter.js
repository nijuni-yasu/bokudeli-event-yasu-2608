export const convertToOgpString = (inputString) => {
  // 文字列から改行を削除
  const stringWithoutNewLines = inputString.replace(/\n/g, '');
  // 先頭から100文字を抜き出す
  const first100Chars = stringWithoutNewLines.substring(0, 100);
  // HTMLエンコード（一部）を行う
  return first100Chars
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
