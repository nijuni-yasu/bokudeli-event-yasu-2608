<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getManageCommunityPath } from '@/router/utils'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { acceptInvitationForCommunityManager } from '@shokujii/base/apis/communityManager.js'

const props = defineProps<{
  communityAccount: string
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

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

const token = route.query.t as string

const redirect = () => {
  router.push(getManageCommunityPath(props.communityAccount))
}

// ログイン状態は router で管理されているため、ここでログインチェックは不要

try {
  await acceptInvitationForCommunityManager({ communityAccount: props.communityAccount, token })
  message.value = t('community_membership.manager_invite_success')
} catch (error) {
  console.error(error)
  message.value = t('community_membership.manager_invite_invalid_url')
} finally {
  window.setTimeout(redirect, 3000)
}
</script>

<template>
  <section>
    <confirm-dialog v-model="isOpenMessageDialog" :is-confirm="false" :onclick="redirect">
      {{ message }}
    </confirm-dialog>
    <div class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </div>
  </section>
</template>
