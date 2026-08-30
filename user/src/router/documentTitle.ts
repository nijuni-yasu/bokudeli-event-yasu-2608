import type { RouteLocationNormalized } from 'vue-router'
import { getI18n } from '@shokujii/base/plugins/i18n/index.js'
import { useCommunityStore } from '@shokujii/base/stores/community.js'
import { useEventStore } from '@shokujii/base/stores/event.js'
import {
  DEFAULT_DOCUMENT_TITLE,
  formatDocumentTitle,
  isCommunityListPath,
  parseCommunityAccountFromPath,
  parseErrorCodeFromRoute,
  parseEventIdFromPath,
} from './documentTitleHelpers.js'

export { DEFAULT_DOCUMENT_TITLE, formatDocumentTitle } from './documentTitleHelpers.js'

export const resolveDocumentTitle = async (to: RouteLocationNormalized): Promise<string> => {
  const errorCode = parseErrorCodeFromRoute(to.path, to.params.error)
  if (errorCode != null) {
    const t = getI18n().global.t as (key: string) => string
    return formatDocumentTitle(t(`error.${errorCode}.title`))
  }

  if (isCommunityListPath(to.path)) {
    const t = getI18n().global.t as (key: string) => string
    return formatDocumentTitle(t('communitylist.page_title'))
  }

  const eventId = parseEventIdFromPath(to.path)
  if (eventId != null) {
    try {
      const eventStore = useEventStore(eventId)
      const event = await eventStore.getLoadedEvent(3000)
      if (event.event_name !== '') {
        return formatDocumentTitle(event.event_name)
      }
    } catch {
      // fall through to default title
    }
  }

  const communityAccount = parseCommunityAccountFromPath(to.path)
  if (communityAccount != null) {
    try {
      const communityStore = useCommunityStore(communityAccount)
      const community = await communityStore.getLoadedCommunity(3000)
      if (community.community_name !== '') {
        return formatDocumentTitle(community.community_name)
      }
    } catch {
      // fall through to default title
    }
  }

  return DEFAULT_DOCUMENT_TITLE
}
