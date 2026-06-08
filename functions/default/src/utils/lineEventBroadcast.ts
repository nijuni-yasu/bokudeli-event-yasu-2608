import { DateTime } from 'luxon'
import { convertToDuration } from '@shokujii/common/utils/datetime.js'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { getAllAcceptingOrderEvents } from '../stores/event.js'
import { convertStoragePathToURL, getEventUrlForExternalBrowser } from './urls.js'
import { broadcastLineEvents, type LineEventCarouselItem } from './lineMessage.js'
import { createModuleLogger } from './logger.js'

const logger = createModuleLogger('lineEventBroadcast')

const EVENT_LIMIT = 10

const resolveEventAddress = (eventAddress: string, eventAddressBase: string, eventAddressDetail: string): string => {
  if (eventAddress !== '') {
    return eventAddress
  }
  return [eventAddressBase, eventAddressDetail].filter(Boolean).join(' ')
}

/**
 * 公開・注文受付中・締切未来のイベントを LINE ブロードキャストする。
 * legacy broadcastEventConcludedMessage 相当。満席判定は members 正本を使用する。
 */
export const broadcastEventConcludedMessage = async (): Promise<void> => {
  const nowDateTimeMillis = DateTime.now().toMillis()
  const events = await getAllAcceptingOrderEvents(nowDateTimeMillis)

  const sorted = [...events].sort((a, b) => a.event_start_datetime - b.event_start_datetime)

  const carouselItems: LineEventCarouselItem[] = []
  let eligibleCount = 0

  for (const event of sorted) {
    if (event.members.length >= event.event_max_people) {
      continue
    }

    eligibleCount += 1

    if (carouselItems.length < EVENT_LIMIT) {
      carouselItems.push({
        event_name: event.event_name,
        event_address: resolveEventAddress(event.event_address, event.event_address_base, event.event_address_detail),
        event_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime),
        event_url: getEventUrlForExternalBrowser(event.community_account, event.id),
        event_cover_url: convertStoragePathToURL(getEventCoverStoragePath(event.community_id, event.id)),
      })
    }
  }

  logger.info('Prepared LINE event broadcast', {
    totalFetched: events.length,
    eligibleCount,
    carouselCount: carouselItems.length,
  })

  await broadcastLineEvents(carouselItems)
}
