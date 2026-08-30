import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ZodError } from 'zod'

import { usePublicResourceNotFoundRedirect } from '@shokujii/base/composable/usePublicResourceNotFoundRedirect.js'
import { useEventStore, type EventStore, type EventStoreOptions } from '@shokujii/base/stores/event.js'

export const usePublicEventNotFoundRedirect = (
  eventId: string,
  expectedCommunityAccount: string,
  options: EventStoreOptions = {},
): void => {
  const router = useRouter()
  const eventStore = useEventStore(eventId, options) as EventStore
  const { exists, event, schemaError } = storeToRefs(eventStore)
  usePublicResourceNotFoundRedirect(exists)

  watch(
    event,
    (loaded) => {
      if (loaded == null) {
        return
      }
      if (loaded.is_deleted) {
        void router.replace('/404')
        return
      }
      if (loaded.community_account.toLowerCase() !== expectedCommunityAccount.toLowerCase()) {
        void router.replace('/404')
      }
    },
    { immediate: true },
  )

  watch(
    schemaError,
    (err) => {
      if (err instanceof ZodError) {
        void router.replace('/520')
      }
    },
    { immediate: true },
  )
}
