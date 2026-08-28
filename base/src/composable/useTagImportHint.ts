import { effectScope, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toggleTagOnMyProfile } from '@shokujii/base/apis/userTags.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { hasSeenTagImportHint, markTagImportHintSeen } from '@shokujii/base/utils/tagImportHintSession.js'

const showDialog = ref(false)
let pendingExecute: (() => Promise<void>) | null = null

// ダイアログ状態はモジュール singleton のため、watch も呼び出し元コンポーネントから独立した
// detached scope で 1 度だけ登録する（setup 内で登録すると最初の呼び出し元の unmount で停止する）
effectScope(true).run(() => {
  watch(showDialog, (visible, wasVisible) => {
    if (wasVisible === true && !visible) {
      pendingExecute = null
    }
  })
})

export function useTagImportHint() {
  const interceptTagClick = async (execute: () => Promise<void>) => {
    if (hasSeenTagImportHint()) {
      await execute()
      return
    }
    if (showDialog.value) {
      return
    }
    pendingExecute = execute
    showDialog.value = true
  }

  const confirmHint = async () => {
    markTagImportHintSeen()
    showDialog.value = false
    const execute = pendingExecute
    pendingExecute = null
    if (execute != null) {
      await execute()
    }
  }

  return { showDialog, interceptTagClick, confirmHint }
}

export function useProfileTagToggle() {
  const { t: $t } = useI18n()
  const currentUserStore = useCurrentUserStore()
  const notification = useNotification()
  const { showDialog, interceptTagClick, confirmHint } = useTagImportHint()

  const toggleTag = async (tag: string) => {
    const uid = currentUserStore.firebaseUser?.uid
    if (uid == null) {
      notification.show($t('event_details.tag_toggle_login_required'), 'error')
      return
    }
    await interceptTagClick(async () => {
      try {
        const r = await toggleTagOnMyProfile(tag, currentUserStore.user?.user_tags)
        notification.show(
          r === 'added' ? $t('event_details.tag_toggle_added', [tag]) : $t('event_details.tag_toggle_removed', [tag]),
          'success',
        )
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : $t('event_details.tag_toggle_failed')
        notification.show(msg, 'error')
      }
    })
  }

  return { showDialog, confirmHint, toggleTag }
}
