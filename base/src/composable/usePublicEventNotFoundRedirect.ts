import { storeToRefs } from 'pinia'

import { usePublicResourceNotFoundRedirect } from '@shokujii/base/composable/usePublicResourceNotFoundRedirect.js'
import { useEventStore, type EventStore, type EventStoreOptions } from '@shokujii/base/stores/event.js'

export const usePublicEventNotFoundRedirect = (eventId: string, options: EventStoreOptions = {}): void => {
  const eventStore = useEventStore(eventId, options) as EventStore
  const { exists } = storeToRefs(eventStore)
  usePublicResourceNotFoundRedirect(exists)
}
