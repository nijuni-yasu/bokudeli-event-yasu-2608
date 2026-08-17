import type { HttpResponse } from './utils/httpResponse.js'
import { getStorage } from 'firebase-admin/storage'
import { https } from 'firebase-functions/v2'
import type { HttpsFunction } from 'firebase-functions/v2/https'
import { getEvent, type ShokujiiEvent } from './stores/event.js'
import { getCommunityByAccount } from './stores/community.js'
import { convertStoragePathToURL, getEventSiteOrigin } from './utils/urls.js'
import { getEventCoverStoragePath, getCommunityCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { createModuleLogger } from './utils/logger.js'
import { resolveRequestSite } from './utils/resolveRequestSite.js'
import { injectSeoHtml, type SeoPageContext } from './seo/htmlInjection.js'
import { DEFAULT_OGP_IMAGE_TYPE, OGP_SITE_NAME, type OgpMetaContext } from './seo/metaTags.js'
import { toOgpExcerpt, toPlainTextExcerpt } from './seo/escape.js'
import {
  buildBreadcrumbListJsonLd,
  buildEventJsonLdNode,
  buildJsonLdDocument,
  buildOrganizationJsonLdNode,
} from './seo/jsonLd.js'
import { buildEventPrerenderHtml, buildCommunityPrerenderHtml } from './seo/prerenderBody.js'

const logger = createModuleLogger('ogpRequest')

const SEO_CACHE_CONTROL = 'public, max-age=600, s-maxage=600'

/**
 * Firebase Hosting から取得したレスポンスヘッダを、圧縮や接続制御に関するものだけ除外して転送する。
 * これにより、Content-Security-Policy などのセキュリティ関連ヘッダは維持される。
 */
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

const resolveOgpImageType = (contentType: string | undefined | null): string => {
  if (contentType == null || contentType === '') {
    return DEFAULT_OGP_IMAGE_TYPE
  }
  return contentType.split(';')[0].trim()
}

const applyCoverImageFromMetadata = (
  context: OgpMetaContext,
  storagePath: string,
  metadata: { contentType?: string | null },
): void => {
  context.image = convertStoragePathToURL(storagePath)
  context.imageType = resolveOgpImageType(metadata.contentType)
}

const sendNotFound = (res: HttpResponse): void => {
  res
    .status(404)
    .set('Content-Type', 'text/html; charset=utf-8')
    .send('<!doctype html><title>404 Not Found</title><h1>404 Not Found</h1>')
}

const fetchIndexHtml = async (): Promise<{ html: string; response: Response } | undefined> => {
  const response = await fetch(`${getEventSiteOrigin()}/index.html`)
  if (!response.ok) {
    return undefined
  }
  const html = await response.text()
  return { html, response }
}

const sendSeoHtml = (res: HttpResponse, indexHtmlResponse: Response, html: string, context: SeoPageContext): void => {
  forwardSafeHeaders(indexHtmlResponse, res, { excludeCacheControl: true })
  const injected = injectSeoHtml(html, context)
  res.status(200).set('Cache-Control', SEO_CACHE_CONTROL).set('Content-Type', 'text/html; charset=utf-8').send(injected)
}

const buildEventSeoContext = (params: {
  canonicalUrl: string
  eventData: ShokujiiEvent
  ogp: OgpMetaContext
}): SeoPageContext => {
  const { eventData, canonicalUrl, ogp } = params
  const metaDescription = toPlainTextExcerpt(eventData.event_desc)

  return {
    pageTitle: eventData.event_name,
    metaDescription,
    canonicalUrl,
    jsonLd: buildJsonLdDocument(
      buildEventJsonLdNode({
        eventName: eventData.event_name,
        eventDesc: eventData.event_desc,
        url: canonicalUrl,
        imageUrl: ogp.image,
        startDatetimeMillis: eventData.event_start_datetime,
        endDatetimeMillis: eventData.event_end_datetime,
        shopName: eventData.shop_name,
        eventAddress: eventData.event_address,
        eventAddressBase: eventData.event_address_base,
        eventAddressDetail: eventData.event_address_detail,
        communityName: eventData.community_name,
        organizerUrl: `${ogp.site}/c/${eventData.community_account.toLowerCase()}`,
        isCanceled: eventData.event_status.value === 'event_canceled',
      }),
      buildBreadcrumbListJsonLd([
        { name: OGP_SITE_NAME, url: `${ogp.site}/` },
        {
          name: eventData.community_name,
          url: `${ogp.site}/c/${eventData.community_account.toLowerCase()}`,
        },
        { name: eventData.event_name, url: canonicalUrl },
      ]),
    ),
    prerenderHtml: buildEventPrerenderHtml({
      eventName: eventData.event_name,
      eventDesc: eventData.event_desc,
      startDatetimeMillis: eventData.event_start_datetime,
      shopName: eventData.shop_name,
      eventAddress: eventData.event_address,
      eventAddressBase: eventData.event_address_base,
      eventAddressDetail: eventData.event_address_detail,
    }),
    ogp: {
      ...ogp,
      title: toOgpExcerpt(eventData.event_name),
      description: toOgpExcerpt(eventData.event_desc),
    },
  }
}

const buildCommunitySeoContext = (params: {
  canonicalUrl: string
  communityData: NonNullable<Awaited<ReturnType<typeof getCommunityByAccount>>>
  ogp: OgpMetaContext
}): SeoPageContext => {
  const { communityData, canonicalUrl, ogp } = params
  const metaDescription = toPlainTextExcerpt(communityData.community_desc)

  return {
    pageTitle: communityData.community_name,
    metaDescription,
    canonicalUrl,
    jsonLd: buildJsonLdDocument(
      buildOrganizationJsonLdNode({
        name: communityData.community_name,
        description: communityData.community_desc,
        url: canonicalUrl,
        addressBase: communityData.community_address_base,
        addressDetail: communityData.community_address_detail,
      }),
      buildBreadcrumbListJsonLd([
        { name: OGP_SITE_NAME, url: `${ogp.site}/` },
        { name: communityData.community_name, url: canonicalUrl },
      ]),
    ),
    prerenderHtml: buildCommunityPrerenderHtml({
      communityName: communityData.community_name,
      communityDesc: communityData.community_desc,
    }),
    ogp: {
      ...ogp,
      title: toOgpExcerpt(communityData.community_name),
      description: toOgpExcerpt(communityData.community_desc),
    },
  }
}

const normalizeEventPaths = (reqPath: string): string[] => {
  const paths = reqPath.split('/')
  if (paths[1] === 'community') {
    paths[1] = 'c'
  }
  if (paths[3] === 'events') {
    paths[3] = 'e'
  }
  if (paths[2] !== undefined) {
    paths[2] = paths[2].toLowerCase()
  }
  return paths
}

export const handleEventOgpRequest: HttpsFunction = https.onRequest(
  {
    region: 'asia-northeast1',
    memory: '1GiB',
  },
  async (req, res) => {
    const site = resolveRequestSite(req)
    if (site == null) {
      res.status(400).send('Bad Request')
      return
    }
    const paths = normalizeEventPaths(req.path)
    const path = paths.join('/')

    if (paths[1] !== 'c' || paths[3] !== 'e') {
      sendNotFound(res)
      return
    }

    const eventId = paths[4]
    if (eventId === undefined || eventId === '') {
      sendNotFound(res)
      return
    }

    try {
      const indexResult = await fetchIndexHtml()
      if (indexResult === undefined) {
        res.status(500).send('Could not retrieve index.html')
        return
      }

      const eventData = await getEvent(eventId)
      if (eventData === undefined || !eventData.is_public || eventData.is_deleted || eventData.enterprise_id != null) {
        sendNotFound(res)
        return
      }

      const communityAccountFromPath = paths[2]
      if (communityAccountFromPath !== eventData.community_account.toLowerCase()) {
        sendNotFound(res)
        return
      }

      const canonicalUrl = `${site}${path}`
      const ogp: OgpMetaContext = {
        site,
        url: canonicalUrl,
        image: `${site}/shokujii_ogp.png`,
        imageType: DEFAULT_OGP_IMAGE_TYPE,
        title: '',
        description: '',
      }

      try {
        const storagePath = getEventCoverStoragePath(eventData.community_id, eventId)
        const [metadata] = await getStorage().bucket().file(storagePath).getMetadata()
        applyCoverImageFromMetadata(ogp, storagePath, metadata)
      } catch (error) {
        logger.warn('Failed to get storage metadata for event cover image', { error })
      }

      const context = buildEventSeoContext({ canonicalUrl, eventData, ogp })
      sendSeoHtml(res, indexResult.response, indexResult.html, context)
    } catch (error) {
      logger.warn('Unexpected error in event SEO handler', { error })
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error')
      }
    }
  },
)

const normalizeCommunityPaths = (reqPath: string): string[] => {
  const paths = reqPath.split('/')
  if (paths[1] === 'community') {
    paths[1] = 'c'
  }
  if (paths[2] !== undefined) {
    paths[2] = paths[2].toLowerCase()
  }
  return paths
}

export const handleCommunityOgpRequest: HttpsFunction = https.onRequest(
  {
    region: 'asia-northeast1',
    memory: '1GiB',
  },
  async (req, res) => {
    const site = resolveRequestSite(req)
    if (site == null) {
      res.status(400).send('Bad Request')
      return
    }
    const paths = normalizeCommunityPaths(req.path)
    const path = paths.join('/')

    if (paths[1] !== 'c' || paths.length !== 3 || paths[2] === undefined || paths[2] === '') {
      sendNotFound(res)
      return
    }

    const communityAccount = paths[2]

    try {
      const indexResult = await fetchIndexHtml()
      if (indexResult === undefined) {
        res.status(500).send('Could not retrieve index.html')
        return
      }

      const communityData = await getCommunityByAccount(communityAccount)
      if (
        communityData === undefined ||
        !communityData.is_public ||
        !communityData.is_approved ||
        communityData.enterprise_id != null
      ) {
        sendNotFound(res)
        return
      }

      const canonicalUrl = `${site}${path}`
      const ogp: OgpMetaContext = {
        site,
        url: canonicalUrl,
        image: `${site}/shokujii_ogp.png`,
        imageType: DEFAULT_OGP_IMAGE_TYPE,
        title: '',
        description: '',
      }

      try {
        const storagePath = getCommunityCoverStoragePath(communityData.community_id)
        const [metadata] = await getStorage().bucket().file(storagePath).getMetadata()
        applyCoverImageFromMetadata(ogp, storagePath, metadata)
      } catch (error) {
        logger.warn('Failed to get storage metadata for community cover image', { error })
      }

      const context = buildCommunitySeoContext({ canonicalUrl, communityData, ogp })
      sendSeoHtml(res, indexResult.response, indexResult.html, context)
    } catch (error) {
      logger.warn('Unexpected error in community SEO handler', { error })
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error')
      }
    }
  },
)
