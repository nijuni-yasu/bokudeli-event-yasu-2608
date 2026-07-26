<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { mdiTagOutline } from '@mdi/js'
import TagInput from '@shokujii/base/components/TagInput.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { addTagToMyProfile, updateUserTags } from '@shokujii/base/apis/userTags.js'
import { useNotification } from '@shokujii/base/composable/notification.js'

const model = defineModel<boolean>({ required: true })

const { t: $t } = useI18n()
const { smAndDown } = useDisplay()
const currentUserStore = useCurrentUserStore()
const notification = useNotification()

const isUpdating = ref(false)

const tags = computed(() => currentUserStore.user?.user_tags ?? [])

const onAddTag = async (tag: string) => {
  if (isUpdating.value) return
  isUpdating.value = true
  try {
    await addTagToMyProfile(tag)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : $t('user_tags.save_failed')
    notification.show(msg, 'error')
  } finally {
    isUpdating.value = false
  }
}

const onRemoveTag = async (tag: string) => {
  if (isUpdating.value) return
  isUpdating.value = true
  try {
    const current = tags.value
    await updateUserTags(current.filter((x) => x !== tag))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : $t('user_tags.save_failed')
    notification.show(msg, 'error')
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <v-dialog v-model="model" max-width="640" :fullscreen="smAndDown" scrollable transition="dialog-bottom-transition">
    <v-card class="tag-settings-dialog pa-sm-9 pa-5">
      <v-card-item class="text-center pb-2 px-0">
        <v-icon :icon="mdiTagOutline" color="primary" size="32" class="mb-2" />
        <v-card-title class="text-h5">{{ $t('user_tags.dialog_title') }}</v-card-title>
      </v-card-item>

      <v-card-text class="px-0 pt-2">
        <TagInput :tags="tags" :loading="isUpdating" @add="onAddTag" @remove="onRemoveTag" />
      </v-card-text>

      <v-card-actions class="px-0 pt-2">
        <v-btn block variant="outlined" color="primary" @click="model = false">{{ $t('user_tags.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
