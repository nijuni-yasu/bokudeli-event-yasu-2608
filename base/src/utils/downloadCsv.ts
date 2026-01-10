export const downloadCsv = (name: string, csv: string) => {
  // UTF-8 BOM を先頭に追加（Windows環境での文字化け対策）
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
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
