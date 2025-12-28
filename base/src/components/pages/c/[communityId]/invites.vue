<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { acceptInvitationForCommunityManager } from '@shokujii/base/apis/communityManager.js'
import { getManageCommunityPath } from '@/router/utils'

const props = defineProps<{
  communityAccount: string
}>()

const route = useRoute()
const router = useRouter()
const isOpenMessageDialog = ref(false)
const message = ref('')

const token = route.query.t as string

const redirect = () => {
  router.push(getManageCommunityPath(props.communityAccount))
}

watch(
  () => [useCurrentUserStore().firebaseUser],
  ([firebaseUser]) => {
    if (firebaseUser == null) {
      // ログインチェックは router で行われているので、ここにくることはない
      return
    }
    acceptInvitationForCommunityManager({ communityAccount: props.communityAccount, token })
      .then(() => {
        message.value = '管理者になりました'
        isOpenMessageDialog.value = true
      })
      .catch((error) => {
        console.error(error)
        message.value = '無効な URL です'
        isOpenMessageDialog.value = true
      })
      .finally(() => {
        window.setTimeout(redirect, 3000)
      })
  },
  { immediate: true },
)
</script>

<template>
  <section>
    <confirm-dialog v-model="isOpenMessageDialog" :is-confirm="false" onclick="redirect">
      {{ message }}
    </confirm-dialog>
    <div class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </div>
  </section>
</template>
