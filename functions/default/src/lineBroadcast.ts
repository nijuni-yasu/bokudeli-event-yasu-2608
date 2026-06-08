import { onRequest } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { broadcastEventConcludedMessage } from './utils/lineEventBroadcast.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('lineBroadcast')

const LINE_SECRETS = ['LINE_CHANNEL_ACCESS_TOKEN'] as const

/** legacy broadcast_event_message_request から移行。export 名は維持する。 */
export const broadcast_event_message_request = onRequest(
  {
    region: 'asia-northeast1',
    secrets: [...LINE_SECRETS],
  },
  async (_req, res) => {
    try {
      await broadcastEventConcludedMessage()
      res.status(200).send('OK')
    } catch (error) {
      logger.error('broadcast_event_message_request failed', { error: String(error) })
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error')
      }
    }
  },
)

/** legacy line_event_information から移行。export 名は維持する。 */
export const line_event_information = onSchedule(
  {
    schedule: '15 12 * * 5',
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
    secrets: [...LINE_SECRETS],
  },
  async () => {
    await broadcastEventConcludedMessage()
  },
)
