import { https } from 'firebase-functions/v2'
import type { HttpResponse } from './utils/httpResponse.js'
import { createModuleLogger } from './utils/logger.js'
import { resolveRequestSite } from './utils/resolveRequestSite.js'
import { getPublicCommunitiesForSeoPreview } from './stores/seoSitemap.js'
import { injectSeoHtml } from './seo/htmlInjection.js'
import { DEFAULT_OGP_IMAGE_TYPE, OGP_SITE_NAME, type OgpMetaContext } from './seo/metaTags.js'
import { buildBreadcrumbListJsonLd, buildJsonLdDocument } from './seo/jsonLd.js'
import {
  buildCommunityListPrerenderHtml,
  COMMUNITY_LIST_META_DESCRIPTION,
  COMMUNITY_LIST_PAGE_TITLE,
} from './seo/prerenderCommunityList.js'
import { getEventSiteOrigin } from './utils/urls.js'

const logger = createModuleLogger('communityListSeoRequest')

const SEO_CACHE_CONTROL = 'public, max-age=600, s-maxage=600'
const COMMUNITY_LIST_PREVIEW_LIMIT = 30

const forwardSafeHeaders = (from: Response, to: HttpResponse, options?: { excludeCacheControl?: boolean }) => {
  const excludedHeaderKeys = new Set([
    'content-encoding',
    'transfer-encoding',
    'content-length',
    'connection',
    'keep-alive',
    'upgrade',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
  ])

  from.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (excludedHeaderKeys.has(lowerKey)) return
    if (options?.excludeCacheControl && lowerKey === 'cache-control') return
    to.setHeader(key, value)
  })
}

const fetchIndexHtml = async (): Promise<{ html: string; response: Response } | undefined> => {
  const response = await fetch(`${getEventSiteOrigin()}/index.html`)
  if (!response.ok) {
    return undefined
  }
  const html = await response.text()
  return { html, response }
}

const buildCommunityListJsonLd = (params: {
  site: string
  canonicalUrl: string
  communities: Awaited<ReturnType<typeof getPublicCommunitiesForSeoPreview>>
}): Record<string, unknown> => {
  const { site, canonicalUrl, communities } = params
  return buildJsonLdDocument(
    {
      '@type': 'WebPage',
      name: COMMUNITY_LIST_PAGE_TITLE,
      url: canonicalUrl,
      description: COMMUNITY_LIST_META_DESCRIPTION,
    },
    buildBreadcrumbListJsonLd([
      { name: OGP_SITE_NAME, url: `${site}/` },
      { name: COMMUNITY_LIST_PAGE_TITLE, url: canonicalUrl },
    ]),
    {
      '@type': 'ItemList',
      itemListElement: communities.map((community, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: community.communityName,
        url: `${site}/c/${community.communityAccount.toLowerCase()}`,
      })),
    },
  )
}

export const handleCommunityListSeoRequest = https.onRequest(
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

    if (req.path !== '/communitylist') {
      res.status(404).send('Not Found')
      return
    }

    try {
      const indexResult = await fetchIndexHtml()
      if (indexResult === undefined) {
        res.status(500).send('Could not retrieve index.html')
        return
      }

      const communities = await getPublicCommunitiesForSeoPreview(COMMUNITY_LIST_PREVIEW_LIMIT)
      const canonicalUrl = `${site}/communitylist`
      const ogp: OgpMetaContext = {
        site,
        url: canonicalUrl,
        image: `${site}/shokujii_ogp.png`,
        imageType: DEFAULT_OGP_IMAGE_TYPE,
        title: COMMUNITY_LIST_PAGE_TITLE,
        description: COMMUNITY_LIST_META_DESCRIPTION,
      }

      const injected = injectSeoHtml(indexResult.html, {
        pageTitle: COMMUNITY_LIST_PAGE_TITLE,
        metaDescription: COMMUNITY_LIST_META_DESCRIPTION,
        canonicalUrl,
        jsonLd: buildCommunityListJsonLd({ site, canonicalUrl, communities }),
        prerenderHtml: buildCommunityListPrerenderHtml(site, communities),
        ogp,
      })

      forwardSafeHeaders(indexResult.response, res, { excludeCacheControl: true })
      res
        .status(200)
        .set('Cache-Control', SEO_CACHE_CONTROL)
        .set('Content-Type', 'text/html; charset=utf-8')
        .send(injected)
    } catch (error) {
      logger.error('Failed to generate community list SEO HTML', { error })
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error')
      }
    }
  },
)
