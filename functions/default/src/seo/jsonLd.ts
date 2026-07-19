import { DateTime } from 'luxon'
import { computeEventFullAddress, JAPAN_PREFECTURE_NAMES } from '@shokujii/common/utils/splitAddress.js'
import { OGP_SITE_NAME } from './metaTags.js'
import { toPlainTextExcerpt } from './escape.js'

const DEFAULT_TIME_ZONE = 'Asia/Tokyo'
const SCHEMA_CONTEXT = 'https://schema.org'
const OFFLINE_EVENT_ATTENDANCE_MODE = `${SCHEMA_CONTEXT}/OfflineEventAttendanceMode`

export const DEFAULT_SITE_URL = 'https://shokujii.jp'

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
  organizerUrl: string
  isCanceled: boolean
}

export interface OrganizationJsonLdInput {
  name: string
  description: string
  url: string
  addressBase: string
  addressDetail: string
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface SiteOrganizationJsonLdInput {
  site: string
  name: string
  logoUrl: string
}

export interface WebSiteJsonLdInput {
  site: string
  name: string
  publisherId: string
}

const toIso8601 = (millis: number): string =>
  DateTime.fromMillis(millis, { zone: DEFAULT_TIME_ZONE }).toISO({ suppressMilliseconds: true }) ?? ''

const stripJsonLdContext = (node: Record<string, unknown>): Record<string, unknown> => {
  const result = { ...node }
  delete result['@context']
  return result
}

export const buildJsonLdDocument = (...nodes: Record<string, unknown>[]): Record<string, unknown> => ({
  '@context': SCHEMA_CONTEXT,
  '@graph': nodes.map(stripJsonLdContext),
})

const buildPostalAddressFromJapanese = (fullAddress: string): Record<string, unknown> => {
  if (fullAddress === '') {
    return {
      '@type': 'PostalAddress',
      addressCountry: 'JP',
    }
  }

  const matchedPrefecture = JAPAN_PREFECTURE_NAMES.find((prefecture) => fullAddress.startsWith(prefecture))
  if (matchedPrefecture === undefined) {
    return {
      '@type': 'PostalAddress',
      addressCountry: 'JP',
      streetAddress: fullAddress,
    }
  }

  const streetAddress = fullAddress.slice(matchedPrefecture.length).trim()
  return {
    '@type': 'PostalAddress',
    addressCountry: 'JP',
    addressRegion: matchedPrefecture,
    streetAddress: streetAddress !== '' ? streetAddress : fullAddress,
  }
}

export const buildEventJsonLdNode = (input: EventJsonLdInput): Record<string, unknown> => {
  const fullAddress = computeEventFullAddress({
    event_address: input.eventAddress,
    event_address_base: input.eventAddressBase,
    event_address_detail: input.eventAddressDetail,
  })

  return {
    '@type': 'Event',
    name: input.eventName,
    description: toPlainTextExcerpt(input.eventDesc),
    url: input.url,
    image: input.imageUrl,
    startDate: toIso8601(input.startDatetimeMillis),
    endDate: toIso8601(input.endDatetimeMillis),
    eventStatus: input.isCanceled ? `${SCHEMA_CONTEXT}/EventCancelled` : `${SCHEMA_CONTEXT}/EventScheduled`,
    eventAttendanceMode: OFFLINE_EVENT_ATTENDANCE_MODE,
    location: {
      '@type': 'Place',
      name: input.shopName,
      address: buildPostalAddressFromJapanese(fullAddress),
    },
    organizer: {
      '@type': 'Organization',
      name: input.communityName,
      url: input.organizerUrl,
    },
  }
}

export const buildOrganizationJsonLdNode = (input: OrganizationJsonLdInput): Record<string, unknown> => {
  const fullAddress = [input.addressBase, input.addressDetail].filter(Boolean).join(' ')

  const jsonLd: Record<string, unknown> = {
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

export const buildBreadcrumbListJsonLd = (items: BreadcrumbItem[]): Record<string, unknown> => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})

export const buildSiteOrganizationJsonLd = (input: SiteOrganizationJsonLdInput): Record<string, unknown> => ({
  '@type': 'Organization',
  '@id': `${input.site}/#organization`,
  name: input.name,
  url: input.site,
  logo: input.logoUrl,
})

export const buildWebSiteJsonLd = (input: WebSiteJsonLdInput): Record<string, unknown> => ({
  '@type': 'WebSite',
  '@id': `${input.site}/#website`,
  url: input.site,
  name: input.name,
  publisher: {
    '@id': input.publisherId,
  },
})

export const buildHomePageJsonLd = (site: string = DEFAULT_SITE_URL): Record<string, unknown> => {
  const organizationId = `${site}/#organization`
  return buildJsonLdDocument(
    buildSiteOrganizationJsonLd({
      site,
      name: OGP_SITE_NAME,
      logoUrl: `${site}/shokujii_ogp.png`,
    }),
    buildWebSiteJsonLd({
      site,
      name: OGP_SITE_NAME,
      publisherId: organizationId,
    }),
  )
}

export const buildEventJsonLd = (input: EventJsonLdInput): Record<string, unknown> =>
  buildJsonLdDocument(buildEventJsonLdNode(input))

export const buildOrganizationJsonLd = (input: OrganizationJsonLdInput): Record<string, unknown> =>
  buildJsonLdDocument(buildOrganizationJsonLdNode(input))
