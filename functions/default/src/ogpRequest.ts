import { pipeline, Readable } from 'stream'
import { ReadableStream } from 'stream/web'
import express from 'express'
import { getStorage } from 'firebase-admin/storage'
import { https } from 'firebase-functions/v2'
import { ReplaceSectionStream } from '@shokujii/common/utils/ReplaceSectionStream.js'
import { getEvent } from './stores/event.js'
import { getCommunityByAccount } from './stores/community.js'
import { convertStoragePathToURL } from './utils/urls.js'
import { getEventCoverStoragePath, getCommunityCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('ogpRequest')

interface OgpContext {
  site: string
  url: string
  image: string
  imageType: string
  title?: string
  description?: string
}

/**
 * Firebase Hosting から取得したレスポンスヘッダを、圧縮や接続制御に関するものだけ除外して転送する。
 * これにより、Content-Security-Policy などのセキュリティ関連ヘッダは維持される。
 */
const forwardSafeHeaders = (from: Response, to: express.Response, options?: { excludeCacheControl?: boolean }) => {
  const excludedHeaderKeys = new Set([
    // 圧縮・転送関連
    'content-encoding',
    'transfer-encoding',
    // ボディサイズは Node/Express 側で決定させる
    'content-length',
    // 接続制御系（Hop-by-hop ヘッダ）は Node/Express に任せる
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

const returnOriginalIndexHtml = async (site: string, res: express.Response) => {
  const originalResponse = await fetch(`${site}/index.html`)

  if (!originalResponse.ok || !originalResponse.body) {
    res.status(500).send('Could not retrieve index.html')
    return
  }

  res.status(originalResponse.status)
  // 圧縮や接続制御に関するヘッダのみ除外し、それ以外（特にセキュリティ関連ヘッダ）は透過する
  forwardSafeHeaders(originalResponse, res)

  pipeline(Readable.fromWeb(originalResponse.body as ReadableStream), res, (error: NodeJS.ErrnoException | null) => {
    if (error) {
      logger.error('Pipeline failed for original response.', { error })
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error during stream processing')
      }
    }
  })
}

const convertToOgpString = (inputString: string): string => {
  // 文字列から改行とHTMLタグを削除
  const stringWithoutNewLinesAndHtmlTags = inputString.replace(/\n/g, '').replace(/<[^>]*>/g, '')
  // 先頭から100文字を抜き出す
  const first100Chars = stringWithoutNewLinesAndHtmlTags.substring(0, 100)
  // HTMLエンコード（一部）を行う
  return first100Chars.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const makeMetaTags = (context: OgpContext): string => {
  const title = context.title || ''
  const description = context.description || ''
  const image = context.image || ''
  const url = context.url || ''
  const site = context.site || ''

  return `<meta property="og:title" content="${title}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="${context.imageType}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="食事でつながる「shokujii」">
<meta name="twitter:site" content="${site}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:description" content="${description}">`
}

export const handleEventOgpRequest = https.onRequest(
  {
    region: 'asia-northeast1',
    memory: '1GiB',
  },
  async (req: https.Request, res: express.Response) => {
    const site = `${req.protocol}://${req.headers['x-forwarded-host']}`
    const paths = req.path.split('/')
    // 短縮前のパスにアクセスしてきた場合は変換する
    if (paths[1] === 'community') {
      paths[1] = 'c'
    }
    if (paths[3] === 'events') {
      paths[3] = 'e'
    }
    // Community 名に大文字を許可していた時代のリクエストに対応
    paths[2] = paths[2].toLowerCase()
    const path = paths.join('/')

    const response = await fetch(`${site}/index.html`)
    if (!response.ok) {
      res.status(500).send('Could not retrieve index.html')
      return
    }

    const context: OgpContext = {
      site,
      url: `${site}${path}`,
      image: `${site}/shokujii_ogp.png`,
      imageType: 'image/png',
    }
    try {
      // Event ページの場合のみ処理
      if (paths[1] === 'c' && paths[3] === 'e') {
        const eventId = paths[4]

        const eventData = await getEvent(eventId)
        if (eventData === undefined) {
          await returnOriginalIndexHtml(site, res)
          return
        }
        try {
          const storagePath = getEventCoverStoragePath(eventData.community_id, eventId)
          const [metadata] = await getStorage().bucket().file(storagePath).getMetadata()
          if (metadata.contentType != null) {
            context.image = convertStoragePathToURL(storagePath)
            context.imageType = metadata.contentType
          }
        } catch (error) {
          logger.warn('Failed to get storage metadata for event cover image', { error })
        }
        // Firebase Hosting が付与したセキュリティ関連ヘッダを維持しつつ、
        // Cache-Control はこの関数側で上書きする
        forwardSafeHeaders(response, res, { excludeCacheControl: true })
        context.title = convertToOgpString(eventData.event_name)
        context.description = convertToOgpString(eventData.event_desc)
        res.status(200).set('Cache-Control', 'public, max-age=600, s-maxage=600')

        // pipelineはPromiseを返さないため、コールバックでエラーハンドリング
        pipeline(
          Readable.fromWeb(response.body as ReadableStream),
          new ReplaceSectionStream('<!-- OGP_BEGIN_TAG -->', '<!-- OGP_END_TAG -->', makeMetaTags(context)),
          res,
          (error: NodeJS.ErrnoException | null) => {
            if (error) {
              logger.error('Pipeline failed.', { error })
              // エラーが発生した場合でも、resが閉じられていなければエラーレスポンスを送る
              if (!res.headersSent) {
                res.status(500).send('Internal Server Error during stream processing')
              }
            }
          },
        )
        return
      }
    } catch (error) {
      logger.warn('Unexpected error in OGP handler', { error })
      if (!res.headersSent) {
        await returnOriginalIndexHtml(site, res)
      }
      return
    }
    await returnOriginalIndexHtml(site, res)
  },
)

export const handleCommunityOgpRequest = https.onRequest(
  {
    region: 'asia-northeast1',
    memory: '1GiB',
  },
  async (req: https.Request, res: express.Response) => {
    const site = `${req.protocol}://${req.headers['x-forwarded-host']}`
    const paths = req.path.split('/')
    // 短縮前のパスにアクセスしてきた場合は変換する
    if (paths[1] === 'community') {
      paths[1] = 'c'
    }
    if (paths[2] === undefined || paths[2] === '') {
      await returnOriginalIndexHtml(site, res)
      return
    }
    // Community 名に大文字を許可していた時代のリクエストに対応
    paths[2] = paths[2].toLowerCase()
    const path = paths.join('/')

    const response = await fetch(`${site}/index.html`)
    if (!response.ok) {
      res.status(500).send('Could not retrieve index.html')
      return
    }

    const context: OgpContext = {
      site,
      url: `${site}${path}`,
      image: `${site}/shokujii_ogp.png`,
      imageType: 'image/png',
    }
    try {
      // Community ページの場合のみ処理
      if (paths[1] === 'c' && paths.length === 3) {
        // /c/{communityAccount} の形式
        const communityAccount = paths[2]

        const communityData = await getCommunityByAccount(communityAccount)
        if (communityData === undefined) {
          await returnOriginalIndexHtml(site, res)
          return
        }
        try {
          const storagePath = getCommunityCoverStoragePath(communityData.community_id)
          const [metadata] = await getStorage().bucket().file(storagePath).getMetadata()
          if (metadata.contentType != null) {
            context.image = convertStoragePathToURL(storagePath)
            context.imageType = metadata.contentType
          }
        } catch (error) {
          logger.warn('Failed to get storage metadata for community cover image', { error })
        }
        // Firebase Hosting が付与したセキュリティ関連ヘッダを維持しつつ、
        // Cache-Control はこの関数側で上書きする
        forwardSafeHeaders(response, res, { excludeCacheControl: true })
        context.title = convertToOgpString(communityData.community_name)
        context.description = convertToOgpString(communityData.community_desc)
        res.status(200).set('Cache-Control', 'public, max-age=600, s-maxage=600')

        // pipelineはPromiseを返さないため、コールバックでエラーハンドリング
        pipeline(
          Readable.fromWeb(response.body as ReadableStream),
          new ReplaceSectionStream('<!-- OGP_BEGIN_TAG -->', '<!-- OGP_END_TAG -->', makeMetaTags(context)),
          res,
          (error: NodeJS.ErrnoException | null) => {
            if (error) {
              logger.error('Pipeline failed.', { error })
              // エラーが発生した場合でも、resが閉じられていなければエラーレスポンスを送る
              if (!res.headersSent) {
                res.status(500).send('Internal Server Error during stream processing')
              }
            }
          },
        )
        return
      }
    } catch (error) {
      logger.warn('Unexpected error in OGP handler', { error })
      if (!res.headersSent) {
        await returnOriginalIndexHtml(site, res)
      }
      return
    }
    await returnOriginalIndexHtml(site, res)
  },
)
