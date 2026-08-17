import { https } from 'firebase-functions/v2'
import type { HttpsFunction } from 'firebase-functions/v2/https'
import { createModuleLogger } from './utils/logger.js'
import { resolveRequestSite } from './utils/resolveRequestSite.js'
import { getPublicCommunitiesForSitemap, getPublicEventsForSitemap } from './stores/seoSitemap.js'
import { buildSitemapXml, formatSitemapLastmod, type SitemapUrlEntry } from './seo/sitemap.js'

const logger = createModuleLogger('sitemapRequest')

const SITEMAP_CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600'

const buildSitemapEntries = (
  site: string,
  communities: Awaited<ReturnType<typeof getPublicCommunitiesForSitemap>>,
  events: Awaited<ReturnType<typeof getPublicEventsForSitemap>>,
): SitemapUrlEntry[] => {
  const entries: SitemapUrlEntry[] = [{ loc: `${site}/` }, { loc: `${site}/communitylist` }]

  for (const community of communities) {
    entries.push({
      loc: `${site}/c/${community.communityAccount.toLowerCase()}`,
      lastmod: formatSitemapLastmod(community.updatedAtMillis),
    })
  }

  for (const event of events) {
    entries.push({
      loc: `${site}/c/${event.communityAccount.toLowerCase()}/e/${event.eventId}`,
      lastmod: formatSitemapLastmod(event.updatedAtMillis),
    })
  }

  return entries
}

export const handleSitemapRequest: HttpsFunction = https.onRequest(
  {
    region: 'asia-northeast1',
    memory: '512MiB',
  },
  async (req, res) => {
    const site = resolveRequestSite(req)
    if (site == null) {
      res.status(400).send('Bad Request')
      return
    }

    try {
      const [communities, events] = await Promise.all([getPublicCommunitiesForSitemap(), getPublicEventsForSitemap()])
      const entries = buildSitemapEntries(site, communities, events)
      const xml = buildSitemapXml(entries)

      res
        .status(200)
        .set('Content-Type', 'application/xml; charset=utf-8')
        .set('Cache-Control', SITEMAP_CACHE_CONTROL)
        .send(xml)
    } catch (error) {
      logger.error('Failed to generate sitemap', { error })
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error')
      }
    }
  },
)
