<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { acceptInvitationForCommunityManager } from '@shokujii/base/apis/communityManager.js'
import { useCommunityStore } from '@shokujii/base/stores/community'

const props = defineProps<{
  communityAccount: string
  token: string
}>()

const emits = defineEmits<{
  done: []
}>()

const { t } = useI18n()

const communityStore = useCommunityStore(props.communityAccount)

// notification を使用したいところだが、Manager ページはレイアウトが違うので notification がキャンセルされてしまう
// TODO: そもそも invites が Manager ページにあるべきかもしれない。仕様を再検討
const message = ref('')
const isOpenMessageDialog = computed({
  get: () => message.value !== '',
  set: (value) => {
    if (!value) {
      message.value = ''
    }
  },
})

const done = () => emits('done')

// ログイン状態は router で管理されているため、ここでログインチェックは不要

try {
  const roles = await communityStore.getCurrentUserRoles()
  const isManager = roles?.includes('manager') ?? false
  if (isManager) {
    // 既に管理者の場合は、招待を受け入れずにメッセージを表示
    message.value = t('community_membership.manager_invite_already_manager')
  } else {
    try {
      await acceptInvitationForCommunityManager({ communityAccount: props.communityAccount, token: props.token })
      message.value = t('community_membership.manager_invite_success')
    } catch (error) {
      console.error(error)
      message.value = t('community_membership.manager_invite_invalid_url')
    }
  }
} catch (error) {
  console.error(error)
  message.value = t('community_membership.manager_invite_error')
} finally {
  window.setTimeout(done, 3000)
}
</script>

<template>
  <section>
    <confirm-dialog v-model="isOpenMessageDialog" :is-confirm="false" :onclick="done">
      {{ message }}
    </confirm-dialog>
    <div class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </div>
  </section>
</template>
