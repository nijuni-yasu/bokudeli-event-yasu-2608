<script setup lang="ts">
import { defineProps } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import { functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import LoginDialog from '@/components/LoginDialog.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import type BokudeliCommunity from '@/schemes/bokudeliCommunity'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { getCommunityPath } from '@/router/utils'

const accept_invitation_for_community_manager = httpsCallable(functions, 'accept_invitation_for_community_manager')

const props = defineProps<{
  communityId: string
}>()

const route = useRoute()
const router = useRouter()
const isOpenLoginDialog = ref(false)
const isOpenMessageDailog = ref(false)
const message = ref('')

const redirect = () => {
  router.push(getCommunityPath(props.communityId))
}

watch(
  () => [useStoreStoredUser().storedUser, (useCommunityStore(props.communityId) as CommunityStore).community],
  ([storedUser, community]) => {
    console.log('watch', storedUser)
    if (storedUser == null) {
      isOpenLoginDialog.value = true
      return
    }
    const communityId = (community as BokudeliCommunity | null)?.community_id
    if (communityId == null) {
      return
    }
    accept_invitation_for_community_manager({ communityId, token: route.query.t })
      .then(() => {
        message.value = '管理者になりました'
        isOpenMessageDailog.value = true
      })
      .catch((error) => {
        console.error(error)
        message.value = '無効な URL です'
        isOpenMessageDailog.value = true
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
    <div>
      <login-dialog v-model="isOpenLoginDialog" />
    </div>
    <confirm-dialog v-model="isOpenMessageDailog" :is-confirm="false" onclick="redirect">
      {{ message }}
    </confirm-dialog>
    <div class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </div>
  </section>
</template>
