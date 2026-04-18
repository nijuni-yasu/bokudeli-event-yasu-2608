/** TinyMCE 等の HTML 内の img を文書順で列挙する（同一 src はそのまま残す） */
export function extractImageSlidesFromHtml(html: string | undefined | null): { src: string; title: string }[] {
  if (html == null || html === '') {
    return []
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const imgs = doc.querySelectorAll('img')
  const out: { src: string; title: string }[] = []
  for (const img of imgs) {
    const src = img.getAttribute('src')?.trim()
    if (src != null && src !== '') {
      const alt = img.getAttribute('alt')?.trim() ?? ''
      out.push({ src, title: alt })
    }
  }
  return out
}
