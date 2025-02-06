export const downloadCsv = (name: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  // <a> 要素を作成してダウンロードをトリガー
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.style.display = 'none'
  // <a> 要素をDOMに追加してクリックをシミュレート
  document.body.appendChild(a)
  a.click()
  // 不要になった要素とURLをクリーンアップ
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
