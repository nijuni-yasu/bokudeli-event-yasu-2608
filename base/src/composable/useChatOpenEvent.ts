import { useRouter } from 'vue-router'
import { fetchEventInCommunityDocument } from '@shokujii/base/stores/event.js'

type UseChatOpenEventOptions = {
  getEventPath: (communityAccount: string, eventId: string) => string
}

export const useChatOpenEvent = (options: UseChatOpenEventOptions) => {
  const router = useRouter()

  const onOpenEvent = async (payload: { communityId: string; eventId: string }) => {
    try {
      const event = await fetchEventInCommunityDocument(payload.communityId, payload.eventId)
      if (event == null) {
        return
      }
      void router.push(options.getEventPath(event.community_account, payload.eventId))
    } catch {
      // getDoc 失敗時（ネットワーク / 権限）: イベントハンドラからの unhandled rejection を防ぐ
    }
  }

  return { onOpenEvent }
}
