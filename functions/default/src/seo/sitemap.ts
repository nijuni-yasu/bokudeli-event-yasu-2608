export interface SitemapUrlEntry {
  loc: string
  lastmod?: string
}

const escapeXml = (input: string): string =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/** ISO 8601 date (YYYY-MM-DD) for sitemap lastmod */
export const formatSitemapLastmod = (millis: number): string => {
  const date = new Date(millis)
  return date.toISOString().slice(0, 10)
}

export const buildSitemapXml = (entries: SitemapUrlEntry[]): string => {
  const urlBlocks = entries
    .map((entry) => {
      const lastmodLine =
        entry.lastmod != null && entry.lastmod !== '' ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ''
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmodLine}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlBlocks}
</urlset>`
}
