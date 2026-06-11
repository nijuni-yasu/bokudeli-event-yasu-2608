<script setup lang="ts">
import { mdiPencil, mdiDelete, mdiContentCopy, mdiCancel } from '@mdi/js'

defineProps<{
  canEdit: boolean
  canDelete: boolean
  canCopy: boolean
  canCancel: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
  copy: []
  cancel: []
}>()
</script>

<template>
  <v-col md="4" sm="6" cols="12" class="justify-center">
    <v-row>
      <v-btn class="ma-3" variant="outlined" :prepend-icon="mdiPencil" :disabled="!canEdit" @click="emit('edit')">
        {{ $t('manage.event.edit') }}
      </v-btn>
    </v-row>
    <v-row>
      <v-btn v-if="canDelete" class="ma-3" variant="outlined" :prepend-icon="mdiDelete" @click="emit('delete')">
        {{ $t('manage.event.delete') }}
      </v-btn>
    </v-row>
    <v-row>
      <v-btn v-if="canCopy" class="ma-3" variant="outlined" :prepend-icon="mdiContentCopy" @click="emit('copy')">
        {{ $t('manage.copy_event') }}
      </v-btn>
    </v-row>
    <v-row>
      <v-btn
        v-if="canCancel"
        class="ma-3"
        variant="outlined"
        color="grey-400"
        :prepend-icon="mdiCancel"
        @click="emit('cancel')"
      >
        {{ $t('manage.event.cancel') }}
      </v-btn>
    </v-row>
  </v-col>
</template>
