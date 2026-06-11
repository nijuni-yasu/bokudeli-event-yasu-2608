<script setup lang="ts">
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification.js'

const props = defineProps<{
  deleteEvent: () => Promise<void>
}>()

const emit = defineEmits<{
  deleted: []
}>()

const { t: $t } = useI18n()
const { show: showNotification } = useNotification()

const deleteConfirmationDialog = ref(false)
const deleteCompleteDialog = ref(false)
const isDeleting = ref(false)

const confirmDelete = async () => {
  isDeleting.value = true
  try {
    await props.deleteEvent()
    deleteConfirmationDialog.value = false
    deleteCompleteDialog.value = true
  } catch {
    showNotification($t('manage.event.delete_failed'), 'error')
  } finally {
    isDeleting.value = false
  }
}

const handleDeleteCompleteOk = () => {
  emit('deleted')
}

defineExpose({
  openDeleteConfirmation: () => {
    deleteConfirmationDialog.value = true
  },
})
</script>

<template>
  <v-dialog v-model="deleteConfirmationDialog" max-width="600px">
    <v-card class="pa-2">
      <v-card-title>
        {{ $t('manage.event.dialog.title') }}
      </v-card-title>
      <v-card-text>
        {{ $t('manage.event.dialog.description') }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="isDeleting" @click="deleteConfirmationDialog = false">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn variant="tonal" :loading="isDeleting" @click="confirmDelete">
          {{ $t('manage.event.dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <ConfirmDialog
    v-model="deleteCompleteDialog"
    :title="$t('manage.event.dialog.complete')"
    ok-text="OK"
    :ok-click="handleDeleteCompleteOk"
    max-width="500px"
  />
</template>
