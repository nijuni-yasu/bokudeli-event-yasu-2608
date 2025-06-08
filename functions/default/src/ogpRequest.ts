import { pipeline, Readable } from 'stream'
import express from 'express'
import { https } from 'firebase-functions/v2'
import { ReplaceSectionStream } from './commonUtils/ReplaceSectionStream.js'
import { getEvent } from './stores/event.js'

interface OgpContext {
  site: string
  url: string
  image: string
  title?: string
  description?: string
}

export const handleOgpRequest = https.onRequest(
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
    }
    try {
      // Event ページの場合は title 等を上書き
      if (paths[1] === 'c' && paths[3] === 'e') {
        const eventId = paths[4]

        const eventData = await getEvent(eventId)
        if (eventData === undefined) {
          res.status(404).send('Event not found')
          return
        }
        context.title = convertToOgpString(eventData.event_name)
        context.description = convertToOgpString(eventData.event_desc)
        context.image = eventData.event_cover_url
        res.status(200).set('Cache-Control', 'public, max-age=600, s-maxage=600')

        // pipelineはPromiseを返さないため、コールバックでエラーハンドリング
        pipeline(
          Readable.fromWeb(response.body as any),
          new ReplaceSectionStream('<!-- OGP_BEGIN_TAG -->', '<!-- OGP_END_TAG -->', makeMetaTags(context)),
          res,
          (err: NodeJS.ErrnoException | null) => {
            if (err) {
              console.error('Pipeline failed.', err)
              // エラーが発生した場合でも、resが閉じられていなければエラーレスポンスを送る
              if (!res.headersSent) {
                res.status(500).send('Internal Server Error during stream processing')
              }
            }
          },
        )
        return
      }
    } catch (e) {
      console.warn(e)
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error')
      }
      return
    }
    res.status(404).send('Invalid path')
  },
)

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
