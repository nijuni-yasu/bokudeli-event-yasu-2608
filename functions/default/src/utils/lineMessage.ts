import { messagingApi } from '@line/bot-sdk'
import { defineSecret } from 'firebase-functions/params'
import { createModuleLogger } from './logger.js'

const { MessagingApiClient } = messagingApi

const LINE_CHANNEL_ACCESS_TOKEN = defineSecret('LINE_CHANNEL_ACCESS_TOKEN')

const logger = createModuleLogger('lineMessage')

/** legacy notice_message.json の固定文 */
export const LINE_EVENT_BROADCAST_NOTICE_TEXT =
  '【食事会のご案内💌】\nコワーキングスペースやオフィスなどで開催される食事会をご案内！以下のイベントはオープンに誰でも参加いただけるものとなっております。お気軽にご参加ください🙋🙋‍♀️'

export type LineEventCarouselItem = {
  event_name: string
  event_address: string
  event_datetime: string
  event_url: string
  event_cover_url: string
}

const createLineClient = (): messagingApi.MessagingApiClient =>
  new MessagingApiClient({
    channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN.value(),
  })

const buildEventBubble = (event: LineEventCarouselItem): messagingApi.FlexBubble => ({
  type: 'bubble',
  hero: {
    type: 'image',
    url: event.event_cover_url,
    size: 'full',
    aspectRatio: '191:100',
    aspectMode: 'cover',
    action: {
      type: 'uri',
      uri: event.event_url,
    },
  },
  body: {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        text: event.event_name,
        weight: 'bold',
        size: 'xl',
        wrap: true,
        maxLines: 2,
      },
      {
        type: 'box',
        layout: 'vertical',
        margin: 'lg',
        spacing: 'sm',
        contents: [
          {
            type: 'box',
            layout: 'baseline',
            spacing: 'sm',
            contents: [
              {
                type: 'icon',
                url: 'https://static.line-scdn.net/biz-app/edge/manager/img/cardtypemessage/icon_map_marker_alt.png',
                scaling: true,
                offsetTop: 'xs',
              },
              {
                type: 'text',
                text: event.event_address,
                wrap: true,
                color: '#666666',
                size: 'sm',
                flex: 5,
                maxLines: 2,
              },
            ],
          },
          {
            type: 'box',
            layout: 'baseline',
            spacing: 'sm',
            contents: [
              {
                type: 'icon',
                url: 'https://static.line-scdn.net/biz-app/edge/manager/img/cardtypemessage/icon_clock.png',
                scaling: true,
                offsetTop: 'xs',
              },
              {
                type: 'text',
                text: event.event_datetime,
                wrap: true,
                color: '#666666',
                size: 'sm',
                flex: 5,
              },
            ],
          },
        ],
      },
    ],
  },
  footer: {
    type: 'box',
    layout: 'vertical',
    spacing: 'sm',
    contents: [
      {
        type: 'button',
        style: 'link',
        height: 'sm',
        action: {
          type: 'uri',
          label: 'イベント参加はこちら',
          uri: event.event_url,
        },
      },
    ],
    flex: 0,
  },
})

const buildCarouselMessage = (events: LineEventCarouselItem[], altText: string): messagingApi.FlexMessage => ({
  type: 'flex',
  altText,
  contents: {
    type: 'carousel',
    contents: events.map(buildEventBubble),
  },
})

export const broadcastLineEvents = async (
  events: LineEventCarouselItem[],
  noticeText: string = LINE_EVENT_BROADCAST_NOTICE_TEXT,
): Promise<void> => {
  if (events.length === 0) {
    logger.info('No events to broadcast, skip LINE broadcast')
    return
  }

  const message = buildCarouselMessage(events, noticeText)
  logger.info('LINE broadcast', { eventCount: events.length })

  const client = createLineClient()
  const messages: messagingApi.Message[] = noticeText !== '' ? [{ type: 'text', text: noticeText }, message] : [message]

  await client.broadcast({ messages })
}
