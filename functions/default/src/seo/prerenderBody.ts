import { convertToDatetimeWeekdayShort } from '@shokujii/common/utils/datetime.js'
import { computeEventFullAddress } from '@shokujii/common/utils/splitAddress.js'
import { escapeHtmlAttribute, escapeHtmlText, toPlainTextExcerpt } from './escape.js'

export interface EventPrerenderInput {
  site: string
  communityAccount: string
  communityName: string
  eventName: string
  eventDesc: string
  startDatetimeMillis: number
  shopName: string
  eventAddress: string
  eventAddressBase: string
  eventAddressDetail: string
}

export interface CommunityPrerenderInput {
  site: string
  communityName: string
  communityDesc: string
}

const buildTopNavLink = (site: string, href: string, label: string): string =>
  `<a href="${escapeHtmlAttribute(href)}">${escapeHtmlText(label)}</a>`

export const buildEventPrerenderHtml = (input: EventPrerenderInput): string => {
  const datetimeLabel = convertToDatetimeWeekdayShort(input.startDatetimeMillis)
  const fullAddress = computeEventFullAddress({
    event_address: input.eventAddress,
    event_address_base: input.eventAddressBase,
    event_address_detail: input.eventAddressDetail,
  })
  const description = toPlainTextExcerpt(input.eventDesc)
  const communityUrl = `${input.site}/c/${input.communityAccount.toLowerCase()}`

  const addressBlock = fullAddress !== '' ? `<p>${escapeHtmlText(fullAddress)}</p>` : ''
  const descriptionBlock = description !== '' ? `<p>${escapeHtmlText(description)}</p>` : ''
  const navBlock = `<nav>
  ${buildTopNavLink(input.site, `${input.site}/`, 'トップ')}
  · ${buildTopNavLink(input.site, communityUrl, input.communityName)}
</nav>`

  return `<article>
  ${navBlock}
  <h1>${escapeHtmlText(input.eventName)}</h1>
  <p>${escapeHtmlText(datetimeLabel)} · ${escapeHtmlText(input.shopName)}</p>
  ${addressBlock}
  ${descriptionBlock}
</article>`
}

export const buildCommunityPrerenderHtml = (input: CommunityPrerenderInput): string => {
  const description = toPlainTextExcerpt(input.communityDesc)
  const descriptionBlock = description !== '' ? `<p>${escapeHtmlText(description)}</p>` : ''
  const navBlock = `<nav>
  ${buildTopNavLink(input.site, `${input.site}/`, 'トップ')}
  · ${buildTopNavLink(input.site, `${input.site}/communitylist`, 'コミュニティ一覧')}
</nav>`

  return `<article>
  ${navBlock}
  <h1>${escapeHtmlText(input.communityName)}</h1>
  ${descriptionBlock}
</article>`
}
