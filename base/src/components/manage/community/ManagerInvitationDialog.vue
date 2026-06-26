<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { functions } from '@shokujii/base/firebase.js'
import { httpsCallable } from 'firebase/functions'
import { useNotification } from '@shokujii/base/composable/notification.js'

const props = defineProps<{
  communityId: string | undefined
  /** デフォルトは PF 版 Callable */
  invitationCallableName?: string
}>()

const isOpen = defineModel<boolean>({ required: true })

const { t: $t } = useI18n()
const notification = useNotification()

const invitationUrl = ref('')
const isLoading = ref(false)

const fetchInvitationUrl = async (communityId: string) => {
  const callable = httpsCallable<{ communityId: string }, string>(
    functions,
    props.invitationCallableName ?? 'getInvitationUrlForCommunityManager',
  )
  return callable({ communityId })
}

const inviteManager = async () => {
  if (props.communityId == null) {
    notification.show($t('manage.community_manager_invitation.failed'), 'error')
    return
  }
  isLoading.value = true
  try {
    const result = await fetchInvitationUrl(props.communityId)
    invitationUrl.value = result.data
    await navigator.clipboard
      .writeText(result.data)
      .then(() => {
        notification.show($t('copied_to_clipboard'), 'success')
      })
      .catch((err) => {
        console.warn(err)
      })
  } catch (error) {
    console.error(error)
    notification.show($t('manage.community_manager_invitation.failed'), 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-dialog v-model="isOpen" persistent :width="$vuetify.display.smAndDown ? 'auto' : 650">
    <v-card class="px-2 py-4">
      <v-card-title>{{ $t('manage.community_manager_invitation.title') }}</v-card-title>
      <v-card-text style="display: flex; flex-direction: column; gap: 20px; margin-top: 20px">
        <v-text-field
          v-model="invitationUrl"
          outlined
          dense
          :readonly="true"
          :label="$t('manage.community_manager_invitation.description')"
        />
        <v-btn color="primary" :loading="isLoading" :disabled="communityId == null" @click="inviteManager">
          {{ $t('manage.community_manager_invitation.generate') }}
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <v-btn type="cancel" @click="isOpen = false">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
