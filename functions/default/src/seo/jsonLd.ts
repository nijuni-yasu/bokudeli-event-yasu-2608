import { DateTime } from 'luxon'
import { computeEventFullAddress } from '@shokujii/common/utils/splitAddress.js'
import { toPlainTextExcerpt } from './escape.js'

const DEFAULT_TIME_ZONE = 'Asia/Tokyo'

export interface EventJsonLdInput {
  eventName: string
  eventDesc: string
  url: string
  imageUrl: string
  startDatetimeMillis: number
  endDatetimeMillis: number
  shopName: string
  eventAddress: string
  eventAddressBase: string
  eventAddressDetail: string
  communityName: string
  isCanceled: boolean
}

export interface OrganizationJsonLdInput {
  name: string
  description: string
  url: string
  addressBase: string
  addressDetail: string
}

const toIso8601 = (millis: number): string =>
  DateTime.fromMillis(millis, { zone: DEFAULT_TIME_ZONE }).toISO({ suppressMilliseconds: true }) ?? ''

export const buildEventJsonLd = (input: EventJsonLdInput): Record<string, unknown> => {
  const fullAddress = computeEventFullAddress({
    event_address: input.eventAddress,
    event_address_base: input.eventAddressBase,
    event_address_detail: input.eventAddressDetail,
  })

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: input.eventName,
    description: toPlainTextExcerpt(input.eventDesc),
    url: input.url,
    image: input.imageUrl,
    startDate: toIso8601(input.startDatetimeMillis),
    endDate: toIso8601(input.endDatetimeMillis),
    eventStatus: input.isCanceled ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: input.shopName,
      address: fullAddress,
    },
    organizer: {
      '@type': 'Organization',
      name: input.communityName,
    },
  }

  return jsonLd
}

export const buildOrganizationJsonLd = (input: OrganizationJsonLdInput): Record<string, unknown> => {
  const fullAddress = [input.addressBase, input.addressDetail].filter(Boolean).join(' ')

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    description: toPlainTextExcerpt(input.description),
    url: input.url,
  }

  if (fullAddress !== '') {
    jsonLd.address = fullAddress
  }

  return jsonLd
}
