<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import TagInput from '@shokujii/base/components/TagInput.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { updateUserTags } from '@shokujii/base/apis/userTags.js'
import { useNotification } from '@shokujii/base/composable/notification.js'

const model = defineModel<boolean>({ required: true })

const { t: $t } = useI18n()
const currentUserStore = useCurrentUserStore()
const notification = useNotification()

const draftTags = ref<string[]>([])
const isSaving = ref(false)

watch(model, (open) => {
  if (open) {
    draftTags.value = [...(currentUserStore.user?.user_tags ?? [])]
  }
})

const saveTags = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await updateUserTags(draftTags.value)
    model.value = false
    notification.show($t('user_tags.save_success'), 'success')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : $t('user_tags.save_failed')
    notification.show(msg, 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <v-dialog v-model="model" max-width="640" scrollable>
    <v-card>
      <v-card-title>{{ $t('user_tags.dialog_title') }}</v-card-title>
      <v-card-text>
        <TagInput v-model="draftTags" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="isSaving" @click="model = false">{{ $t('user_tags.cancel') }}</v-btn>
        <v-btn color="primary" :loading="isSaving" @click="saveTags">{{ $t('user_tags.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
