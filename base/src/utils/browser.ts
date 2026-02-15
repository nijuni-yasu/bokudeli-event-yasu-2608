export function isInAppBrowser(userAgent: string): boolean {
  const ua = userAgent || ''
  const patterns = [
    /Line\//i, // LINE
    /FBAN|FBAV|Facebook/i, // Facebook アプリ/ブラウザ
    /Messenger/i, // Facebook Messenger
    /Instagram/i, // Instagram
    /Twitter/i, // X(Twitter)
    /; wv| wv;/i, // Android WebView 指標
  ]
  return patterns.some((pattern) => pattern.test(ua))
}
